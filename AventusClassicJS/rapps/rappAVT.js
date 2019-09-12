const AVTERC20 = require('../AVTERC20.js');
const AVTManager = require('../AVTManager.js');
const Web3ContractsManager = require('../Web3ContractsManager.js');
const AventusAPI = require('../AventusAPI.js');

async function main() {
  console.log('Starting AVT Reference App');
  const contractsManager = new Web3ContractsManager();
  await contractsManager.initialise('http://127.0.0.1:8545');

  const aventusApi = new AventusAPI();
  await aventusApi.initialise(contractsManager);

  const avtERC20 = new AVTERC20(aventusApi);
  const avtManager = new AVTManager(aventusApi, avtERC20);

  console.log('AVT balance', await avtERC20.balanceOf(aventusApi.parameters.from));
  console.log('Protocol balance 0', await avtManager.getBalance(aventusApi.parameters.from));
  console.log('Protocol balance 1', await avtManager.getBalance(aventusApi.accounts[1]));

  console.log('Depositing');
  await avtManager.approveAndDeposit(100000000000000);
  await avtManager.approveAndDeposit(100000000000000, aventusApi.accounts[1]);
  console.log('Protocol balance 0', await avtManager.getBalance(aventusApi.parameters.from));
  console.log('Protocol balance 1', await avtManager.getBalance(aventusApi.accounts[1]));


  console.log('Withdrawing');
  await avtManager.withdrawFrom(100000000000000);
  await avtManager.withdrawFrom(100000000000000, aventusApi.accounts[1]);
  console.log('Protocol balance 0', await avtManager.getBalance(aventusApi.parameters.from));
  console.log('Protocol balance 1', await avtManager.getBalance(aventusApi.accounts[1]));

  await aventusApi.tearDown();

  console.log("FINISHED");
}

return main();