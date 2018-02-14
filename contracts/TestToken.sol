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

import "node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title TestToken
 * @author CoinAlpha, Inc. <contact@coinalpha.com>
 */

contract TestToken is StandardToken, Ownable {
  string public name;
  string public symbol;
  uint public decimals;
  uint public faucetAmount;

  /// @dev Token constructor
  /// @param  _name             Token name
  /// @param  _symbol           Token symbol
  /// @param  _decimals         Decimal precision
  /// @param  _initialSupply    Initial total supply of tokens
  /// @param  _faucetAmount     Amount to faucet with each request
  function TestToken(
    string _name,
    string _symbol,
    uint _decimals,
    uint _initialSupply,
    uint _faucetAmount
  )
    public
  {
    totalSupply_ = _initialSupply;
    balances[msg.sender] = _initialSupply;
    owner = msg.sender;
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    faucetAmount = _faucetAmount;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public { revert(); }

  /// @dev Withdraw a set amount of token to any address
  /// @return success           Operation successful
  function faucet() public returns (bool) {
    balances[owner] = balances[owner].sub(faucetAmount);
    balances[msg.sender] = balances[msg.sender].add(faucetAmount);
    return true;
  }

  /// @dev Creates new tokens
  /// @return success           Operation successful
  function mint(uint _value) public onlyOwner returns (bool) {
    totalSupply_ = totalSupply_.add(_value);
    balances[owner] = balances[owner].add(_value);
    return true;
  }
}
