# NFT Market Frontend

基于 Vite + React + Wagmi + AppKit 的 NFT 市场前端应用。

## ✨ 功能特性

- 🔌 AppKit 钱包连接（支持 300+ 钱包）
- 📝 NFT 上架功能
- 🛒 NFT 购买功能
- ❌ 取消上架功能
- 🌐 多链支持（Mainnet, Sepolia, Localhost）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 从 https://cloud.reown.com/ 获取
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# 部署后的合约地址
VITE_NFT_MARKET_ADDRESS=0x...
VITE_PAYMENT_TOKEN_ADDRESS=0x...
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📖 使用说明

### 连接钱包

1. 点击 "Connect Wallet" 按钮
2. 选择你的钱包（MetaMask, Coinbase, WalletConnect 等）
3. 授权连接

### 上架 NFT

1. 输入 NFT 合约地址
2. 输入 Token ID
3. 输入价格（以支付代币为单位）
4. 点击 "Approve NFT" 授权
5. 点击 "List NFT" 完成上架

### 购买 NFT

1. 输入 Listing ID
2. 查看 NFT 详情
3. 点击 "Approve Tokens" 授权代币
4. 点击 "Buy NFT" 完成购买

### 取消上架

1. 输入 Listing ID
2. 点击 "Cancel Listing"（仅卖家可操作）

## 🛠️ 技术栈

- **Vite** - 快速构建工具
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Wagmi** - 以太坊 React Hooks
- **Viem** - 轻量级以太坊库
- **AppKit** - 钱包连接 UI
- **TanStack Query** - 数据管理

## 📁 项目结构

```
src/
├── components/
│   ├── Header.tsx          # 页面头部
│   ├── WalletConnect.tsx   # 钱包连接（AppKit）
│   ├── ListNFT.tsx         # NFT 上架
│   ├── BuyNFT.tsx          # NFT 购买
│   └── CancelListing.tsx   # 取消上架
├── config/
│   └── appkit.ts           # AppKit 配置
├── contracts/
│   └── abis.ts             # 合约 ABI
├── App.tsx                 # 主应用
└── index.tsx               # 入口文件
```

## 🔧 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 📚 相关文档

- [AppKit 集成指南](./APPKIT_SETUP.md)
- [合约 ABI 说明](./src/contracts/abis.ts)

## ⚠️ 注意事项

1. 需要先部署 NFTMarket 合约和支付代币合约
2. 上架前需授权 NFT 给市场合约
3. 购买前需授权代币给市场合约
4. 确保钱包有足够 ETH 支付 gas 费用
5. 建议在测试网（Sepolia）或本地节点（Anvil）测试

## 🌐 本地测试

使用 Foundry Anvil 启动本地节点：

```bash
anvil
```

然后在 AppKit 中选择 "Localhost" 网络。

## 📄 License

MIT
