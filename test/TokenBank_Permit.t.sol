// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/TokenBank_Permit.sol";

contract TokenBankPermitTest is Test {
    ExtendedERC20Permit public token;
    TokenBankV2 public bank;
    
    address public user1;
    address public user2;
    
    uint256 public user1PrivateKey;
    uint256 public user2PrivateKey;
    
    function setUp() public {
        // 创建测试用户地址和私钥
        user1PrivateKey = 0xA11CE;
        user2PrivateKey = 0xB0B;
        
        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        
        // 部署代币合约
        token = new ExtendedERC20Permit();
        
        // 部署TokenBankV2合约
        bank = new TokenBankV2(address(token));
        
        // 给测试用户分配代币
        token.transfer(user1, 1000 * 10**18);
        token.transfer(user2, 1000 * 10**18);
    }
    
    // 测试1: 正常的permitDeposit流程
    function testPermitDeposit() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // 构建permit签名
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 检查初始余额
        assertEq(token.balanceOf(user1), 1000 * 10**18);
        assertEq(bank.balanceOf(user1), 0);
        
        // 执行permitDeposit
        vm.prank(user1);
        bank.permitDeposit(depositAmount, deadline, v, r, s);
        
        // 验证存款成功
        assertEq(token.balanceOf(user1), 900 * 10**18);
        assertEq(token.balanceOf(address(bank)), depositAmount);
        assertEq(bank.balanceOf(user1), depositAmount);
    }
    
    // 测试2: 多次permitDeposit
    function testMultiplePermitDeposits() public {
        uint256 firstDeposit = 100 * 10**18;
        uint256 secondDeposit = 50 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // 第一次存款
        bytes32 permitHash1 = _getPermitHash(
            user1,
            address(bank),
            firstDeposit,
            token.nonces(user1),
            deadline
        );
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(user1PrivateKey, permitHash1);
        
        vm.prank(user1);
        bank.permitDeposit(firstDeposit, deadline, v1, r1, s1);
        
        assertEq(bank.balanceOf(user1), firstDeposit);
        
        // 第二次存款 (nonce会增加)
        bytes32 permitHash2 = _getPermitHash(
            user1,
            address(bank),
            secondDeposit,
            token.nonces(user1),
            deadline
        );
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(user1PrivateKey, permitHash2);
        
        vm.prank(user1);
        bank.permitDeposit(secondDeposit, deadline, v2, r2, s2);
        
        // 验证总存款
        assertEq(bank.balanceOf(user1), firstDeposit + secondDeposit);
        assertEq(token.balanceOf(user1), 1000 * 10**18 - firstDeposit - secondDeposit);
    }
    
    // 测试3: 过期的permit应该失败
    function testPermitDepositExpired() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 时间快进到deadline之后
        vm.warp(deadline + 1);
        
        // 应该失败
        vm.prank(user1);
        vm.expectRevert("ERC20Permit: expired deadline");
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }
    
    // 测试4: 无效的签名应该失败
    function testPermitDepositInvalidSignature() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // 使用user1的参数但用user2的私钥签名
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user2PrivateKey, permitHash);
        
        // 应该失败
        vm.prank(user1);
        vm.expectRevert("ERC20Permit: invalid signature");
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }

    
    // 测试5: 余额不足应该失败
    function testPermitDepositInsufficientBalance() public {
        uint256 depositAmount = 2000 * 10**18; // 超过用户余额
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 应该失败
        vm.prank(user1);
        vm.expectRevert("TokenBank: insufficient token balance");
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }
    
    // 测试6: 零金额应该失败
    function testPermitDepositZeroAmount() public {
        uint256 depositAmount = 0;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 应该失败
        vm.prank(user1);
        vm.expectRevert("TokenBank: deposit amount must be greater than zero");
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }
    
    // 测试7: 重放攻击应该失败 (使用相同的签名两次)
    function testPermitDepositReplayAttack() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 第一次调用成功
        vm.prank(user1);
        bank.permitDeposit(depositAmount, deadline, v, r, s);
        
        // 第二次使用相同签名应该失败 (nonce已经增加)
        vm.prank(user1);
        vm.expectRevert("ERC20Permit: invalid signature");
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }
    
    // 测试8: 不同用户可以同时使用permitDeposit
    function testPermitDepositMultipleUsers() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // User1存款
        bytes32 permitHash1 = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(user1PrivateKey, permitHash1);
        
        vm.prank(user1);
        bank.permitDeposit(depositAmount, deadline, v1, r1, s1);
        
        // User2存款
        bytes32 permitHash2 = _getPermitHash(
            user2,
            address(bank),
            depositAmount,
            token.nonces(user2),
            deadline
        );
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(user2PrivateKey, permitHash2);
        
        vm.prank(user2);
        bank.permitDeposit(depositAmount, deadline, v2, r2, s2);
        
        // 验证两个用户的存款
        assertEq(bank.balanceOf(user1), depositAmount);
        assertEq(bank.balanceOf(user2), depositAmount);
        assertEq(token.balanceOf(address(bank)), depositAmount * 2);
    }
    
    // 测试9: 验证Deposit事件被正确触发
    function testPermitDepositEmitsEvent() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        // 期望触发Deposit事件
        vm.expectEmit(true, false, false, true);
        emit Deposit(user1, depositAmount);
        
        vm.prank(user1);
        bank.permitDeposit(depositAmount, deadline, v, r, s);
    }
    
    // 测试10: permitDeposit后可以正常withdraw
    function testPermitDepositThenWithdraw() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 withdrawAmount = 50 * 10**18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // 使用permitDeposit存款
        bytes32 permitHash = _getPermitHash(
            user1,
            address(bank),
            depositAmount,
            token.nonces(user1),
            deadline
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, permitHash);
        
        vm.prank(user1);
        bank.permitDeposit(depositAmount, deadline, v, r, s);
        
        // 提取部分存款
        vm.prank(user1);
        bank.withdraw(withdrawAmount);
        
        // 验证余额
        assertEq(bank.balanceOf(user1), depositAmount - withdrawAmount);
        assertEq(token.balanceOf(user1), 1000 * 10**18 - depositAmount + withdrawAmount);
    }
    
    // 辅助函数: 构建permit签名哈希
    function _getPermitHash(
        address owner,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes32) {
        bytes32 PERMIT_TYPEHASH = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );
        
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                nonce,
                deadline
            )
        );
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );
    }
    
    // 声明事件用于测试
    event Deposit(address indexed user, uint256 amount);
}
