const Promise = require('bluebird');
const Web3 = require('web3');
const { PORT } = require('../config');

const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${PORT}`));
if (!web3.eth.getAccountsPromise) Promise.promisifyAll(web3.eth, { suffix: 'Promise' });

module.exports = { web3 };
