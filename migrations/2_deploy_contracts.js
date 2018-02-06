const Basket          = artifacts.require("Basket");
const BasketFactory   = artifacts.require("BasketFactory");
const TestToken       = artifacts.require("TestToken");

module.exports = function(deployer) {
  deployer.deploy([
    Basket, BasketFactory
  ])
}