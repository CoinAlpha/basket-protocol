const Basket  = artifacts.require("Basket");
const BasketFactory  = artifacts.require("BasketFactory");

module.exports = function(deployer) {
  deployer.deploy([
    Basket, BasketFactory
  ])
}