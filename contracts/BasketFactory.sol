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
import "./Basket.sol";
import "./BasketRegistry.sol";

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
  IBasketRegistry               public basketRegistry;

  // Modifiers
  modifier onlyAdmin {
    require(msg.sender == admin, "Only the admin can call this function");
    _;
  }

  // Events
  event LogBasketCreated(uint indexed basketIndex, address indexed basketAddress, address indexed arranger);
  event LogProductionFeeRecipientChange(address indexed oldRecipient, address indexed newRecipient);
  event LogProductionFeeChange(uint indexed oldFee, uint indexed newFee);

  /// @dev BasketFactory constructor
  /// @param  _basketRegistryAddress               Address of basket registry
  function BasketFactory(
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
    require(msg.value >= productionFee, "Insufficient ETH for basket creation fee");
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

    emit LogBasketCreated(
      basketRegistry.registerBasket(b, msg.sender, _name, _symbol, _tokens, _weights),
      b,
      msg.sender
    );
    return b;
  }

  /// @dev Change recipient of production fees
  /// @param  _newRecipient                        New fee recipient
  /// @return success                              Operation successful
  function changeProductionFeeRecipient(address _newRecipient) public onlyAdmin returns (bool success) {
    address oldRecipient = productionFeeRecipient;
    productionFeeRecipient = _newRecipient;

    emit LogProductionFeeRecipientChange(oldRecipient, productionFeeRecipient);
    return true;
  }

  /// @dev Change amount of fee charged for every basket created
  /// @param  _newFee                              New fee amount
  /// @return success                              Operation successful
  function changeProductionFee(uint _newFee) public onlyAdmin returns (bool success) {
    uint oldFee = productionFee;
    productionFee = _newFee;

    emit LogProductionFeeChange(oldFee, productionFee);
    return true;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public payable { revert("BasketFactory does not accept ETH transfers"); }
}
