/**
 * @dev The following constructors are used to create contract instances for testing
 */
const { GAS_PRICE_DEV } = require('../config/params.js');

const allArtifacts = {
  TestToken: artifacts.require('./TestToken.sol'),
  BasketEscrow: artifacts.require('./BasketEscrow.sol'),
  BasketFactory: artifacts.require('./BasketFactory.sol'),
  BasketRegistry: artifacts.require('./BasketRegistry.sol'),
  Basket: artifacts.require('./Basket.sol'),
  TokenWallet: artifacts.require('./TokenWallet.sol'),
  TokenWalletFactory: artifacts.require('./TokenWalletFactory.sol'),
};

const constructors = {
  BasketRegistry: _owner => allArtifacts.BasketRegistry.new({ from: _owner, gasPrice: GAS_PRICE_DEV }),

  BasketEscrow: (_owner, _basketRegistryAddress, _transactionFeeRecipient, _transactionFee) =>
    allArtifacts.BasketEscrow.new(_basketRegistryAddress, _transactionFeeRecipient, _transactionFee, { from: _owner, gasPrice: GAS_PRICE_DEV }),

  BasketFactory: (_owner, _basketRegistryAddress, _productionFeeRecipient, _productionFee) =>
    allArtifacts.BasketFactory.new(_basketRegistryAddress, _productionFeeRecipient, _productionFee, { from: _owner, gasPrice: GAS_PRICE_DEV }),

  TestToken: (_owner, _name, _symbol, _decimals, _initialSupply, _faucetAmount) =>
    allArtifacts.TestToken.new(_name, _symbol, _decimals, _initialSupply, _faucetAmount, { from: _owner, gasPrice: GAS_PRICE_DEV }),

  Basket: (_owner, _name, _symbol, _tokens, _weights, _registryAddress, _arranger, _arrangerFeeRecipient, _arrangerFee) =>
    allArtifacts.Basket.new(
      _name, _symbol, _tokens, _weights, _registryAddress, _arranger, _arrangerFeeRecipient, _arrangerFee,
      { from: _owner, gasPrice: GAS_PRICE_DEV },
    ),

  TokenWallet: (_owner, _user) =>
    allArtifacts.TokenWallet.new(_user, { from: _owner, gasPrice: GAS_PRICE_DEV }),

  TokenWalletFactory: (_admin, _basketFactory) =>
    allArtifacts.TokenWalletFactory.new(_basketFactory, { from: _admin, gasPrice: GAS_PRICE_DEV }),
};

module.exports = {
  constructors,
};
