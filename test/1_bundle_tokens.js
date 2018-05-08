const path = require('path');
const Promise = require('bluebird');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const { abi: basketAbi } = require('../build/contracts/Basket.json');
const { constructors } = require('../migrations/constructors.js');
const { web3 } = require('../utils/web3');
const {
  ARRANGER_FEE,
  PRODUCTION_FEE,
  FEE_DECIMALS,
  DECIMALS,
  INITIAL_SUPPLY,
  FAUCET_AMOUNT,
} = require('../config');


contract('TestToken | Basket', (accounts) => {
  // Accounts
  const [ADMINISTRATOR, ARRANGER, MARKETMAKER, HOLDER_A, HOLDER_B] = accounts.slice(0, 5);

  // Contract instances
  let basketFactory;
  let basketAB;
  let basketABAddress;

  // Token instances
  let tokenA, tokenB;
  const tokenParamsA = [HOLDER_A, 'Token A', 'TOKA', DECIMALS, INITIAL_SUPPLY, FAUCET_AMOUNT];
  const tokenParamsB = [HOLDER_A, 'Token B', 'TOKB', DECIMALS, INITIAL_SUPPLY, FAUCET_AMOUNT];

  before('Before: deploy tokens', async () => {
    console.log(`  ================= START TEST [ ${path.basename(__filename)} ] =================`);

    try {
      basketFactory = await BasketFactory.deployed();
      tokenA = await constructors.TestToken(...tokenParamsA);
      tokenB = await constructors.TestToken(...tokenParamsB);
    } catch (err) {
      assert.throw(`Failed to create Tokens: ${err.toString()}`);
    }
  });

  describe('tokens and balances should be correct', () => {
    it('get token balances', async () => {
      const supplyA = await tokenA.totalSupply();
      const supplyB = await tokenB.totalSupply();
      assert.strictEqual(Number(supplyA), INITIAL_SUPPLY, 'Incorrect token supply');
      assert.strictEqual(Number(supplyB), INITIAL_SUPPLY, 'Incorrect token supply');

      const balanceA = await tokenA.balanceOf(HOLDER_A);
      const balanceB = await tokenB.balanceOf(HOLDER_A);
      assert.strictEqual(Number(balanceA), INITIAL_SUPPLY, 'Incorrect owner balances');
      assert.strictEqual(Number(balanceB), INITIAL_SUPPLY, 'Incorrect owner balances');
    });
  });

  describe('deploy basket A:B @ 1:1', () => {
    let initialBalance;

    it('deploy the basket', async () => {
      try {
        const fee = await basketFactory.productionFee.call();
        initialBalance = await web3.eth.getBalancePromise(ARRANGER);
        const txObj = await basketFactory.createBasket(
          'A1B1', 'BASK', [tokenA.address, tokenB.address], [1e18, 1e18], ARRANGER, ARRANGER_FEE,
          { from: ARRANGER, value: Number(fee) },
        );

        const txLogs = txObj.logs;
        // Check logs to ensure contract was created
        const txLog = txLogs[0];
        assert.strictEqual(txLogs.length, 1, 'incorrect number of logs');
        assert.strictEqual(txLog.event, 'LogBasketCreated', 'incorrect event label');

        const { basketAddress, arranger: _arranger, fee: feeFromEvent } = txLog.args;
        basketABAddress = basketAddress;
        // Get basketAB instance
        const newContract = web3.eth.contract(basketAbi);
        basketAB = newContract.at(basketABAddress);
        Promise.promisifyAll(basketAB, { suffix: 'Promise' });
      } catch (err) { assert.throw(`Error deploying basketAB: ${err.toString()}`); }
    });

    it('calculates the production fee correctly', async () => {
      const balance = await web3.eth.getBalancePromise(ARRANGER);
      assert.isAbove((initialBalance - balance), PRODUCTION_FEE, 'incorrect production fee amount charged');
    });

    it('remembers the basketFactory', async () => {
      const _factoryAddress = await basketAB.basketFactoryAddress.call();
      assert.strictEqual(_factoryAddress, basketFactory.address, 'incorrect basket factory');
    });
  });

  const amount1 = 25e18;
  const amount2 = 25e17;

  describe(`HOLDER_A: create ${amount1 / 1e18} basketAB tokens`, () => {
    let initialBalance;
    let balTokenA, balTokenB, balBasketAB;

    before('HOLDER_A\'s amount of basketAB tokens should be zero', async () => {
      try {
        balTokenA = await tokenA.balanceOf(HOLDER_A);
        balTokenB = await tokenB.balanceOf(HOLDER_A);
        balBasketAB = await basketAB.balanceOf(HOLDER_A);
        assert.notEqual(Number(balTokenA), 0, 'tokenA balance is zero');
        assert.notEqual(Number(balTokenB), 0, 'tokenB balance is zero');
        assert.strictEqual(Number(balBasketAB), 0, 'basketAB token balance is not zero');
      } catch (err) { assert.throw(`before error: ${err.toString()}`); }
    });

    after(`HOLDER_A's amount of basketAB tokens should be ${amount1}`, async () => {
      try {
        const balA = await tokenA.balanceOf(HOLDER_A);
        const balB = await tokenB.balanceOf(HOLDER_A);
        const bal = await basketAB.balanceOfPromise(HOLDER_A);
        assert.strictEqual(Number(bal), amount1 + amount2, 'incorrect amount of basketAB tokens');
      } catch (err) { assert.throw(`balanceOf error: ${err.toString()}`); }
    });

    it('approve token contracts for basketAB', async () => {
      try {
        await tokenA.approve(basketABAddress, amount1 + amount2, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount1 + amount2, { from: HOLDER_A });
        const data = await Promise.all(['name', 'symbol', 'decimals'].map(field => basketAB[field].call()));
      } catch (err) { assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to deposit and bundle tokens', async () => {
      const fee = await basketAB.arrangerFee.call();
      initialBalance = await web3.eth.getBalancePromise(HOLDER_A);
      await basketAB.depositAndBundlePromise(amount1, { from: HOLDER_A, value: amount1 * (Number(fee) / (10 ** FEE_DECIMALS)), gas: 1e6 })
        .catch(err => assert.throw(`Error depositing and bundling ${err.toString()}`));
    });

    it('charges correct amount of arranger fee', async () => {
      let balance = await web3.eth.getBalancePromise(HOLDER_A);
      initialBalance = Number(initialBalance) / 1e18;
      balance = Number(balance) / 1e18;
      assert.strictEqual(
        Math.floor(100 * (initialBalance - balance)),
        Math.floor(100 * ((ARRANGER_FEE / 1e18) * (amount1 / 1e18))),
        'incorrect amount of arranger fee charged',
      );
    });

    it('should allow HOLDER_A to deposit and bundle part of a basket', async () => {
      const fee = await basketAB.arrangerFee.call();
      initialBalance = await web3.eth.getBalancePromise(HOLDER_A);
      await basketAB.depositAndBundlePromise(amount2, { from: HOLDER_A, value: amount2 * (Number(fee) / (10 ** FEE_DECIMALS)), gas: 1e6 })
        .catch(err => assert.throw(`Error depositing and bundling partial ${err.toString()}`));
    });
  });

  describe('Combined depositAndBundle', () => {
    let basketABBalance;

    before('get HOLDER_A\'s balance', async () => {
      try {
        const balBasketAB = await basketAB.balanceOfPromise(HOLDER_A);
        basketABBalance = Number(balBasketAB);
        await tokenA.approve(basketABAddress, amount1, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount1, { from: HOLDER_A });
      } catch (err) { assert.throw(`Error retrieving basketAB contract data: ${err.toString()}`); }
    });

    after(`HOLDER_A's balance should have increased by ${amount1} basketAB tokens`, async () => {
      try {
        const balBasketAB = await basketAB.balanceOfPromise(HOLDER_A);
        assert.strictEqual(Number(balBasketAB), basketABBalance + amount1, 'incorrect increase');
      } catch (err) { assert.throw(`after error: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to depositAndBundle', async () => {
      const fee = await basketAB.arrangerFee.call();
      await basketAB.depositAndBundlePromise(amount1, { from: HOLDER_A, value: amount1 * (Number(fee) / (10 ** FEE_DECIMALS)), gas: 1e6 });
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
        const debundleSum = amount1 + amount2;
        const _balTokenA = await tokenA.balanceOf(HOLDER_A);
        const _balTokenB = await tokenB.balanceOf(HOLDER_A);
        const _balBasketAB = await basketAB.balanceOf(HOLDER_A);
        assert.strictEqual(Number(_balTokenA), tokenABalance + debundleSum, `tokenA balance is not ${debundleSum / 1e18}`);
        assert.strictEqual(Number(_balTokenB), tokenBBalance + debundleSum, `tokenB balance is not ${debundleSum / 1e18}`);
        assert.strictEqual(Number(_balBasketAB), basketABBalance - debundleSum, 'basketAB balance did not decrease correctly');
      } catch (err) { assert.throw(`after error: ${err.toString()}`); }
    });

    it('should allow HOLDER_A to debundleAndWithdraw', async () => {
      await basketAB.debundleAndWithdrawPromise(amount1, { from: HOLDER_A, gas: 1e6 });
    });

    it('should allow HOLDER_A to debundleAndWithdraw part of a basket', async () => {
      await basketAB.debundleAndWithdrawPromise(amount2, { from: HOLDER_A, gas: 1e6 });
    });
  });

  describe('Allows factory admin to change key variables', () => {
    before('initialization', async () => {
      const admin = await basketFactory.admin.call();
      const productionFeeRecipient = await basketFactory.productionFeeRecipient.call();
      const productionFee = await basketFactory.productionFee.call();
      assert.strictEqual(admin, ADMINISTRATOR, 'wrong admin saved');
      assert.strictEqual(productionFeeRecipient, ADMINISTRATOR, 'wrong productionFeeRecipient saved');
      assert.strictEqual(Number(productionFee), PRODUCTION_FEE, 'wrong productionFee saved');
    });

    it('allows admin to change production fee recipient', async () => {
      await basketFactory.changeProductionFeeRecipient(HOLDER_B, { from: ADMINISTRATOR });
      const productionFeeRecipient = await basketFactory.productionFeeRecipient.call();
      assert.strictEqual(productionFeeRecipient, HOLDER_B, 'production fee recipient did not change accordingly');
    });

    it('allows admin to change production fee', async () => {
      const NEW_FEE = 0.002;
      await basketFactory.changeProductionFee(NEW_FEE * (10 ** FEE_DECIMALS), { from: ADMINISTRATOR });
      const productionFee = await basketFactory.productionFee.call();
      assert.strictEqual(Number(productionFee), Number(NEW_FEE) * (10 ** FEE_DECIMALS), 'production fee did not change accordingly');
    });
  });

  describe('Allows basket admin to change key variables', () => {
    before('initialization', async () => {
      const arranger = await basketAB.arranger.call();
      const arrangerFeeRecipient = await basketAB.arrangerFeeRecipient.call();
      const arrangerFee = await basketAB.arrangerFee.call();
      assert.strictEqual(arranger, ARRANGER, 'wrong arranger saved');
      assert.strictEqual(arrangerFeeRecipient, ARRANGER, 'wrong arrangerFeeRecipient saved');
      assert.strictEqual(Number(arrangerFee), ARRANGER_FEE, 'wrong arrangerFee saved');
    });

    it('allows arranger to change arranger fee recipient', async () => {
      await basketAB.changeArrangerFeeRecipient(HOLDER_B, { from: ARRANGER });
      const arrangerFeeRecipient = await basketAB.arrangerFeeRecipient.call();
      assert.strictEqual(arrangerFeeRecipient, HOLDER_B, 'arranger fee recipient did not change accordingly');
    });

    it('allows arranger to change arranger fee', async () => {
      const NEW_FEE = 0.007;
      await basketAB.changeArrangerFee(NEW_FEE * (10 ** FEE_DECIMALS), { from: ARRANGER });
      const arrangerFee = await basketAB.arrangerFee.call();
      assert.strictEqual(Number(arrangerFee), Number(NEW_FEE) * (10 ** FEE_DECIMALS), 'arranger fee did not change accordingly');
    });
  });
});
