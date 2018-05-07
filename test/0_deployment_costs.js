const path = require('path');
const Promise = require('bluebird');
const numeral = require('numeral');
const { constructors } = require('../migrations/constructors');
const { GAS_PRICE_DEV } = require('../config/params.js');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const Basket = artifacts.require('./Basket.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');
const TokenWallet = artifacts.require('./TokenWallet.sol');
const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

/* global vars */
let adminBalanceStart, adminBalance;
let basketFactory, basket, tokenWalletFactory, tokenWallet;  // Contract Instances
const gasPriceGwei = GAS_PRICE_DEV;

contract('Deployment costs', (accounts) => {
  const ADMIN = accounts[0];
  const TOKEN_A = accounts[1];
  const TOKEN_B = accounts[2];
  const USER = accounts[3];
  const REGISTRY = accounts[4];
  const ESCROW = accounts[5];
  const TRANSACTION_FEE = 0.01;
  const PRODUCTION_FEE = 0.01;
  const ARRANGER_FEE = 0.01;

  before('before: should get starting admin balance', async () => {
    console.log(`================= START TEST [ ${scriptName} ] =================`);

    const _bal = await web3.eth.getBalancePromise(ADMIN);
    adminBalanceStart = web3.fromWei(_bal, 'ether');
  });

  beforeEach('before: should get admin balance', async () => {
    const _bal = await web3.eth.getBalancePromise(ADMIN);
    adminBalance = web3.fromWei(_bal, 'ether');
    console.log(`\n      admin balance before: ${adminBalance}`);
  });

  afterEach('after: should get admin balance', async () => {
    const _bal = await web3.eth.getBalancePromise(ADMIN);
    const newBalance = web3.fromWei(_bal, 'ether');
    const ethCost = adminBalance - newBalance;
    const gasUsed = (ethCost / gasPriceGwei) * 1e18;
    const marker = (gasUsed > 4700000) ? '**** HIGH GAS ****' : '';
    console.log(`      New balance:        ${newBalance}`);
    console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')} ${marker}`);
    console.log(`      ETH Cost:           ${ethCost}`);
    adminBalance = newBalance;
  });

  after('after: get closing admin balance', async () => {
    const _bal = await web3.eth.getBalancePromise(ADMIN);
    const newBalance = web3.fromWei(_bal, 'ether');
    const ethCost = adminBalanceStart - newBalance;
    const gasUsed = (ethCost / gasPriceGwei) * 1e18;

    console.log(`      Ending balance:     ${newBalance}`);
    console.log('\n      =========================================');
    console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')}`);
    console.log(`      TOTAL ETH COST:     ${ethCost}`);
  });

  describe('Calculate cost', () => {
    it('BasketRegistry cost', async () => {
      basketFactory = await constructors.BasketRegistry(ADMIN);
    });

    it('BasketEscrow cost', async () => {
      basketFactory = await constructors.BasketEscrow(ADMIN, REGISTRY, ADMIN, TRANSACTION_FEE);
    });

    it('BasketFactory cost', async () => {
      basketFactory = await constructors.BasketFactory(ADMIN, REGISTRY, ADMIN, PRODUCTION_FEE);
    });

    it('Basket cost', async () => {
      basket = await constructors.Basket(
        ADMIN,
        'Basket contract', 'BASK', [TOKEN_A, TOKEN_B], [1, 2], REGISTRY, ADMIN, ADMIN, ARRANGER_FEE,
      );
    });

    it('TokenWallet cost', async () => {
      tokenWallet = await constructors.TokenWallet(ADMIN, USER);
    });

    it('TokenWalletFactory cost', async () => {
      tokenWalletFactory = await constructors.TokenWalletFactory(ADMIN, basketFactory.address);
    });

    it('BasketFactory: set TokenWalletFactory', async () => {
      await basketFactory.setTokenWalletFactory(basketFactory.address, { from: ADMIN, gasPrice: GAS_PRICE_DEV })
        .catch(err => assert.throw(`Error setting TokenWalletFactory: ${err.toString()}`));
    });
  });
});
