const path = require('path');
const Promise = require('bluebird');

const BasketRegistry = artifacts.require('./BasketRegistry.sol');
const BasketEscrow = artifacts.require('./BasketEscrow.sol');
const BasketFactory = artifacts.require('./BasketFactory.sol');
const { abi: basketAbi } = require('../build/contracts/Basket.json');
const { abi: tokenWalletAbi } = require('../build/contracts/TokenWallet.json');
const { constructors } = require('../migrations/constructors.js');

const scriptName = path.basename(__filename);

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('Basket Escrow', (accounts) => {
  // Accounts
  const [ADMINISTRATOR, ARRANGER, MARKET_MAKER, HOLDER_A, HOLDER_B] = accounts.slice(5);
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  // Contract instances
  let basketRegistry, basketFactory, basketEscrow;

  let basketAB;
  let basketABAddress;

  // Token instances
  let tokenA, tokenB;
  const decimals = 18, initialSupply = 100e18, faucetAmount = 1e18;

  const tokenParamsA = [MARKET_MAKER, 'Token A', 'TOKA', decimals, initialSupply, faucetAmount];
  const tokenParamsB = [MARKET_MAKER, 'Token B', 'TOKB', decimals, initialSupply, faucetAmount];

  before('Before: deploy contracts', async () => {
    console.log(`================= START TEST [ ${scriptName} ] =================`);
    try {
      basketRegistry = await BasketRegistry.deployed();
      basketEscrow = await BasketEscrow.deployed();
      basketFactory = await BasketFactory.deployed();
      tokenA = await constructors.TestToken(...tokenParamsA);
      tokenB = await constructors.TestToken(...tokenParamsB);
    } catch (err) { assert.throw(`Failed to deploy contracts: ${err.toString()}`); }
  });

  describe('initialization', () => {
    it('initializes basketFactory and basketRegistry correctly', async () => {
      try {
        // check addresses in basketFactory been set correctly
        const _basketEscrowAddress = await basketFactory.basketEscrowAddress.call();
        assert.strictEqual(_basketEscrowAddress, basketEscrow.address, 'basket escrow address not set correctly');

        // check initialization of indices in basketEscrow
        const _orderIndex = await basketEscrow.orderIndex.call();
        const orderIndex = Number(_orderIndex);
        assert.strictEqual(orderIndex, 1, 'orderIndex not initialized to one');
      } catch (err) { assert.throw(`Failed to initialize basket escrow correctly: ${err.toString()}`); }
    });
  });

  describe('deploys test basket', () => {
    it('deploys the basket with defined escrow address', async () => {
      try {
        const txObj = await basketFactory.createBasket('A1B1', 'BASK', [tokenA.address, tokenB.address], [1, 1], { from: ARRANGER });
        const txLog = txObj.logs[0];
        basketABAddress = txLog.args.basketAddress;
        basketAB = web3.eth.contract(basketAbi).at(basketABAddress);
        Promise.promisifyAll(basketAB, { suffix: 'Promise' });

        const _escrowAddress = basketAB.basketEscrowAddress.call();
        assert.strictEqual(_escrowAddress, basketEscrow.address, 'Basket does not inherit escrow address from factory');
      } catch (err) { assert.throw(`Error deploying basket with escrow address: ${err.toString()}`); }
    });

    after('approve and mint baskets', async () => {
      const amount = 25e18;

      try {
        const balBasketABBefore = await basketAB.balanceOfPromise(MARKET_MAKER);
        await tokenA.approve(basketABAddress, amount, { from: MARKET_MAKER });
        await tokenB.approve(basketABAddress, amount, { from: MARKET_MAKER });
        await basketAB.depositAndBundlePromise(amount, { from: MARKET_MAKER, gas: 1e7 });

        await basketAB.approve(basketEscrow.address, amount, { from: MARKET_MAKER, gas: 1e6 });

        const _balBasketABAfter = await basketAB.balanceOfPromise(MARKET_MAKER);
        assert.strictEqual(Number(_balBasketABAfter), Number(balBasketABBefore + amount), 'incorrect increase');
      } catch (err) { assert.throw(`Error minting baskets: ${err.toString()}`); }
    });
  });


  let initialEscrowBalance, initialHolderBalance;
  let newOrderIndex;
  const amountBasketsToBuy = 10e18;
  const amountEthToSend = 5e18;
  const expirationInSeconds = (new Date().getTime() + 86400000) / 1000;
  let nonce = Math.random() * 1e7;

  describe('Holder_A creates buy order', () => {
    before('check initial balance', async () => {
      try {
        const _initialEscrowBalance = await web3.eth.getBalancePromise(basketEscrow.address);
        const _initialHolderBalance = await web3.eth.getBalancePromise(HOLDER_A);
        initialEscrowBalance = Number(_initialEscrowBalance);
        initialHolderBalance = Number(_initialHolderBalance);
      } catch (err) { assert.throw(`Error reading initial balance: ${err.toString()}`); }
    });

    it('creates and logs buy orders ', async () => {
      try {
        const buyOrderParams = [
          basketABAddress,
          amountBasketsToBuy,
          expirationInSeconds,
          nonce,
          { from: HOLDER_A, value: amountEthToSend, gas: 1e6 },
        ];
        const _buyOrderResults = await basketEscrow.createBuyOrder(...buyOrderParams);

        const { event, args } = _buyOrderResults.logs[0];
        const { buyer, basket, amountEth, amountBasket } = args;
        ({ newOrderIndex } = args);
        assert.strictEqual(event, 'LogBuyOrderCreated', 'incorrect event label');
        assert.strictEqual(Number(newOrderIndex), 1, 'incorrect new order index');
        assert.strictEqual(Number(amountEth), amountEthToSend, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToBuy, 'incorrect basket amount');
        assert.strictEqual(buyer, HOLDER_A, 'incorrect buyer');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
      } catch (err) { assert.throw(`Error creating buy order: ${err.toString()}`); }
    });

    it('sends ETH to escrow contract', async () => {
      try {
        const escrowBalance = await web3.eth.getBalancePromise(basketEscrow.address);
        const holderBalance = await web3.eth.getBalancePromise(HOLDER_A);
        assert.strictEqual(Number(escrowBalance), (initialEscrowBalance + amountEthToSend), 'escrow balance did not increase');
        // check isBelow instead of strict equal due to gas
        assert.isBelow(Number(holderBalance), (initialHolderBalance - amountEthToSend), 'holder balance did not decrease');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('finds order from escrow by contract index', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const [_orderCreator, _basket, _basketAmt, _eth, _ethAmt, _expires, _nonce, _orderExists, _isFilled] = _orderDetails;

        assert.strictEqual(_orderCreator, HOLDER_A, 'incorrect _orderCreator');
        assert.strictEqual(_basket, basketABAddress, 'incorrect _basket');
        assert.strictEqual(Number(_basketAmt), amountBasketsToBuy, 'incorrect _basketAmt');
        assert.strictEqual(_eth, zeroAddress, 'incorrect _eth');
        assert.strictEqual(Number(_ethAmt), amountEthToSend, 'incorrect _ethAmt');
        assert.strictEqual(Number(_expires), Math.floor(expirationInSeconds), 'incorrect _expires');
        assert.strictEqual(Number(_nonce), Math.floor(nonce), 'incorrect _nonce');
        assert.strictEqual(_orderExists, true, 'incorrect _orderExists');
        assert.strictEqual(_isFilled, false, 'incorrect _isFilled');
      } catch (err) { assert.throw(`Error in getOrderDetails: ${err.toString()}`); }
    });
  });

  describe('Holder_A cancels buy order', () => {
    before('check initial balance', async () => {
      try {
        const _initialEscrowBalance = await web3.eth.getBalancePromise(basketEscrow.address);
        const _initialHolderBalance = await web3.eth.getBalancePromise(HOLDER_A);
        initialEscrowBalance = Number(_initialEscrowBalance);
        initialHolderBalance = Number(_initialHolderBalance);
      } catch (err) { assert.throw(`Error reading initial balance: ${err.toString()}`); }
    });

    it('allows and logs cancellation of buy orders ', async () => {
      try {
        const cancelBuyParams = [
          basketABAddress, amountBasketsToBuy, amountEthToSend, expirationInSeconds, nonce, { from: HOLDER_A },
        ];
        const _cancelBuyResults = await basketEscrow.cancelBuyOrder(...cancelBuyParams);

        const { event, args } = _cancelBuyResults.logs[0];
        const { buyer, basket, amountEth, amountBasket } = args;
        assert.strictEqual(event, 'LogBuyOrderCancelled', 'incorrect event label');
        assert.strictEqual(Number(amountEth), amountEthToSend, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToBuy, 'incorrect basket amount');
        assert.strictEqual(buyer, HOLDER_A, 'incorrect buyer');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
      } catch (err) { assert.throw(`Error creating buy order: ${err.toString()}`); }
    });

    it('sends ETH to back to holder', async () => {
      try {
        const escrowBalance = await web3.eth.getBalancePromise(basketEscrow.address);
        const holderBalance = await web3.eth.getBalancePromise(HOLDER_A);
        assert.strictEqual(Number(escrowBalance), (initialEscrowBalance - amountEthToSend), 'escrow balance did not decrease');
        assert.isAbove(Number(holderBalance), (initialHolderBalance - amountEthToSend), 'holder balance did not increase');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('marks order as no longer exists', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const _orderExists = _orderDetails[7];
        assert.strictEqual(_orderExists, false, 'incorrect _orderExists');
      } catch (err) { assert.throw(`Error in getOrderDetails: ${err.toString()}`); }
    });

    after('update nonce', () => { nonce = Math.random() * 1e7; });
  });

  describe('MARKET_MAKER fills HOLDER_A\'s new buy order', () => {
    let initialFillerBasketBal, initialBuyerBasketBal, initialFillerEthBal, initialEscrowEthBal;

    before('create second buy order and check initial balance', async () => {
      try {
        const buyOrderParams = [
          basketABAddress, amountBasketsToBuy, expirationInSeconds, nonce,
          { from: HOLDER_A, value: amountEthToSend, gas: 1e6 },
        ];

        const _buyOrderResults = await basketEscrow.createBuyOrder(...buyOrderParams);
        ({ newOrderIndex } = _buyOrderResults.logs[0].args);

        const _initialFillerBasketBal = await basketAB.balanceOf(MARKET_MAKER);
        const _initialBuyerBasketBal = await basketAB.balanceOf(HOLDER_A);
        const _initialFillerEthBal = await web3.eth.getBalancePromise(MARKET_MAKER);
        const _initialEscrowEthBal = await web3.eth.getBalancePromise(basketEscrow.address);
        initialFillerBasketBal = Number(_initialFillerBasketBal);
        initialBuyerBasketBal = Number(_initialBuyerBasketBal);
        initialFillerEthBal = Number(_initialFillerEthBal);
        initialEscrowEthBal = Number(_initialEscrowEthBal);
      } catch (err) { assert.throw(`Error creating second buy order: ${err.toString()}`); }
    });

    it('allows and logs buy order fills ', async () => {
      try {
        const fillBuyParams = [
          HOLDER_A, basketABAddress, amountBasketsToBuy, amountEthToSend, expirationInSeconds, nonce,
          { from: MARKET_MAKER, gas: 1e7 },
        ];
        const _fillBuyResults = await basketEscrow.fillBuyOrder(...fillBuyParams);
        const { event, args } = _fillBuyResults.logs[0];
        const { buyOrderFiller, orderCreator, basket, amountEth, amountBasket } = args;

        assert.strictEqual(event, 'LogBuyOrderFilled', 'incorrect event label');
        assert.strictEqual(buyOrderFiller, MARKET_MAKER, 'incorrect filler');
        assert.strictEqual(orderCreator, HOLDER_A, 'incorrect orderCreator');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
        assert.strictEqual(Number(amountEth), amountEthToSend, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToBuy, 'incorrect basket amount');
      } catch (err) { assert.throw(`Error filling buy order: ${err.toString()}`); }
    });

    it('alters all balances correctly', async () => {
      try {
        const _fillerBasketBal = await basketAB.balanceOf(MARKET_MAKER);
        const _buyerBasketBal = await basketAB.balanceOf(HOLDER_A);
        const _fillerEthBal = await web3.eth.getBalancePromise(MARKET_MAKER);
        const _escrowEthBal = await web3.eth.getBalancePromise(basketEscrow.address);

        assert.strictEqual(Number(_fillerBasketBal), (initialFillerBasketBal - amountBasketsToBuy), 'filler basket balance did not decrease');
        assert.strictEqual(Number(_buyerBasketBal), (initialBuyerBasketBal + amountBasketsToBuy), 'buyer basket balance did not increase');
        assert.isBelow(Number(_fillerEthBal), (initialFillerEthBal + amountEthToSend), 'filler eth balance did not increase');
        assert.strictEqual(Number(_escrowEthBal), (initialEscrowEthBal - amountEthToSend), 'escrow eth balance did not decrease');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('marks order as filled', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const _isFilled = _orderDetails[8];
        assert.strictEqual(_isFilled, true, 'incorrect _isFilled');
      } catch (err) { assert.throw(`Error in marking order filled: ${err.toString()}`); }
    });
  });

  let initialEscrowBasketBal, initialMMBasketBal, currentOrderIndex;
  const amountBasketsToSell = 7e18;
  const amountEthToGet = 9e18;
  nonce = Math.random() * 1e7;

  describe('MARKET_MAKER creates sell order', () => {
    before('check initial balance', async () => {
      try {
        const _initialEscrowBasketBal = await basketAB.balanceOf(basketEscrow.address);
        const _initialMMBasketBal = await basketAB.balanceOf(MARKET_MAKER);
        initialEscrowBasketBal = Number(_initialEscrowBasketBal);
        initialMMBasketBal = Number(_initialMMBasketBal);
        currentOrderIndex = await basketEscrow.orderIndex.call();
      } catch (err) { assert.throw(`Error reading initial balance: ${err.toString()}`); }
    });

    it('creates and logs sell orders ', async () => {
      try {
        const sellOrderParams = [
          basketABAddress, amountBasketsToSell, amountEthToGet, expirationInSeconds, nonce, { from: MARKET_MAKER, gas: 1e6 },
        ];
        const _sellOrderResults = await basketEscrow.createSellOrder(...sellOrderParams);

        const { event, args } = _sellOrderResults.logs[0];
        const { seller, basket, amountEth, amountBasket } = args;
        ({ newOrderIndex } = args);
        assert.strictEqual(event, 'LogSellOrderCreated', 'incorrect event label');
        assert.strictEqual(Number(newOrderIndex), Number(currentOrderIndex), 'incorrect new order index');
        assert.strictEqual(Number(amountEth), amountEthToGet, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToSell, 'incorrect basket amount');
        assert.strictEqual(seller, MARKET_MAKER, 'incorrect seller');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
      } catch (err) { assert.throw(`Error creating buy order: ${err.toString()}`); }
    });

    it('sends Baskets to escrow contract', async () => {
      try {
        const escrowBalance = await basketAB.balanceOf(basketEscrow.address);
        const sellerBalance = await basketAB.balanceOf(MARKET_MAKER);
        assert.strictEqual(Number(escrowBalance), (initialEscrowBasketBal + amountBasketsToSell), 'escrow balance did not increase');
        assert.strictEqual(Number(sellerBalance), (initialMMBasketBal - amountBasketsToSell), 'market maker balance did not decrease');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('finds order from escrow by contract index', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const [_orderCreator, _eth, _ethAmt, _basket, _basketAmt, _expires, _nonce, _orderExists, _isFilled] = _orderDetails;

        assert.strictEqual(_orderCreator, MARKET_MAKER, 'incorrect _orderCreator');
        assert.strictEqual(_eth, zeroAddress, 'incorrect _eth');
        assert.strictEqual(Number(_ethAmt), amountEthToGet, 'incorrect _ethAmt');
        assert.strictEqual(_basket, basketABAddress, 'incorrect _basket');
        assert.strictEqual(Number(_basketAmt), amountBasketsToSell, 'incorrect _basketAmt');
        assert.strictEqual(Number(_expires), Math.floor(expirationInSeconds), 'incorrect _expires');
        assert.strictEqual(Number(_nonce), Math.floor(nonce), 'incorrect _nonce');
        assert.strictEqual(_orderExists, true, 'incorrect _orderExists');
        assert.strictEqual(_isFilled, false, 'incorrect _isFilled');
      } catch (err) { assert.throw(`Error in getOrderDetails: ${err.toString()}`); }
    });
  });

  describe('MARKET_MAKER cancels sell order', () => {
    before('check initial balance', async () => {
      try {
        const _initialEscrowBasketBal = await basketAB.balanceOf(basketEscrow.address);
        const _initialMMBasketBal = await basketAB.balanceOf(MARKET_MAKER);
        initialEscrowBasketBal = Number(_initialEscrowBasketBal);
        initialMMBasketBal = Number(_initialMMBasketBal);
      } catch (err) { assert.throw(`Error reading initial balance: ${err.toString()}`); }
    });

    it('allows and logs cancellation of sell orders ', async () => {
      try {
        const cancelSellParams = [
          basketABAddress, amountBasketsToSell, amountEthToGet, expirationInSeconds, nonce, { from: MARKET_MAKER },
        ];
        const _cancelSellResults = await basketEscrow.cancelSellOrder(...cancelSellParams);

        const { event, args } = _cancelSellResults.logs[0];
        const { seller, basket, amountEth, amountBasket } = args;
        assert.strictEqual(event, 'LogSellOrderCancelled', 'incorrect event label');
        assert.strictEqual(Number(amountEth), amountEthToGet, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToSell, 'incorrect basket amount');
        assert.strictEqual(seller, MARKET_MAKER, 'incorrect seller');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
      } catch (err) { assert.throw(`Error creating buy order: ${err.toString()}`); }
    });

    it('sends Baskets to back to market maker', async () => {
      try {
        const escrowBalance = await basketAB.balanceOf(basketEscrow.address);
        const sellerBalance = await basketAB.balanceOf(MARKET_MAKER);
        assert.strictEqual(Number(escrowBalance), (initialEscrowBasketBal - amountBasketsToSell), 'escrow balance did not decrease');
        assert.strictEqual(Number(sellerBalance), (initialMMBasketBal + amountBasketsToSell), 'market maker balance did not increase');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('marks order as no longer exists', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const _orderExists = _orderDetails[7];
        assert.strictEqual(_orderExists, false, 'incorrect _orderExists');
      } catch (err) { assert.throw(`Error in getOrderDetails: ${err.toString()}`); }
    });

    after('update nonce', () => { nonce = Math.random() * 1e7; });
  });

  describe('HOLDER_B fills MARKET_MAKER\'s new sell order', () => {
    let initialFillerBasketBal, initialSellerEthBal, initialFillerEthBal;

    before('create second sell order and check initial balance', async () => {
      try {
        const sellOrderParams = [
          basketABAddress, amountBasketsToSell, amountEthToGet, expirationInSeconds, nonce, { from: MARKET_MAKER, gas: 1e6 },
        ];
        const _sellOrderResults = await basketEscrow.createSellOrder(...sellOrderParams);
        ({ newOrderIndex } = _sellOrderResults.logs[0].args);

        const _initialFillerBasketBal = await basketAB.balanceOf(HOLDER_B);
        const _initialSellerEthBal = await web3.eth.getBalancePromise(MARKET_MAKER);
        const _initialFillerEthBal = await web3.eth.getBalancePromise(HOLDER_B);
        const _initialEscrowBasketBal = await basketAB.balanceOf(basketEscrow.address);
        initialFillerBasketBal = Number(_initialFillerBasketBal);
        initialSellerEthBal = Number(_initialSellerEthBal);
        initialFillerEthBal = Number(_initialFillerEthBal);
        initialEscrowBasketBal = Number(_initialEscrowBasketBal);
      } catch (err) { assert.throw(`Error creating second sell order: ${err.toString()}`); }
    });

    it('allows and logs sell order fills ', async () => {
      try {
        const fillSellParams = [
          MARKET_MAKER, basketABAddress, amountBasketsToSell, expirationInSeconds, nonce,
          { from: HOLDER_B, value: amountEthToGet, gas: 1e7 },
        ];

        const _fillSellResults = await basketEscrow.fillSellOrder(...fillSellParams);
        const { event, args } = _fillSellResults.logs[0];
        const { sellOrderFiller, orderCreator, basket, amountEth, amountBasket } = args;

        assert.strictEqual(event, 'LogSellOrderFilled', 'incorrect event label');
        assert.strictEqual(sellOrderFiller, HOLDER_B, 'incorrect filler');
        assert.strictEqual(orderCreator, MARKET_MAKER, 'incorrect orderCreator');
        assert.strictEqual(basket, basketABAddress, 'incorrect basket address');
        assert.strictEqual(Number(amountEth), amountEthToGet, 'incorrect eth amount');
        assert.strictEqual(Number(amountBasket), amountBasketsToSell, 'incorrect basket amount');
      } catch (err) { assert.throw(`Error filling sell order: ${err.toString()}`); }
    });

    it('alters all balances correctly', async () => {
      try {
        const _fillerBasketBal = await basketAB.balanceOf(HOLDER_B);
        const _sellerEthBal = await web3.eth.getBalancePromise(MARKET_MAKER);
        const _fillerEthBal = await web3.eth.getBalancePromise(HOLDER_B);
        const _escrowBasketBal = await basketAB.balanceOf(basketEscrow.address);

        assert.strictEqual(Number(_fillerBasketBal), (initialFillerBasketBal + amountBasketsToSell), 'filler basket balance did not increase');
        assert.strictEqual(Number(_sellerEthBal), (initialSellerEthBal + amountEthToGet), 'seller eth balance did not increase');
        assert.isBelow(Number(_fillerEthBal), (initialFillerEthBal - amountEthToGet), 'filler eth balance did not decrease');
        assert.strictEqual(Number(_escrowBasketBal), (initialEscrowBasketBal - amountBasketsToSell), 'escrow basket balance did not decrease');
      } catch (err) { assert.throw(`Error sending ETH to escrow contract: ${err.toString()}`); }
    });

    it('marks order as filled', async () => {
      try {
        const _orderDetails = await basketEscrow.getOrderDetails(newOrderIndex);
        const _isFilled = _orderDetails[8];
        assert.strictEqual(_isFilled, true, 'incorrect _isFilled');
      } catch (err) { assert.throw(`Error in marking order filled: ${err.toString()}`); }
    });
  });
});
