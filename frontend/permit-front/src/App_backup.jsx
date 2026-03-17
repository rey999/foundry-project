﻿import { useState, useEffect } from 'react'
import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther, defineChain, getContract } from 'viem'
import { signTypedData } from 'viem/actions'
import './App.css'
import { CONTRACT_ADDRESSES, RPC_URL } from './config'
import { TOKEN_ABI, BANK_ABI } from './contracts'

// 定义 Anvil 链配置
const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
})

function App() {
  const [account, setAccount] = useState(null)
  const [publicClient, setPublicClient] = useState(null)
  const [walletClient, setWalletClient] = useState(null)
  const [tokenBalance, setTokenBalance] = useState('0')
  const [bankDeposit, setBankDeposit] = useState('0')
  const [depositAmount, setDepositAmount] = useState('')
  const [permitDepositAmount, setPermitDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [status, setStatus] = useState({ message: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [permitLoading, setPermitLoading] = useState(false)

  // 初始化客户端
  useEffect(() => {
    const client = createPublicClient({
      chain: anvilChain,
      transport: http(RPC_URL)
    })
    setPublicClient(client)
  }, [])

  // 连接钱包
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus({ message: '请安装 MetaMask!', type: 'error' })
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const wallet = createWalletClient({
        account: accounts[0],
        chain: anvilChain,
        transport: custom(window.ethereum)
      })

      setAccount(accounts[0])
      setWalletClient(wallet)
      setStatus({ message: '钱包连接成功!', type: 'success' })
    } catch (error) {
      setStatus({ message: `连接失败: ${error.message}`, type: 'error' })
    }
  }

  // 加载余额
  const loadBalances = async () => {
    if (!publicClient || !account) return

    try {
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOKEN,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [account]
      })

      const deposit = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.BANK,
        abi: BANK_ABI,
        functionName: 'deposits',
        args: [account]
      })

      setTokenBalance(formatEther(balance))
      setBankDeposit(formatEther(deposit))
    } catch (error) {
      console.error('加载余额失败:', error)
    }
  }

  useEffect(() => {
    if (account && publicClient) {
      loadBalances()
      const interval = setInterval(loadBalances, 3000)
      return () => clearInterval(interval)
    }
  }, [account, publicClient])

  // 普通存款
  const handleDeposit = async () => {
    if (!depositAmount || !walletClient) return

    setLoading(true)
    setStatus({ message: '处理中...', type: 'info' })

    try {
      const amount = parseEther(depositAmount)

      // 先授权
      const approveTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.TOKEN,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.BANK, amount],
        account: account
      })

      await publicClient.waitForTransactionReceipt({ hash: approveTx })

      // 再存款
      const depositTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.BANK,
        abi: BANK_ABI,
        functionName: 'deposit',
        args: [amount],
        account: account
      })

      await publicClient.waitForTransactionReceipt({ hash: depositTx })

      setStatus({ message: '存款成功!', type: 'success' })
      setDepositAmount('')
      loadBalances()
    } catch (error) {
      setStatus({ message: `存款失败: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Permit 存款（使用 signTypedData）
  const handlePermitDeposit = async () => {
      if (!permitDepositAmount || !walletClient || !account) return

      setPermitLoading(true)
      setStatus({ message: '签名中...', type: 'info' })

      try {
        const amount = parseEther(permitDepositAmount)
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

        console.log('=== Permit 存款调试信息 ===')
        console.log('账户地址:', account)
        console.log('存款金额:', permitDepositAmount, 'ETH =', amount.toString(), 'Wei')
        console.log('截止时间:', deadline.toString())

        // 获取 Token 名称
        const tokenName = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TOKEN,
          abi: TOKEN_ABI,
          functionName: 'name'
        })
        console.log('Token 名称:', tokenName)

        // 获取 nonce
        const nonce = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TOKEN,
          abi: TOKEN_ABI,
          functionName: 'nonces',
          args: [account]
        })
        console.log('当前 nonce:', nonce.toString())

        // 获取 DOMAIN_SEPARATOR
        const domainSeparator = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TOKEN,
          abi: TOKEN_ABI,
          functionName: 'DOMAIN_SEPARATOR'
        })
        console.log('DOMAIN_SEPARATOR:', domainSeparator)

        // 准备 EIP-712 签名数据
        const domain = {
          name: tokenName,
          version: '1',
          chainId: anvilChain.id,
          verifyingContract: CONTRACT_ADDRESSES.TOKEN,
        }

        const types = {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        }

        const message = {
          owner: account,
          spender: CONTRACT_ADDRESSES.BANK,
          value: amount,
          nonce: nonce,
          deadline: deadline,
        }

        console.log('Domain:', domain)
        console.log('Message:', message)

        // 使用 signTypedData 签名
        const signature = await signTypedData(walletClient, {
          account: account,
          domain,
          types,
          primaryType: 'Permit',
          message,
        })

        console.log('签名结果:', signature)

        // 从签名中提取 v, r, s
        const r = signature.slice(0, 66)
        const s = '0x' + signature.slice(66, 130)
        const v = parseInt('0x' + signature.slice(130, 132), 16)

        console.log('v:', v)
        console.log('r:', r)
        console.log('s:', s)

        setStatus({ message: '提交交易中...', type: 'info' })

        // 调用 permitDeposit
        console.log('调用 permitDeposit 参数:', {
          amount: amount.toString(),
          deadline: deadline.toString(),
          v,
          r,
          s
        })

        const tx = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.BANK,
          abi: BANK_ABI,
          functionName: 'permitDeposit',
          args: [amount, deadline, v, r, s],
          account: account
        })

        console.log('交易哈希:', tx)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
        console.log('交易收据:', receipt)

        if (receipt.status === 'reverted') {
          throw new Error('交易被回滚')
        }

        setStatus({ message: 'Permit 存款成功!', type: 'success' })
        setPermitDepositAmount('')
        loadBalances()
      } catch (error) {
        console.error('=== Permit 存款错误详情 ===')
        console.error('错误对象:', error)
        console.error('错误消息:', error.message)
        console.error('错误详情:', error.details)
        console.error('错误原因:', error.cause)

        let errorMsg = '未知错误'
        if (error.shortMessage) {
          errorMsg = error.shortMessage
        } else if (error.message) {
          errorMsg = error.message
        }

        // 尝试解析 revert 原因
        if (error.message && error.message.includes('revert')) {
          const match = error.message.match(/reverted with reason string '([^']+)'/)
          if (match) {
            errorMsg = `合约回滚: ${match[1]}`
          }
        }

        setStatus({ message: `Permit 存款失败: ${errorMsg}`, type: 'error' })
      } finally {
        setPermitLoading(false)
      }
    }

  // 取款
  const handleWithdraw = async () => {
    if (!withdrawAmount || !walletClient) return

    setLoading(true)
    setStatus({ message: '处理中...', type: 'info' })

    try {
      const amount = parseEther(withdrawAmount)

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.BANK,
        abi: BANK_ABI,
        functionName: 'withdraw',
        args: [amount],
        account: account
      })

      await publicClient.waitForTransactionReceipt({ hash: tx })

      setStatus({ message: '取款成功!', type: 'success' })
      setWithdrawAmount('')
      loadBalances()
    } catch (error) {
      setStatus({ message: `取款失败: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>TokenBank Permit</h1>

        {!account ? (
          <button className="btn btn-primary" onClick={connectWallet}>
            连接钱包
          </button>
        ) : (
          <>
            <div className="wallet-section">
              <div className="wallet-info">
                <div className="info-row">
                  <span className="label">钱包地址:</span>
                  <span className="value">{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Token 余额:</span>
                  <span className="value">{parseFloat(tokenBalance).toFixed(4)} ETK</span>
                </div>
                <div className="info-row">
                  <span className="label">Bank 存款:</span>
                  <span className="value">{parseFloat(bankDeposit).toFixed(4)} ETK</span>
                </div>
              </div>
            </div>

            <div className="operations">
              <div className="operation-card">
                <h3>普通存款 (需要 Approve)</h3>
                <div className="input-group">
                  <label>存款金额</label>
                  <input
                    type="number"
                    placeholder="输入金额"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount}
                >
                  {loading ? <span className="loading"></span> : '存款'}
                </button>
              </div>

              <div className="operation-card" style={{background: '#e3f2fd'}}>
                <h3>Permit 存款 (无需 Approve)</h3>
                <div className="input-group">
                  <label>存款金额</label>
                  <input
                    type="number"
                    placeholder="输入金额"
                    value={permitDepositAmount}
                    onChange={(e) => setPermitDepositAmount(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handlePermitDeposit}
                  disabled={permitLoading || !permitDepositAmount}
                >
                  {permitLoading ? <span className="loading"></span> : 'Permit 存款'}
                </button>
                <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                  使用 EIP-2612 签名，一步完成授权和存款
                </p>
              </div>

              <div className="operation-card">
                <h3>取款</h3>
                <div className="input-group">
                  <label>取款金额</label>
                  <input
                    type="number"
                    placeholder="输入金额"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount}
                >
                  {loading ? <span className="loading"></span> : '取款'}
                </button>
              </div>
            </div>

            {status.message && (
              <div className={`status ${status.type}`}>
                {status.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
