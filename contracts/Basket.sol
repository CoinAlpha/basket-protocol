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
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./BasketFactory.sol";

/// @title Basket -- Basket contract for bundling and debundling tokens
/// @author CoinAlpha, Inc. <contact@coinalpha.com>
contract Basket is StandardToken {
  using SafeMath for uint;

  // Constants set at contract inception
  string                  public name;
  string                  public symbol;
  uint                    public decimals;
  address[]               public tokens;
  uint[]                  public weights;
  address                 public basketFactoryAddress;

  // Modules
  IBasketFactory          public basketFactory;

  // Events
  event LogDepositAndBundle(address indexed holder, uint quantity);
  event LogDebundleAndWithdraw(address indexed holder, uint quantity);
  event LogExtract(address indexed holder, uint quantity, address tokenWalletAddress);

  /// @dev Basket constructor
  /// @param  _name                                Token name
  /// @param  _symbol                              Token symbol
  /// @param  _tokens                              Array of ERC20 token addresses
  /// @param  _weights                             Array of ERC20 token quantities
  function Basket(
    string _name,
    string _symbol,
    address[] _tokens,
    uint[] _weights
  ) public {
    require(_tokens.length > 0 && _tokens.length == _weights.length);

    name = _name;
    symbol = _symbol;
    tokens = _tokens;
    weights = _weights;
    decimals = 18;                                 // Default to 18 decimals to allow accomodate all types of ERC20 token
    totalSupply_ = 0;                              // Baskets can only be created by depositing and forging underlying tokens
    basketFactoryAddress = msg.sender;             // This contract is created only by the Factory
    basketFactory = IBasketFactory(msg.sender);
  }

  /// @dev Combined deposit of all component tokens (not yet deposited) and bundle
  /// @param  _quantity                            Quantity of basket tokens to mint
  /// @return success                              Operation successful
  function depositAndBundle(uint _quantity) public returns (bool success) {
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      assert(ERC20(t).transferFrom(msg.sender, this, w.mul(_quantity)));
    }

    balances[msg.sender] = balances[msg.sender].add(_quantity);
    totalSupply_ = totalSupply_.add(_quantity);

    LogDepositAndBundle(msg.sender, _quantity);
    return true;
  }


  /// @dev Convert basketTokens back to original tokens and transfer to requester
  /// @param  _quantity                            Quantity of basket tokens to convert back to original tokens
  /// @return success                              Operation successful
  function debundleAndWithdraw(uint _quantity) public returns (bool success) {
    require(balances[msg.sender] >= _quantity);
    // decrease holder balance and total supply by _quantity
    balances[msg.sender] = balances[msg.sender].sub(_quantity);
    totalSupply_ = totalSupply_.sub(_quantity);

    // increase balance of each of the tokens by their weights
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      assert(ERC20(t).transfer(msg.sender, w.mul(_quantity)));
    }

    LogDebundleAndWithdraw(msg.sender, _quantity);
    return true;
  }

  /// @dev Extracts tokens into a private TokenWallet contract
  /// @param  _quantity                            Quantity of basket tokens to extract
  /// @return success                              Operation successful
  function extract(uint _quantity) public returns (bool success) {
    require(balances[msg.sender] >= _quantity);
    // decrease holder balance and total supply by _quantity
    balances[msg.sender] = balances[msg.sender].sub(_quantity);
    totalSupply_ = totalSupply_.sub(_quantity);

    address tokenWalletAddress = basketFactory.createTokenWallet(msg.sender);

    // increase balance of each of the tokens by their weights
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      assert(ERC20(t).transfer(tokenWalletAddress, w.mul(_quantity)));
    }

    LogExtract(msg.sender, _quantity, tokenWalletAddress);
    return true;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public { revert(); }

}
