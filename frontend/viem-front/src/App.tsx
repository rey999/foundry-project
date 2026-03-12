import { useState, useEffect } from 'react'
import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther } from 'viem'
import { mainnet, localhost } from 'viem/chains'
import { NFT_MARKET_ABI, ERC20_ABI, ERC721_ABI, CONTRACTS } from './contracts'
import './App.css'

// 定义 Listing 类型
interface Listing {
  seller: string
  nftContract: string
  tokenId: bigint
  price: bigint
  isActive: boolean
}

// 使用本地链配置
const localChain = {
  ...localhost,
  id: 31337,
  name: 'Anvil Local',
}

function App() {
  const [account, setAccount] = useState<string>('')
  const [publicClient, setPublicClient] = useState<any>(null)
  const [walletClient, setWalletClient] = useState<any>(null)
  const [listings, setListings] = useState<Map<number, Listing>>(new Map())
  const [nextListingId, setNextListingId] = useState<number>(0)
  const [tokenBalance, setTokenBalance] = useState<string>('0')

  // 表单状态 - 使用合约地址作为默认值
  const [nftContract, setNftContract] = useState(CONTRACTS.NFT_CONTRACT)
  const [tokenId, setTokenId] = useState('')
  const [price, setPrice] = useState('')
  const [listingIdToBuy, setListingIdToBuy] = useState('')
  const [listingIdToCancel, setListingIdToCancel] = useState('')

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        setAccount(accounts[0])

        // 创建 public client (使用本地链)
        const pubClient = createPublicClient({
          chain: localChain,
          transport: http('http://localhost:8545')
        })
        setPublicClient(pubClient)

        // 创建 wallet client
        const walClient = createWalletClient({
          chain: localChain,
          transport: custom(window.ethereum)
        })
        setWalletClient(walClient)

        console.log('钱包已连接:', accounts[0])
      } catch (error) {
        console.error('连接钱包失败:', error)
        alert('连接钱包失败')
      }
    } else {
      alert('请安装 MetaMask!')
    }
  }

  // 加载代币余额
  const loadTokenBalance = async () => {
    if (!publicClient || !account) return

    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.PAYMENT_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account as `0x${string}`],
      })

      setTokenBalance(formatEther(balance as bigint))
    } catch (error) {
      console.error('加载代币余额失败:', error)
    }
  }

  // 加载市场数据
  const loadMarketData = async () => {
    if (!publicClient) return

    try {
      // 获取下一个 listing ID
      const nextId = await publicClient.readContract({
        address: CONTRACTS.NFT_MARKET as `0x${string}`,
        abi: NFT_MARKET_ABI,
        functionName: 'nextListingId',
      })

      setNextListingId(Number(nextId))

      // 加载所有 listings
      const newListings = new Map<number, Listing>()
      for (let i = 0; i < Number(nextId); i++) {
        const listing = await publicClient.readContract({
          address: CONTRACTS.NFT_MARKET as `0x${string}`,
          abi: NFT_MARKET_ABI,
          functionName: 'listings',
          args: [BigInt(i)],
        })

        newListings.set(i, {
          seller: listing[0],
          nftContract: listing[1],
          tokenId: listing[2],
          price: listing[3],
          isActive: listing[4],
        })
      }

      setListings(newListings)
    } catch (error) {
      console.error('加载市场数据失败:', error)
    }
  }

  // 上架 NFT
  const listNFT = async () => {
    if (!walletClient || !account) {
      alert('请先连接钱包')
      return
    }

    if (!nftContract || !tokenId || !price) {
      alert('请填写完整信息')
      return
    }

    try {
      // 1. 先授权 NFT 给市场合约
      console.log('授权 NFT 给市场合约...')
      const approveHash = await walletClient.writeContract({
        address: nftContract as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACTS.NFT_MARKET as `0x${string}`, true],
        account: account as `0x${string}`,
      })

      console.log('NFT 授权交易:', approveHash)
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // 2. 上架 NFT
      console.log('上架 NFT...')
      const listHash = await walletClient.writeContract({
        address: CONTRACTS.NFT_MARKET as `0x${string}`,
        abi: NFT_MARKET_ABI,
        functionName: 'list',
        args: [
          nftContract as `0x${string}`,
          BigInt(tokenId),
          parseEther(price),
        ],
        account: account as `0x${string}`,
      })

      console.log('上架交易:', listHash)
      await publicClient.waitForTransactionReceipt({ hash: listHash })

      alert('NFT 上架成功!')
      loadMarketData()
      
      // 清空表单
      setTokenId('')
      setPrice('')
    } catch (error) {
      console.error('上架失败:', error)
      alert('上架失败: ' + (error as Error).message)
    }
  }

  // 购买 NFT
  const buyNFT = async () => {
    if (!walletClient || !account) {
      alert('请先连接钱包')
      return
    }

    try {
      const listingId = parseInt(listingIdToBuy)
      const listing = listings.get(listingId)

      if (!listing || !listing.isActive) {
        alert('该 NFT 不可购买')
        return
      }

      // 1. 授权 token 给市场合约
      console.log('授权代币给市场合约...')
      const approveHash = await walletClient.writeContract({
        address: CONTRACTS.PAYMENT_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.NFT_MARKET as `0x${string}`, listing.price],
        account: account as `0x${string}`,
      })

      console.log('Token 授权交易:', approveHash)
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // 2. 购买 NFT
      console.log('购买 NFT...')
      const buyHash = await walletClient.writeContract({
        address: CONTRACTS.NFT_MARKET as `0x${string}`,
        abi: NFT_MARKET_ABI,
        functionName: 'buyNFT',
        args: [BigInt(listingId)],
        account: account as `0x${string}`,
      })

      console.log('购买交易:', buyHash)
      await publicClient.waitForTransactionReceipt({ hash: buyHash })

      alert('购买成功!')
      loadMarketData()
      loadTokenBalance()
      setListingIdToBuy('')
    } catch (error) {
      console.error('购买失败:', error)
      alert('购买失败: ' + (error as Error).message)
    }
  }

  // 取消上架
  const cancelListing = async () => {
    if (!walletClient || !account) {
      alert('请先连接钱包')
      return
    }

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.NFT_MARKET as `0x${string}`,
        abi: NFT_MARKET_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingIdToCancel)],
        account: account as `0x${string}`,
      })

      console.log('取消上架交易:', hash)
      await publicClient.waitForTransactionReceipt({ hash })

      alert('取消上架成功!')
      loadMarketData()
      setListingIdToCancel('')
    } catch (error) {
      console.error('取消上架失败:', error)
      alert('取消上架失败: ' + (error as Error).message)
    }
  }

  useEffect(() => {
    if (publicClient && account) {
      loadMarketData()
      loadTokenBalance()
    }
  }, [publicClient, account])

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 NFT Market</h1>
        {!account ? (
          <button onClick={connectWallet} className="connect-btn">
            连接钱包
          </button>
        ) : (
          <div className="account-info">
            <div>
              <span>账户: {account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <div>
              <span>代币余额: {parseFloat(tokenBalance).toFixed(2)} MTK</span>
            </div>
          </div>
        )}
      </header>

      {/* 合约地址信息 */}
      <div className="contract-info">
        <h3>📋 合约地址</h3>
        <div className="info-grid">
          <div>
            <strong>NFT Market:</strong>
            <code>{CONTRACTS.NFT_MARKET}</code>
          </div>
          <div>
            <strong>Payment Token:</strong>
            <code>{CONTRACTS.PAYMENT_TOKEN}</code>
          </div>
          <div>
            <strong>NFT Contract:</strong>
            <code>{CONTRACTS.NFT_CONTRACT}</code>
          </div>
        </div>
      </div>

      <div className="container">
        {/* 上架 NFT */}
        <section className="card">
          <h2>📤 上架 NFT</h2>
          <div className="form">
            <div className="input-group">
              <label>NFT 合约地址</label>
              <input
                type="text"
                placeholder="NFT 合约地址"
                value={nftContract}
                onChange={(e) => setNftContract(e.target.value)}
              />
              <small>默认使用部署的 MockERC721 地址</small>
            </div>
            <div className="input-group">
              <label>Token ID</label>
              <input
                type="text"
                placeholder="例如: 1"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
              <small>部署时铸造了 Token ID 1-5</small>
            </div>
            <div className="input-group">
              <label>价格 (MTK)</label>
              <input
                type="text"
                placeholder="例如: 100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <small>以 MockToken (MTK) 计价</small>
            </div>
            <button onClick={listNFT} disabled={!account}>
              上架
            </button>
          </div>
        </section>

        {/* 购买 NFT */}
        <section className="card">
          <h2>🛒 购买 NFT</h2>
          <div className="form">
            <div className="input-group">
              <label>Listing ID</label>
              <input
                type="text"
                placeholder="例如: 0"
                value={listingIdToBuy}
                onChange={(e) => setListingIdToBuy(e.target.value)}
              />
              <small>从下方市场列表中查看 ID</small>
            </div>
            <button onClick={buyNFT} disabled={!account}>
              购买
            </button>
          </div>
        </section>

        {/* 取消上架 */}
        <section className="card">
          <h2>❌ 取消上架</h2>
          <div className="form">
            <div className="input-group">
              <label>Listing ID</label>
              <input
                type="text"
                placeholder="例如: 0"
                value={listingIdToCancel}
                onChange={(e) => setListingIdToCancel(e.target.value)}
              />
              <small>只能取消自己上架的 NFT</small>
            </div>
            <button onClick={cancelListing} disabled={!account}>
              取消
            </button>
          </div>
        </section>

        {/* NFT 列表 */}
        <section className="card full-width">
          <h2>📋 市场列表</h2>
          <button onClick={() => { loadMarketData(); loadTokenBalance(); }} className="refresh-btn">
            刷新
          </button>
          <div className="listings">
            {Array.from(listings.entries()).map(([id, listing]) => (
              <div key={id} className={`listing-item ${!listing.isActive ? 'inactive' : ''}`}>
                <div className="listing-header">
                  <span className="listing-id">ID: {id}</span>
                  <span className={`status ${listing.isActive ? 'active' : 'sold'}`}>
                    {listing.isActive ? '在售' : '已售出'}
                  </span>
                </div>
                <div className="listing-details">
                  <p><strong>卖家:</strong> {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
                  <p><strong>NFT:</strong> {listing.nftContract.slice(0, 6)}...{listing.nftContract.slice(-4)}</p>
                  <p><strong>Token ID:</strong> {listing.tokenId.toString()}</p>
                  <p><strong>价格:</strong> {formatEther(listing.price)} MTK</p>
                </div>
              </div>
            ))}
            {listings.size === 0 && (
              <p className="empty-message">暂无上架的 NFT</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
