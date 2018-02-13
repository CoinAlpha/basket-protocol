const BasketFactory6 = artifacts.require('BasketFactory6');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer

  deployer.deploy(
    BasketFactory6,
    { from: ADMINISTRATOR },
  );
};
