// const ganache = require("ganache-cli");
// const server = ganache.server();
// web3.setProvider(ganache.provider());

// const PORT = 7190;
// server.listen(PORT, (err, blockchain) => {
//   console.log(`Ganache server listening on with ${PORT}`);
//   console.log('blockchain: ', blockchain)
// });

const Basket = artifacts.require('Basket');

contract('Basket', (accounts) => {
  it('should assert true', (done) => {
    const basket = Basket.deployed();
    assert.isTrue(true);
    done();
  });
});
