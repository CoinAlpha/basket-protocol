const path = require('path');
const Promise = require('bluebird');

const BasketRegistry = artifacts.require('./BasketRegistry.sol');
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

const doesRevert = err => err.message.includes('revert');

contract('Basket Factory | Basket Registry', (accounts) => {
  // Accounts
  const [ADMINISTRATOR, ARRANGER, MARKETMAKER, HOLDER_A, HOLDER_B, INVALID_ADDRESS] = accounts.slice(0, 6);

  // Contract instances
  let basketRegistry;
  let basketFactory;
  let basketAB;
  let basketABAddress;

  // Token instances
  let tokenA, tokenB;
  const tokenParamsA = [HOLDER_A, 'Token A', 'TOKA', DECIMALS, INITIAL_SUPPLY, FAUCET_AMOUNT];
  const tokenParamsB = [HOLDER_A, 'Token B', 'TOKB', DECIMALS, INITIAL_SUPPLY, FAUCET_AMOUNT];

  before('Before: deploy contracts', async () => {
    console.log(`  ================= START TEST [ ${path.basename(__filename)} ] =================`);

    try {
      basketRegistry = await BasketRegistry.deployed();
      basketFactory = await BasketFactory.deployed();
      tokenA = await constructors.TestToken(...tokenParamsA);
      tokenB = await constructors.TestToken(...tokenParamsB);
    } catch (err) { assert.throw(`Failed to deploy contracts: ${err.toString()}`); }
  });

  describe('initialization', () => {
    it('initializes basketFactory and basketRegistry correctly', async () => {
      try {
        // check addresses in both contracts have been set correctly
        const _basketFactoryExists = await basketRegistry.basketFactoryMap.call(basketFactory.address);
        const _basketRegistryAddress = await basketFactory.basketRegistryAddress.call();
        assert.strictEqual(_basketFactoryExists, true, 'basket factory address not whitelisted');
        assert.strictEqual(_basketRegistryAddress, basketRegistry.address, 'basket registry address not set correctly');

        // check indices initialization in basketRegistry
        const _basketIndex = await basketRegistry.basketIndex.call();
        const _arrangerIndex = await basketRegistry.arrangerIndex.call();
        const basketIndex = Number(_basketIndex);
        const arrangerIndex = Number(_arrangerIndex);
        assert.strictEqual(basketIndex, 1, 'basketIndex not initialized to one');
        assert.strictEqual(arrangerIndex, 1, 'arrangerIndex not initialized to one');
      } catch (err) { assert.throw(`Failed to initialize basket factory and registry: ${err.toString()}`); }
    });
  });

  describe('whitelists the basket factory correctly', () => {
    it('lets admin set basket factory correctly', async () => {
      try {
        // check addresses in both contracts have been set correctly
        const result = await basketRegistry.whitelistBasketFactory(INVALID_ADDRESS, { from: ADMINISTRATOR });
        const _basketFactoryExists = await basketRegistry.basketFactoryMap.call(INVALID_ADDRESS);
        assert.strictEqual(_basketFactoryExists, true, 'basket factory address not whitelisted');
      } catch (err) { assert.throw(`Failed to set basket factory in registry: ${err.toString()}`); }
    });

    it('disallows anyone else to set basket factory', async () => {
      try {
        // check addresses in both contracts have been set correctly
        await basketRegistry.whitelistBasketFactory(INVALID_ADDRESS, { from: INVALID_ADDRESS });
      } catch (err) { assert.equal(doesRevert(err), true, 'did not revert as expected'); }
    });
  });

  describe('deploy test basket', () => {
    let basketIndex;

    it('deploys the basket', async () => {
      try {
        const txObj = await basketFactory.createBasket(
          'A1B1', 'BASK', [tokenA.address, tokenB.address], [1e18, 1e18], ARRANGER, ARRANGER_FEE,
          { from: ARRANGER, value: PRODUCTION_FEE },
        );
        const txLogs = txObj.logs;
        // Check logs to ensure contract was created
        assert.strictEqual(txLogs.length, 1, 'incorrect number of logs');
        const txLog = txLogs[0];
        assert.strictEqual(txLog.event, 'LogBasketCreated', 'incorrect event label');
        const { basketIndex: _basketIndex, basketAddress, arranger: _arranger } = txLog.args;
        basketIndex = _basketIndex;
        basketABAddress = basketAddress;
        assert.strictEqual(Number(_basketIndex), 1, 'incorrect basketIndex');
        assert.strictEqual(_arranger, ARRANGER, 'incorrect arranger address');
      } catch (err) { assert.throw(`Error deploying basketAB: ${err.toString()}`); }
    });

    it('updates basket registry upon basket creation', async () => {
      try {
        // Check basketIndex has incremented
        const index = await basketRegistry.basketIndex.call();
        assert.isAbove(Number(index), basketIndex, 'basketIndex was not incremented');

        // Check basket has been registered
        const firstBasket = await basketRegistry.basketList.call(0);
        assert.strictEqual(firstBasket, basketABAddress, 'new basket does not equal basket created');

        // Save basketAB instance
        basketAB = web3.eth.contract(basketAbi).at(basketABAddress);
        Promise.promisifyAll(basketAB, { suffix: 'Promise' });
      } catch (err) { assert.throw(`Error updating basket registry: ${err.toString()}`); }
    });
  });

  describe('fails to register basket from anywhere but the factory', () => {
    it('deploys the basket', async () => {
      try {
        await basketRegistry.registerBasket(
          INVALID_ADDRESS, ARRANGER, 'A1B1', 'BASK', [tokenA.address, tokenB.address], [1e18, 1e18],
          { from: ARRANGER },
        );
      } catch (err) { assert.equal(doesRevert(err), true, 'did not revert as expected'); }
    });
  });

  describe('Basket registry\'s constant functions', () => {
    it('can check if a basket belongs in the registry', async () => {
      try {
        const _basketExists = await basketRegistry.checkBasketExists(basketABAddress);
        const _nullBasketExists = await basketRegistry.checkBasketExists(ARRANGER);
        assert.strictEqual(_basketExists, true, 'basket does not exist in registry');
        assert.strictEqual(_nullBasketExists, false, 'null basket exists in registry');
      } catch (err) { assert.throw(`Error in checkBasketExists: ${err.toString()}`); }
    });

    it('can get details about a basket using its address', async () => {
      try {
        const _basketStruct = await basketRegistry.getBasketDetails(basketABAddress);
        assert.strictEqual(_basketStruct.length, 8, 'basket does not have 8 arguments');
        const [
          _basketAddress, _arranger, _name, _symbol, _tokens, _weights, _totalMinted, _totalBurned,
        ] = _basketStruct;
        assert.strictEqual(_basketAddress, basketABAddress, 'incorrect name from basketStruct');
        assert.strictEqual(_arranger, ARRANGER, 'incorrect arranger from basketStruct');
        assert.strictEqual(_name, 'A1B1', 'incorrect name from basketStruct');
        assert.strictEqual(_symbol, 'BASK', 'incorrect symbol from basketStruct');
        assert.strictEqual(Number(_totalMinted), 0, 'incorrect totalMinted initialized');
        assert.strictEqual(Number(_totalBurned), 0, 'incorrect totalBurned initialized');
      } catch (err) { assert.throw(`Error in getBasketDetails: ${err.toString()}`); }
    });
  });

  describe('Mint basket tokens', () => {
    const amount = 25e18;

    before('Before minting', async () => {
      try {
        await tokenA.approve(basketABAddress, amount, { from: HOLDER_A });
        await tokenB.approve(basketABAddress, amount, { from: HOLDER_A });
        await basketAB.depositAndBundlePromise(amount, { from: HOLDER_A, value: amount * (ARRANGER_FEE / 1e18), gas: 1e6 });
      } catch (err) { assert.throw(`Error in minting basket tokens: ${err.toString()}`); }
    });

    it('Auto increments totalMinted in basket registry', async () => {
      try {
        const _basketStruct = await basketRegistry.getBasketDetails(basketABAddress);
        const [_totalMinted] = _basketStruct.slice(6, 7);
        assert.strictEqual(Number(_totalMinted), amount, 'incorrect totalMinted amount');
      } catch (err) { assert.throw(`Error in incrementing totalMinted: ${err.toString()}`); }
    });
  });

  describe('Burn basket tokens', () => {
    const amount = 13e18;

    before('Before burning', async () => {
      try {
        await basketAB.debundleAndWithdrawPromise(amount, { from: HOLDER_A, gas: 1e6 });
      } catch (err) { assert.throw(`Error in burning basket tokens: ${err.toString()}`); }
    });

    it('Auto increments totalBurned in basket registry', async () => {
      try {
        const _basketStruct = await basketRegistry.getBasketDetails(basketABAddress);
        const [_totalBurned] = _basketStruct.slice(7, 8);
        assert.strictEqual(Number(_totalBurned), amount, 'incorrect totalBurned amount');
      } catch (err) { assert.throw(`Error in incrementing totalBurned: ${err.toString()}`); }
    });
  });

  describe('disallows anyone to increment basket mint / burn count', () => {
    it('disallows increment total minted', async () => {
      try {
        await basketRegistry.incrementBasketsMinted(1e18, INVALID_ADDRESS, { from: INVALID_ADDRESS });
      } catch (err) { assert.equal(doesRevert(err), true, 'did not revert as expected'); }
    });

    it('disallows increment total burned', async () => {
      try {
        await basketRegistry.incrementBasketsBurned(1e18, INVALID_ADDRESS, { from: INVALID_ADDRESS });
      } catch (err) { assert.equal(doesRevert(err), true, 'did not revert as expected'); }
    });
  });

  describe('Fallback', () => {
    let initialRegistryBalance;

    before('Read initial balance', async () => {
      try {
        const _initialRegistryBalance = await web3.eth.getBalancePromise(basketRegistry.address);
        initialRegistryBalance = Number(_initialRegistryBalance);
      } catch (err) { assert.throw(`Error reading balances: ${err.toString()}`); }
    });

    it('Rejects any ether sent to contract', async () => {
      try {
        web3.eth.sendTransactionPromise({ from: HOLDER_B, to: basketRegistry.address, value: 1e18, data: 1e18 })
          .catch(() => {});

        const _currentRegistryBalance = await web3.eth.getBalancePromise(basketRegistry.address);

        assert.strictEqual(initialRegistryBalance, Number(_currentRegistryBalance), 'basket registry balance increased');
      } catch (err) { assert.equal(doesRevert(err), true, 'did not revert as expected'); }
    });
  });
});
