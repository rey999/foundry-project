// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


// @title 多签钱包合约
// @notice 这是一个支持多人签名的钱包合约，可以用于团队资金管理
contract ContractWallet {

    //记录存款事件
    event Deposit(address indexed sender, uint amount, uint balance);

    // 记录提交交易事件，包含交易索引、提交者地址、目标地址、转账金额和调用数据
    event SubmitTransaction(
        uint indexed txIndex,
        address indexed owner,
        address indexed to,
        uint value,
        bytes data
    );

    // 记录确认交易事件，包含交易索引和确认者地址
    event ConfirmTransaction(uint indexed txIndex, address indexed owner);

    // 记录撤销确认事件，包含交易索引和撤销者地址
    event RevokeConfirmation(uint indexed txIndex, address indexed owner);

    // 记录执行交易事件，包含交易索引、目标地址、转账金额和调用数据
    event ExecuteTransaction(uint indexed txIndex,address indexed to,uint value,bytes data);

    //多签持有人地址列表
    address[] public owners;

    //记录地址是否为多签持有人
    mapping(address => bool) public isOwner;

    //执行交易最少确认数
    uint public numConfirmationsRequired;

    //交易结构体，交易的详细记录
    struct Transection{
        address to;// 目标地址
        uint value;// 转账金额
        bytes data;// 调用数据
        bool excuted;// 是否已执行
        uint numConfirmations; //确认数
    }

    //记录交易的确认状态 交易索引=>持有人=>是否确认
    mapping(uint => mapping(address=>bool)) public isConfirmed;

    //所有交易列表
    Transection[] public transections;

    //限制只有多签持有人才能调用
    modifier onlyOwner() {
        require(isOwner[msg.sender],"not owner");
        _;
    }

    //验证交易是否存在
    modifier txExists(uint _index){
        require(_index < transections.length,"tx already executed");
        _;
    }

    //验证交易是否未被当前调用者确认
    modifier notConfirmed(uint _index){
        require(!isConfirmed[_index][msg.sender]);
        _;
    }

    //验证交易是否执行
    modifier notExcute(uint _index){
        require(!transections[_index].excuted);
        _;
    }

    constructor(address [] memory _owners,uint _numConfirmationsRequired){
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        //初始化所有持签人
        for(uint i=0;i<_owners.length;i++){
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // @notice 提交新的交易提案
    // @param _to 目标地址
    // @param _value 转账金额
    // @param _data 调用数据
    function submitTransaction(address to,uint256 value,bytes memory _data) public onlyOwner {
        uint txIndex = transections.length;
        transections.push(Transection({
            to: to,
            value: value,
            data: _data,
            excuted: false,
            numConfirmations: 0
        }));
        emit SubmitTransaction(txIndex, msg.sender, to, value, _data);
    }
    
    // @notice 确认交易
    // @param _txIndex 交易索引
    function confirmTransaction(uint _index) 
        public 
        onlyOwner 
        txExists(_index)
        notConfirmed(_index)
        notExcute(_index)
    {
        Transection storage transaction = transections[_index];
        transaction.numConfirmations++;
        isConfirmed[_index][msg.sender] = true;
        emit ConfirmTransaction(_index, msg.sender);
    }

    function executeTransaction(uint _index) 
        public
        txExists(_index)
        notExcute(_index)
    {
        Transection storage transaction = transections[_index];
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );
        address to = transaction.to;
        transaction.excuted = true;
        (bool success,) = to.call{value:transaction.value}(transaction.data);
        require(success,"tx failed");

        emit ExecuteTransaction(
            _index,
            transaction.to,
            transaction.value,
            transaction.data
        );
    }


    function revokeConfirmation(uint _index)
        public 
        onlyOwner
        notExcute(_index)
        txExists(_index)
    {
        require(isConfirmed[_index][msg.sender], "tx not confirmed");
        Transection storage transaction = transections[_index];
        isConfirmed[_index][msg.sender] = false;
        transaction.numConfirmations --;
        emit RevokeConfirmation(_index, msg.sender);
    }

    function getOwners() public view returns(address [] memory){
        return owners;
    }

    function getTransectionCount()public view returns (uint){
        return transections.length;
    }

    function getTransection(uint _index) public view returns(Transection memory){
        return transections[_index];
    }

}
