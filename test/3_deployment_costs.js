const path = require('path');
const Promise = require('bluebird');
const numeral = require('numeral');

const { constructors } = require('../migrations/constructors');

const BasketFactory = artifacts.require('./BasketFactory.sol');
const Basket = artifacts.require('./Basket.sol');
const TokenWallet = artifacts.require('./TokenWallet.sol');

const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

let creatorBalanceStart;
let creatorBalance;

// Contract Instances
let basketFactory;
let basket;
let tokenWallet;
let gasPriceGwei;

contract('Deployment costs', (accounts) => {
  const CREATOR = accounts[0];
  const TOKEN_A = accounts[1];
  const TOKEN_B = accounts[2];
  const USER = accounts[3];

  before('before: should get starting creator balance', () => web3.eth.getBalancePromise(CREATOR)
    .then(_bal => creatorBalanceStart = web3.fromWei(_bal, 'ether'))
    .then(() => web3.eth.getGasPricePromise())
    .then((_gasPrice) => {
      gasPriceGwei = Number(_gasPrice) / 1e9;
      console.log(`      Gas Price:          ${Number(_gasPrice / 1e9)} gwei\n`);
    }));

  beforeEach('before: should get creator balance', () => web3.eth.getBalancePromise(CREATOR)
    .then(_bal => creatorBalance = web3.fromWei(_bal, 'ether'))
    .then(() => console.log(`\n      creator balance before: ${creatorBalance}`)));

  afterEach('after: should get creator balance', () => web3.eth.getBalancePromise(CREATOR)
    .then((_bal) => {
      const newBalance = web3.fromWei(_bal, 'ether');
      const ethCost = creatorBalance - newBalance;
      const gasUsed = (ethCost / gasPriceGwei) * 1e9;
      const marker = (gasUsed > 4700000) ? '**** HIGH GAS ****' : '';
      console.log(`      New balance:        ${newBalance}`);
      console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')} ${marker}`);
      console.log(`      ETH Cost:           ${ethCost}`);
      creatorBalance = newBalance;
    }));

  after('after: get closing creator balance', () => web3.eth.getBalancePromise(CREATOR)
    .then((_bal) => {
      const newBalance = web3.fromWei(_bal, 'ether');
      const ethCost = creatorBalanceStart - newBalance;
      const gasUsed = (ethCost / gasPriceGwei) * 1e9;

      console.log(`      Ending balance:     ${newBalance}`);
      console.log('\n      =========================================');
      console.log(`      Gas Used:           ${numeral(gasUsed).format('0,0')}`);
      console.log(`      TOTAL ETH COST:     ${ethCost}`);
    }));

  describe('Calculate cost', () => {
    it('BasketFactory cost', () => constructors.BasketFactory(CREATOR)
      .then(_instance => basketFactory = _instance));

    it('Basket cost', () => constructors.Basket(CREATOR, 'Basket contract', 'BASK', [TOKEN_A, TOKEN_B], [1, 2])
      .then(_instance => basket = _instance));

    it('TokenWallet cost', () => constructors.TokenWallet(CREATOR, USER)
      .then(_instance => tokenWallet = _instance));
  });
});
