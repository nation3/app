import { useTokenAllowance, useTokenApproval } from '../lib/approve'
import { transformNumber } from '../lib/numbers'
import { useAccount } from '../lib/use-wagmi'
import ActionButton from './ActionButton'
import { useErrorContext } from './ErrorProvider'

export default function ActionNeedsTokenApproval({
  className,
  children,
  amountNeeded,
  token,
  spender,
  approveText,
  action,
  preAction,
}) {
  const [{ data: account }] = useAccount()
  const [
    {
      data: tokenAllowance,
      loading: tokenAllowanceLoading,
      error: allowanceError,
    },
  ] = useTokenAllowance({ token, address: account?.address, spender })

  const { addError } = useErrorContext()
  addError([allowanceError])

  const weiAmountNeeded = transformNumber(
    amountNeeded.formatted || amountNeeded,
    'bignumber',
    0
  )

  console.log(weiAmountNeeded.toString())
  const approve = useTokenApproval({
    amountNeeded: weiAmountNeeded,
    token,
    spender,
  })
  return (
    <>
      {!tokenAllowanceLoading && !approve?.loading ? (
        tokenAllowance?.gte(weiAmountNeeded) ? (
          <ActionButton
            className={className}
            action={action}
            preAction={preAction}
          >
            {children}
          </ActionButton>
        ) : (
          <ActionButton className={className} action={approve}>
            {approveText}
          </ActionButton>
        )
      ) : (
        <div className={className}>
          <button className="btn btn-square btn-outline btn-disabled bg-transparent loading"></button>
        </div>
      )}
    </>
  )
}
