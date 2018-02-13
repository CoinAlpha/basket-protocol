const BasketFactory = artifacts.require('BasketFactory');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer

  deployer.deploy(
    BasketFactory,
    { from: ADMINISTRATOR },
  );
};
