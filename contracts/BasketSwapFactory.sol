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
import "./BasketSwap.sol";
import "./BasketRegistry.sol";

/**
  * @title BasketFactory -- Factory contract for creating different baskets
  * @author CoinAlpha, Inc. <contact@coinalpha.com>
  */
contract BasketSwapFactory {
  using SafeMath for uint;

  address                       public admin;
  address                       public basketRegistryAddress;

  uint                          public rebalanceFee;
  address                       public rebalanceFeeRecipient;

  uint                          public exchangeRateDecimals;

  // Modules
  IBasketRegistry               public basketRegistry;

  // Modifiers
  modifier onlyAdmin {
    require(msg.sender == admin, "Only the admin can call this function");
    _;
  }

  // Events
  event LogBasketSwapCreated(address basketSwapAddress, address arranger);
  event LogRebalanceFeeRecipientChange(address oldRecipient, address newRecipient);
  event LogRebalanceFeeChange(uint oldFee, uint newFee);

  /// @dev BasketFactory constructor
  /// @param  _basketRegistryAddress               Address of basket registry
  /// @param  _rebalanceFeeRecipient               Address to receive rebalance fee
  /// @param  _rebalanceFee                        Amount of rebalance fee
  /// @param  _exchangeRateDecimals                Number of decimals in exchange
  constructor(
    address   _basketRegistryAddress,
    address   _rebalanceFeeRecipient,
    uint      _rebalanceFee,
    uint      _exchangeRateDecimals
  ) public {
    admin = msg.sender;

    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);

    rebalanceFeeRecipient = _rebalanceFeeRecipient;
    rebalanceFee = _rebalanceFee;
    exchangeRateDecimals = _exchangeRateDecimals;
  }

  /// @dev Deploy a new basketSwap contract
  /// @param  _fromBasket                          Address of original basket
  /// @param  _toBasket                            Address of new basket
  /// @param  _exchangeRate                        Exchange rate between original and new basket
  /// @return deployed basketSwap
  function createBasketSwap(
    address   _fromBasket,
    address   _toBasket,
    uint      _exchangeRate
  )
    public payable returns (address newBasketSwap) {
    // charging arrangers a fee to deploy new basketSwap
    require(msg.value >= rebalanceFee, "Insufficient ETH for basketSwap creation fee");
    rebalanceFeeRecipient.transfer(msg.value);

    require(msg.sender == basketRegistry.getBasketArranger(_fromBasket), "Only the arranger of original basket can create swaps");
    require(msg.sender == basketRegistry.getBasketArranger(_toBasket), "Only the arranger of new basket can create swaps");

    BasketSwap bs = new BasketSwap(
      msg.sender,
      _fromBasket,
      _toBasket,
      _exchangeRate,
      exchangeRateDecimals
    );

    emit LogBasketSwapCreated(bs, msg.sender);
    return bs;
  }

  /// @dev Change recipient of rebalance fees
  /// @param  _newRecipient                        New fee recipient
  /// @return success                              Operation successful
  function changeRebalanceFeeRecipient(address _newRecipient) public onlyAdmin returns (bool success) {
    address oldRecipient = rebalanceFeeRecipient;
    rebalanceFeeRecipient = _newRecipient;

    emit LogRebalanceFeeRecipientChange(oldRecipient, rebalanceFeeRecipient);
    return true;
  }

  /// @dev Change amount of fee charged for every basket created
  /// @param  _newFee                              New fee amount
  /// @return success                              Operation successful
  function changeRebalanceFee(uint _newFee) public onlyAdmin returns (bool success) {
    uint oldFee = rebalanceFee;
    rebalanceFee = _newFee;

    emit LogRebalanceFeeChange(oldFee, rebalanceFee);
    return true;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public payable { revert("BasketSwapFactory do not accept ETH transfers"); }
}
