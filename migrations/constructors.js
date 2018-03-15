/**
 * @dev The following constructors are used to create contract instances for testing
 */

const allArtifacts = {
  TestToken: artifacts.require('./TestToken.sol'),
  BasketFactory: artifacts.require('./BasketFactory.sol'),
  BasketRegistry: artifacts.require('./BasketRegistry.sol'),
  Basket: artifacts.require('./Basket.sol'),
  TokenWallet: artifacts.require('./TokenWallet.sol'),
  TokenWalletFactory: artifacts.require('./TokenWalletFactory.sol'),
};

const constructors = {
  BasketRegistry: _owner => allArtifacts.BasketRegistry.new({ from: _owner }),

  BasketFactory: (_owner, _basketRegistryAddress) =>
    allArtifacts.BasketFactory.new(_basketRegistryAddress, { from: _owner }),

  TestToken: (_owner, _name, _symbol, _decimals, _initialSupply, _faucetAmount) =>
    allArtifacts.TestToken.new(_name, _symbol, _decimals, _initialSupply, _faucetAmount, { from: _owner }),

  Basket: (_owner, _name, _symbol, _tokens, _weights, _registryAddress) =>
    allArtifacts.Basket.new(_name, _symbol, _tokens, _weights, _registryAddress, { from: _owner }),

  TokenWallet: (_owner, _user) =>
    allArtifacts.TokenWallet.new(_user, { from: _owner }),

  TokenWalletFactory: (_creator, _basketFactory) =>
    allArtifacts.TokenWalletFactory.new(_basketFactory, { from: _creator }),
};

module.exports = {
  constructors,
};
