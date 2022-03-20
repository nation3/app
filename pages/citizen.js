import React, { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useNationBalance } from '../lib/nationToken'
import ActionNeedsAccount from '../components/ActionNeedsAccount'
import LoadingBalance from '../components/LoadingBalance'

const requiredStake = process.env.NEXT_PUBLIC_NATION_REQUIRED_STAKE

export default function Citizen() {
  const [{ data: accountData }] = useAccount()
  const { balanceData, balanceLoading } = useNationBalance(accountData?.address)

  return (
    <>
      <div className="hero bg-gradient-to-r from-n3blue-100 to-n3green-100 flex-auto overflow-auto">
        <div className="hero-content">
          <div className="max-w-md">
            <div className="card md:w-96 bg-base-100 shadow-xl">
              <div className="card-body items-stretch items-center">
                <h2 className="card-title text-center">
                  Become a Nation3 citizen
                </h2>
                <ul className="steps steps-vertical lg:steps-horizontal my-8">
                  <li className="step step-primary">Stake and mint</li>
                  <li className="step">Adore your passport</li>
                </ul>
                <p>
                  To become a citizen, you need to mint a passport NFT by
                  locking up {requiredStake} $NATION for a year and renewing
                  your stake over time. This is to make sure all citizens are
                  economically aligned.
                </p>

                <div className="stats stats-vertical lg:stats-horizontal shadow my-4">
                  <div className="stat">
                    <div className="stat-title">Needed balance</div>
                    <div className="stat-value">{requiredStake}</div>
                    <div className="stat-desc">$NATION</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Your balance</div>
                    <div className="stat-value">
                      <LoadingBalance
                        balanceLoading={balanceLoading}
                        balanceData={balanceData}
                      />
                    </div>
                    <div className="stat-desc">$NATION</div>
                  </div>
                </div>
                {balanceData?.value < requiredStake ? (
                  <ActionNeedsAccount className="btn btn-primary grow">
                    Buy $NATION
                  </ActionNeedsAccount>
                ) : (
                  <ActionNeedsAccount className="btn btn-primary grow">
                    Stake and mint
                  </ActionNeedsAccount>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
