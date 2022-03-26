// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {Hevm} from "./utils/evm.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";
import {
    LiquidityRewardsDistributor,
    InvalidStartBlock,
    InvalidEndBlock,
    InsufficientRewardsBalance,
    InvalidRewardsAmount
} from "../LiquidityRewardsDistributor.sol";

contract RewardsDistributorTest is DSTestPlus {
    Hevm evm = Hevm(HEVM_ADDRESS);

    ERC20Mock rewardsToken;
    ERC20Mock lpToken;
    LiquidityRewardsDistributor distributor;

    uint256 public constant tokenSupply = 4206900 * 1e18;
    uint256 public constant totalRewards = 30000 * 1e18;
    uint256 public constant rewardsPeriod = 300; // Blocks

    function setUp() public {
        rewardsToken = new ERC20Mock("Nation3 Network Token", "NATION", tokenSupply);
        lpToken = new ERC20Mock("ETH/NATION Balancer Token", "ETHNATION", tokenSupply);

        distributor = new LiquidityRewardsDistributor();
        distributor.initialize(rewardsToken, lpToken);
    }

    function setRewards() public returns (uint256 startBlock, uint256 endBlock) {
        rewardsToken.transfer(address(distributor), totalRewards);

        startBlock = block.number + 5;
        endBlock = startBlock + rewardsPeriod;

        distributor.setRewards(totalRewards, startBlock, endBlock);
    }

    function testSetRewards() public {
        (uint256 startBlock, uint256 endBlock) = setRewards();
        
        assertEq(distributor.totalRewards(), totalRewards);
        assertEq(distributor.startBlock(), startBlock);
        assertEq(distributor.endBlock(), endBlock);
    }

    function testCannotSetWithoutTransferRewards() public {
        uint256 startBlock = block.number + 5;
        uint256 endBlock = startBlock + rewardsPeriod;

        evm.expectRevert(InsufficientRewardsBalance.selector);
        distributor.setRewards(totalRewards, startBlock, endBlock);
    }

    function testCannotSetPastStartBlock() public {
        uint256 startBlock = block.number - 5;
        uint256 endBlock = startBlock + rewardsPeriod;

        rewardsToken.transfer(address(distributor), totalRewards);
        evm.expectRevert(InvalidStartBlock.selector);
        distributor.setRewards(totalRewards, startBlock, endBlock);
    }

    function testCannotSetPastEndBlock() public {
        uint256 startBlock = block.number + 5;
        uint256 endBlock = block.number - 5;

        rewardsToken.transfer(address(distributor), totalRewards);
        evm.expectRevert(InvalidEndBlock.selector);
        distributor.setRewards(totalRewards, startBlock, endBlock);
    }

    function testSingleDepositFullTime() public {
        (uint256 startBlock, uint256 endBlock) = setRewards();

        uint256 depositAmount = 1337 *1e18;
        address userAccount = address(0xBABE);

        // Fill user account, switch to it & give approval
        lpToken.transfer(userAccount, depositAmount);
        evm.startPrank(userAccount);
        lpToken.approve(address(distributor), depositAmount);

        distributor.deposit(depositAmount);

        uint256 acumRewards = 0;

        // Claim 20% into rewards period
        evm.roll(startBlock + rewardsPeriod / 5);
        acumRewards = acumRewards + distributor.claimRewards();

        assertEq(acumRewards, rewardsToken.balanceOf(userAccount));
        assertApproxEq(acumRewards, totalRewards / 5, 5);

        // Claim 75% into rewards period
        evm.roll(startBlock + rewardsPeriod * 3 / 4);
        acumRewards = acumRewards + distributor.claimRewards();

        assertEq(acumRewards, rewardsToken.balanceOf(userAccount));
        assertApproxEq(acumRewards, totalRewards * 3 / 4, 5);

        // Withdraw everything after rewards period end
        evm.roll(endBlock + 5);
        (uint256 staking, uint256 rewards) = distributor.withdrawAndClaim();
        acumRewards = acumRewards + rewards;

        assertEq(staking, depositAmount);
        assertEq(staking, lpToken.balanceOf(userAccount));
        assertEq(acumRewards, rewardsToken.balanceOf(userAccount));
        // Precision of 5 * 1e(-18)
        assertApproxEq(acumRewards, totalRewards, 5);

        evm.stopPrank();
    }

    function testSingleDepositAfterStart() public {
        (uint256 startBlock, uint256 endBlock) = setRewards();

        uint256 depositAmount = 1337 *1e18;
        address userAccount = address(0xBABE);

        // Fill user account, switch to it & give approval
        lpToken.transfer(userAccount, depositAmount);
        evm.startPrank(userAccount);
        lpToken.approve(address(distributor), depositAmount);

        // Deposit in half of the rewards period
        evm.roll(startBlock + rewardsPeriod / 2);
        distributor.deposit(depositAmount);

        evm.roll(endBlock);

        (uint256 staking, uint256 rewards) = distributor.withdrawAndClaim();

        assertEq(staking, depositAmount);
        // Precision of 5 * 1e(-18)
        assertApproxEq(rewards, totalRewards / 2, 5);

        evm.stopPrank();
    }

    function testMultiDeposit() public {
        (uint256 startBlock, uint256 endBlock) = setRewards();

        uint256 depositAmount = 1337 *1e18;
        address userAccountA = address(0xBABE);
        address userAccountB = address(0xBEEF);

        // Fill user accounts
        lpToken.transfer(userAccountA, depositAmount);
        lpToken.transfer(userAccountB, depositAmount * 2);

        // Account A initial deposit
        evm.startPrank(userAccountA);
        lpToken.approve(address(distributor), depositAmount * 10);
        distributor.deposit(depositAmount);
        evm.stopPrank();

        // Fastforward to 25% of rewards period
        evm.roll(startBlock + rewardsPeriod / 4);

        // Account B initial deposit
        evm.startPrank(userAccountB);
        lpToken.approve(address(distributor), depositAmount * 10);
        distributor.deposit(depositAmount);
        evm.stopPrank();

        // Fastforward to 50% of rewards period
        evm.roll(startBlock + rewardsPeriod / 2);

        // Account A claim rewards
        evm.prank(userAccountA);
        uint256 rewardsAccountA = distributor.claimRewards();
        // Account B withdraw and claim
        evm.prank(userAccountB);
        (,uint256 rewardsAccountB) = distributor.withdrawAndClaim();

        // Account A should have 1/4 + 1/2 * 1/4 = 3/8 of the totalRewards
        assertApproxEq(rewardsAccountA, totalRewards * 3/8, 5);
        // Account B should have 1/2 * 1/4 = 1/8 of the totalRewards
        assertApproxEq(rewardsAccountB, totalRewards / 8, 5);

        // Fastforward to 75% of rewards period
        evm.roll(startBlock + rewardsPeriod * 3/4);

        // Account B deposit double of the previous deposit
        evm.prank(userAccountB);
        distributor.deposit(depositAmount * 2);

        // Fastforward to 100% of rewards period
        evm.roll(endBlock);

        // Both accounts claim rewards
        evm.prank(userAccountA);
        rewardsAccountA = distributor.claimRewards();
        evm.prank(userAccountB);
        rewardsAccountB = distributor.claimRewards();

        // Account A should have 1/4 + 1/3 * 1/4 = 1/3 of the totalRewards
        assertApproxEq(rewardsAccountA, totalRewards * 1/3, 5);
        // Account B should have 2/3 * 1/4 = 1/6 of the totalRewards
        assertApproxEq(rewardsAccountB, totalRewards * 1/6, 5);

        // Both accounts should add up to the totalRewards
        uint256 balanceA = rewardsToken.balanceOf(userAccountA);
        uint256 balanceB = rewardsToken.balanceOf(userAccountB);
        assertApproxEq(balanceA + balanceB, totalRewards, 10);
    }

    function testUpdateRewardsWhileStaking() public {
        // Set initial rewards
        (uint256 startBlock,) = setRewards();

        uint256 depositAmount = 1337 *1e18;
        address userAccount = address(0xBABE);

        // Fill user account, switch to it & give approval
        lpToken.transfer(userAccount, depositAmount);
        evm.startPrank(userAccount);
        lpToken.approve(address(distributor), depositAmount);

        distributor.deposit(depositAmount);
        evm.stopPrank();
        
        // Fastforward to 25% of the rewards period
        evm.roll(startBlock + rewardsPeriod / 4);

        // Reduce  time by 25%
        uint256 newRewardsPeriod = rewardsPeriod / 2;
        uint256 newStart = block.number;
        uint256 newEnd = newStart + newRewardsPeriod;

        distributor.setRewards(totalRewards, newStart, newEnd);

        // Fastforward to 50% of the original rewards period
        evm.roll(startBlock + rewardsPeriod / 2);

        evm.prank(userAccount);
        uint256 userRewards = distributor.claimRewards();

        /// First quarter -> 1/4 rewards
        /// Second quarter -> 3/4 * 1/2 (new time) = 3/8 rewards
        /// Total -> 5/8 rewards
        assertApproxEq(userRewards, totalRewards * 5/8, 5);

        // Reduce decrease pending rewards by 25%
        distributor.setRewards(totalRewards * 3/4, block.number + 5, newEnd);

        // Fastforward to end of the rewards period
        evm.roll(newEnd);

        evm.prank(userAccount);
        userRewards = userRewards + distributor.claimRewards();

        // At the end user rewards should be 75% of original rewards
        assertApproxEq(userRewards, totalRewards * 3/4, 5);

    }

    function testCannotReduceAlreadyDistributedRewards() public {
        (uint256 startBlock, uint256 endBlock) = setRewards();

        // Someone deposits from the beginning
        uint256 depositAmount = 1337 *1e18;
        lpToken.approve(address(distributor), depositAmount);
        distributor.deposit(depositAmount);

        evm.roll(startBlock + rewardsPeriod * 3/4);

        // Should fail becasue 3/4 of the rewards are already distributed to the single staker
        evm.expectRevert(InvalidRewardsAmount.selector);
        distributor.setRewards(totalRewards / 2, block.number, endBlock);
    }

    function testERC20Recovery() public {
        // Someone sends an ERC20 by error
        ERC20Mock token = new ERC20Mock("Token", "TK", 200 * 1e18);
        token.transfer(address(distributor), 100 * 1e18);

        uint256 tokensRecovered = distributor.recoverTokens(token, address(0xBABE));

        assertEq(tokensRecovered, 100 * 1e18);
        assertEq(token.balanceOf(address(0xBABE)), tokensRecovered);
    }

    function testLPTokensRecovery() public {
        // Someone stakes
        lpToken.approve(address(distributor), 200 * 1e18);
        distributor.deposit(200 * 1e18);
        // Someone else sends LP tokens by error
        lpToken.transfer(address(distributor), 100 * 1e18);

        // Only can recover not staked tokens
        uint256 tokensRecovered = distributor.recoverTokens(lpToken, address(0xBABE));

        assertEq(tokensRecovered, 100 * 1e18);
        assertEq(lpToken.balanceOf(address(0xBABE)), tokensRecovered);
    }

    function testRewardsRecovery() public {
        (uint256 startBlock,) = setRewards();

        // Someone transfer rewards tokens
        rewardsToken.transfer(address(distributor), 200 * 1e18);

        evm.roll(startBlock + rewardsPeriod / 2);

        // Only can recover tokens not reserved as rewards
        uint256 tokensRecovered = distributor.recoverTokens(rewardsToken, address(0xBABE));
        assertEq(tokensRecovered, 200 * 1e18);
        assertEq(rewardsToken.balanceOf(address(0xBABE)), tokensRecovered);
    }

}
