const Promise = require('bluebird');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3();

if (!web3.eth.getAccountsPromise) Promise.promisifyAll(web3.eth, { suffix: 'Promise' });

module.exports = { web3 };
