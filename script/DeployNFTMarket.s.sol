// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/NFTMarket.sol";
import "../src/MockERC20.sol";
import "../src/MockERC721.sol";

contract DeployNFTMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署 MockERC20 (支付代币)
        MockERC20 paymentToken = new MockERC20(1000000 * 10**18); // 100万代币
        console.log("MockERC20 deployed at:", address(paymentToken));

        // 2. 部署 MockERC721 (NFT)
        MockERC721 nft = new MockERC721();
        console.log("MockERC721 deployed at:", address(nft));

        // 3. 部署 NFTMarket
        NFTMarket market = new NFTMarket(address(paymentToken));
        console.log("NFTMarket deployed at:", address(market));

        // 4. 铸造一些测试 NFT
        for (uint256 i = 1; i <= 5; i++) {
            nft.mint(msg.sender, i);
        }
        console.log("Minted 5 test NFTs to deployer");

        // 5. 给部署者一些代币
        console.log("Deployer token balance:", paymentToken.balanceOf(msg.sender));

        vm.stopBroadcast();

        // 输出部署信息到文件
        string memory deploymentInfo = string(abi.encodePacked(
            "NFT_MARKET_ADDRESS=", vm.toString(address(market)), "\n",
            "PAYMENT_TOKEN_ADDRESS=", vm.toString(address(paymentToken)), "\n",
            "NFT_CONTRACT_ADDRESS=", vm.toString(address(nft)), "\n"
        ));
        
        vm.writeFile("frontend/viem-front/.env.local", deploymentInfo);
        console.log("\nDeployment info written to frontend/viem-front/.env.local");
    }
}
