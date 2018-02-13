const basket = require('../../build/contracts/Basket.json');
const erc20 = require('../../build/contracts/ERC20.json');

console.log('Basket ABI');
console.log(JSON.stringify(basket.abi));

/*
@dev Truffle console commands

basketAbi = 
basketABAddress = 
basketContract = web3.eth.contract(basketAbi);
basketAB = basketContract.at(basketABAddress);
*/

console.log('ERC20 ABI');
console.log(JSON.stringify(erc20.abi));

/*
@dev Truffle console commands

ercAbi = 
tokenAAddress = 
tokenBAddress =
tokenContract = web3.eth.contract(ercAbi);
tokenA = tokenContract.at(tokenAAddress);
tokenB = tokenContract.at(tokenBAddress);
*/