const BasketFactory = artifacts.require('./BasketFactory.sol');
const BasketRegistry = artifacts.require('./BasketRegistry.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer

  // Contract instances
  let basketRegistry, basketFactory, tokenWalletFactory;

  // 1. Deploy BasketRegistry contract
  deployer.deploy(BasketRegistry, { from: ADMINISTRATOR })
    .then(() => BasketRegistry.deployed())
    .then(_instance => basketRegistry = _instance)

    // 2. Deploy BasketFactory contract with basketRegistry address
    .then(() => deployer.deploy(BasketFactory, basketRegistry.address, { from: ADMINISTRATOR }))
    .then(() => BasketFactory.deployed())
    .then(_instance => basketFactory = _instance)

    // 3. Set basketFactory address to basketRegistry
    .then(() => basketRegistry.setBasketFactory(basketFactory.address, { from: ADMINISTRATOR }))

    // 4. Deploy TokenWalletFactory contract with basketFactory address
    .then(() => deployer.deploy(TokenWalletFactory, basketFactory.address, { from: ADMINISTRATOR }))
    .then(() => TokenWalletFactory.deployed())
    .then(_instance => tokenWalletFactory = _instance)

    // 5. Set tokenWalletFactory address to basketFactory
    .then(() => basketFactory.setTokenWalletFactory(tokenWalletFactory.address, { from: ADMINISTRATOR }))

    // @dev Logs
    .then(() => console.log('  Contract addresses:'))
    .then(() => console.log(`  - BasketFactory        : ${basketFactory.address}\n`))
    .then(() => console.log(`  - TokenWalletFactory   : ${tokenWalletFactory.address}\n`));
};
