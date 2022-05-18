// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { useState, useMemo } from 'react'
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module '../abis/MerkleDistributor.json... Remove this comment to see the full error message
import MerkleDistributor from '../abis/MerkleDistributor.json'
import { nationDropContracts } from './config'
import { useContractRead, useContractWrite } from './use-wagmi'

async function fetchClaimsFile(contractId: any) {
  if (typeof window !== 'undefined') {
    const res = await fetch(
      `/tweetdrop/${process.env.NEXT_PUBLIC_CHAIN}-${contractId}.json`
    )
    return await res.json()
  }
  return {}
}

export function checkEligibility(claimsFiles: any, address: any) {
  for (const id in claimsFiles) {
    if (claimsFiles[id].claims[address]) {
      return [id, claimsFiles[id].claims[address].index]
    }
  }
  return [null, null]
}

export function useClaimsFiles() {
  const [data, setData] = useState({ isLoading: true })
  useMemo(async () => {
    try {
      const claims = await Promise.all(
        nationDropContracts.map(
          async (_, contractId) => await fetchClaimsFile(contractId)
        )
      )
      setData({ data: claims, isLoading: false })
    } catch (error) {
      console.log(error)
      setData({ error, isLoading: false })
    }
  }, [])
  return data
}

const contractParams = (contractId: any) => ({
  addressOrName: nationDropContracts[contractId],
  contractInterface: MerkleDistributor.abi
})

export function useIsClaimed(contractId: any, index: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
  return useContractRead(contractParams(contractId), 'isClaimed', {
    args: [index],
    watch: true,
    enabled: contractId && index,
  })
}

export function getClaimIndex(claims: any, address: any) {
  return claims[address]?.index
}

export function useClaimDrop({
  contractId,
  index,
  account,
  amount,
  proof
}: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
  return useContractWrite(contractParams(contractId), 'claim', {
    args: [index, account, amount, proof],
    overrides: {
      gasLimit: 150000,
    },
  })
}
