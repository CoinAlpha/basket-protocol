require('dotenv').config();

const Web3 = require('web3');
const WalletProvider = require('truffle-wallet-provider');
const Wallet = require('ethereumjs-wallet');

const web3 = new Web3();
const ropstenPrivateKey = new Buffer(process.env.ROPSTEN_PRIVATE_KEY, 'hex');
const ropstenWallet = Wallet.fromPrivateKey(ropstenPrivateKey);
const ropstenProvider = new WalletProvider(ropstenWallet, 'https://ropsten.infura.io/');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',       // Match any network id
      gas: 4712388,          // Set to Ropsten limit
      gasPrice: 1000000000,  // 1 gwei
    },
    test: {
      host: 'localhost',
      port: 8545,
      network_id: '*',       // Match any network id
      gas: 7000000,
      gasPrice: 20000000000, // 20 GWei
    },
    ropsten: {
      provider: ropstenProvider,
      gas: 4710000,
      gasPrice: 20000000000,
      network_id: '3',
    },
    rinkeby: {
      host: 'localhost',
      gas: 7500000,          // Current approximate limit
      gasPrice: 20e9,        // 20 GWei
      network_id: '4',
    },
    kovan: {
      host: 'localhost',
      gas: 6900000,          // Current approximate limit
      gasPrice: 20e9,        // 20 GWei
      network_id: '42',
    },
    mainnet: {
      host: 'localhost',
      gas: 8e6,
      gasPrice: 5e9,         // 5 GWei
      network_id: '1',
    },
    parrotRp: {
      host: '10.1.10.171',
      port: 7545,
      gas: 4700000,          // Current Ropsten limit is approx 47124331
      gasPrice: 20e9,        // 20 GWei
      network_id: '3',
    },
  },
};
