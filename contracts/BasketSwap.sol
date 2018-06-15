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
import "./Basket.sol";


contract IBasketSwap {
  // Called by Basket
  function swap(address, address, address, uint) public returns (bool) {}
}


/// @title BasketSwap -- BasketSwap contract for swapping one basket token for another
/// @author CoinAlpha, Inc. <contact@coinalpha.com>
contract BasketSwap {
  using SafeMath for uint;

  // Constants set at contract inception
  address                 public arranger;
  address                 public fromBasket;
  address                 public toBasket;
  uint                    public exchangeRate;
  uint                    public exchangeRateDecimals;

  // Events
  event LogWithdraw(address token, uint quantity);
  event LogSetExchangeRate(uint oldRate, uint newRate);
  event LogSwap(address holder, uint quantity);

  // Modifiers
  modifier onlyArranger {
    require(msg.sender == arranger, "Only the Arranger can call this function");
    _;
  }

  /// @dev BasketSwap constructor
  /// @param  _arranger                            Address of arranger (cannot be reset)
  /// @param  _fromBasket                          Address of original basket
  /// @param  _toBasket                            Address of new basket
  /// @param  _exchangeRate                        Original basket / New basket
  /// @param  _exchangeRateDecimals                Number of decimals for exchange rate
  constructor(
    address   _arranger,
    address   _fromBasket,
    address   _toBasket,
    uint      _exchangeRate,
    uint      _exchangeRateDecimals
  ) public {
    arranger = _arranger;
    fromBasket = _fromBasket;
    toBasket = _toBasket;
    exchangeRate = _exchangeRate;
    exchangeRateDecimals = _exchangeRateDecimals;
  }

  /// @dev Withdraw ERC20 tokens from contract
  /// @param  _token                               Token to withdraw
  /// @param  _quantity                            Amount of tokens to withdraw
  /// @return success                              Operation successful
  function withdraw(address _token, uint _quantity) public onlyArranger returns (bool success) {
    assert(ERC20(_token).transfer(msg.sender, _quantity));
    emit LogWithdraw(_token, _quantity);
    return true;
  }

  /// @dev Change exchange rate between to baskets
  /// @param  _newRate                             New exchange rate between to baskets
  /// @return success                              Operation successful
  function setExchangeRate(uint _newRate) public onlyArranger returns (bool success) {
    uint oldRate = exchangeRate;
    exchangeRate = _newRate;

    emit LogSetExchangeRate(oldRate, _newRate);
    return true;
  }

  /// @dev Swap basket for other baskets           Only basket holders can initiate this transaction
  /// @param  _quantity                            Quantity of baskets to swap
  /// @return success                              Operation successful
  function swap(address _holder, uint _quantity) public returns (bool success) {
    require(msg.sender == fromBasket, "Transaction did not come from original basket");
    uint newBasketQuantity = exchangeRate.mul(_quantity).div(10 ** exchangeRateDecimals);

    assert(Basket(toBasket).depositAndBundle(newBasketQuantity));
    assert(ERC20(toBasket).transfer(this, newBasketQuantity));

    emit LogSwap(_holder, _quantity);
    return true;
  }


  /// @dev Fallback to reject any ether sent to contract
  function () public payable { revert("BasketSwap does not accept ETH transfers"); }
}
