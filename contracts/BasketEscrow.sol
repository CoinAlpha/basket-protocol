/*

  Copyright 2018 CoinAlpha, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.22;

import "./zeppelin/SafeMath.sol";
import "./zeppelin/ERC20.sol";
import "./BasketRegistry.sol";

/// @title BasketEscrow -- Escrow contract to facilitate trading
/// @author CoinAlpha, Inc. <contact@coinalpha.com>
contract BasketEscrow {
  using SafeMath for uint;

  // Constants set at contract inception
  address                 public admin;
  address                 public transactionFeeRecipient;
  uint                    public transactionFee;
  uint                    public FEE_DECIMALS;

  uint                    public orderIndex;
  address                 public basketRegistryAddress;
  address                 public ETH_ADDRESS;

  // mapping of token addresses to mapping of account balances (token=0 means Ether)
  // ADDRESS USER  || ADDRESS TOKEN || UINT BALANCE
  mapping(address => mapping(address => uint)) public balances;

  // mapping of user accounts to mapping of order hashes to orderIndex (equivalent to offchain signature)
  // ADDRESS USER  || ORDER HASH    || uint
  mapping(address => mapping(bytes32 => uint)) public orders;

  // mapping of user accounts to mapping of order hashes to booleans (true = order has been filled)
  // ADDRESS USER  || ORDER HASH    || BOOL
  mapping(address => mapping(bytes32 => bool)) public filledOrders;

  mapping(uint => Order) public orderMap;                // Used to lookup existing orders


  // Modules
  IBasketRegistry         public basketRegistry;

  // Structs
  struct Order {
    address   orderCreator;
    address   tokenGet;
    uint      amountGet;
    address   tokenGive;
    uint      amountGive;
    uint      expiration;
    uint      nonce;
  }

  // Modifiers
  modifier onlyAdmin {
    require(msg.sender == admin, "Only the admin can call this function");
    _;
  }

  // Events
  event LogBuyOrderCreated(uint newOrderIndex, address indexed buyer, address basket, uint amountEth, uint amountBasket, uint expiration, uint nonce);
  event LogSellOrderCreated(uint newOrderIndex, address indexed seller, address basket, uint amountEth, uint amountBasket, uint expiration, uint nonce);
  event LogBuyOrderCancelled(uint cancelledOrderIndex, address indexed buyer, address basket, uint amountEth, uint amountBasket);
  event LogSellOrderCancelled(uint cancelledOrderIndex, address indexed seller, address basket, uint amountEth, uint amountBasket);
  event LogBuyOrderFilled(uint filledOrderIndex, address indexed buyOrderFiller, address indexed orderCreator, address basket, uint amountEth, uint amountBasket);
  event LogSellOrderFilled(uint filledOrderIndex, address indexed sellOrderFiller, address indexed orderCreator, address basket, uint amountEth, uint amountBasket);
  event LogTransactionFeeRecipientChange(address oldRecipient, address newRecipient);
  event LogTransactionFeeChange(uint oldFee, uint newFee);

  /// @dev BasketEscrow constructor
  /// @param  _basketRegistryAddress                     Address of basket registry
  /// @param  _transactionFeeRecipient                   Address to send transactionFee
  /// @param  _transactionFee                            Transaction fee in ETH percentage
  constructor(
    address   _basketRegistryAddress,
    address   _transactionFeeRecipient,
    uint      _transactionFee
  ) public {
    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);
    ETH_ADDRESS = 0;                                     // Use address 0 to indicate Eth
    orderIndex = 1;                                      // Initialize order index at 1

    admin = msg.sender;                                  // record admin
    transactionFeeRecipient = _transactionFeeRecipient;
    transactionFee = _transactionFee;
    FEE_DECIMALS = 18;
  }

  /// @dev Create an order to buy baskets with ETH
  /// @param  _basketAddress                             Address of basket to purchase
  /// @param  _amountBasket                              Amount of baskets to purchase
  /// @param  _expiration                                Unix timestamp
  /// @param  _nonce                                     Random number to generate unique order hash
  /// @return success                                    Operation successful
  function createBuyOrder(
    address   _basketAddress,
    uint      _amountBasket,
    uint      _expiration,
    uint      _nonce
  ) public payable returns (bool success) {
    uint index = _createOrder(msg.sender, _basketAddress, _amountBasket, ETH_ADDRESS, msg.value, _expiration, _nonce);

    emit LogBuyOrderCreated(index, msg.sender, _basketAddress, msg.value, _amountBasket, _expiration, _nonce);
    return true;
  }

  /// @dev Create an order to sell baskets for ETH       NOTE: REQUIRES TOKEN APPROVAL
  /// @param  _basketAddress                             Address of basket to sell
  /// @param  _amountBasket                              Amount of baskets to sell
  /// @param  _amountEth                                 Amount of ETH to receive in exchange
  /// @param  _expiration                                Unix timestamp
  /// @param  _nonce                                     Random number to generate unique order hash
  /// @return success                                    Operation successful
  function createSellOrder(
    address   _basketAddress,
    uint      _amountBasket,
    uint      _amountEth,
    uint      _expiration,
    uint      _nonce
  )
    public
    returns (bool success)
  {
    assert(ERC20(_basketAddress).transferFrom(msg.sender, this, _amountBasket));
    uint index = _createOrder(msg.sender, ETH_ADDRESS, _amountEth, _basketAddress, _amountBasket, _expiration, _nonce);

    emit LogSellOrderCreated(index, msg.sender, _basketAddress, _amountEth, _amountBasket, _expiration, _nonce);
    return true;
  }

  /// @dev Contract internal function to record submitted orders
  /// @param  _orderCreator                              Address of the order's creator
  /// @param  _tokenGet                                  Address of token/ETH to receive
  /// @param  _amountGet                                 Amount of token/ETH to receive
  /// @param  _tokenGive                                 Address of token/ETH to give
  /// @param  _amountGive                                Amount of token/ETH to give
  /// @param  _expiration                                Unix timestamp
  /// @param  _nonce                                     Random number to generate unique order hash
  /// @return newOrderIndex
  function _createOrder(
    address   _orderCreator,
    address   _tokenGet,
    uint      _amountGet,
    address   _tokenGive,
    uint      _amountGive,
    uint      _expiration,
    uint      _nonce
  )
    internal
    returns (uint newOrderIndex)
  {
    require(_tokenGet == ETH_ADDRESS || basketRegistry.checkBasketExists(_tokenGet), "Order not for ETH or invalid basket");
    require(_tokenGive == ETH_ADDRESS || basketRegistry.checkBasketExists(_tokenGive), "Order not for ETH or invalid basket");

    bytes32 hash = sha256(this, _tokenGet, _amountGet, _tokenGive, _amountGive, _expiration, _nonce);
    require(orders[_orderCreator][hash] == 0, "Duplicate order");

    orders[_orderCreator][hash] = orderIndex;
    balances[_orderCreator][_tokenGive] = balances[_orderCreator][_tokenGive].add(_amountGive);
    orderMap[orderIndex] = Order(_orderCreator, _tokenGet, _amountGet, _tokenGive, _amountGive, _expiration, _nonce);
    orderIndex = orderIndex.add(1);

    return orderIndex.sub(1);
  }

  /// @dev Cancel an existing buy order
  /// @param  _basketAddress                             Address of basket to purchase in original order
  /// @param  _amountBasket                              Amount of baskets to purchase in original order
  /// @param  _amountEth                                 Amount of ETH sent in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return success                                    Operation successful
  function cancelBuyOrder(
    address   _basketAddress,
    uint      _amountBasket,
    uint      _amountEth,
    uint      _expiration,
    uint      _nonce
  ) public returns (bool success) {
    uint cancelledOrderIndex = _cancelOrder(msg.sender, _basketAddress, _amountBasket, ETH_ADDRESS, _amountEth, _expiration, _nonce);

    if (now >= _expiration) {
      msg.sender.transfer(_amountEth);                   // if order has expired, no transaction fee is charged
    } else {
      uint fee = _amountEth.mul(transactionFee).div(10 ** FEE_DECIMALS);
      msg.sender.transfer(_amountEth.sub(fee));
      transactionFeeRecipient.transfer(fee);
    }

    emit LogBuyOrderCancelled(cancelledOrderIndex, msg.sender, _basketAddress, _amountEth, _amountBasket);
    return true;
  }

  /// @dev Cancel an existing sell order
  /// @param  _basketAddress                             Address of basket to sell in original order
  /// @param  _amountBasket                              Amount of baskets to sell in original order
  /// @param  _amountEth                                 Amount of ETH to receive in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return success                                    Operation successful
  function cancelSellOrder(
    address   _basketAddress,
    uint      _amountBasket,
    uint      _amountEth,
    uint      _expiration,
    uint      _nonce
  ) public returns (bool success) {
    uint cancelledOrderIndex = _cancelOrder(msg.sender, ETH_ADDRESS, _amountEth, _basketAddress, _amountBasket, _expiration, _nonce);

    assert(ERC20(_basketAddress).transfer(msg.sender, _amountBasket));

    emit LogSellOrderCancelled(cancelledOrderIndex, msg.sender, _basketAddress, _amountEth, _amountBasket);
    return true;
  }

  /// @dev Contract internal function to cancel an existing order
  /// @param  _orderCreator                              Address of the original order's creator
  /// @param  _tokenGet                                  Address of token/ETH to receive in original order
  /// @param  _amountGet                                 Amount of token/ETH to receive in original order
  /// @param  _tokenGive                                 Address of token/ETH to give in original order
  /// @param  _amountGive                                Amount of token/ETH to give in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return cancelledOrderIndex                        Index of cancelled order
  function _cancelOrder(
    address   _orderCreator,
    address   _tokenGet,
    uint      _amountGet,
    address   _tokenGive,
    uint      _amountGive,
    uint      _expiration,
    uint      _nonce
  )
    internal
    returns (uint index)
  {
    bytes32 hash = sha256(this, _tokenGet, _amountGet, _tokenGive, _amountGive, _expiration, _nonce);
    uint cancelledOrderIndex = orders[_orderCreator][hash];
    require(cancelledOrderIndex > 0, "Order does not exist");
    require(filledOrders[_orderCreator][hash] != true, "Order has been filled");

    orders[_orderCreator][hash] = 0;
    balances[_orderCreator][_tokenGive] = balances[_orderCreator][_tokenGive].sub(_amountGive);

    return cancelledOrderIndex;
  }

  /// @dev Fill an existing buy order                    NOTE: REQUIRES TOKEN APPROVAL
  /// @param  _orderCreator                              Address of order's creator
  /// @param  _basketAddress                             Address of basket to purchase in original order
  /// @param  _amountBasket                              Amount of baskets to purchase in original order
  /// @param  _amountEth                                 Amount of ETH to sent in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return success                                    Operation successful
  function fillBuyOrder(
    address   _orderCreator,
    address   _basketAddress,
    uint      _amountBasket,
    uint      _amountEth,
    uint      _expiration,
    uint      _nonce
  ) public returns (bool success) {
    uint filledOrderIndex = _fillOrder(_orderCreator, _basketAddress, _amountBasket, ETH_ADDRESS, _amountEth, _expiration, _nonce);
    assert(ERC20(_basketAddress).transferFrom(msg.sender, _orderCreator, _amountBasket));

    uint fee = _amountEth.mul(transactionFee).div(10 ** FEE_DECIMALS);
    msg.sender.transfer(_amountEth.sub(fee));
    transactionFeeRecipient.transfer(fee);

    emit LogBuyOrderFilled(filledOrderIndex, msg.sender, _orderCreator, _basketAddress, _amountEth, _amountBasket);
    return true;
  }

  /// @dev Fill an existing sell order
  /// @param  _orderCreator                              Address of order's creator
  /// @param  _basketAddress                             Address of basket to sell in original order
  /// @param  _amountBasket                              Amount of baskets to sell in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return success                                    Operation successful
  function fillSellOrder(
    address   _orderCreator,
    address   _basketAddress,
    uint      _amountBasket,
    uint      _expiration,
    uint      _nonce
  ) public payable returns (bool success) {
    uint filledOrderIndex = _fillOrder(_orderCreator, ETH_ADDRESS, msg.value, _basketAddress, _amountBasket, _expiration, _nonce);
    assert(ERC20(_basketAddress).transfer(msg.sender, _amountBasket));

    uint fee = msg.value.mul(transactionFee).div(10 ** FEE_DECIMALS);
    _orderCreator.transfer(msg.value.sub(fee));
    transactionFeeRecipient.transfer(fee);

    emit LogSellOrderFilled(filledOrderIndex, msg.sender, _orderCreator, _basketAddress, msg.value, _amountBasket);
    return true;
  }

  /// @dev Contract internal function to fill an existing order
  /// @param  _orderCreator                              Address of the original order's creator
  /// @param  _tokenGet                                  Address of token/ETH to receive in original order
  /// @param  _amountGet                                 Amount of token/ETH to receive in original order
  /// @param  _tokenGive                                 Address of token/ETH to give in original order
  /// @param  _amountGive                                Amount of token/ETH to give in original order
  /// @param  _expiration                                Unix timestamp in original order
  /// @param  _nonce                                     Random number in original order
  /// @return filledOrderIndex                           Index of filled order
  function _fillOrder(
    address   _orderCreator,
    address   _tokenGet,
    uint      _amountGet,
    address   _tokenGive,
    uint      _amountGive,
    uint      _expiration,
    uint      _nonce
  )
    internal
    returns (uint index)
  {
    bytes32 hash = sha256(this, _tokenGet, _amountGet, _tokenGive, _amountGive, _expiration, _nonce);
    uint filledOrderIndex = orders[_orderCreator][hash];
    require(filledOrderIndex > 0, "Order does not exist");
    require(filledOrders[_orderCreator][hash] != true, "Order has been filled");
    require(now <= _expiration, "Order has expired");

    filledOrders[_orderCreator][hash] = true;
    balances[_orderCreator][_tokenGive] = balances[_orderCreator][_tokenGive].sub(_amountGive);

    return filledOrderIndex;
  }

  /// @dev Get details of an order with its index;
  /// @param  _orderIndex                                  Order index assigned at order creation
  /// @return Order struct
  function getOrderDetails(uint _orderIndex) public view returns (
    address   orderCreator,
    address   tokenGet,
    uint      amountGet,
    address   tokenGive,
    uint      amountGive,
    uint      expiration,
    uint      nonce,
    bool      _orderExists,
    bool      _isFilled
  ) {
    Order memory o = orderMap[_orderIndex];
    bytes32 hash = sha256(this, o.tokenGet, o.amountGet, o.tokenGive, o.amountGive, o.expiration, o.nonce);
    bool orderExists = orders[o.orderCreator][hash] > 0;
    bool isFilled = filledOrders[o.orderCreator][hash];

    return (o.orderCreator, o.tokenGet, o.amountGet, o.tokenGive, o.amountGive, o.expiration, o.nonce, orderExists, isFilled);
  }

  /// @dev Change recipient of transaction fees
  /// @param  _newRecipient                        New fee recipient
  /// @return success                              Operation successful
  function changeTransactionFeeRecipient(address _newRecipient) public onlyAdmin returns (bool success) {
    address oldRecipient = transactionFeeRecipient;
    transactionFeeRecipient = _newRecipient;

    emit LogTransactionFeeRecipientChange(oldRecipient, transactionFeeRecipient);
    return true;
  }

  /// @dev Change percentage of fee charged for ETH transactions
  /// @param  _newFee                              New fee amount
  /// @return success                              Operation successful
  function changeTransactionFee(uint _newFee) public onlyAdmin returns (bool success) {
    uint oldFee = transactionFee;
    transactionFee = _newFee;

    emit LogTransactionFeeChange(oldFee, transactionFee);
    return true;
  }

  /// @dev Fallback to reject any ether sent directly to contract
  function () public payable { revert("BasketEscrow does not accept ETH transfers"); }
}
