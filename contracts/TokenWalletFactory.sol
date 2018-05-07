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
import "./TokenWallet.sol";

/**
  * @title ITokenWalletFactory -- Interface for BasketFactory to reduce deployment gas cost
  * @author CoinAlpha, Inc. <contact@coinalpha.com>
  */

contract ITokenWalletFactory {
  function createTokenWallet(address) public returns (address) {}
}

/**
  * @title TokenWalletFactory -- Factory contract for creating tokenWallets
  * @author CoinAlpha, Inc. <contact@coinalpha.com>
  */
contract TokenWalletFactory {
  // Constant
  address public basketFactory;

  // Events
  event LogTokenWalletCreated(address owner);

  // Modifiers
  modifier onlyBasketFactory {
    require(msg.sender == basketFactory, "Only the basket factory can call this function");
    _;
  }

  // Constructor
  constructor(address _basketFactory) public {
    basketFactory = _basketFactory;
  }

  // Create TokenWallet: for segregatint assets
  function createTokenWallet(address _owner)
    public
    onlyBasketFactory
    returns (address newTokenWallet)
  {
    return new TokenWallet(_owner);
  }

}
