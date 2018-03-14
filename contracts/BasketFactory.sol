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
import "./Basket.sol";
import "./BasketRegistry.sol";
import "./TokenWalletFactory.sol";

contract IBasketFactory {
  // Create TokenWallet: for segregatint assets
  function createTokenWallet(address) public returns (address) {}
}


/**
  * @title BasketFactory -- Factory contract for creating different baskets
  * @author CoinAlpha, Inc. <contact@coinalpha.com>
  */
contract BasketFactory {

  address                       public creator;
  address                       public basketRegistryAddress;

  // Modules
  ITokenWalletFactory           public tokenWalletFactory;
  IBasketRegistry               public basketRegistry;

  // TokenWallet register
  uint                          public tokenWalletIndex;
  mapping(uint => address)      public tokenWallets;
  address[]                     public tokenWalletList;
  mapping(address => uint)      public tokenWalletIndexFromAddress;

  // Modifiers
  modifier onlyBasket {
    require(basketRegistry.checkBasketExists(msg.sender));
    _;
  }

  // Events
  event LogBasketCreated(address basketAddress, address arranger);
  event LogTokenWalletCreated(address tokenWallet, address owner);
  event LogSetTokenWalletFactory(address newTokenWalletFactory);

  /// @dev BasketFactory constructor
  /// @param  _basketRegistryAddress               Address of basket registry
  function BasketFactory (address _basketRegistryAddress) public {
    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);
    creator = msg.sender;
  }

  /// @dev Deploy a new basket
  /// @param  _name                                Name of new basket
  /// @param  _symbol                              Symbol of new basket
  /// @param  _tokens                              Token addresses of new basket
  /// @param  _weights                             Weight ratio addresses of new basket
  /// @return deployed basket
  function createBasket(
    string    _name,
    string    _symbol,
    address[] _tokens,
    uint[]    _weights
  )
    public
    returns (address newBasket)
  {
    Basket b = new Basket(_name, _symbol, _tokens, _weights, basketRegistryAddress);
    basketRegistry.registerBasket(b, msg.sender, _name, _symbol, _tokens, _weights);

    LogBasketCreated(b, msg.sender);
    return b;
  }

  /// @dev Create TokenWallet: for segregatint assets
  /// @param  _owner                               Address of new token wallet owner
  /// @return newTokenWallet                       New token wallet address
  function createTokenWallet(address _owner)
    public
    onlyBasket
    returns (address newTokenWallet)
  {
    address tw = tokenWalletFactory.createTokenWallet(_owner);
    tokenWalletList.push(tw);
    tokenWallets[tokenWalletIndex] = tw;
    tokenWalletIndexFromAddress[tw] = tokenWalletIndex;
    tokenWalletIndex += 1;

    LogTokenWalletCreated(tw, _owner);
    return tw;
  }

  /// @dev Link to TokenWalletFactory
  /// @param  _tokenWalletFactory                  Address of token wallet factory
  /// @return success                              Operation successful
  function setTokenWalletFactory(address _tokenWalletFactory) public returns (bool success) {
    require(msg.sender == creator);
    tokenWalletFactory = ITokenWalletFactory(_tokenWalletFactory);
    LogSetTokenWalletFactory(_tokenWalletFactory);
    return true;
  }

}
