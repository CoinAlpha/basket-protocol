const BasketFactory = artifacts.require('./BasketFactory.sol');
// const SwappableBasketFactory = artifacts.require('./SwappableBasketFactory.sol');
const BasketRegistry = artifacts.require('./BasketRegistry.sol');
const BasketEscrow = artifacts.require('./BasketEscrow.sol');
const { TRANSACTION_FEE, PRODUCTION_FEE, SWAPPABLE_PRODUCTION_FEE, DEPLOYER_ADDRESS } = require('../config');


module.exports = (deployer, network, accounts) => {
  // Accounts
  const DEPLOY_ACCOUNT = DEPLOYER_ADDRESS || accounts[0]; // Protocol administrator, BasketFactory deployer

  // Contract instances
  let basketRegistry, basketEscrow, basketFactory, swappableBasketFactory;

  // 1. Deploy BasketRegistry contract
  deployer.deploy(BasketRegistry, { from: DEPLOY_ACCOUNT })
    .then(() => BasketRegistry.deployed())
    .then(_instance => basketRegistry = _instance)

    // 2. Deploy BasketEscrow contract with basketRegistry address
    // BasketEscrow(_basketRegistryAddress, _transactionFeeRecipient, _transactionFee)
    .then(() => deployer.deploy(
      BasketEscrow, basketRegistry.address, DEPLOY_ACCOUNT, TRANSACTION_FEE,
      { from: DEPLOY_ACCOUNT },
    ))
    .then(() => BasketEscrow.deployed())
    .then(_instance => basketEscrow = _instance)

    // 3. Deploy BasketFactory contract with basketRegistry address
    // BasketFactory(_basketRegistryAddress, _productionFeeRecipient, _productionFee)
    .then(() => deployer.deploy(
      BasketFactory, basketRegistry.address, DEPLOY_ACCOUNT, PRODUCTION_FEE,
      { from: DEPLOY_ACCOUNT },
    ))
    .then(() => BasketFactory.deployed())
    .then(_instance => basketFactory = _instance)

    // 4. Deploy SwappableBasketFactory contract with basketRegistry address
    // .then(() => deployer.deploy(
    //   SwappableBasketFactory, basketRegistry.address, ADMINISTRATOR, SWAPPABLE_PRODUCTION_FEE,
    //   { from: ADMINISTRATOR },
    // ))
    // .then(() => SwappableBasketFactory.deployed())
    // .then(_instance => swappableBasketFactory = _instance)

    // 5. Whitelist basketFactory address
    .then(() => basketRegistry.whitelistBasketFactory(
      basketFactory.address,
      { from: DEPLOY_ACCOUNT },
    ))

    // 6. Whitelist swappableBasketFactory address
    // .then(() => basketRegistry.whitelistBasketFactory(
    //   swappableBasketFactory.address,
    //   { from: ADMINISTRATOR },
    // ))

    // @dev Logs
    .then(() => console.log('  Contract addresses:'))
    .then(() => console.log(`  - BasketRegistry            : ${basketRegistry.address}`))
    .then(() => console.log(`  - BasketEscrow              : ${basketEscrow.address}`))
    .then(() => console.log(`  - BasketFactory             : ${basketFactory.address}`));
  // .then(() => console.log(`  - SwappableBasketFactory    : ${swappableBasketFactory.address}`));
};
