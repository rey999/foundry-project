import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/appkit'
import { Header } from './components/Header'
import { WalletConnect } from './components/WalletConnect'
import { SignInWithEthereum } from './components/SignInWithEthereum'
import { ProtectedFeature } from './components/ProtectedFeature'
import { ListNFT } from './components/ListNFT'
import { BuyNFT } from './components/BuyNFT'
import { CancelListing } from './components/CancelListing'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <Header />
          <WalletConnect />
          
          {/* 签名登录和演示 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}>
            <SignInWithEthereum />
            <ProtectedFeature />
          </div>
          
          {/* NFT 操作 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}>
            <ListNFT />
            <BuyNFT />
            <CancelListing />
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
