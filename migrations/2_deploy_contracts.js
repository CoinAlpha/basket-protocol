const BasketFactory = artifacts.require('./BasketFactory.sol');
const BasketRegistry = artifacts.require('./BasketRegistry.sol');
const BasketEscrow = artifacts.require('./BasketEscrow.sol');
const TokenWalletFactory = artifacts.require('./TokenWalletFactory.sol');

module.exports = (deployer, network, accounts) => {
  // Accounts
  const ADMINISTRATOR = accounts[0];    // Protocol administrator, BasketFactory deployer
  const TRANSACTION_FEE = 0.005;        // Charge 0.5% transaction fee
  const PRODUCTION_FEE = 0.3;           // Charge 0.3 ETH of transaction per basket creation

  // Contract instances
  let basketRegistry, basketEscrow, basketFactory, tokenWalletFactory;

  // 1. Deploy BasketRegistry contract
  deployer.deploy(BasketRegistry, { from: ADMINISTRATOR })
    .then(() => BasketRegistry.deployed())
    .then(_instance => basketRegistry = _instance)

    // 2. Deploy BasketEscrow contract with basketRegistry address
    // BasketEscrow(_basketRegistryAddress, _transactionFeeRecipient, _transactionFee)
    .then(() => deployer.deploy(
      BasketEscrow, basketRegistry.address, ADMINISTRATOR, TRANSACTION_FEE,
      { from: ADMINISTRATOR },
    ))
    .then(() => BasketEscrow.deployed())
    .then(_instance => basketEscrow = _instance)

    // 3. Deploy BasketFactory contract with basketRegistry address and basketEscrow address
    // BasketFactory(_basketRegistryAddress, _basketEscrowAddress, _productionFeeRecipient, _productionFee)
    .then(() => deployer.deploy(
      BasketFactory, basketRegistry.address, basketEscrow.address, ADMINISTRATOR, (PRODUCTION_FEE * 1e4),
      { from: ADMINISTRATOR },
    ))
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
