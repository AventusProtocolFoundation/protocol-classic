const AVTERC20 = require('../AventusClassicJS/AVTERC20.js');
const AVTFaucet = require('../AventusClassicJS/AVTFaucet.js');
const Web3ContractsManager = require('../AventusClassicJS/Web3ContractsManager.js');
const AventusAPI = require('../AventusClassicJS/AventusAPI.js');

async function main() {
  console.log('Initialising...');
  const contractsManager = new Web3ContractsManager();
  console.log('contractsManager...');
  await contractsManager.initialise('');
  const BN = web3.utils.BN;

  console.log('aventusApi...');
  const aventusApi = new AventusAPI();
  await aventusApi.initialise(contractsManager);

  const avtERC20 = new AVTERC20(aventusApi);
  const avtFaucet = new AVTFaucet(aventusApi);

  console.log('My AVT balance', await avtERC20.balanceOf(aventusApi.parameters.from));

  const faucetBalance = await avtERC20.balanceOf(avtFaucet.getAddress());
  console.log('Faucet balance', faucetBalance);
  const dripAmount = new BN(10).pow(new BN(19));

  if (faucetBalance < dripAmount) {
    // Give it enough for 1000 more drips.
    // await avtERC20.transfer(avtFaucet.getAddress(), dripAmount.mul(new BN(1000)).toString());
  }

  console.log('Dripping');
  try {
    await avtFaucet.drip();
  } catch (e) {
    console.log('Could not drip:', e);
  }
  console.log('My AVT balance', await avtERC20.balanceOf(aventusApi.parameters.from));
  console.log('Faucet balance', await avtERC20.balanceOf(avtFaucet.getAddress()));
  console.log('Next payment due at:', await avtFaucet.getNextPaymentTime());
  await aventusApi.tearDown();

  console.log("FINISHED");
}

return main();