const path = require('path');
const Promise = require('bluebird');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');
const { abi: basketAbi } = require('../build/contracts/Basket.json');
const { abi: tokenWalletAbi } = require('../build/contracts/TokenWallet.json');

const { constructors } = require('../migrations/constructors.js');

const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('TestToken | Basket', (accounts) => {
  // Accounts
  const [ADMINISTRATOR, ARRANGER, MARKETMAKER, HOLDER_A, HOLDER_B] = accounts.slice(5);
  const accountsObj = { ADMINISTRATOR, ARRANGER, MARKETMAKER, HOLDER_A, HOLDER_B };
  console.log('  Accounts:');
  Object.keys(accountsObj).forEach(account => console.log(`  - ${account} = '${accountsObj[account]}'`));

  // Contract instances
  let basketFactory;
  let basketIndex;

  let tokenWalletFactory;

  let basketAB;
  let basketABAddress;

  // Token instances
  let tokenA;
  let tokenB;
  const decimals = 18;
  const initialSupply = 100e18;
  const faucetAmount = 1e18;

  const tokenParamsA = [HOLDER_A, 'Token A', 'TOKA', decimals, initialSupply, faucetAmount];
  const tokenParamsB = [HOLDER_A, 'Token B', 'TOKB', decimals, initialSupply, faucetAmount];

  before('Before: deploy tokens', async () => {
    console.log(`  ****** START TEST [ ${scriptName} ] *******`);
    try {
      basketFactory = await BasketFactory.deployed();
      const index = await basketFactory.basketIndex.call();
      basketIndex = Number(index);

      tokenWalletFactory = await TokenWalletFactory.deployed();

      assert.strictEqual(basketIndex, 1, 'basketIndex not initialized to one');

      tokenA = await constructors.TestToken(...tokenParamsA);
      tokenB = await constructors.TestToken(...tokenParamsB);

      console.log('\n  Token Contracts:');
      console.log(`  - tokenAAddress = '${tokenA.address}'`);
      console.log(`  - tokenBAddress = '${tokenB.address}'\n`);
    } catch (err) {
      assert.throw(`Failed to create Tokens: ${err.toString()}`);
    }
  });

  describe('tokens and balances should be correct', () => {
    it('get token balances', async () => {
      const supplyA = await tokenA.totalSupply();
      const supplyB = await tokenB.totalSupply();
      assert.strictEqual(Number(supplyA), initialSupply, 'Incorrect token supply');
      assert.strictEqual(Number(supplyB), initialSupply, 'Incorrect token supply');

      const balanceA = await tokenA.balanceOf(HOLDER_A);
      const balanceB = await tokenB.balanceOf(HOLDER_A);
      assert.strictEqual(Number(balanceA), initialSupply, 'Incorrect owner balances');
      assert.strictEqual(Number(balanceB), initialSupply, 'Incorrect owner balances');
    });
  });

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
        const { basketIndex: _basketIndex, basketAddress, arranger: _arranger } = txLog.args;
        basketABAddress = basketAddress;
        assert.strictEqual(Number(_basketIndex), 1, 'incorrect basketIndex');
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

  const amount = 25e18;

  describe(`HOLDER_A: create ${amount / 1e18} basketAB tokens`, () => {
    before('HOLDER_A\'s amount of basketAB tokens should be zero', () => Promise.all([
      tokenA.balanceOf(HOLDER_A),
      tokenB.balanceOf(HOLDER_A),
      basketAB.balanceOfPromise(HOLDER_A),
    ])
      .then(([_balTokenA, _balTokenB, _balBasketAB]) => {
        assert.notEqual(Number(_balTokenA), 0, 'tokenA balance is zero');
        assert.notEqual(Number(_balTokenB), 0, 'tokenB balance is zero');
        assert.strictEqual(Number(_balBasketAB), 0, 'basketAB token balance is not zero');
      })
      .catch(err => assert.throw(`before error: ${err.toString()}`)));

    after(`HOLDER_A's amount of basketAB tokens should be ${amount}`, () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_bal => assert.strictEqual(Number(_bal), amount, 'incorrect amount of basketAB tokens'))
      .catch(err => assert.throw(`balanceOf error: ${err.toString()}`)));

    it('approve token contracts for basketAB', () => Promise.all([
      tokenA, tokenB].map(token => token.approve(basketABAddress, amount, { from: HOLDER_A })))
      .then(() => Promise.all(['name', 'symbol', 'decimals'].map(field => basketAB[field].call())))
      .then(_data => console.log(`      Contract data: ${_data}`))
      .catch(err => assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`)));

    it('should allow HOLDER_A to deposit and bundle tokens', () => basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 })
      .catch(err => assert.throw(`Error depositing and bundling ${err.toString()}`)));
  });

  describe('Combined depositAndBundle', () => {
    let basketABBalance;

    before('get HOLDER_A\'s balance', () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_balBasketAB => basketABBalance = Number(_balBasketAB))
      .then(() => Promise.all([tokenA, tokenB]
        .map(token => token.approve(basketABAddress, amount, { from: HOLDER_A })))
        .catch(err => assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`))));

    after(`HOLDER_A's balance should have increased by ${amount} basketAB tokens`, () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_balBasketAB => assert.strictEqual(Number(_balBasketAB), basketABBalance + amount, 'incorrect increase'))
      .catch(err => assert.throw(`after error: ${err.toString()}`)));

    it('should allow HOLDER_A to depositAndBundle', () => basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 }));
  });

  describe('Combined debundleAndWithdraw', () => {
    let basketABBalance;
    let tokenABalance;
    let tokenBBalance;

    before('get HOLDER_A\'s balances', () => Promise.all([
      tokenA.balanceOf(HOLDER_A),
      tokenB.balanceOf(HOLDER_A),
      basketAB.balanceOfPromise(HOLDER_A),
    ])
      .then(_balances => [tokenABalance, tokenBBalance, basketABBalance] = _balances.map(x => Number(x)))
      .catch(err => assert.throw(`before error: ${err.toString()}`)));

    after(`HOLDER_A should have additional ${basketABBalance / 1e18} of tokens A and B, 0 of basketAB`, () => Promise.all([
      tokenA.balanceOf(HOLDER_A),
      tokenB.balanceOf(HOLDER_A),
      basketAB.balanceOf(HOLDER_A),
    ])
      .then(([_balTokenA, _balTokenB, _balBasketAB]) => {
        assert.strictEqual(Number(_balTokenA), tokenABalance + basketABBalance, `tokenA balance is not ${basketABBalance / 1e18}`);
        assert.strictEqual(Number(_balTokenB), tokenBBalance + basketABBalance, `tokenB balance is not ${basketABBalance / 1e18}`);
        assert.strictEqual(Number(_balBasketAB), 0, 'basketAB balance is not 0');
      })
      .catch(err => assert.throw(`after error: ${err.toString()}`)));

    it('should allow HOLDER_A to debundleAndWithdraw', () => basketAB.debundleAndWithdrawPromise(basketABBalance, { from: HOLDER_A, gas: 1e6 }));
  });

  describe('Extract to private TokenWallet contract', () => {
    let basketABBalance;
    let tokenWalletAddress;

    before('get HOLDER_A\'s balance', () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_balBasketAB => basketABBalance = Number(_balBasketAB))
      .then(() => Promise.all([tokenA, tokenB]
        .map(token => token.approve(basketABAddress, amount, { from: HOLDER_A })))
        .then(() => basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 }))
        .then(() => basketAB.balanceOfPromise(HOLDER_A))
        .then(_balBasketAB => basketABBalance = Number(_balBasketAB))
        .then(() => assert.isAbove(basketABBalance, 0, 'HOLDER_A does not own any BasketAB tokens'))
        .catch(err => assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`))));

    it('should allow HOLDER_A to extract basketAB tokens', () => basketAB.extractPromise(basketABBalance, { from: HOLDER_A, gas: 1e7 })
      .then(data => console.log(data))
      .then(() => basketFactory.tokenWallets.call(0))
      .then((_twAddress) => { tokenWalletAddress = _twAddress; })
      .catch(err => assert.throw(`Error extracting: ${err.toString()}`)));

    it('tokenWallet should contain the tokenBalance', () => {
      // Get tokenWallet instance
      const newContract = web3.eth.contract(tokenWalletAbi);
      const tokenWallet = newContract.at(tokenWalletAddress);
      Promise.promisifyAll(tokenWallet, { suffix: 'Promise' });
      console.log(`\n  - tokenWalletAddress = '${tokenWallet.address}'\n`);

      return Promise.all([tokenWallet.balanceOfTokenPromise(tokenA.address), tokenWallet.balanceOfTokenPromise(tokenB.address)])
        .then(_balances => _balances.map(x => assert.strictEqual(Number(x), basketABBalance, 'incorrect token balance in wallet')));
    });
  });
});
