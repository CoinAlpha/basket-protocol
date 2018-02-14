module.exports = function getTransactionReceiptMined(txHash, interval) {
  const self = this;
  const transactionReceiptAsync = (resolve, reject) => {
    self.getTransactionReceipt(txHash, (error, receipt) => {
      if (error) reject(error);
      else if (receipt === null) {
        setTimeout(() => transactionReceiptAsync(resolve, reject), (interval || 500));
      } else { resolve(receipt); }
    });
  };

  if (Array.isArray(txHash)) {
    return Promise.all(txHash.map((oneTxHash) => {
      return self.getTransactionReceiptMined(oneTxHash, interval);
    }));
  } else if (typeof txHash === 'string') {
    return new Promise(transactionReceiptAsync);
  }
  throw new Error(`Invalid Type: ${txHash}`);
};
