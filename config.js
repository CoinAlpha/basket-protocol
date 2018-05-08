module.exports = {
  // Gas price used for development and testing
  GAS_PRICE_DEV: 20e9,
  GAS_LIMIT: 5e6,

  // Fee amounts used for development and testing
  TRANSACTION_FEE: 0.005 * 1e18,    // Charge 0.5% transaction fee
  PRODUCTION_FEE: 0.3 * 1e18,       // Charge 0.3 ETH of transaction per basket creation
  ARRANGER_FEE: 0.01 * 1e18,        // Charge 0.01 ETH of transaction per basket minted
  FEE_DECIMALS: 18,

  // Zero address
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',

  // Token deployment tokenParams
  DECIMALS: 18,
  INITIAL_SUPPLY: 100e18,
  FAUCET_AMOUNT: 1e18,
};
