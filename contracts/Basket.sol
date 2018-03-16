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
import "./BasketRegistry.sol";

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
  address                 public basketRegistryAddress;
  address                 public basketEscrowAddress;

  address                 public arranger;
  address                 public arrangerFeeRecipient;
  uint                    public arrangerFee;
  uint                    public FEE_DECIMALS;

  // Modules
  IBasketFactory          public basketFactory;
  IBasketRegistry         public basketRegistry;

  // Modifiers
  modifier onlyArranger {
    require(msg.sender == arranger);
    _;
  }

  // Events
  event LogDepositAndBundle(address indexed holder, uint quantity);
  event LogDebundleAndWithdraw(address indexed holder, uint quantity);
  event LogExtract(address indexed holder, uint quantity, address tokenWalletAddress);
  event LogArrangerFeeRecipientChange(address oldRecepient, address newRecipient);
  event LogArrangerFeeChange(uint oldFee, uint arrangerFee);

  /// @dev Basket constructor
  /// @param  _name                                Token name
  /// @param  _symbol                              Token symbol
  /// @param  _tokens                              Array of ERC20 token addresses
  /// @param  _weights                             Array of ERC20 token quantities
  /// @param  _basketRegistryAddress               Address of basket registry
  /// @param  _basketRegistryAddress               Address of basket escrow
  /// @param  _arranger                            Address of arranger
  /// @param  _arrangerFeeRecipient                Address to send arranger fees
  /// @param  _arrangerFee                         Amount of fee in ETH for every basket minted
  function Basket(
    string _name,
    string _symbol,
    address[] _tokens,
    uint[] _weights,
    address _basketRegistryAddress,
    address _basketEscrowAddress,
    address _arranger,
    address _arrangerFeeRecipient,
    uint _arrangerFee                              // Amount of ETH charged per basket minted
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

    basketRegistryAddress = _basketRegistryAddress;
    basketRegistry = IBasketRegistry(_basketRegistryAddress);

    basketEscrowAddress = _basketEscrowAddress;

    arranger = _arranger;
    arrangerFeeRecipient = _arrangerFeeRecipient;
    arrangerFee = _arrangerFee;
    FEE_DECIMALS = 4;                              // Default transaction fee to 4 decimal places
  }

  /// @dev Combined deposit of all component tokens (not yet deposited) and bundle
  /// @param  _quantity                            Quantity of basket tokens to mint
  /// @return success                              Operation successful
  function depositAndBundle(uint _quantity) public payable returns (bool success) {
    for (uint i = 0; i < tokens.length; i++) {
      address t = tokens[i];
      uint w = weights[i];
      assert(ERC20(t).transferFrom(msg.sender, this, w.mul(_quantity)));
    }

    // charging market makers a fee for every new basket minted
    if (arrangerFee > 0) {
      require(msg.value >= arrangerFee.mul(_quantity).div(10 ** FEE_DECIMALS));
      arrangerFeeRecipient.transfer(msg.value);
    }

    balances[msg.sender] = balances[msg.sender].add(_quantity);
    totalSupply_ = totalSupply_.add(_quantity);

    basketRegistry.incrementBasketsMinted(_quantity);
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

    basketRegistry.incrementBasketsBurned(_quantity);
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

    basketRegistry.incrementBasketsBurned(_quantity);
    LogExtract(msg.sender, _quantity, tokenWalletAddress);
    return true;
  }

  /// @dev Change recipient of arranger fees
  /// @param  _newRecepient                        New fee recipient
  /// @return success                              Operation successful
  function changeArrangerFeeRecipient(address _newRecepient) public onlyArranger returns (bool success) {
    address oldRecepient = arrangerFeeRecipient;
    arrangerFeeRecipient = _newRecepient;

    LogArrangerFeeRecipientChange(oldRecepient, arrangerFeeRecipient);
    return true;
  }

  /// @dev Change amount of fee charged for every basket minted
  /// @param  _newFee                              New fee amount
  /// @return success                              Operation successful
  function changeArrangerFee(uint _newFee) public onlyArranger returns (bool success) {
    uint oldFee = arrangerFee;
    arrangerFee = _newFee;

    LogArrangerFeeChange(oldFee, arrangerFee);
    return true;
  }

  /// @dev Fallback to reject any ether sent to contract
  function () public { revert(); }

}
