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
  let basketFactory, tokenWalletFactory, basketAB;
  let basketABAddress;

  // Token instances
  let tokenA, tokenB;
  const decimals = 18;
  const initialSupply = 100e18;
  const faucetAmount = 1e18;

  const tokenParamsA = [HOLDER_A, 'Token A', 'TOKA', decimals, initialSupply, faucetAmount];
  const tokenParamsB = [HOLDER_A, 'Token B', 'TOKB', decimals, initialSupply, faucetAmount];

  before('Before: deploy tokens', async () => {
    console.log(`================= START TEST [ ${scriptName} ] =================`);
    try {
      basketFactory = await BasketFactory.deployed();
      tokenA = await constructors.TestToken(...tokenParamsA);
      tokenB = await constructors.TestToken(...tokenParamsB);

      // console.log('\n  Token Contracts:');
      // console.log(`  - tokenAAddress = '${tokenA.address}'`);
      // console.log(`  - tokenBAddress = '${tokenB.address}'\n`);
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
    it('deploy the basket', async () => {
      try {
        const txObj = await basketFactory.createBasket('A1B1', 'BASK', [tokenA.address, tokenB.address], [1, 1], { from: ARRANGER });
        const txLogs = txObj.logs;
        // Check logs to ensure contract was created
        const txLog = txLogs[0];
        assert.strictEqual(txLogs.length, 1, 'incorrect number of logs');
        assert.strictEqual(txLog.event, 'LogBasketCreated', 'incorrect event label');

        const { basketAddress, arranger: _arranger } = txLog.args;
        basketABAddress = basketAddress;

        // Get basketAB instance
        const newContract = web3.eth.contract(basketAbi);
        basketAB = newContract.at(basketABAddress);
        Promise.promisifyAll(basketAB, { suffix: 'Promise' });

        // console.log(`\n  - basketABAddress = '${basketABAddress}'\n`);
      } catch (err) { assert.throw(`Error deploying basketAB: ${err.toString()}`); }
    });
  });

  const amount = 25e18;

  describe(`HOLDER_A: create ${amount / 1e18} basketAB tokens`, () => {
    before('HOLDER_A\'s amount of basketAB tokens should be zero', async () => {
      try {
        const balTokenA = await tokenA.balanceOf(HOLDER_A);
        const balTokenB = await tokenB.balanceOf(HOLDER_A);
        const balBasketAB = await basketAB.balanceOf(HOLDER_A);
        assert.notEqual(Number(balTokenA), 0, 'tokenA balance is zero');
        assert.notEqual(Number(balTokenB), 0, 'tokenB balance is zero');
        assert.strictEqual(Number(balBasketAB), 0, 'basketAB token balance is not zero');
      } catch (err) { assert.throw(`before error: ${err.toString()}`); }
    });

    after(`HOLDER_A's amount of basketAB tokens should be ${amount}`, async () => {
      try {
        const bal = await basketAB.balanceOfPromise(HOLDER_A);
        assert.strictEqual(Number(bal), amount, 'incorrect amount of basketAB tokens');
      } catch (err) { assert.throw(`balanceOf error: ${err.toString()}`); }
    });

    it('approve token contracts for basketAB', async () => {
      try {
        await tokenA.approve(basketABAddress, amount, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount, { from: HOLDER_A });
        const data = await Promise.all(['name', 'symbol', 'decimals'].map(field => basketAB[field].call()));
        // console.log(`      Contract data: ${data}`);
      } catch (err) { assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to deposit and bundle tokens', async () => {
      await basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 })
        .catch(err => assert.throw(`Error depositing and bundling ${err.toString()}`));
    });
  });

  describe('Combined depositAndBundle', () => {
    let basketABBalance;

    before('get HOLDER_A\'s balance', async () => {
      try {
        const balBasketAB = await basketAB.balanceOfPromise(HOLDER_A);
        basketABBalance = Number(balBasketAB);
        await tokenA.approve(basketABAddress, amount, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount, { from: HOLDER_A });
      } catch (err) { assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`); }
    });

    after(`HOLDER_A's balance should have increased by ${amount} basketAB tokens`, async () => {
      try {
        const balBasketAB = await basketAB.balanceOfPromise(HOLDER_A);
        assert.strictEqual(Number(balBasketAB), basketABBalance + amount, 'incorrect increase');
      } catch (err) { assert.throw(`after error: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to depositAndBundle', async () => {
      await basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 });
    });
  });

  describe('Combined debundleAndWithdraw', () => {
    let basketABBalance, tokenABalance, tokenBBalance;

    before('get HOLDER_A\'s balances', async () => {
      try {
        const _tokenABalance = await tokenA.balanceOf(HOLDER_A);
        const _tokenBBalance = await tokenB.balanceOf(HOLDER_A);
        const _basketABBalance = await basketAB.balanceOfPromise(HOLDER_A);
        ([tokenABalance, tokenBBalance, basketABBalance] = [
          _tokenABalance, _tokenBBalance, _basketABBalance,
        ].map(x => Number(x)));
      } catch (err) { assert.throw(`before error: ${err.toString()}`); }
    });

    after(`HOLDER_A should have additional ${basketABBalance / 1e18} of tokens A and B, 0 of basketAB`, async () => {
      try {
        const _balTokenA = await tokenA.balanceOf(HOLDER_A);
        const _balTokenB = await tokenB.balanceOf(HOLDER_A);
        const _balBasketAB = await basketAB.balanceOf(HOLDER_A);
        assert.strictEqual(Number(_balTokenA), tokenABalance + basketABBalance, `tokenA balance is not ${basketABBalance / 1e18}`);
        assert.strictEqual(Number(_balTokenB), tokenBBalance + basketABBalance, `tokenB balance is not ${basketABBalance / 1e18}`);
        assert.strictEqual(Number(_balBasketAB), 0, 'basketAB balance is not 0');
      } catch (err) { assert.throw(`after error: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to debundleAndWithdraw', async () => {
      await basketAB.debundleAndWithdrawPromise(basketABBalance, { from: HOLDER_A, gas: 1e6 });
    });
  });

  describe('Extract to private TokenWallet contract', () => {
    let basketABBalance;
    let tokenWalletAddress;

    before('get HOLDER_A\'s balance', async () => {
      try {
        const _balBasketABBefore = await basketAB.balanceOfPromise(HOLDER_A);
        basketABBalance = Number(_balBasketABBefore);

        await tokenA.approve(basketABAddress, amount, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount, { from: HOLDER_A });
        await basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, gas: 1e6 });
        const _balBasketABAfter = await basketAB.balanceOfPromise(HOLDER_A);
        basketABBalance = Number(_balBasketABAfter);

        assert.isAbove(basketABBalance, 0, 'HOLDER_A does not own any BasketAB tokens');
      } catch (err) { assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to extract basketAB tokens', async () => {
      try {
        const data = await basketAB.extractPromise(basketABBalance, { from: HOLDER_A, gas: 1e7 });
        tokenWalletAddress = await basketFactory.tokenWallets.call(0);
      } catch (err) { assert.throw(`Error extracting: ${err.toString()}`); }
    });

    it('tokenWallet should contain the tokenBalance', async () => {
      try {
        // Get tokenWallet instance
        const newContract = web3.eth.contract(tokenWalletAbi);
        const tokenWallet = newContract.at(tokenWalletAddress);
        Promise.promisifyAll(tokenWallet, { suffix: 'Promise' });
        // console.log(`\n  - tokenWalletAddress = '${tokenWallet.address}'\n`);

        const _balTokenA = await tokenWallet.balanceOfTokenPromise(tokenA.address);
        const _balTokenB = await tokenWallet.balanceOfTokenPromise(tokenB.address);
        assert.strictEqual(Number(_balTokenA), basketABBalance, 'incorrect token balance in wallet');
        assert.strictEqual(Number(_balTokenB), basketABBalance, 'incorrect token balance in wallet');
      } catch (err) { assert.throw(`Error extracting: ${err.toString()}`); }
    });
  });
});
