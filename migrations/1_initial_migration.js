const Migrations = artifacts.require('Migrations');

module.exports = (deployer, network) => {
  deployer.deploy(Migrations);
};
