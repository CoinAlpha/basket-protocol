const path = require('path');
const Promise = require('bluebird');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const { abi: basketAbi } = require('../build/contracts/Basket.json');
const { abi: tokenWalletAbi } = require('../build/contracts/TokenWallet.json');

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

  let tokenWalletFactory;

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
      .then((_index) => {
        basketIndex = Number(_index);
        assert.strictEqual(basketIndex, 1, 'basketIndex not initialized to one');
      })
      .then(() => Promise.all([tokenParamsA, tokenParamsB].map(({ owner, name, symbol, decimals, initialSupply, faucetAmount }) =>
        constructors.TestToken(owner, name, symbol, decimals, initialSupply, faucetAmount))))
      .then(_instances => [tokenA, tokenB] = _instances)

      .then(() => {
        console.log('\n  Token Contracts:');
        console.log(`  - tokenAAddress = '${tokenA.address}'`);
        console.log(`  - tokenBAddress = '${tokenB.address}'\n`);
      })

      .catch(err => assert.throw(`Failed to create Tokens: ${err.toString()}`));
  });

  describe('tokens and balances should be correct', () => {

    it('get token balances', () => Promise.all([tokenA.totalSupply(), tokenB.totalSupply()])
      .then(_supply => _supply.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect token supply')))
      .then(() => Promise.all([tokenA.balanceOf(tokenParamsA.owner), tokenB.balanceOf(tokenParamsB.owner)]))
      .then(_balances => _balances.map(x => assert.strictEqual(Number(x), initialSupply, 'Incorrect owner balances'))));
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
        assert.strictEqual(Number(basketIndex), 1, 'incorrect basketIndex');
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

    before('HOLDER_A\'s amount of basketAB tokens should be zero', () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_bal => assert.strictEqual(Number(_bal), 0, 'basketAB token balance is not zero'))
      .catch(err => assert.throw(`balanceOf error: ${err.toString()}`)));

    after(`HOLDER_A's amount of basketAB tokens should be ${amount}`, () => basketAB.balanceOfPromise(HOLDER_A)
      .then(_bal => assert.strictEqual(Number(_bal), amount, 'incorrect amount of basketAB tokens'))
      .catch(err => assert.throw(`balanceOf error: ${err.toString()}`)));

    it('approve token contracts for basketAB', () => Promise.all([
      tokenA, tokenB].map(token => token.approve(basketABAddress, amount, { from: HOLDER_A })))
      .then(() => Promise.all(['name', 'symbol', 'decimals'].map(field => basketAB[field].call())))
      .then(_data => console.log(`      Contract data: ${_data}`))
      .catch(err => assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`)));

    it('should allow HOLDER_A to deposit tokenA', () => basketAB.depositPromise(tokenA.address, amount, { from: HOLDER_A })
      .catch(err => assert.throw(`Error depositing tokenA: ${err.toString()}`)));

    it('should allow HOLDER_A to deposit tokenB', () => basketAB.depositPromise(tokenB.address, amount, { from: HOLDER_A })
      .catch(err => assert.throw(`Error depositing tokenA: ${err.toString()}`)));

    it('should allow HOLDER_A to bundle tokens', () => basketAB.bundlePromise(amount, { from: HOLDER_A }));
  });

  describe('Transfer + debundle basketAB', () => {
    before('HOLDER_B should have 0 tokens', () => Promise.all([
      tokenA.balanceOf(HOLDER_B),
      tokenB.balanceOf(HOLDER_B),
      basketAB.balanceOfPromise(HOLDER_B),
    ])
      .then(([_balTokenA, _balTokenB, _balBasketAB]) => {
        assert.strictEqual(Number(_balTokenA), 0, 'tokenA balance is not zero');
        assert.strictEqual(Number(_balTokenB), 0, 'tokenB balance is not zero');
        assert.strictEqual(Number(_balBasketAB), 0, 'basketAB token balance is not zero');
      })
      .catch(err => assert.throw(`before error: ${err.toString()}`)));

    after(`HOLDER_B should have ${amount / 1e18} of tokens A and B, 0 of basketAB`, () => Promise.all([
      tokenA.balanceOf(HOLDER_B),
      tokenB.balanceOf(HOLDER_B),
    ])
      .then(([_balTokenA, _balTokenB]) => {
        assert.strictEqual(Number(_balTokenA), amount, `tokenA balance is not ${amount / 1e18}`);
        assert.strictEqual(Number(_balTokenB), amount, `tokenB balance is not ${amount / 1e18}`);
      })
      .catch(err => assert.throw(`after error: ${err.toString()}`)));

    it('should allow HOLDER_A to transfer basketAB tokens to HOLDER_B', () => basketAB.transferPromise(HOLDER_B, amount, { from: HOLDER_A })
      .then(() => basketAB.balanceOfPromise(HOLDER_B))
      .then(_bal => assert.strictEqual(Number(_bal), amount, 'incorrect amount transferred'))
      .catch(err => assert.throw(`Error transferring tokenA: ${err.toString()}`)));

    it('should allow HOLDER_B to debundle and withdraw tokens', () => basketAB.debundlePromise(amount, { from: HOLDER_B })
      .then(() => Promise.all([
        basketAB.withdrawPromise(tokenA.address, amount, { from: HOLDER_B }),
        basketAB.withdrawPromise(tokenB.address, amount, { from: HOLDER_B }),
      ]))
      .catch(err => assert.throw(`Error debundling and withdrawing: ${err.toString()}`)));
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

    it('should allow HOLDER_A to basketAB tokens', () => basketAB.extractPromise(basketABBalance, { from: HOLDER_A, gas: 7e6 })
      .then(() => basketFactory.tokenWallets.call(0))
      .then(_twAddress => tokenWalletAddress = _twAddress)
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
