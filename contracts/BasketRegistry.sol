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

pragma solidity ^0.4.18;
import "./BasketFactory.sol";

contract IBasketRegistry {
  // Called by BasketFactory
  function registerBasket(address, address, string, string, address[], uint[]) public returns (bool) {}
  function checkBasketExists (address) public returns (bool) {}

  // Called by Basket
  function incrementBasketsMinted (uint) public returns (bool) {}
  function incrementBasketsBurned (uint) public returns (bool) {}
}


/**
  * @title BasketRegistry -- Storage contract to keep track of all baskets created
  * @author CoinAlpha, Inc. <contact@coinalpha.com>
  */
contract BasketRegistry {
  // Constants set at contract inception
  address                           public creator;
  address                           public basketFactoryAddress;

  uint                              public basketIndex;           // Baskets index starting from index = 1
  address[]                         public basketList;
  mapping(address => BasketStruct)  public basketMap;
  mapping(address => uint)          public basketIndexFromAddress;

  uint                              public arrangerIndex;         // Arrangers register starting from index = 1
  address[]                         public arrangerList;
  mapping(address => uint)          public arrangerBasketCount;
  mapping(address => uint)          public arrangerIndexFromAddress;

  // Modules
  IBasketFactory                    public basketFactory;

  // Structs
  struct BasketStruct {
    address   basketAddress;
    address   arranger;
    string    name;
    string    symbol;
    address[] tokens;
    uint[]    weights;
    uint      totalMinted;
    uint      totalBurned;
  }

  // Modifiers
  modifier onlyBasket {
    require(basketIndexFromAddress[msg.sender] > 0);
    _;
  }

  modifier onlyBasketFactory {
    require(msg.sender == basketFactoryAddress);
    _;
  }

  // Events
  event LogSetBasketFactory(address basketFactory);
  event LogBasketRegistration(address basketAddress, uint basketIndex);
  event LogIncrementBasketsMinted(address basketAddress, uint quantity);
  event LogIncrementBasketsBurned(address basketAddress, uint quantity);

  /// @dev BasketRegistry constructor
  function BasketRegistry () public {
    basketIndex = 1;
    arrangerIndex = 1;
    creator = msg.sender;
  }

  /// @dev Set basket factory address after deployment
  /// @param  _basketFactory                       Quantity of basket tokens to mint
  /// @return success                              Operation successful
  function setBasketFactory(address _basketFactory) public returns (bool success) {
    require(msg.sender == creator);
    basketFactoryAddress = _basketFactory;
    basketFactory = IBasketFactory(_basketFactory);
    LogSetBasketFactory(_basketFactory);
    return true;
  }

  /// @dev Add new basket to registry after being created in the basketFactory
  /// @param  _basketAddress                       Address of deployed basket
  /// @param  _arranger                            Address of basket creator
  /// @param  _name                                Basket name
  /// @param  _symbol                              Basket symbol
  /// @param  _tokens                              Token address array
  /// @param  _weights                             Weight ratio array
  /// @return success                              Operation successful
  function registerBasket(
    address   _basketAddress,
    address   _arranger,
    string    _name,
    string    _symbol,
    address[] _tokens,
    uint[]    _weights
  )
    public
    returns (bool success)
  {
    basketMap[_basketAddress] = BasketStruct(
      _basketAddress, _arranger, _name, _symbol, _tokens, _weights, 0, 0
    );
    basketList.push(_basketAddress);
    basketIndexFromAddress[_basketAddress] = basketIndex;

    if (arrangerBasketCount[_arranger] == 0) {
      arrangerList.push(_arranger);
      arrangerIndexFromAddress[_arranger] = arrangerIndex;
      arrangerIndex += 1;
    }
    arrangerBasketCount[_arranger] += 1;

    LogBasketRegistration(_basketAddress, basketIndex);
    basketIndex += 1;
    return true;
  }

  /// @dev Check if basket exists in registry
  /// @param  _basketAddress                       Address of basket to check
  /// @return basketExists
  function checkBasketExists(address _basketAddress) public view returns (bool basketExists) {
    return basketIndexFromAddress[_basketAddress] > 0;
  }

  /// @dev Retrieve basket info from the registry
  /// @param  _basketAddress                       Address of basket to check
  /// @return basketDetails
  function getBasketDetails(address _basketAddress) public view returns (BasketStruct basketDetails) {
    return basketMap[_basketAddress];
  }

  /// @dev Increment totalMinted from BasketStruct
  /// @param  _quantity                            Quantity to increment
  /// @return success                              Operation successful
  function incrementBasketsMinted(uint _quantity) public onlyBasket returns (bool) {
    basketMap[msg.sender].totalMinted += _quantity;
    LogIncrementBasketsMinted(msg.sender, _quantity);
    return true;
  }

  /// @dev Increment totalBurned from BasketStruct
  /// @param  _quantity                            Quantity to increment
  /// @return success                              Operation successful
  function incrementBasketsBurned(uint _quantity) public onlyBasket returns (bool) {
    basketMap[msg.sender].totalBurned += _quantity;
    LogIncrementBasketsBurned(msg.sender, _quantity);
    return true;
  }
}
