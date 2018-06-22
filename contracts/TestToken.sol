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

import "./zeppelin/StandardToken.sol";
import "./zeppelin/Destructible.sol";
import "./zeppelin/Pausable.sol";
import "./zeppelin/SafeMath.sol";

/**
 * @title TestToken
 * @author CoinAlpha, Inc. <contact@coinalpha.com>
 */

contract TestToken is StandardToken, Destructible, Pausable {
  string public name;
  string public symbol;
  uint public decimals;
  uint public faucetAmount;

  event LogFaucet(address recipient, uint amount);
  event LogMint(uint amount);

  /// @dev Token constructor
  /// @param  _name             Token name
  /// @param  _symbol           Token symbol
  /// @param  _decimals         Decimal precision
  /// @param  _initialSupply    Initial total supply of tokens
  /// @param  _faucetAmount     Amount to faucet with each request
  function TestToken(
    string    _name,
    string    _symbol,
    uint      _decimals,
    uint      _initialSupply,
    uint      _faucetAmount
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
  function () public { revert("Token contract does not accept ETH transfers"); }

  /// @dev Transfer a set amount of token to any address
  /// @return success           Operation successful
  function transfer(address _to, uint _value) public whenNotPaused returns (bool) {
    return super.transfer(_to, _value);
  }

  /// @dev Transfer a set amount of token from any address
  /// @return success           Operation successful
  function transferFrom(address _from, address _to, uint _value) public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  /// @dev Withdraw a set amount of token to any address
  /// @return success           Operation successful
  function faucet() public returns (bool) {
    balances[owner] = balances[owner].sub(faucetAmount);
    balances[msg.sender] = balances[msg.sender].add(faucetAmount);
    emit LogFaucet(msg.sender, faucetAmount);
    return true;
  }

  /// @dev Creates new tokens
  /// @return success           Operation successful
  function mint(uint _value) public onlyOwner returns (bool) {
    totalSupply_ = totalSupply_.add(_value);
    balances[owner] = balances[owner].add(_value);
    emit LogMint(_value);
    return true;
  }
}
