import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

interface AuthState {
  isAuthenticated: boolean
  message: string | null
  signature: string | null
}

export function SignInWithEthereum() {
  const { address, isConnected, chain } = useAccount()
  const { signMessage, isPending } = useSignMessage()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    message: null,
    signature: null
  })

  // 当钱包断开时清除认证状态
  useEffect(() => {
    if (!isConnected) {
      setAuthState({
        isAuthenticated: false,
        message: null,
        signature: null
      })
    }
  }, [isConnected])

  const createSiweMessage = (address: string, chainId: number): string => {
    const domain = window.location.host
    const origin = window.location.origin
    const statement = 'Sign in to NFT Market to access all features'
    const nonce = generateNonce()
    const issuedAt = new Date().toISOString()

    // 创建符合 EIP-4361 标准的 SIWE 消息
    return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`
  }

  const handleSignIn = async () => {
    if (!address || !chain) return

    try {
      const message = createSiweMessage(address, chain.id)

      // 请求签名
      signMessage(
        { message },
        {
          onSuccess: (signature) => {
            // 在实际应用中，你应该将 message 和 signature 发送到后端验证
            setAuthState({
              isAuthenticated: true,
              message,
              signature
            })
            
            // 可以将认证信息存储到 localStorage
            localStorage.setItem('siwe_auth', JSON.stringify({
              address,
              message,
              signature,
              timestamp: Date.now()
            }))

            console.log('✅ Signed in successfully!')
            console.log('Message:', message)
            console.log('Signature:', signature)
          },
          onError: (error) => {
            console.error('❌ Sign in failed:', error)
          }
        }
      )
    } catch (error) {
      console.error('Error creating SIWE message:', error)
    }
  }

  const handleSignOut = () => {
    setAuthState({
      isAuthenticated: false,
      message: null,
      signature: null
    })
    localStorage.removeItem('siwe_auth')
    console.log('👋 Signed out')
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
        <h3>🔐 Authentication</h3>
        <p style={{ color: '#666' }}>Please connect your wallet first</p>
      </div>
    )
  }

  if (authState.isAuthenticated) {
    return (
      <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', marginTop: '20px' }}>
        <h3>✅ Authenticated</h3>
        <p style={{ margin: '10px 0', color: '#2e7d32' }}>
          You are signed in as: <br />
          <code style={{ 
            fontSize: '14px',
            background: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block',
            marginTop: '5px'
          }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </code>
        </p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Chain ID: {chain?.id} | Network: {chain?.name}
        </p>
        <button
          onClick={handleSignOut}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            marginTop: '10px'
          }}
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h3>🔐 Sign In with Ethereum</h3>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        Sign a message to authenticate and access protected features
      </p>
      <button
        onClick={handleSignIn}
        disabled={isPending}
        style={{
          padding: '12px 24px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          background: isPending ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {isPending ? '⏳ Waiting for signature...' : '✍️ Sign In'}
      </button>
    </div>
  )
}

// 生成随机 nonce
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}
