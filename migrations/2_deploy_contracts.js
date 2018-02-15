const BasketFactory = artifacts.require('./BasketFactory.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer

  // Contract instances
  let basketFactory;
  let tokenWalletFactory;

  deployer.deploy(
    BasketFactory,
    { from: ADMINISTRATOR },
  )
    .then(() => BasketFactory.deployed())
    .then(_instance => basketFactory = _instance)
    .then(() => deployer.deploy(
      TokenWalletFactory,
      basketFactory.address,
      { from: ADMINISTRATOR },
    ))
    .then(() => TokenWalletFactory.deployed())
    .then(_instance => tokenWalletFactory = _instance)

    .then(() => basketFactory.setTokenWalletFactory(tokenWalletFactory.address, { from: ADMINISTRATOR }))

    .then(() => console.log('  Contract addresses:'))
    .then(() => console.log(`  - BasketFactory        : ${basketFactory.address}\n`))
    .then(() => console.log(`  - TokenWalletFactory   : ${tokenWalletFactory.address}\n`));
};
