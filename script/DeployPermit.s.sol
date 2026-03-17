// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {ExtendedERC20Permit, TokenBankV2} from "../src/TokenBank_Permit.sol";

contract DeployPermitScript is Script {
    function run() external returns (address, address) {
        vm.startBroadcast();

        ExtendedERC20Permit token = new ExtendedERC20Permit();
        console.log("ExtendedERC20Permit deployed at:", address(token));
        console.log("Token name:", token.name());
        console.log("Token symbol:", token.symbol());
        console.log("Total supply:", token.totalSupply());

        TokenBankV2 bank = new TokenBankV2(address(token));
        console.log("TokenBankV2 deployed at:", address(bank));

        console.log("Deployer balance:", token.balanceOf(msg.sender));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Configuration ===");
        console.log("Update addresses in frontend/permit-front/src/contracts.js:");
        console.log("TOKEN_ADDRESS:", address(token));
        console.log("BANK_ADDRESS:", address(bank));

        return (address(token), address(bank));
    }
}
