// @dev Stringified ABI's for copying and pasting (e.g. truffle console / parity / wallet)

const basketRegistry = require('../../build/contracts/BasketRegistry.json');
const basketFactory = require('../../build/contracts/BasketFactory.json');
const basket = require('../../build/contracts/Basket.json');
const testToken = require('../../build/contracts/TestToken.json');

console.log('Basket Register');
console.log(JSON.stringify(basketRegistry.abi));

console.log('\nBasketFactory ABI');
console.log(JSON.stringify(basketFactory.abi));

console.log('\nBasket ABI');
console.log(JSON.stringify(basket.abi));

/*
@dev Truffle console commands

basketAbi =
basketABAddress =
basketContract = web3.eth.contract(basketAbi);
basketAB = basketContract.at(basketABAddress);
*/

console.log('\nTestToken ABI');
console.log(JSON.stringify(testToken.abi));

/*
@dev Truffle console commands

ercAbi =
tokenAAddress =
tokenBAddress =
tokenContract = web3.eth.contract(ercAbi);
tokenA = tokenContract.at(tokenAAddress);
tokenB = tokenContract.at(tokenBAddress);
*/
