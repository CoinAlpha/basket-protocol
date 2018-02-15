pragma solidity ^0.4.18;
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * @title Basket
 * @author CoinAlpha, Inc. <contact@coinalpha.com>
 *
*/

contract BasketFactory1 {
  address[] public baskets;

  function createBasket(
    address[] _tokens,
    uint[] _weights
  )
    public
    returns (address newBasket)
  {
    Basket1 b = new Basket1(_tokens, _weights);
    baskets.push(b);
    return b;
  }
}

contract Basket1 is StandardToken {

  // basket composition
  address[] public tokens;
  uint[] public weights;

  // mapping of orders
  mapping (bytes32 => uint) orders;

  function Basket1(
    address[] _tokens,
    uint[] _weights
  )
    public
  {
    tokens = _tokens;
    weights = _weights;
  }

  // as a holder, buy a Basket
  function purchase(
      bytes32[] orderHashes,
      bytes32[] orderSignatures,
      uint amount,
      uint _fee,
      uint _feeRecipient)
      public
      payable
  {

    // authenticate signatures with ecrecover
    // verify that orders have not expired
    // verify that orders have not been filled
    // verify token amounts >= Basket amount
    // verify token payments <= Basket payment
    // modify orders mapping
    // execute purchase
  }

  // as a holder, convert some or all of the Basket into underlying tokens
  function extract(
    uint _amount
  )
    public
  {
    // transfer tokens to msg.sender
    // decrement balanceOf and totalSupply

  }

  // as a maker, cancel an order
  function cancel(
    bytes32[] orderHashes,
    bytes32[] orderSignatures
  )
    public
  {
    // verify signature
    // modify orders mapping
  }

}
