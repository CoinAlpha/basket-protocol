const Basket6 = artifacts.require('Basket');
// const BasketFactory6 = artifacts.require('BasketFactory');
const TestToken = artifacts.require('TestToken');

// helpers
const ethToWei = eth => eth * 1e18;

module.exports = (deployer, network, accounts) => {
  console.log('*************** START CONTRACT DEPLOYMENT ***************');
  // Accounts
  const ARRANGER = accounts[0];
  const TOKEN_CREATOR = accounts[0];                 // set token creator to the same address to simplify testing

  let testToken1, testToken2, testToken3;

  if (network === 'development' || network === 'test') {
    // deployer.deploy(TestTokenFactory, { from: TOKEN_CREATOR })
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
        testToken1 = TestToken.address;
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
        testToken2 = TestToken.address;
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
        testToken3 = TestToken.address;
        return deployer.deploy(
          Basket6,
          'Basket6',                                   // name
          'BSK',                                       // symbol
          [testToken1, testToken2, testToken3],        // tokenAddresses
          [ethToWei(1), ethToWei(2), ethToWei(3)],     // weights
          { from: ARRANGER },
        );
      })
      .then(() => {
        console.log('Contracts successfully deployed');
        return TestToken.deployed();
      })
      .then((_testToken) => {
        console.log(Object.keys(_testToken));
      })
      .catch((e) => {
        console.log('Error: ', e);
      });
  } else {
    console.log('DEPLOYMENT FILE PENDING CONFIG');
  }
};
