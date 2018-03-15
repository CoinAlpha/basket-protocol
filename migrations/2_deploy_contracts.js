const BasketFactory = artifacts.require('./BasketFactory.sol');
const BasketRegistry = artifacts.require('./BasketRegistry.sol');
const BasketEscrow = artifacts.require('./BasketEscrow.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer

  // Contract instances
  let basketRegistry, basketEscrow, basketFactory, tokenWalletFactory;

  // 1. Deploy BasketRegistry contract
  deployer.deploy(BasketRegistry, { from: ADMINISTRATOR })
    .then(() => BasketRegistry.deployed())
    .then(_instance => basketRegistry = _instance)

    // 2. Deploy BasketEscrow contract with basketRegistry address
    .then(() => deployer.deploy(BasketEscrow, basketRegistry.address, { from: ADMINISTRATOR }))
    .then(() => BasketEscrow.deployed())
    .then(_instance => basketEscrow = _instance)

    // 3. Deploy BasketFactory contract with basketRegistry address and basketEscrow address
    .then(() => deployer.deploy(BasketFactory, basketRegistry.address, basketEscrow.address, { from: ADMINISTRATOR }))
    .then(() => BasketFactory.deployed())
    .then(_instance => basketFactory = _instance)

    // 4. Set basketFactory address to basketRegistry
    .then(() => basketRegistry.setBasketFactory(basketFactory.address, { from: ADMINISTRATOR }))

    // 5. Deploy TokenWalletFactory contract with basketFactory address
    .then(() => deployer.deploy(TokenWalletFactory, basketFactory.address, { from: ADMINISTRATOR }))
    .then(() => TokenWalletFactory.deployed())
    .then(_instance => tokenWalletFactory = _instance)

    // 6. Set tokenWalletFactory address to basketFactory
    .then(() => basketFactory.setTokenWalletFactory(tokenWalletFactory.address, { from: ADMINISTRATOR }))

    // @dev Logs
    .then(() => console.log('  Contract addresses:'))
    .then(() => console.log(`  - BasketRegistry        : ${basketRegistry.address}`))
    .then(() => console.log(`  - BasketEscrow          : ${basketEscrow.address}`))
    .then(() => console.log(`  - BasketFactory         : ${basketFactory.address}`))
    .then(() => console.log(`  - TokenWalletFactory    : ${tokenWalletFactory.address}\n`));
};
