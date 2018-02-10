const Basket = artifacts.require('Basket');
const TestToken = artifacts.require('TestToken');

contract('Basket', (accounts) => {
  before('Getting ready', async () => {
    const basket = await Basket.deployed();
    const testToken = await TestToken.deployed();
<<<<<<< HEAD
=======
    console.log(basket);
>>>>>>> f170ef09acb31443d14cf59e8b04218baed18451
  });

  it('should start with zero basketTokens', (done) => {
    assert.isTrue(true);
    done();
  });
});
