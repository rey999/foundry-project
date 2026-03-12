#!/bin/bash

echo "🚀 启动 NFT Market 本地开发环境"
echo "================================"

# 1. 启动 Anvil 本地节点（在后台运行）
echo "📡 启动 Anvil 本地节点..."
anvil --port 8545 --chain-id 31337 &
ANVIL_PID=$!

# 等待 Anvil 启动
sleep 3

# 2. 部署合约
echo ""
echo "📝 部署合约..."
forge script script/DeployNFTMarket.s.sol:DeployNFTMarket \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# 3. 更新前端合约地址
echo ""
echo "📝 更新前端合约地址..."
chmod +x update-contracts.sh
./update-contracts.sh

# 4. 显示部署信息
echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 合约地址已自动更新到: frontend/viem-front/src/contracts.ts"
echo ""
echo "🔑 测试账户信息:"
echo "   地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "   私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "🌐 RPC URL: http://localhost:8545"
echo "🆔 Chain ID: 31337"
echo ""
echo "💡 提示:"
echo "   1. 在 MetaMask 中添加本地网络"
echo "   2. 导入上面的测试账户私钥"
echo "   3. 进入 frontend/viem-front 目录运行 npm run dev"
echo ""
echo "⚠️  按 Ctrl+C 停止 Anvil 节点"

# 保持脚本运行，等待用户中断
wait $ANVIL_PID
