pragma solidity ^0.8.0;

// 导入IERC20接口，用于与ERC20代币交互
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

// 定义接收代币回调的接口
interface ITokenReceiver {
    function tokensReceived(address from, uint256 amount, bytes calldata data) external returns (bool);
}

// 简单的ERC721接口
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function getApproved(uint256 tokenId) external view returns (address);
}

// 扩展的ERC20接口，添加带有回调功能的转账函数；
interface IExtendedERC20 is IERC20 {
    function transferWithCallback(address _to,uint256 _value) external returns(bool);

    function transferWithCallbackAndData(address _to,uint256 _value,bytes calldata _data) external returns (bool);
}

contract NFTMarket is ITokenReceiver {

    // 扩展的ERC20代币合约地址；
    IExtendedERC20 public paymentToken;

    // NFT 上架结构体信息

    struct Listing {
        address seller;         //买家地址
        address nftContract;    //NFT合约地址
        uint256 tokenId;        //nft的tokenId
        uint256 price;          //价格（以token为单位)
        bool isActive;          //是否处于活跃状态
    }

    // 所有上架的NFT，使用listingId作为唯一标识
    mapping(uint256 => Listing) public listings;

    uint256 public nextListingId;

    //Nft上架和购买事件
    event NFTListed(uint256 indexed listingId,address indexed seller,address indexed nftContract,uint256 tokenId,uint256 price);
    event NFTSold(uint256 indexed listingId,address indexed buyer,address indexed seller,address nftContract,uint256 tokenId,uint256 price);
    event NFTListingCancelled(uint256 indexed listingId);

    //构造函数，设置支付代币地址
    constructor(address _paymentTokenAddress){
        require(_paymentTokenAddress != address(0),"NFTMarket:payment token address cannot be zero");
        paymentToken = IExtendedERC20(_paymentTokenAddress);
    }


    // 上架NFT
    function list(address _nftContract,uint256 _tokenId,uint256 _price) external returns(uint256) {
        //检查价格是否大于0
        require(_price > 0,"NFTMarket:price must be greater than zero");

        //检查NFT合约地址是否有效
        require(_nftContract != address(0),"NFTMarket: NFT contract address cannot be zero");

        //检查调用者是否为NFT的所有者或已获得授权
        IERC721 nftContract = IERC721(_nftContract);
        address owner = nftContract.ownerOf(_tokenId);
        require(
            owner == msg.sender ||
            nftContract.isApprovedForAll(owner, msg.sender)||
            nftContract.getApproved(_tokenId) == msg.sender,
            "NFTMarket: caller is not owner nor approved"
        );


        //创建新的上架信息
        uint256 listingId = nextListingId;
        listings[listingId] = Listing({
            seller:owner,
            nftContract:_nftContract,
            tokenId:_tokenId,
            price:_price,
            isActive:true
        });

        // 增加listingId技术器
        nextListingId ++;

        //出发NFT上架事件
        emit NFTListed(listingId, owner, _nftContract, _tokenId, _price);

        return listingId;
    }

    // 取消上架NFT
    function cancelListing(uint256 _listingId) external {
        //检查上架信息是否存在且处于活跃状态
        Listing storage listing = listings[_listingId];
        require(listing.isActive,"NFTMarket:listing is not active");

        //检查调用者是否为卖家
        require(listing.seller == msg.sender,"NFTMarket: caller is not ther seller");

        // 将商家信息标记为非活跃
        listing.isActive = false;

        //出发NFT上架取消事件
        emit NFTListingCancelled(_listingId);
    }

    function buyNFT(uint256 _listingId) external {
        //检查上架信息是否存在且在活跃状态
        Listing storage listing = listings[_listingId];
        require(listing.isActive,"NFTMarket: listing is not active");

        //检查卖家是否有足够的代币
        require(paymentToken.balanceOf(msg.sender) >= listing.price,"NFTMarket: insufficient token balance");

        // 将商家信息标记为非活跃
        listing.isActive = false;

        //处理代币转账（卖家 -> 卖家）
        bool success = paymentToken.transferFrom(msg.sender, listing.seller, listing.price);
        require(success,"NFTmarket:token transfer failed");

        // 处理NFT转移（卖家 -> 买家）
        IERC721(listing.nftContract).transferFrom(listing.seller, msg.sender, listing.tokenId);

        //出发NFT售出事件
        emit NFTSold(_listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, listing.price);
    }

    //实现tokenReceived接口，处理通过transferWithCallback接收到的代币
    function tokensReceived(address from, uint256 amount, bytes calldata data) external override returns(bool){
        //检查调用者是否未支付代币合约
        require(msg.sender == address(paymentToken),"NFTMarket: caller is not the payment token contract");

        //解析附加数据，获取listingId
        require(data.length == 32,"NFTMarket: invalid data length");
        uint256 listingId = abi.decode(data,(uint256));

        //检查上架信息是否处于活跃状态
        Listing storage listing = listings[listingId];
        require(listing.isActive,"NFTMarket: listing is not active");

        //检查转入的代币数量是否等于NFT价格
        require(amount == listing.price,"NFTMarket: incorrect payment amount");

        //将商家信息标记为非活跃
        listing.isActive = false;

        //将代币转给卖家
        bool success = paymentToken.transfer(listing.seller, amount);
        require(success,"NFTMarket: token transfer to seller failed");

        // 处理NFT转移（卖家->买家）
        IERC721(listing.nftContract).transferFrom(listing.seller, from, listing.tokenId);

        emit NFTSold(listingId, from, listing.seller, listing.nftContract, listing.tokenId, amount);

        return true;
    }

    // 使用transferWithCallbackAndData 购买nft的辅助函数
    function buyNftWithCallback(uint256 _listingId) external {
        // 检查上架信息是否处于活跃状态
        Listing storage listing = listings[_listingId];
        require(listing.isActive,"NFTMarket: listing is not active");

        // 检查卖家是否有足够的代币
        require(paymentToken.balanceOf(msg.sender) >= listing.price,"NFTMarket: insufficient token balance");

        //编码listingId作为附加数据
        bytes memory data = abi.encode(_listingId);

        //调用transferWithCallbackAndData函数，将代币转给市场合约并附带listingId数据
        bool success = paymentToken.transferWithCallbackAndData(address(this), listing.price, data);
        require(success,"NFTMarket:token transfer with call back failed");
    }
}
