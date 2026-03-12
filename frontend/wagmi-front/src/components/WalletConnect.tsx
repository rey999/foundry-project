import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Connected</p>
            <p style={{ margin: '5px 0 0 0', fontFamily: 'monospace', fontSize: '16px' }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => open()} 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              Account
            </button>
            <button 
              onClick={() => disconnect()} 
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>Connect Your Wallet</h3>
      <p style={{ margin: '0 0 20px 0', color: '#666' }}>
        Connect your wallet to start trading NFTs
      </p>
      <button
        onClick={() => open()}
        style={{
          padding: '12px 30px',
          fontSize: '16px',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600'
        }}
      >
        Connect Wallet
      </button>
    </div>
  )
}
