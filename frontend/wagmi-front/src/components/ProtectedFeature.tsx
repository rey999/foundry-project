import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

/**
 * 演示：需要签名验证才能访问的功能
 * 
 * 实际应用场景：
 * 1. 查看自己的交易历史
 * 2. 修改个人资料
 * 3. 删除上架的 NFT
 * 4. 访问 VIP 功能
 */
export function ProtectedFeature() {
  const { address, isConnected } = useAccount()
  const { signMessage, isPending } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [secretData, setSecretData] = useState<string | null>(null)

  const handleAccessProtectedData = async () => {
    if (!address) return

    try {
      // 1. 创建签名消息
      const timestamp = Date.now()
      const nonce = Math.random().toString(36).substring(7)
      const message = `Access protected data
Address: ${address}
Action: View transaction history
Timestamp: ${timestamp}
Nonce: ${nonce}`

      // 2. 请求用户签名
      signMessage(
        { message },
        {
          onSuccess: async (signature) => {
            console.log('✅ Signature obtained:', signature)

            // 3. 发送到后端验证（这里模拟）
            // 实际应用中应该这样：
            /*
            const response = await fetch('/api/protected/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, signature })
            })
            const data = await response.json()
            */

            // 模拟后端验证成功
            setIsAuthenticated(true)
            setSecretData(`
🎉 验证成功！这是你的私密数据：

📊 交易历史：
- 2024-03-10: 购买 NFT #123 (0.5 ETH)
- 2024-03-11: 出售 NFT #456 (1.2 ETH)
- 2024-03-12: 上架 NFT #789 (2.0 ETH)

💰 总交易额: 3.7 ETH
🏆 VIP 等级: Gold

这些数据只有通过签名验证才能看到！
            `)
          },
          onError: (error) => {
            console.error('❌ Signature failed:', error)
            alert('签名失败，无法访问受保护的数据')
          }
        }
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReset = () => {
    setIsAuthenticated(false)
    setSecretData(null)
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
        <h3>🔒 Protected Feature</h3>
        <p style={{ color: '#666' }}>Please connect your wallet first</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h3>🔒 Protected Feature Demo</h3>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        This feature requires signature verification to access
      </p>

      {!isAuthenticated ? (
        <div>
          <div style={{ 
            padding: '15px', 
            background: '#fff3cd', 
            border: '1px solid #ffc107',
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              ⚠️ <strong>Why sign?</strong><br />
              Connecting wallet only shows your address. Signing proves you own the private key.
            </p>
          </div>

          <button
            onClick={handleAccessProtectedData}
            disabled={isPending}
            style={{
              padding: '12px 24px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              background: isPending ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {isPending ? '⏳ Waiting for signature...' : '🔓 Sign to Access'}
          </button>

          <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
            <p><strong>What happens when you click:</strong></p>
            <ol style={{ marginLeft: '20px' }}>
              <li>Your wallet will ask you to sign a message</li>
              <li>The signature proves you own this address</li>
              <li>Backend verifies the signature</li>
              <li>You get access to protected data</li>
            </ol>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            padding: '15px',
            background: '#e8f5e9',
            border: '1px solid #4caf50',
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: 0, color: '#2e7d32', fontWeight: '600' }}>
              ✅ Signature verified! You have access.
            </p>
          </div>

          {secretData && (
            <div style={{
              padding: '15px',
              background: '#f5f5f5',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              marginBottom: '15px'
            }}>
              {secretData}
            </div>
          )}

          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            Reset Demo
          </button>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#e3f2fd',
        borderRadius: '6px',
        fontSize: '13px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>💡 Real-world use cases:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>View your transaction history</li>
          <li>Edit your profile</li>
          <li>Delete your listings</li>
          <li>Access VIP features</li>
          <li>Claim airdrops</li>
          <li>Participate in governance</li>
        </ul>
      </div>
    </div>
  )
}
