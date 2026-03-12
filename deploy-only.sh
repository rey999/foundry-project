#!/bin/bash

echo "📝 部署合约到本地 Anvil 节点..."

forge script script/DeployNFTMarket.s.sol:DeployNFTMarket \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  -vvvv

echo ""
echo "📝 更新前端合约地址..."
chmod +x update-contracts.sh
./update-contracts.sh

echo ""
echo "✅ 部署完成！"
echo "📋 合约地址已自动更新到 frontend/viem-front/src/contracts.ts"
