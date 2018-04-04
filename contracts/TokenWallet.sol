
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
import "./zeppelin/ERC20.sol";
import "./zeppelin/Ownable.sol";

/// @title TokenWallet -- Wallet contract for segregated pool of ERC20 tokens and Ether
/// @author CoinAlpha, Inc. <contact@coinalpha.com>

// ** CAUTION ** : Transfer only Ether or ERC20 tokens to this address
//                 Transfer of any other types of tokens to this contract may be irreversibly lost

contract TokenWallet is Ownable {
  using SafeMath for uint;

  // Token registry
  // @dev Token register is maintained for tracking and informational use.
  //      Any ERC20 tokens transferred directly to the contract (i.e. not using the internal deposit function)
  //      can still be accessed by this wallet's methods (balanceOfToken, transferToken, approveToken)
  address[]                 public tokenList;

  // This mapping tracks if a token is contained and has been recorded in this wallet
  mapping(address => uint)  public containsToken;

  // Events
  event LogWithdrawEther(uint amount);
  event LogDeposit(address indexed holder, address tokenAddress, uint quantity);
  event LogWithdraw(address indexed holder, address tokenAddress, uint quantity);
  event LogTransfer(address tokenAddress, address recipient, uint quantity);
  event LogDebundle(address indexed holder, uint quantity);
  event LogDebundleAndWithdraw(address indexed holder, uint quantity);

  /// @dev Token Wallet constructor
  /// @param  _owner                                Token owner
  function TokenWallet(address _owner) public {
    owner = _owner;
  }

  /// @dev Transfer all Ether held by the contract to the owner.
  /// @return success                              Operation successful
  function withdrawEther() external onlyOwner returns (bool success) {
    uint amount = this.balance;
    assert(owner.send(this.balance));
    LogWithdrawEther(amount);
    return true;
  }

  /// @dev Get wallet's balance of token
  /// @param  _token                               Address of token to query
  /// @return balance                              Wallet's balance of token
  function balanceOfToken(address _token)
    public
    view
    returns (uint tokenBalance)
  {
    return ERC20(_token).balanceOf(this);
  }

  /// @dev Transfer tokens to contract (requires this contract has allowance/is approved in the token contract)
  /// @param  _token                               Address of token to deposit
  /// @param  _quantity                            Quantity of tokens to deposit
  /// @return success                              Operation successful
  function deposit(address _token, uint _quantity) public returns (bool success) {
    assert(ERC20(_token).transferFrom(msg.sender, this, _quantity));

    if (containsToken[_token] == 0) {
      registerToken(_token);
    }
    LogDeposit(msg.sender, _token, _quantity);
    return true;
  }

  /// @dev Transfer tokens to designated address
  /// @param  _token                               Address of token to transfer
  /// @param  _to                                  Recipient address
  /// @param  _quantity                            Quantity of tokens to transfer
  /// @return success                              Operation successful
  function transferToken(address _token, address _to, uint _quantity)
    public
    onlyOwner
    returns (bool success)
  {
    uint tokenBalance = ERC20(_token).balanceOf(this);
    require(tokenBalance >= _quantity);
    assert(ERC20(_token).transfer(_to, _quantity));

    if (tokenBalance == _quantity) {
      removeTokenFromRegister(_token);
    }
    LogTransfer(_token, _to, _quantity);
    return true;
  }

  /// @dev Withdraw tokens / transfer to owner
  /// @param  _token                               Address of token to transfer
  /// @param  _quantity                            Quantity of tokens to transfer
  /// @return success                              Operation successful
  function withdrawToken(address _token, uint _quantity)
    public
    onlyOwner
    returns (bool success)
  {
    uint tokenBalance = ERC20(_token).balanceOf(this);
    require(tokenBalance >= _quantity);
    assert(transferToken(_token, owner, _quantity));

    if (tokenBalance == _quantity) {
      removeTokenFromRegister(_token);
    }
    return true;
  }

  /// @dev Approve tokens / transfer to owner
  /// @param  _token                               Address of token to transfer
  /// @param  _quantity                            Quantity of tokens to transfer
  /// @return success                              Operation successful
  function approveToken(address _token, address _spender, uint _quantity)
    public
    onlyOwner
    returns (bool success)
  {
    assert(ERC20(_token).approve(_spender, _quantity));
    return true;
  }

  /* TOKEN REGISTRY: ADMINISTRATIVE FUNCTIONS */

  /// @dev Register a token
  /// @param  _token                               Address of token to query
  /// @return success                              Operation successful
  function registerToken(address _token) internal returns (bool success) {
    // Register a token in this wallet if there is a balance and if not previously registered
    if (containsToken[_token] == 0) {
      containsToken[_token] = 1;
      tokenList.push(_token);
      success = true;
    }
    return success;
  }

  /// @dev Administrative function to remove token from list of registered addresses
  /// @param  _token                               Token address to be removed
  /// @return success                              Operation successful
  function removeTokenFromRegister(address _token)
    public
    returns (bool success)
  {
    require(containsToken[_token] > 0 && ERC20(_token).balanceOf(this) == 0);

    bool tokenRemoved;
    for (uint i = 0; i < tokenList.length; i++) {
      if (_token == tokenList[i]) {
        // If token is not the last investor, swap with the last
        if (i < tokenList.length - 1) {
          tokenList[i] = tokenList[tokenList.length - 1];
        }
        // Remove last investor
        tokenList.length = tokenList.length - 1;
        containsToken[_token] = 0;
        tokenRemoved = true;

        // escape loop
        i = tokenList.length;
      }
    }
    return tokenRemoved;
  }

  /// @dev Check token balance and register/deregister token as appropriate
  /// @param  _token                               Address of token to query
  /// @return updated                              State changed
  function checkTokenRegister(address _token)
    public
    returns (bool updated)
  {
    uint tokenBalance = balanceOfToken(_token);
    if (tokenBalance > 0 && containsToken[_token] == 0) {
      registerToken(_token);
      updated = true;
    }

    if (tokenBalance == 0 && containsToken[_token] > 0) {
      removeTokenFromRegister(_token);
      updated = true;
    }
  }
}
