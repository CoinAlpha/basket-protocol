const path = require('path');
const Promise = require('bluebird');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const { abi: basketAbi } = require('../build/contracts/Basket.json');

const { constructors } = require('../migrations/constructors.js');

const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('TestToken | Basket', (accounts) => {

  // Accounts
  const [
    ADMINISTRATOR,
    ARRANGER,
    MARKETMAKER,
    HOLDER_A,
    HOLDER_B,
  ] = accounts.slice(5);

  const accountsObj = {
    ADMINISTRATOR,
    ARRANGER,
    MARKETMAKER,
    HOLDER_A,
    HOLDER_B,
  };

  console.log('  Accounts:');
  Object.keys(accountsObj).forEach(account => console.log(`  - ${account} = '${accountsObj[account]}'`));

  // Contract instances
  let basketFactory;
  let basketIndex;

  let basketAB;
  let basketABAddress;

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
    owner: HOLDER_A,
    name: 'Token B',
    symbol: 'TOKB',
    decimals,
    initialSupply,
    faucetAmount,
  };

  before('Before: deploy tokens', () => {
    console.log(`  ****** START TEST [ ${scriptName} ] *******`);

    return BasketFactory.deployed()
      .then(_instance => basketFactory = _instance)
      .then(() => basketFactory.basketIndex.call())
      .then(_index => {
        basketIndex = Number(_index);
        assert.strictEqual(basketIndex, 0, 'basketIndex not initialized to zero');
      })
      .then(() => Promise.all([tokenParamsA, tokenParamsB].map(({ owner, name, symbol, decimals, initialSupply, faucetAmount }) =>
        constructors.TestToken(owner, name, symbol, decimals, initialSupply, faucetAmount))))
      .then(_instances => [tokenA, tokenB] = _instances)

      .then(() => {
        console.log(`\n  Token Contracts:`);
        console.log(`  - tokenAAddress = '${tokenA.address}'`);
        console.log(`  - tokenBAddress = '${tokenB.address}'\n`);
      })

      .catch(err => assert.throw(`Failed to create Tokens: ${err.toString()}`));
  });

  describe('tokens and balances should be correct', () => {

    it('get token balances', () => Promise.all([tokenA.totalSupply(), tokenB.totalSupply()])
      .then(_supply => _supply.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect token supply')))
      .then(() => Promise.all([tokenA.balanceOf(tokenParamsA.owner), tokenB.balanceOf(tokenParamsB.owner)]))
      .then(_balances => _balances.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect owner balances')))
    );
  });  // describe

  describe('deploy basket A:B @ 1:1', () => {
    it('deploy the basket', () => basketFactory.createBasket(
      'A1B1',
      'BASK',
      [tokenA.address, tokenB.address],
      [1, 1],
      { from: ARRANGER },
    )
      .then((_txObj) => {

        // Check logs to ensure contract was created
        const txLogs = _txObj.logs;
        assert.strictEqual(txLogs.length, 1, 'incorrect number of logs');
        const txLog = txLogs[0];
        assert.strictEqual(txLog.event, 'LogBasketCreated', 'incorrect event label');
        const { basketIndex, basketAddress, arranger: _arranger } = txLog.args;
        basketABAddress = basketAddress;
        assert.strictEqual(Number(basketIndex), 0, 'incorrect basketIndex');
        assert.strictEqual(_arranger, ARRANGER, 'incorrect arranger address');

        // Get basketAB instance
        const newContract = web3.eth.contract(basketAbi);
        basketAB = newContract.at(basketABAddress);

        Promise.promisifyAll(basketAB, { suffix: 'Promise' });

        console.log(`\n  - basketABAddress = '${basketABAddress}'\n`);

        return basketFactory.basketIndex.call();
      })
      .then(_index => assert.isAbove(Number(_index), basketIndex, 'basketIndex was not incremented'))
      .catch(err => assert.throw(`Error deploying basketAB: ${err.toString()}`)));
  });

  describe('HOLDER_A: create 25 basketAB tokens', () => {

    const amount = 25e18;

    before('HOLDER_A\'s amount of basketAB tokens should be zero', () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_bal => assert.strictEqual(Number(_bal), 0, 'basketAB token balance is not zero'))
      .catch(err => assert.throw(`balanceOf error: ${err.toString()}`))
    );

    after(`HOLDER_A's amount of basketAB tokens should be ${amount}`, () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_bal => assert.strictEqual(Number(_bal), amount, 'incorrect amount of basketAB tokens'))
      .catch(err => assert.throw(`balanceOf error: ${err.toString()}`))
    );

    it('approve token contracts for basketAB', () => Promise.all(
      [tokenA, tokenB].map(token => token.approve(basketABAddress, 50e18, { from: HOLDER_A })))
      .then(() => Promise.all(['name', 'symbol', 'decimals'].map(field => basketAB[field].call())))
      .then(_data => console.log(`      Conatract data: ${_data}`))
    );

    it('should allow HOLDER_A to deposit tokenA', () => basketAB.depositPromise(tokenA.address, amount, { from: HOLDER_A })
      .catch(err => assert.throw(`Error depositing tokenA: ${err.toString()}`))
    );

    it('should allow HOLDER_A to deposit tokenB', () => basketAB.depositPromise(tokenB.address, amount, { from: HOLDER_A })
      .catch(err => assert.throw(`Error depositing tokenA: ${err.toString()}`))
    );

    it('should allow HOLDER_A to bundle tokens', () => basketAB.bundlePromise(amount, { from: HOLDER_A })
    );

  });  // describe

  xdescribe('test depositAndBundle', () => { });

});