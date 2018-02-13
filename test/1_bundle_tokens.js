const path = require('path');
const Promise = require('bluebird');

const { constructors } = require('../migrations/constructors.js');

const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('TestToken | Basket', (accounts) => {

  const HOLDER_A = accounts[0];
  const HOLDER_B = accounts[1];
  
  // Token instances
  let tokenA;
  let tokenB;
  const decimals = 18;
  const initialSupply = 100e18;
  const faucetAmount = 1e18;
  
  const tokenParamsA = {
    owner: HOLDER_A,
    name: 'Token A',
    symbol: 'TOKA',
    decimals,
    initialSupply,
    faucetAmount,
  };
  const tokenParamsB = {
    owner: HOLDER_B,
    name: 'Token B',
    symbol: 'TOKB',
    decimals,
    initialSupply,
    faucetAmount,
  };

  before('Before: deploy tokens', () => {
    console.log(`  ****** START TEST [ ${scriptName} ] *******`);

    return Promise.all([tokenParamsA, tokenParamsB].map(({ owner, name, symbol, decimals, initialSupply, faucetAmount }) =>
      constructors.TestToken(owner, name, symbol, decimals, initialSupply, faucetAmount)))
      .then(_instances => [tokenA, tokenB] = _instances)
      .catch(err => assert.throw(`Failed to create Tokens: ${err.toString()}`));
  });

  describe('tokens and balances should be correct', () => {
    let newFundDetails;
    let fundStorageDetails;

    it('get token balances', () => Promise.all([tokenA.totalSupply(), tokenB.totalSupply()])
      .then(_supply => _supply.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect token supply')))
      .then(() => Promise.all([tokenA.balanceOf(tokenParamsA.owner), tokenB.balanceOf(tokenParamsB.owner)]))
      .then(_balances => _balances.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect owner balances')))
    );
  });  // describe

});