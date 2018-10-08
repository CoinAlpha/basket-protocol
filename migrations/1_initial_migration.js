const Migrations = artifacts.require('Migrations');
const { DEPLOYER_ADDRESS } = require('../config');

module.exports = (deployer, network, accounts) => {
  const DEPLOY_ACCOUNT = DEPLOYER_ADDRESS || accounts[0]; // Protocol administrator, BasketFactory deployer
  deployer.deploy(Migrations, { from: DEPLOY_ACCOUNT });
};
