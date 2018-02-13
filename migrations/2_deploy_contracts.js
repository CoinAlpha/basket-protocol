const BasketFactory6 = artifacts.require('BasketFactory6');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer
  const ARRANGER = accounts[1];
  const MARKETMAKER = accounts[2];
  const HOLDER_A = accounts[3];
  const HOLDER_B = accounts[4];

  deployer.deploy(
    BasketFactory6,
    { from: ADMINISTRATOR },
  );
};
