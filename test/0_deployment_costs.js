const path = require('path');
const Promise = require('bluebird');
const numeral = require('numeral');
const { constructors } = require('../migrations/constructors');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const Basket = artifacts.require('./Basket.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');
const TokenWallet = artifacts.require('./TokenWallet.sol');
const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

/* global vars */
let creatorBalanceStart, creatorBalance;
let basketFactory, basket, tokenWalletFactory, tokenWallet;  // Contract Instances
let gasPriceGwei;

contract('Deployment costs', (accounts) => {
  const CREATOR = accounts[0];
  const TOKEN_A = accounts[1];
  const TOKEN_B = accounts[2];
  const USER = accounts[3];
  const REGISTRY = accounts[4];
  const ESCROW = accounts[5];
  const TRANSACTION_FEE = 0.01;
  const PRODUCTION_FEE = 0.01;
  const ARRANGER_FEE = 0.01;

  before('before: should get starting creator balance', async () => {
    console.log(`================= START TEST [ ${scriptName} ] =================`);

    const _bal = await web3.eth.getBalancePromise(CREATOR);
    creatorBalanceStart = web3.fromWei(_bal, 'ether');
    const _gasPrice = await web3.eth.getGasPricePromise();
    gasPriceGwei = Number(_gasPrice) / 1e9;
    console.log(`      Gas Price:          ${Number(_gasPrice / 1e9)} gwei\n`);
  });

  beforeEach('before: should get creator balance', async () => {
    const _bal = await web3.eth.getBalancePromise(CREATOR);
    creatorBalance = web3.fromWei(_bal, 'ether');
    console.log(`\n      creator balance before: ${creatorBalance}`);
  });

  afterEach('after: should get creator balance', async () => {
    const _bal = await web3.eth.getBalancePromise(CREATOR);
    const newBalance = web3.fromWei(_bal, 'ether');
    const ethCost = creatorBalance - newBalance;
    const gasUsed = (ethCost / gasPriceGwei) * 1e9;
    const marker = (gasUsed > 4700000) ? '**** HIGH GAS ****' : '';
    console.log(`      New balance:        ${newBalance}`);
    console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')} ${marker}`);
    console.log(`      ETH Cost:           ${ethCost}`);
    creatorBalance = newBalance;
  });

  after('after: get closing creator balance', async () => {
    const _bal = await web3.eth.getBalancePromise(CREATOR);
    const newBalance = web3.fromWei(_bal, 'ether');
    const ethCost = creatorBalanceStart - newBalance;
    const gasUsed = (ethCost / gasPriceGwei) * 1e9;

    console.log(`      Ending balance:     ${newBalance}`);
    console.log('\n      =========================================');
    console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')}`);
    console.log(`      TOTAL ETH COST:     ${ethCost}`);
  });

  describe('Calculate cost', () => {
    it('BasketRegistry cost', async () => {
      basketFactory = await constructors.BasketRegistry(CREATOR);
    });

    it('BasketEscrow cost', async () => {
      basketFactory = await constructors.BasketEscrow(CREATOR, REGISTRY, CREATOR, TRANSACTION_FEE);
    });

    it('BasketFactory cost', async () => {
      basketFactory = await constructors.BasketFactory(CREATOR, REGISTRY, CREATOR, PRODUCTION_FEE);
    });

    it('Basket cost', async () => {
      basket = await constructors.Basket(
        CREATOR,
        'Basket contract', 'BASK', [TOKEN_A, TOKEN_B], [1, 2], REGISTRY, CREATOR, CREATOR, ARRANGER_FEE,
      );
    });

    it('TokenWallet cost', async () => {
      tokenWallet = await constructors.TokenWallet(CREATOR, USER);
    });

    it('TokenWalletFactory cost', async () => {
      tokenWalletFactory = await constructors.TokenWalletFactory(CREATOR, basketFactory.address);
    });

    it('BasketFactory: set TokenWalletFactory', async () => {
      await basketFactory.setTokenWalletFactory(basketFactory.address, { from: CREATOR })
        .catch(err => assert.throw(`Error setting TokenWalletFactory: ${err.toString()}`));
    });
  });
});
