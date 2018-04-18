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

import "./zeppelin/SafeMath.sol";
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

  address                       public productionFeeRecipient;
  uint                          public productionFee;

  // Modules
  ITokenWalletFactory           public tokenWalletFactory;
  IBasketRegistry               public basketRegistry;

  // TokenWallet register
  uint                          public tokenWalletIndex;
  mapping(uint => address)      public tokenWallets;
  address[]                     public tokenWalletList;
  mapping(address => uint)      public tokenWalletIndexFromAddress;

  // Modifiers
  modifier onlyAdmin {
    require(msg.sender == admin);
    _;
  }

  // Events
  event LogBasketCreated(uint basketIndex, address basketAddress, address arranger);
  event LogTokenWalletCreated(address tokenWallet, address owner);
  event LogSetTokenWalletFactory(address newTokenWalletFactory);
  event LogProductionFeeRecipientChange(address oldRecipient, address newRecipient);
  event LogProductionFeeChange(uint oldFee, uint newFee);

  /// @dev BasketFactory constructor
  /// @param  _basketRegistryAddress               Address of basket registry
  function BasketFactory (
    address   _basketRegistryAddress,
    address   _productionFeeRecipient,
    uint      _productionFee
  ) public {
    admin = msg.sender;

    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);

    productionFeeRecipient = _productionFeeRecipient;
    productionFee = _productionFee;
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
    require(msg.value >= productionFee);
    productionFeeRecipient.transfer(msg.value);

    Basket b = new Basket(
      _name,
      _symbol,
      _tokens,
      _weights,
      basketRegistryAddress,
      msg.sender,                                  // arranger address
      _arrangerFeeRecipient,
      _arrangerFee
    );

    LogBasketCreated(
      basketRegistry.registerBasket(b, msg.sender, _name, _symbol, _tokens, _weights),
      b,
      msg.sender
    );
    return b;
  }

  /// @dev Create TokenWallet: for segregatint assets
  /// @param  _owner                               Address of new token wallet owner
  /// @return newTokenWallet                       New token wallet address
  function createTokenWallet(address _owner) public returns (address newTokenWallet) {
    require(basketRegistry.checkBasketExists(msg.sender));
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
  function setTokenWalletFactory(address _tokenWalletFactory) public onlyAdmin returns (bool success) {
    tokenWalletFactory = ITokenWalletFactory(_tokenWalletFactory);
    LogSetTokenWalletFactory(_tokenWalletFactory);
    return true;
  }

  /// @dev Change recipient of production fees
  /// @param  _newRecipient                        New fee recipient
  /// @return success                              Operation successful
  function changeProductionFeeRecipient(address _newRecipient) public onlyAdmin returns (bool success) {
    address oldRecipient = productionFeeRecipient;
    productionFeeRecipient = _newRecipient;

    LogProductionFeeRecipientChange(oldRecipient, productionFeeRecipient);
    return true;
  }

  /// @dev Change amount of fee charged for every basket created
  /// @param  _newFee                              New fee amount
  /// @return success                              Operation successful
  function changeProductionFee(uint _newFee) public onlyAdmin returns (bool success) {
    uint oldFee = productionFee;
    productionFee = _newFee;

    LogProductionFeeChange(oldFee, productionFee);
    return true;
  }

}
