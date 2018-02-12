require('dotenv').config();

const WalletProvider = require('truffle-wallet-provider');
const Wallet = require('ethereumjs-wallet');

const ropstenPrivateKey = new Buffer(process.env.ROPSTEN_PRIVATE_KEY, 'hex');
const ropstenWallet = Wallet.fromPrivateKey(ropstenPrivateKey);
const ropstenProvider = new WalletProvider(ropstenWallet, process.env.ROPSTEN_URL);

const kovanPrivateKey = new Buffer(process.env.KOVAN_PRIVATE_KEY, 'hex');
const kovanWallet = Wallet.fromPrivateKey(kovanPrivateKey);
const kovanProvider = new WalletProvider(kovanWallet, process.env.KOVAN_URL);

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: "*",       // Match any network id
      gas: 4700000,          // Set to Ropsten limit
      gasPrice: 20e9,        // 20 GWei
    },
    test: {
      host: 'localhost',
      port: 8545,
      network_id: "*",       // Match any network id
      gas: 7000000,
      gasPrice: 20000000000, // 20 GWei
    },
    ropsten: {
      provider: ropstenProvider,
      gas: 4700000,          // Current Ropsten limit is approx 47124331
      gasPrice: 20e9,        // 20 GWei
      network_id: "3",
    },
    rinkeby: {
      host: "localhost",
      gas: 7500000,          // Current approximate limit
      gasPrice: 20e9,        // 20 GWei
      network_id: "4",
    },
    kovan: {
      provider: kovanProvider,
      gas: 6900000,          // Current approximate limit
      gasPrice: 20e9,        // 20 GWei
      network_id: '42',
    },
    mainnet: {
      provider: mainNetProvider,
      gas: 8e6,
      gasPrice: 5e9,         // 5 GWei
      network_id: "1",
    },
  },
};
