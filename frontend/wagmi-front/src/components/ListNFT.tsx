import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { NFT_MARKET_ABI, ERC721_ABI } from '../contracts/abis'

const NFT_MARKET_ADDRESS = import.meta.env.VITE_NFT_MARKET_ADDRESS as `0x${string}`

export function ListNFT() {
  const { address } = useAccount()
  const [nftContract, setNftContract] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [price, setPrice] = useState('')
  
  const { data: approveHash, writeContract: approveNFT } = useWriteContract()
  const { data: listHash, writeContract: listNFT } = useWriteContract()
  
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isListing, isSuccess } = useWaitForTransactionReceipt({ hash: listHash })

  const handleApprove = async () => {
    if (!nftContract || !tokenId) return
    
    approveNFT({
      address: nftContract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'setApprovalForAll',
      args: [NFT_MARKET_ADDRESS, true],
    })
  }

  const handleList = async () => {
    if (!nftContract || !tokenId || !price) return
    
    listNFT({
      address: NFT_MARKET_ADDRESS,
      abi: NFT_MARKET_ABI,
      functionName: 'list',
      args: [nftContract as `0x${string}`, BigInt(tokenId), parseEther(price)],
    })
  }

  if (!address) {
    return <div style={{ padding: '20px' }}>Please connect your wallet first</div>
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h2>List Your NFT</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="NFT Contract Address"
          value={nftContract}
          onChange={(e) => setNftContract(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Price (in tokens)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleApprove}
          disabled={isApproving}
          style={{ padding: '10px', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {isApproving ? 'Approving...' : '1. Approve NFT'}
        </button>
        <button
          onClick={handleList}
          disabled={isListing}
          style={{ padding: '10px', cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {isListing ? 'Listing...' : '2. List NFT'}
        </button>
        {isSuccess && <p style={{ color: 'green' }}>NFT listed successfully!</p>}
      </div>
    </div>
  )
}
