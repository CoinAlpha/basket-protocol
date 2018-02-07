require('dotenv').config();

const WalletProvider = require("truffle-wallet-provider");
const Wallet = require('ethereumjs-wallet');

const ropstenPrivateKey = new Buffer(process.env.ROPSTEN_PRIVATE_KEY, "hex")
const ropstenWallet = Wallet.fromPrivateKey(ropstenPrivateKey);
const ropstenProvider = new WalletProvider(ropstenWallet, process.env.ROPSTEN_URL);

const kovanPrivateKey = new Buffer(process.env.KOVAN_PRIVATE_KEY, "hex")
const kovanWallet = Wallet.fromPrivateKey(kovanPrivateKey);
const kovanProvider = new WalletProvider(kovanWallet, process.env.KOVAN_URL);

const mainNetPrivateKey = new Buffer(process.env.MAINNET_PRIVATE_KEY, "hex")
const mainNetWallet = Wallet.fromPrivateKey(mainNetPrivateKey);
const mainNetProvider = new WalletProvider(mainNetWallet, process.env.MAINNET_URL);

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 7000000,
    },
    test: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 7000000,
    },
    ropsten: {
      provider: ropstenProvider,
      gas: 7000000,
      gasPrice: 20000000000, // 20 GWei
      network_id: "3",
    },
    kovan: {
      provider: kovanProvider,
      gas: 7000000,
      gasPrice: 20000000000, // 20 GWei
      network_id: '42',
    },
    mainnet: {
      provider: mainNetProvider,
      gas: 7000000,
      gasPrice: 20000000000, // 20 GWei
      network_id: "1",
    },
  },
};
