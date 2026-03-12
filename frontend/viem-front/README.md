# NFT Market Frontend

使用 React + Viem 构建的 NFT 市场前端应用。

## 功能特性

- 🔗 连接 MetaMask 钱包
- 📤 上架 NFT 到市场
- 🛒 购买市场上的 NFT
- ❌ 取消 NFT 上架
- 📋 查看所有市场列表

## 技术栈

- React 18
- TypeScript
- Viem (Web3 库)
- Vite (构建工具)

## 安装依赖

```bash
npm install
```

## 配置合约地址

在 `src/contracts.ts` 文件中配置实际的合约地址：

```typescript
export const CONTRACTS = {
  NFT_MARKET: '0x...', // NFTMarket 合约地址
  PAYMENT_TOKEN: '0x...', // ERC20 Token 地址
  NFT_CONTRACT: '0x...', // NFT 合约地址
}
```

## 运行开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

## 构建生产版本

```bash
npm run build
```

## 使用说明

1. 点击"连接钱包"按钮连接 MetaMask
2. 在"上架 NFT"区域输入 NFT 合约地址、Token ID 和价格
3. 点击"上架"按钮将 NFT 上架到市场
4. 在"购买 NFT"区域输入 Listing ID 购买 NFT
5. 在"取消上架"区域输入 Listing ID 取消上架
6. 在"市场列表"区域查看所有上架的 NFT

## 注意事项

- 确保已安装 MetaMask 浏览器插件
- 确保钱包中有足够的 ETH 用于支付 gas 费用
- 确保钱包中有足够的 ERC20 代币用于购买 NFT
- 上架前需要先授权 NFT 给市场合约
- 购买前需要先授权 ERC20 代币给市场合约
