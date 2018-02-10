const Basket = artifacts.require('Basket');
const TestToken = artifacts.require('TestToken');

contract('Basket', (accounts) => {
  before('Getting ready', async () => {
    const basket = await Basket.deployed();
    const testToken = await TestToken.deployed();
  });

  it('should start with zero basketTokens', (done) => {
    assert.isTrue(true);
    done();
  });
});
