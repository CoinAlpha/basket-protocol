const path = require('path');
const Promise = require('bluebird');
const numeral = require('numeral');
const { constructors } = require('../migrations/constructors');
const { web3 } = require('../utils/web3');
const {
  GAS_PRICE_DEV,
  TRANSACTION_FEE,
  PRODUCTION_FEE,
  ARRANGER_FEE,
} = require('../config');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const Basket = artifacts.require('./Basket.sol');

// Contract Instances
let basketFactory;
let basket;

// Global variables
let adminBalanceStart;
let adminBalance;


contract('Deployment costs', (accounts) => {
  const [ADMIN, TOKEN_A, TOKEN_B, USER, REGISTRY, ESCROW] = accounts.slice(6);

  before('before: should get starting admin balance', async () => {
    console.log(`  ================= START TEST [ ${path.basename(__filename)} ] =================`);

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
    const gasUsed = (ethCost / GAS_PRICE_DEV) * 1e18;
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
    const gasUsed = (ethCost / GAS_PRICE_DEV) * 1e18;

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
  });
});
