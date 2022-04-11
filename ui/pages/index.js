import { ethers } from 'ethers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useRef, useEffect, useState } from 'react'
import { veNationRequiredStake } from '../lib/config'
import { useNationBalance } from '../lib/nation-token'
import { useHasPassport } from '../lib/passport-nft'
import { useAccount } from '../lib/use-wagmi'
import { useVeNationBalance } from '../lib/ve-token'
import ActionButton from '../components/ActionButton'
import Balance from '../components/Balance'
import GradientLink from '../components/GradientLink'
import Head from '../components/Head'
import flag from '../public/flag.svg'

export default function Index() {
  const router = useRouter()
  const [{ data: account }] = useAccount()
  const [{ data: nationBalance, loading: nationBalanceLoading }] =
    useNationBalance(account?.address)
  const [{ data: veNationBalance, loading: veNationBalanceLoading }] =
    useVeNationBalance(account?.address)
  const [{ data: hasPassport, loading: hasPassportLoading }] = useHasPassport(
    account?.address
  )

  const [fromTweetdrop, setFromTweetdrop] = useState(false)

  useEffect(() => {
    if (!hasPassportLoading) {
      if (!hasPassport && router.query.source === 'tweetdrop') {
        setFromTweetdrop(true)
      }
    }
  }, [hasPassport, hasPassportLoading, router.pathname])

  const loading =
    nationBalanceLoading || veNationBalanceLoading || hasPassportLoading

  return (
    <>
      <Head title="Tweetdrop" />
      <div className="hero h-full">
        <div className="hero-content flex-col pb-24">
          <h1 className="card-title text-center text-3xl font-medium mb-2">
            {fromTweetdrop
              ? 'You are almost a genesis citizen of Nation3'
              : 'Welcome to Nation3'}
            <Image src={flag} width={36} height={36} />
          </h1>
          <p className="max-w-sm mb-8">
            Nation3 is a sovereign cloud nation. We are building a community of
            like-minded people creating a nation on the cloud.{' '}
            <GradientLink text="Read more" href="https://nation3.org" />
            <br />
            <br />
            Here you can perform on-chain operations related to the Nation3
            communinity, such as...
          </p>

          {!loading ? (
            <>
              <Link href="/claim">
                <a class="btn btn-lg btn-primary mb-1 normal-case font-medium">
                  Claim $NATION
                </a>
              </Link>
              <p>and then...</p>
              <div className="flex flex-col 2xl:flex-row mt-2 gap-8">
                <div className="card w-80 md:w-96 bg-base-100 shadow-md">
                  <div className="card-body items-stretch items-center">
                    <h2 className="card-title text-center font-medium">
                      Liquidity rewards
                    </h2>
                    <p>
                      Provide liquidity in the 80% $NATION / 20% $ETH Balancer
                      pool to receive rewards.
                      <br />
                      High APY, 2.5x boost with $veNATION
                    </p>
                    <GradientLink
                      text="Provide liquidity"
                      href="/liquidity"
                    ></GradientLink>
                  </div>
                </div>
                <div className="card w-80 md:w-96 bg-base-100 shadow-md">
                  <div className="card-body items-stretch items-center">
                    <h2 className="card-title text-center font-medium">
                      Genesis Passport NFT
                    </h2>
                    <p>
                      If you have more than 10 $veNATION, you can claim a
                      citizen passport (only 420 available on launch).
                    </p>
                    <GradientLink
                      text="Get $veNATION"
                      href="/lock"
                    ></GradientLink>
                  </div>
                </div>
                <div className="card w-80 md:w-96 bg-base-100 shadow-md">
                  <div className="card-body items-stretch items-center">
                    <h2 className="card-title text-center font-medium">
                      Buy more $NATION
                    </h2>
                    <p>
                      You can lock $NATION to get $veNATION and participate in
                      the Nation3 ecosystem.
                    </p>
                    <GradientLink
                      text="Buy $NATION"
                      href="/lock"
                    ></GradientLink>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex place-content-center">
              <button className="btn btn-square btn-ghost btn-disabled btn-lg bg-transparent loading"></button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
