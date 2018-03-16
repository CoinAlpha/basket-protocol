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

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
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
  using SafeMath for uint;

  address                       public admin;
  address                       public basketRegistryAddress;
  address                       public basketEscrowAddress;

  address                       public productionFeeRecipient;
  uint                          public productionFee;
  uint                          public FEE_DECIMALS;

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
  event LogBasketCreated(uint basketIndex, address basketAddress, address arranger);
  event LogTokenWalletCreated(address tokenWallet, address owner);
  event LogSetTokenWalletFactory(address newTokenWalletFactory);

  /// @dev BasketFactory constructor
  /// @param  _basketRegistryAddress               Address of basket registry
  /// @param  _basketEscrowAddress                 Address of basket escrow
  function BasketFactory (
    address _basketRegistryAddress,
    address _basketEscrowAddress,
    address _productionFeeRecipient,
    uint _productionFee
  ) public {
    admin = msg.sender;

    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);
    basketEscrowAddress = _basketEscrowAddress;

    productionFeeRecipient = _productionFeeRecipient;
    productionFee = _productionFee;
    FEE_DECIMALS = 4;                              // Default transaction fee to 4 decimal places
  }

  /// @dev Deploy a new basket
  /// @param  _name                                Name of new basket
  /// @param  _symbol                              Symbol of new basket
  /// @param  _tokens                              Token addresses of new basket
  /// @param  _weights                             Weight ratio addresses of new basket
  /// @param  _arrangerFeeRecipient                Address to send arranger fees
  /// @param  _arrangerFee                         Amount of arranger fee to charge per basket minted
  /// @return deployed basket
  function createBasket(
    string    _name,
    string    _symbol,
    address[] _tokens,
    uint[]    _weights,
    address   _arrangerFeeRecipient,
    uint      _arrangerFee
  )
    public
    payable
    returns (address newBasket)
  {
    // charging arrangers a fee to deploy new basket
    if (productionFee > 0) {
      require(msg.value >= productionFee.mul(10 ** (18 - FEE_DECIMALS)));
      productionFeeRecipient.transfer(msg.value);
    }

    Basket b = new Basket(
      _name,
      _symbol,
      _tokens,
      _weights,
      basketRegistryAddress,
      basketEscrowAddress,
      msg.sender,                                  // arranger address
      _arrangerFeeRecipient,
      _arrangerFee
    );
    uint basketIndex = basketRegistry.registerBasket(b, msg.sender, _name, _symbol, _tokens, _weights);

    LogBasketCreated(basketIndex, b, msg.sender);
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
    require(msg.sender == admin);
    tokenWalletFactory = ITokenWalletFactory(_tokenWalletFactory);
    LogSetTokenWalletFactory(_tokenWalletFactory);
    return true;
  }

}
