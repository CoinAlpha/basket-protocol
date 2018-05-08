const {
  GAS_PRICE_DEV,
  GAS_LIMIT,
} = require('./config/params.js');

module.exports = {
  networks: {
    ropsten: {
      host: 'localhost',
      gas: 4700000,             // Current Ropsten limit is approx 4712388
      gasPrice: 20e9,           // 20 GWei
      network_id: '3',
    },
    rinkeby: {
      host: 'localhost',
      gas: 7500000,             // Current approximate limit
      gasPrice: 20e9,           // 20 GWei
      network_id: '4',
    },
    kovan: {
      host: 'localhost',
      gas: 6900000,             // Current approximate limit
      gasPrice: 20e9,           // 20 GWei
      network_id: '42',
    },
    mainnet: {
      host: 'localhost',
      gas: 8e6,
      gasPrice: 5e9,            // 5 GWei
      network_id: '1',
    },
    coverage: {
      host: 'localhost',
      port: 8555,
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE_DEV,
      network_id: '*',
    },
  },
};
