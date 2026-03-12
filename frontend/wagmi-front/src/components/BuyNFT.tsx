import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { NFT_MARKET_ABI, ERC20_ABI } from '../contracts/abis'

const NFT_MARKET_ADDRESS = import.meta.env.VITE_NFT_MARKET_ADDRESS as `0x${string}`
const PAYMENT_TOKEN_ADDRESS = import.meta.env.VITE_PAYMENT_TOKEN_ADDRESS as `0x${string}`

export function BuyNFT() {
  const { address } = useAccount()
  const [listingId, setListingId] = useState('')
  
  const { data: listing } = useReadContract({
    address: NFT_MARKET_ADDRESS,
    abi: NFT_MARKET_ABI,
    functionName: 'listings',
    args: listingId ? [BigInt(listingId)] : undefined,
  })

  const { data: approveHash, writeContract: approveToken } = useWriteContract()
  const { data: buyHash, writeContract: buyNFT } = useWriteContract()
  
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isBuying, isSuccess } = useWaitForTransactionReceipt({ hash: buyHash })

  const handleApprove = async () => {
    if (!listing) return
    
    approveToken({
      address: PAYMENT_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [NFT_MARKET_ADDRESS, listing[3]], // listing[3] is price
    })
  }

  const handleBuy = async () => {
    if (!listingId) return
    
    buyNFT({
      address: NFT_MARKET_ADDRESS,
      abi: NFT_MARKET_ABI,
      functionName: 'buyNFT',
      args: [BigInt(listingId)],
    })
  }

  if (!address) {
    return <div style={{ padding: '20px' }}>Please connect your wallet first</div>
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h2>Buy NFT</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Listing ID"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        {listing && listing[4] && (
          <div style={{ padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
            <p><strong>Seller:</strong> {listing[0]}</p>
            <p><strong>NFT Contract:</strong> {listing[1]}</p>
            <p><strong>Token ID:</strong> {listing[2].toString()}</p>
            <p><strong>Price:</strong> {formatEther(listing[3])} tokens</p>
            <p><strong>Status:</strong> {listing[4] ? 'Active' : 'Inactive'}</p>
          </div>
        )}
        
        {listing && listing[4] && (
          <>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              style={{ padding: '10px', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {isApproving ? 'Approving...' : '1. Approve Tokens'}
            </button>
            <button
              onClick={handleBuy}
              disabled={isBuying}
              style={{ padding: '10px', cursor: 'pointer', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {isBuying ? 'Buying...' : '2. Buy NFT'}
            </button>
          </>
        )}
        
        {isSuccess && <p style={{ color: 'green' }}>NFT purchased successfully!</p>}
      </div>
    </div>
  )
}
