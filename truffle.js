const {
  GAS_PRICE_DEV,
  GAS_LIMIT,
} = require('./config/params.js');

module.exports = {
  networks: {
    // development: {
    //   host: 'localhost',
    //   port: 7545,
    //   network_id: '*',       // Match any network id
    //   gas: 4712388,          // Set to Ropsten limit
    //   gasPrice: GAS_PRICE_DEV,  // 1 gwei
    // },
    // test: {
    //   // host: 'localhost',
    //   // port: 8545,
    //   network_id: '*',       // Match any network id
    //   gas: 7000000,
    //   gasPrice: 20000000000, // 20 GWei
    // },
    ropsten: {
      host: 'localhost',
      gas: 4700000, // Current Ropsten limit is approx 4712388
      gasPrice: 20e9, // 20 GWei
      network_id: '3',
    },
    parrotRp: {
      host: '10.1.10.171',
      port: 7545,
      gas: 4700000, // Current Ropsten limit is approx 47124331
      gasPrice: 20e9, // 20 GWei
      network_id: '3',
    },
    rinkeby: {
      host: 'localhost',
      gas: 7500000, // Current approximate limit
      gasPrice: 20e9, // 20 GWei
      network_id: '4',
    },
    kovan: {
      host: 'localhost',
      gas: 6900000, // Current approximate limit
      gasPrice: 20e9, // 20 GWei
      network_id: '42',
    },
    mainnet: {
      host: 'localhost',
      gas: 8e6,
      gasPrice: 5e9, // 5 GWei
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
