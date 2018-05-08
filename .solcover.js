const { GAS_LIMIT } = require('./config/params.js');

module.exports = {
  port: 8555,
  testrpcOptions: `-p 8555 -l ${GAS_LIMIT}`,
  norpc: false,
  testCommand: 'truffle test',
  skipFiles: ['zeppelin/BasicToken.sol', 'zeppelin/Destructible.sol', 'zeppelin/ERC20.sol', 'zeppelin/ERC20Basic.sol', 'zeppelin/Ownable.sol', 'zeppelin/SafeMath.sol', 'zeppelin/StandardToken.sol', 'TestToken.sol']
};