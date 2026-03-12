#!/bin/bash

# 从 .env.local 读取合约地址并更新 contracts.ts

ENV_FILE="frontend/viem-front/.env.local"
CONTRACTS_FILE="frontend/viem-front/src/contracts.ts"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 找不到 $ENV_FILE 文件"
    echo "请先运行部署脚本"
    exit 1
fi

# 读取地址
NFT_MARKET=$(grep "NFT_MARKET_ADDRESS" $ENV_FILE | cut -d'=' -f2)
PAYMENT_TOKEN=$(grep "PAYMENT_TOKEN_ADDRESS" $ENV_FILE | cut -d'=' -f2)
NFT_CONTRACT=$(grep "NFT_CONTRACT_ADDRESS" $ENV_FILE | cut -d'=' -f2)

echo "📝 更新 contracts.ts..."
echo "NFT Market: $NFT_MARKET"
echo "Payment Token: $PAYMENT_TOKEN"
echo "NFT Contract: $NFT_CONTRACT"

# 生成新的 contracts.ts
cat > $CONTRACTS_FILE << 'EOF'
// 此文件由部署脚本自动生成
// 最后更新时间: 
EOF

echo "// $(date)" >> $CONTRACTS_FILE

cat >> $CONTRACTS_FILE << 'EOF'

// NFTMarket 合约 ABI
export const NFT_MARKET_ABI = [
  {
    type: 'constructor',
    inputs: [{ name: '_paymentTokenAddress', type: 'address' }],
  },
  {
    type: 'function',
    name: 'list',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_nftContract', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
      { name: '_price', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'cancelListing',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buyNFT',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buyNftWithCallback',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'listings',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'nextListingId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'paymentToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'NFTListed',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'nftContract', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'price', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'NFTSold',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'nftContract', type: 'address', indexed: false },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'price', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'NFTListingCancelled',
    inputs: [{ name: 'listingId', type: 'uint256', indexed: true }],
  },
] as const

// ERC20 Token ABI (简化版)
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

// ERC721 NFT ABI (简化版)
export const ERC721_ABI = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const

// 合约地址 (自动生成)
export const CONTRACTS = {
EOF

echo "  NFT_MARKET: '$NFT_MARKET' as \`0x\${string}\`," >> $CONTRACTS_FILE
echo "  PAYMENT_TOKEN: '$PAYMENT_TOKEN' as \`0x\${string}\`," >> $CONTRACTS_FILE
echo "  NFT_CONTRACT: '$NFT_CONTRACT' as \`0x\${string}\`," >> $CONTRACTS_FILE

cat >> $CONTRACTS_FILE << 'EOF'
}
EOF

echo "✅ contracts.ts 已更新！"
