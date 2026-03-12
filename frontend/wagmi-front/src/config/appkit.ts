import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia, localhost } from '@reown/appkit/networks'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

const metadata = {
  name: 'NFT Market',
  description: 'Buy, Sell, and Trade NFTs',
  url: 'https://nftmarket.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const networks = [mainnet, sepolia, localhost]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

export const config = wagmiAdapter.wagmiConfig
