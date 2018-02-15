/**
 * @dev The following constructors are used to create contract instances for testing
 */

const allArtifacts = {
  TestToken: artifacts.require('./TestToken.sol'),
  BasketFactory: artifacts.require('./BasketFactory.sol'),
  Basket: artifacts.require('./Basket.sol'),
  TokenWallet: artifacts.require('./TokenWallet.sol'),
};

const constructors = {
  TestToken: (_owner, _name, _symbol, _decimals, _initialSupply, _faucetAmount) => allArtifacts.TestToken.new(
    _name, _symbol, _decimals, _initialSupply, _faucetAmount,
    { from: _owner },
  ),
  BasketFactory: _owner => allArtifacts.BasketFactory.new({ from: _owner }),
  Basket: (_owner, _name, _symbol, _tokens, _weights) =>
    allArtifacts.Basket.new(_name, _symbol, _tokens, _weights, { from: _owner }),
  TokenWallet: (_owner, _user) => allArtifacts.TokenWallet.new(_user, { from: _owner }),
};

module.exports = {
  constructors,
};
