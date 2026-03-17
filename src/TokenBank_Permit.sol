// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {TokenBank, IERC20, ITokenReceiver, ExtendedERC20} from "./TokenBank.sol";

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

// Extended ERC20 with EIP-2612 Permit support
contract ExtendedERC20Permit is ExtendedERC20 {
    bytes32 private immutable _DOMAIN_SEPARATOR;
    bytes32 private constant _PERMIT_TYPEHASH = 
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    mapping(address => uint256) private _nonces;

    constructor() ExtendedERC20() {
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        bytes32 structHash = keccak256(
            abi.encode(
                _PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                _nonces[owner]++,
                deadline
            )
        );

        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));

        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0) && signer == owner, "ERC20Permit: invalid signature");

        allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function nonces(address owner) public view returns (uint256) {
        return _nonces[owner];
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }
}

// TokenBankV2 with Permit deposit support
contract TokenBankV2 is TokenBank, ITokenReceiver {
    ExtendedERC20Permit public extendedToken;

    constructor(address _tokenAddress) TokenBank(_tokenAddress) {
        extendedToken = ExtendedERC20Permit(_tokenAddress);
    }

    function tokensReceived(address from, uint256 amount) external override returns (bool) {
        require(msg.sender == address(token), "TokenBankV2: caller is not the token contract");
        deposits[from] += amount;
        emit Deposit(from, amount);
        return true;
    }

    function permitDeposit(
        uint256 _amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_amount > 0, "TokenBank: deposit amount must be greater than zero");
        require(extendedToken.balanceOf(msg.sender) >= _amount, "TokenBank: insufficient token balance");

        IERC20Permit(address(extendedToken)).permit(msg.sender, address(this), _amount, deadline, v, r, s);

        bool success = extendedToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "TokenBank: transfer failed");

        deposits[msg.sender] += _amount;
        emit Deposit(msg.sender, _amount);
    }
}
