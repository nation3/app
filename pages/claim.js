import { parseBalanceMap } from '@uniswap/merkle-distributor/parse-balance-map'
import React, { useState, useEffect, useRef } from 'react'
import Confetti from 'react-confetti'
import { useTimeout } from 'react-use'
import { useAccount, useBalance } from 'wagmi'
import ActionNeedsAccount from '../components/ActionNeedsAccount'
import LoadingBalance from '../components/LoadingBalance'

export default function Claim() {
  const [{ data: accountData }] = useAccount()
  const [{ data: balanceData, loading: balanceLoading }] = useBalance({
    addressOrName: accountData?.address,
    token: process.env.NEXT_PUBLIC_NATION_ADDRESS,
    watch: true,
  })

  const [claimed, setClaimed] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const elementRef = useRef()
  const [isComplete] = useTimeout(5000)

  useEffect(() => {
    setWidth(elementRef.current.offsetWidth)
    setHeight(elementRef.current.offsetHeight)
  }, [])

  return (
    <>
      <div
        ref={elementRef}
        className="hero bg-gradient-to-r from-n3blue-100 to-n3green-100 flex-auto overflow-auto"
      >
        {claimed && (
          <Confetti width={width} height={height} recycle={!isComplete()} />
        )}
        <div className="hero-content">
          <div className="max-w-md">
            <div className="card md:w-96 bg-base-100 shadow-xl">
              <div className="card-body items-stretch items-center">
                <h2 className="card-title text-center">$NATION tweetdrop</h2>
                <p>
                  If you have participated in the $NATION tweetdrop, you can
                  claim here. If not, you can buy $NATION.
                </p>

                <div className="stats stats-vertical lg:stats-horizontal shadow my-4">
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <ActionNeedsAccount
                        className="btn btn-primary grow"
                        onClick={() => setClaimed(true)}
                      >
                        Claim
                      </ActionNeedsAccount>
                    </div>
                    <div className="stat-title">Your claimable</div>
                    <div className="stat-value">
                      <LoadingBalance
                        balanceLoading={balanceLoading}
                        balanceData={balanceData}
                      />
                    </div>
                    <div className="stat-desc">NATION tokens</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
