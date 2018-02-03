pragma solidity ^0.4.13;
import "../contracts/ERC20/StandardToken.sol";

/**
 * @title BasketFactory
 * @author CoinAlpha, Inc. <contact@coinalpha.com>
 *
*/

contract BasketFactory {
  address[] public baskets;
  
  // as an arranger, create a basket
  function createBasket(
      address[] _tokens,
      uint[] _weights,
      uint _fee)
      public
      returns (address newBasket)
  { 
    Basket b = new Basket(_tokens, _weights, msg.sender, _fee);
    baskets.push(b);
    return b;  
  }
}

contract Basket is StandardToken {

  struct Order {
    address holder;
    uint expiration;
    bool filled;
    mapping(address => uint) minAmounts;
    mapping(address => uint) currentAmounts;
  }
  address[] public tokens;
  uint[] public weights;
  address public arranger;
  uint public fee;
  Order[] public orders;

  function Basket(
    address[] _tokens,
    uint[] _weights,
    address _arranger,
    uint _fee)
    public
  {
    tokens = _tokens;
    weights = _weights;
    arranger = _arranger;
    fee = _fee;
  }

  // as a holder, place an order for a basket
  function placeOrder(
      uint _price,
      uint _duration)
      public
      payable
  {

    // LogOrder(tokens, weights, _minAmounts, _currentAmounts);

    Order memory newOrder = Order(
      msg.sender,
      now + _duration,
      false
    );
    orders.push(newOrder);

    // calc amounts
    for (uint i = 0; i < tokens.length; i++) {
      orders[orders.length - 1].minAmounts[tokens[i]] = _price * weights[i] / 100 * msg.value;
    }

  }

}