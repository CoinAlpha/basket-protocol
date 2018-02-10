const Basket = artifacts.require('Basket');
// const BasketFactory6 = artifacts.require('BasketFactory');
const TestToken = artifacts.require('TestToken');
const TestTokenFactory = artifacts.require('TestTokenFactory');

// helpers
const ethToWei = eth => eth * 1e18;

module.exports = (deployer, network, accounts) => {
  console.log('*************** START CONTRACT DEPLOYMENT ***************');

  // Accounts
  const ARRANGER = accounts[0];
  const TOKEN_CREATOR = accounts[0];

  let testToken1, testToken2, testToken3;

  if (network === 'development' || network === 'test') {
    deployer.deploy(
      TestToken,
      'test1',                                       // name
      'TTA',                                         // symbol
      ethToWei(18),                                  // decimals
      ethToWei(100),                                 // initialSupply
      ethToWei(5),                                   // faucetAmount
      { from: TOKEN_CREATOR },
    )
      .then(() => {
        testToken1 = TestToken;
        return deployer.deploy(
          TestToken,
          'test2',                                     // name
          'TTB',                                       // symbol
          ethToWei(18),                                // decimals
          ethToWei(100),                               // initialSupply
          ethToWei(5),                                 // faucetAmount
          { from: TOKEN_CREATOR },
        );
      })
      .then(() => {
        testToken2 = TestToken;
        return deployer.deploy(
          TestToken,
          'test3',                                     // name
          'TTC',                                       // symbol
          ethToWei(10),                                // decimals
          ethToWei(100),                               // initialSupply
          ethToWei(8),                                 // faucetAmount
          { from: TOKEN_CREATOR },
        );
      })
      .then(() => {
        testToken3 = TestToken;
        return deployer.deploy(
          Basket,
          'Basket',                                   // name
          'BSK',                                       // symbol
          [
            testToken1.address,
            testToken2.address,
            testToken3.address,
          ],                                           // tokenAddresses
          [ethToWei(1), ethToWei(2), ethToWei(3)],     // weights
          { from: ARRANGER },
        );
      })
      .then(() => {
        console.log('Contracts successfully deployed');
      })
      .catch((e) => {
        console.log('Error: ', e);
      });
  } else {
    console.log('DEPLOYMENT FILE PENDING CONFIG');
  }
};
