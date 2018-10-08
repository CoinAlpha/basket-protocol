const { DEPLOYER_ADDRESS } = require('./config');

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
      gasPrice: 20e9,           // 20 GWei
      network_id: '1',
    },
    parrotMn: {
      host: '<ETHEREUM_NOD_IP>',
      port: 8545,
      // gas: 7984452,            // Current Ropsten limit is approx 4712388
      gasPrice: 2e9,           // 30 GWei
      network_id: '1',
      from: DEPLOYER_ADDRESS,
    },
    parrotRp: {
      host: '<ETHEREUM_NOD_IP>',
      port: 7545,
      gas: 4712388,             // Current Ropsten limit is approx 4712388
      gasPrice: 20e9,           // 30 GWei
      network_id: '3',
      from: DEPLOYER_ADDRESS,
    },
  },
};
