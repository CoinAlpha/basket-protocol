# Basket Protocol
**A new paradigm for asset management**

The Basket protocol establishes a decentralized ecosystem that trustlessly fulfills the primary functions of asset management: selection, execution, and custody. Unlike a traditional investment fund, a Basket is a non-custodial financial instrument collateralized by a portfolio of assets over which the investor has full control and agency.

**Roles in the Basket Protocol Ecosystem**

The Basket Protocol deconstructs the traditional asset management model into three functional roles, allowing for specialization, efficiency, and decentralization.  Market participants can act in any or all capacities.  Meanwhile, the protocol's registry capabilities facilitate the evaluation of and tracking of baskets as well as of the arrangers that created them.

- **Arranger**: "fund manager" in the traditional sense, that selects tokens and weights for basket contracts
- **Market Maker**: accumulates ERC20 tokens for compiling into baskets and "minting" of basket tokens
- **Buyer**: the ultimate holder of the basket token, who owns and controls the basket tokens and the underlying ERC20 tokens they represent

## Basket Protocol Contract Suite

**[Basket Contract](contracts/Basket.sol)**

The fundamental building block of the Basket Protocol, a Basket Contract is an extended ERC20 token contract capable of holding and transacting in other ERC20 tokens.  In addition to the basic [ERC20 token specifications](https://en.wikipedia.org/wiki/ERC20), the basket contract adds the following functionality:

```js
// Deposit ERC20 tokens into the basket contract and "mint" new Basket ERC20
// tokens that represent the underlying tokens
function depositAndBundle(uint _quantity) public payable returns (bool success)

// Extract the underlying ERC20 tokens and "burning" the Basket token
function debundleAndWithdraw(uint _quantity) public returns (bool success)
```

A holder of a basket token issued by a Basket Contract has direct control over and agency of the underlying ERC20 tokens represented by the basket token.  The Basket Contract ensures that the tokens represented by a basket token are always held by the Basket Contract, readily available for any holder who wants to debundle and assume direct ownership of the underlying tokens, at any time.

**[Basket Factory](contracts/BasketFactory.sol)**

Contract that allows Arrangers to construct new ERC20 token portfolios by creating new Basket Contracts.  When constructing new basekts, Arrangers specify tokens and weights, creating a "template" for minting new Basket tokens from that basket.

**[Basket Registry](contracts/BasketRegistry.sol)**

A registry to keep track of baskets created, quantity of each basket minted and burned, as well as usage of a particular arranger's baskets.

**[Basket Escrow](contracts/BasketEscrow.sol)**

Allows for users to create buy and sell orders for baskets, fill orders, and transact in Ether.

## Coding Guides
- [http://solidity.readthedocs.io/en/develop/style-guide.html](http://solidity.readthedocs.io/en/develop/style-guide.html)

## Testing
- [Truffle](http://truffleframework.com/) [v4.1.8](https://github.com/trufflesuite/truffle/releases/tag/v4.1.8)

```
npm test
```

**Running test coverage (solidity-coverage)**

```sh
# Requires environment variable TEST_COVERAGE=true, which is set in the npm script:
npm run coverage
```

## Deployed Contracts: Ropsten Testnet
- Current version 2.0 deployed on Ropsten

### Testnet ERC20 Tokens
- Token Replicas on the Ropsten Testnet: [Test Tokens](TEST-TOKENS.md)

### Basket Factory
- Contract Address:       [0x47cb0663800483350afb42b6c2f3c0e68f82dc4d](https://ropsten.etherscan.io/address/0x47cb0663800483350afb42b6c2f3c0e68f82dc4d)
- Contract Tx Hash:       0x14c4526b5a1c321b142f73d7bdbc52c8258edd5d065d90be0ce57e1b7efc3f49
- Block Number    :       2868151

### Basket Registry
- Contract Address:       [0x9882e3bc3075cc4ccab09ed1d209a71c0a517040](https://ropsten.etherscan.io/address/0x9882e3bc3075cc4ccab09ed1d209a71c0a517040#events)
- Contract Tx Hash:       0x54efa18a942e4a94b57bfdd15a8ce4a0effc106b876cc414fed77ad7405cdbbc
- Block Number    :       2868142

### Basket Escrow
- Contract Address:       [0xca26fcbeb76e4266e803c3e0d71437d220cbc840](https://ropsten.etherscan.io/address/0xca26fcbeb76e4266e803c3e0d71437d220cbc840)
- Contract Tx Hash:       0xb4825dffa476179544c9802da7efa8d2f8bbff527a67e2c9bfed19851156af48
- Block Number    :       2868147

## Security
The CoinAlpha team, to the extent possible, aims to follow industry best practices and keep up to date with the rapidly developing field of smart contracts and blockchain engineering.  Some of the guides and best practices followed include:
- [OpenZeppelin contracts](https://github.com/OpenZeppelin/zeppelin-solidity): the Basket Protocol uses some of the standardized and widely accepted OpenZeppelin contracts
- [ConsenSys: Smart Contract Security Best Practices](https://github.com/ConsenSys/smart-contract-best-practices)

If you find a security issue, please email [dev@coinalpha.com](mailto:dev@coinalpha.com).

## Contributions Are Welcome!
- [Contributing](CONTRIBUTING.md): git workflow

We welcome code contributions (via [pull requests](https://github.com/CoinAlpha/basket-protocol/pulls)) as well as bug reports and feature requests through [github issues](https://github.com/CoinAlpha/basket-protocol/issues).  You may also contact us by [email](mailto:dev@coinalpha.com).

## Contact
The Basket Protocol was created by [CoinAlpha](https://www.coinalpha.com).  You can contact us at [dev@coinalpha.com](mailto:dev@coinalpha.com).

## License
Code released under the [Apache-2.0 License](LICENSE).