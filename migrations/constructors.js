/**
 * @dev The following constructors are used to create contract instances for testing
 */

const allArtifacts = {
  TestToken: artifacts.require('./TestToken.sol'),
  BasketEscrow: artifacts.require('./BasketEscrow.sol'),
  BasketFactory: artifacts.require('./BasketFactory.sol'),
  BasketRegistry: artifacts.require('./BasketRegistry.sol'),
  Basket: artifacts.require('./Basket.sol'),
};

const constructors = {
  BasketRegistry: _owner => allArtifacts.BasketRegistry.new({ from: _owner }),

  BasketEscrow: (_owner, _basketRegistryAddress, _transactionFeeRecipient, _transactionFee) =>
    allArtifacts.BasketEscrow.new(_basketRegistryAddress, _transactionFeeRecipient, _transactionFee, { from: _owner }),

  BasketFactory: (_owner, _basketRegistryAddress, _productionFeeRecipient, _productionFee) =>
    allArtifacts.BasketFactory.new(_basketRegistryAddress, _productionFeeRecipient, _productionFee, { from: _owner }),

  TestToken: (_owner, _name, _symbol, _decimals, _initialSupply, _faucetAmount) =>
    allArtifacts.TestToken.new(_name, _symbol, _decimals, _initialSupply, _faucetAmount, { from: _owner }),

  Basket: (_owner, _name, _symbol, _tokens, _weights, _registryAddress, _arranger, _arrangerFeeRecipient, _arrangerFee) =>
    allArtifacts.Basket.new(
      _name, _symbol, _tokens, _weights, _registryAddress, _arranger, _arrangerFeeRecipient, _arrangerFee,
      { from: _owner },
    ),
};

module.exports = {
  constructors,
};
