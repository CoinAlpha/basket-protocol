pragma solidity ^0.4.18;
import "./lib/StandardToken.sol";
import "../lib/SafeMath.sol";

/**
 * @title TestToken
 * @author CoinAlpha, Inc. <contact@coinalpha.com>
 *
*/

contract TestToken is StandardToken, Ownable {

  string name;
  string symbol;
  uint decimals;
  uint faucetAmount;

  function TestToken(
    string _name,
    string _symbol,
    uint _initialSupply,
  )
    public
    returns (bool success)
  {
    totalSupply = _initialSupply;
    balances[msg.sender] = _initialSupply;
    owner = msg.sender;
  }

  function faucet()
    public
    returns (bool)
  {
    balances[owner] = balances[owner].sub(faucetAmount);
    balances[msg.sender] = balances[msg.sender].add(faucetAmount);
    return true;
 }

  function mint(
    uint _value
    returns (bool)
  )
    onlyOwner {
      totalSupply = totalSupply.add(_value);
      balances[owner] = balances[owner].add(_value);
      return true;
  }
}