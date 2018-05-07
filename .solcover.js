module.exports = {
  port: 8555,
  testrpcOptions: '-p 8555 -l 5000000',
  norpc: false,
  testCommand: 'truffle test',
  skipFiles: ['zeppelin/*']
};