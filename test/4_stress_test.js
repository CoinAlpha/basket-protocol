// const path = require('path');
// const Promise = require('bluebird');
//
// const BasketRegistry = artifacts.require('./BasketRegistry.sol');
// const BasketEscrow = artifacts.require('./BasketEscrow.sol');
// const BasketFactory = artifacts.require('./BasketFactory.sol');
// const { abi: basketAbi } = require('../build/contracts/Basket.json');
// const { constructors } = require('../migrations/constructors.js');
// const { web3 } = require('../utils/web3');
// const {
//   ZERO_ADDRESS,
//   ARRANGER_FEE,
//   PRODUCTION_FEE,
//   TRANSACTION_FEE,
//   FEE_DECIMALS,
//   DECIMALS,
//   INITIAL_SUPPLY,
//   FAUCET_AMOUNT,
// } = require('../config');
//
// const doesRevert = err => err.message.includes('revert');
//
// const BUNDLING_GAS_LIMIT = 1e6;
// const DEBUNDLING_GAS_LIMIT = 2e5;
//
// contract('Basket Factory Limit', (accounts) => {
//   // Accounts
//   const [ADMINISTRATOR, ARRANGER, MARKETMAKER, HOLDER_A, HOLDER_B, INVALID_ADDRESS] = accounts.slice(0, 6);
//
//   // Contract instances
//   let basketFactory;
//   let fee;
//
//   const tokenArray = [];
//   const tokenAddressArray = [];
//   const weightArray = [];
//   const basketArray = [];
//
//   let deploymentCount = 1;
//   let bundleCount = 0;
//   let debundleCount = 0;
//
//   describe('stress test basket constructor', () => {
//     before('deploying basketFactory and tokens', async () => {
//       console.log(`  ================= START TEST [ ${path.basename(__filename)} ] =================`);
//
//       basketFactory = await BasketFactory.deployed();
//       fee = await basketFactory.productionFee.call();
//       // change fee amount to 0 so that the transaction does not revert due to insufficient funds
//       await basketFactory.changeProductionFee(0, { from: ADMINISTRATOR });
//     });
//
//     it('deploy baskets with as many tokens as possible', async () => {
//       if (process.env.TEST_COVERAGE) {
//         console.log('SKIPPING THIS TEST IN COVERAGE');
//         return;
//       }
//
//       let breakLoop = false;
//       console.log('STARTING TO DEPLOY BASKETS...');
//       while (!breakLoop) {
//         try {
//           const params = [
//             HOLDER_A,
//             `Token${deploymentCount}`,
//             `TOK${deploymentCount}`,
//             DECIMALS,
//             INITIAL_SUPPLY,
//             FAUCET_AMOUNT,
//           ];
//           const token = await constructors.TestToken(...params);
//           tokenArray.push(token);
//           tokenAddressArray.push(token.address);
//           weightArray.push(1e18);
//           const txObj = await basketFactory.createBasket(
//             'A1B1', 'BASK', tokenAddressArray, weightArray, ARRANGER, 0,
//             // charge 0 arranger fee
//             { from: ARRANGER },
//           );
//           console.log(`SUCCESSFULLY DEPLOYED BASKET # ${deploymentCount}`);
//           const txLog = txObj.logs[0];
//           const { basketAddress, arranger: _arranger, fee: feeFromEvent } = txLog.args;
//           const newContract = web3.eth.contract(basketAbi);
//           const basketInstance = newContract.at(basketAddress);
//           Promise.promisifyAll(basketInstance, { suffix: 'Promise' });
//           basketArray.push(basketInstance);
//           deploymentCount += 1;
//         } catch (err) {
//           assert.equal(doesRevert(err), true, 'did not revert as expected');
//           console.log(`MAXIMUM AMT OF TOKENS ALLOWED FOR DEPLOYMENT: ${deploymentCount - 1}`);
//           breakLoop = true;
//         }
//       }
//     });
//   });
//
//
//   describe('stress test basket bundling', () => {
//     it('bundle baskets with as many tokens as possible', async () => {
//       if (process.env.TEST_COVERAGE) {
//         console.log('SKIPPING THIS TEST IN COVERAGE');
//         return;
//       }
//
//       let breakLoop = false;
//       console.log('STARTING TO BUNDLE BASKETS...');
//       while (!breakLoop) {
//         try {
//           const basketInstance = basketArray[bundleCount];
//           for (let i = 0; i <= bundleCount; i += 1) {
//             await tokenArray[i].approve(basketInstance.address, 1e25, { from: HOLDER_A });
//           }
//           await basketInstance.depositAndBundlePromise(1e18, { from: HOLDER_A, gas: BUNDLING_GAS_LIMIT });
//           console.log(`SUCCESSFULLY BUNDLED BASKET #: ${bundleCount}`);
//           bundleCount += 1;
//         } catch (err) {
//           if (doesRevert(err)) {
//             console.log(`MAXIMUM AMT OF TOKENS ALLOWED FOR BUNDLING: ${bundleCount}`);
//           } else {
//             console.log('MAXIMUM UNKNOWN: ALL DEPLOYED BASKETS HAVE BEEN BUNDLED');
//           }
//           breakLoop = true;
//         }
//       }
//     });
//   });
//
//
//   describe('stress test basket debundling', () => {
//     it('debundle baskets with as many tokens as possible', async () => {
//       if (process.env.TEST_COVERAGE) {
//         console.log('SKIPPING THIS TEST IN COVERAGE');
//         return;
//       }
//
//       let breakLoop = false;
//
//       console.log('STARTING TO DEBUNDLE BASKETS...');
//       while (!breakLoop) {
//         try {
//           if (debundleCount >= bundleCount) throw new Error('cannot debundle unbundled baskets');
//           const basketInstance = basketArray[debundleCount];
//           await basketInstance.debundleAndWithdrawPromise(1e18, { from: HOLDER_A, gas: DEBUNDLING_GAS_LIMIT });
//           console.log(`SUCCESSFULLY DEBUNDLED BASKET #: ${debundleCount}`);
//           debundleCount += 1;
//         } catch (err) {
//           if (doesRevert(err)) {
//             console.log(`MAXIMUM AMT OF TOKENS ALLOWED FOR DEBUNDLING: ${debundleCount}`);
//           } else {
//             console.log('MAXIMUM UNKNOWN: ALL BUNDLED BASKETS HAVE BEEN DEBUNDLED');
//           }
//           breakLoop = true;
//         }
//       }
//     });
//   });
// });
