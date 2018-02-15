/**
 * @dev The following constructors are used to create contract instances for testing
 */

const allArtifacts = {
  TestToken: artifacts.require('./TestToken.sol'), 
};

const constructors = {
  TestToken: (_owner, _name, _symbol, _decimals, _initialSupply, _faucetAmount) => allArtifacts.TestToken.new(
    _name, _symbol, _decimals, _initialSupply, _faucetAmount,
    { from: _owner },
  ),
};

module.exports = {
  constructors,
};