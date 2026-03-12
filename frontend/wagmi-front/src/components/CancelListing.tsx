import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { NFT_MARKET_ABI } from '../contracts/abis'

const NFT_MARKET_ADDRESS = import.meta.env.VITE_NFT_MARKET_ADDRESS as `0x${string}`

export function CancelListing() {
  const { address } = useAccount()
  const [listingId, setListingId] = useState('')
  
  const { data: hash, writeContract } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleCancel = async () => {
    if (!listingId) return
    
    writeContract({
      address: NFT_MARKET_ADDRESS,
      abi: NFT_MARKET_ABI,
      functionName: 'cancelListing',
      args: [BigInt(listingId)],
    })
  }

  if (!address) {
    return <div style={{ padding: '20px' }}>Please connect your wallet first</div>
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h2>Cancel Listing</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Listing ID"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleCancel}
          disabled={isLoading}
          style={{ padding: '10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Listing'}
        </button>
        {isSuccess && <p style={{ color: 'green' }}>Listing cancelled successfully!</p>}
      </div>
    </div>
  )
}
