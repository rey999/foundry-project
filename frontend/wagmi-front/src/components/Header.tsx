export function Header() {
  return (
    <header style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      color: 'white',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h1 style={{ margin: 0 }}>NFT Market</h1>
      <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Buy, Sell, and Trade NFTs</p>
    </header>
  )
}
