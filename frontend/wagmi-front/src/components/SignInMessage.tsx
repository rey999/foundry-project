import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { verifyMessage } from 'viem'

export function SignInMessage() {
  const { address, isConnected } = useAccount()
  const { signMessage, data: signature, isPending, isSuccess } = useSignMessage()
  const [verified, setVerified] = useState<boolean | null>(null)
  const [currentMessage, setCurrentMessage] = useState<string>('')

  const handleSignIn = async () => {
    if (!address) return

    // 生成登录消息
    const timestamp = new Date().toISOString()
    const nonce = Math.random().toString(36).substring(7)
    
    const message = `Welcome to NFT Market!

Please sign this message to verify your identity.

Wallet: ${address}
Timestamp: ${timestamp}
Nonce: ${nonce}`

    setCurrentMessage(message)
    signMessage({ message })
  }

  const handleVerify = async () => {
    if (!signature || !address || !currentMessage) return

    try {
      const isValid = await verifyMessage({
        address,
        message: currentMessage,
        signature,
      })
      setVerified(isValid)
      
      if (isValid) {
        console.log('✅ Signature verified!')
      } else {
        console.log('❌ Signature verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerified(false)
    }
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
        <p style={{ color: '#666' }}>Please connect your wallet first</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h2>🔐 Sign Message</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Sign a message to prove you own this wallet
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <button
          onClick={handleSignIn}
          disabled={isPending}
          style={{
            padding: '12px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            background: isPending ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {isPending ? 'Waiting for signature...' : '✍️ Sign Message'}
        </button>

        {isSuccess && signature && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ color: 'green', fontWeight: '600' }}>✅ Message signed!</p>
            <div style={{
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '4px',
              wordBreak: 'break-all',
              fontSize: '12px',
              fontFamily: 'monospace',
              marginTop: '10px'
            }}>
              <strong>Signature:</strong><br />
              {signature.slice(0, 30)}...{signature.slice(-30)}
            </div>

            <button
              onClick={handleVerify}
              style={{
                marginTop: '10px',
                padding: '10px',
                cursor: 'pointer',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                width: '100%'
              }}
            >
              🔍 Verify Signature
            </button>

            {verified !== null && (
              <p style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: '4px',
                background: verified ? '#e8f5e9' : '#ffebee',
                color: verified ? '#2e7d32' : '#c62828',
                fontWeight: '600'
              }}>
                {verified ? '✅ Signature verified!' : '❌ Verification failed'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
