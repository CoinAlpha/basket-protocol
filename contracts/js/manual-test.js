/* Truffle console commands
---------------------------
Start with `truffle develop` from the command line, and run these commands in order.
*/

// Helpers
gasAmt = 500000
getBal = address => web3.fromWei(web3.eth.getBalance(address), 'ether').toNumber()
weiToNum = wei => web3.fromWei(wei, 'ether').toNumber()
ethToWei = eth => web3.toWei(eth, 'ether')

// Accounts
arranger = web3.eth.accounts[0]
holder = web3.eth.accounts[1]

// Deploy
truffle migrate --reset

// Get BasketFactory instance
BasketFactory.deployed().then(instance => factory = instance)

// (ARRANGER) Create a basket
factory.createBasket(["0x0", "0x1"], [50, 50], 2)

// Get Basket instance
factory.baskets(0).then(address => Basket.at(address).then(instance => basket = instance))

// Log events
var basketEvents = basket.allEvents(function(error, event) { if (!error) console.log(event.args); });

// (HOLDER) Place order for a basket
basket.placeOrder(10, 3600, {from:holder, value: ethToWei(1)})

// See the order
basket.orders(0)