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
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/// @title Basket -- Basket contract for bundling and debundling tokens
/// @author CoinAlpha, Inc. <contact@coinalpha.com>
contract Basket is StandardToken {
  using SafeMath for uint;

  // Constants set at contract inception
  string    public name;
  string    public symbol;
  uint      public decimals;
  address[] public tokens;
  uint[]    public weights;

  // This mapping tracks each of the token balances for a specific holder address
  // HOLDER_ADDRESS | TOKEN_ADDRESS | TOKEN_BALANCE
  mapping(address => mapping(address => uint)) public vault;

  // Events
  event LogDeposit(address indexed holder, address tokenAddress, uint quantity);
  event LogWithdraw(address indexed holder, address tokenAddress, uint quantity);
  event LogBundle(address indexed holder, uint quantity);
  event LogDebundle(address indexed holder, uint quantity);

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
    require(_tokens.length > 0);
    require(_weights.length > 0);
    require(_tokens.length == _weights.length);

    name = _name;
    symbol = _symbol;
    tokens = _tokens;
    weights = _weights;
    decimals = 18;                                 // Default to 18 decimals to allow accomodate all types of ERC20 token
    totalSupply_ = 0;                              // Baskets can only be created by depositing and forging underlying tokens
  }

  /// @dev Basket transfer tokens to contract
  /// @param  _token                               Address of token to deposit
  /// @param  _quantity                            Quantity of tokens to deposit
  /// @return success                              Operation successful
  function deposit(address _token, uint _quantity) public returns (bool success) {
    uint tokenBalance = vault[msg.sender][_token];

    assert(ERC20(_token).transferFrom(msg.sender, this, _quantity));
    vault[msg.sender][_token] = tokenBalance.add(_quantity);

    LogDeposit(msg.sender, _token, _quantity);
    return true;
  }

  /// @dev Basket transfer tokens from contract to holder's address
  /// @param  _token                               Address of token to withdraw
  /// @param  _quantity                            Quantity of tokens to withdraw
  /// @return success                              Operation successful
  function withdraw(address _token, uint _quantity) public returns (bool success) {
    uint tokenBalance = vault[msg.sender][_token];
    require(tokenBalance >= _quantity);

    assert(transfer(msg.sender, _quantity));
    vault[msg.sender][_token] = tokenBalance.sub(_quantity);

    LogWithdraw(msg.sender, _token, _quantity);
    return true;
  }

  /// @dev Convert tokens inside the contract into basketTokens
  /// @param  _quantity                            Quantity of tokens to bundle into basket tokens
  /// @return success                              Operation successful
  function bundle(uint _quantity) public returns (bool success) {
    // decrease balance of each of the tokens by their weights
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      uint tokenBalance = vault[msg.sender][t];

      // check if holder has enough tokens to convert
      vault[msg.sender][t] = tokenBalance.sub(w.mul(_quantity));
    }

    // increment holder balance and total supply by _quantity
    balances[msg.sender] = balances[msg.sender].add(_quantity);
    totalSupply_ = totalSupply_.add(_quantity);

    LogBundle(msg.sender, _quantity);
    return true;
  }

  /// @dev Combined deposit of all component tokens (not yet deposited) and bundle
  /// @param  _quantity                            Quantity of tokens to bundle into basket tokens
  /// @return success                              Operation successful
  function depositAndBundle(uint _quantity) public returns (bool success) {
    // decrease balance of each of the tokens by their weights
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      deposit(t, w.mul(_quantity));
    }

    bundle(_quantity);
    return true;
  }

  /// @dev Convert basketTokens back to original tokens
  /// @param  _quantity                            Quantity of basket tokens to convert back to original tokens
  /// @return success                              Operation successful
  function debundle(uint _quantity) public returns (bool success) {
    // decrease holder balance and total supply by _quantity
    balances[msg.sender] = balances[msg.sender].sub(_quantity);
    totalSupply_ = totalSupply_.sub(_quantity);

    // increase balance of each of the tokens by their weights
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      uint tokenBalance = vault[msg.sender][t];
      vault[msg.sender][t] = tokenBalance.add(w.mul(_quantity));
    }

    LogDebundle(msg.sender, _quantity);
    return true;
  }

  /// @dev Read vault balance of current investor
  /// @return tokenBalances                        Array of token balances arranged in the order declared at contract creation
  function getVault() public view returns (uint[]) {
    uint[] memory tokenBalances;
    for (uint i = 0; i < tokens.length; i++) {
      tokenBalances[i] = vault[msg.sender][tokens[i]];
    }
    return tokenBalances;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public { revert(); }

}
