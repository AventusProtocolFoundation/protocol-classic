const Web3ContractsManager = require('../AventusClassicJS/Web3ContractsManager.js');
const AventusAPI = require('../AventusClassicJS/AventusAPI.js');

async function main() {
  console.log('Starting AVT Reference App');
  const contractsManager = new Web3ContractsManager();
  await contractsManager.initialise('rinkeby');
  const aventusApi = new AventusAPI();
  await aventusApi.initialise(contractsManager);
  const BN = web3.utils.BN;
  console.log('*** ...done***\n');

  let params = aventusApi.parameters;

  const key = aventusApi.hash('Events' + 'PaidEventDepositAmount');
  const value = (new BN(20)).mul(new BN(10).pow(new BN(18))).toString();

  params.gas = await aventusApi.aventusStorage.methods.setUInt(key, value).estimateGas(params);
  params.gasPrice = await web3.eth.getGasPrice();

  // Change this to be something reasonable if using a public net: eg see ethgastation.info
  console.log('Using gas price', params.gasPrice);
  const weiRequired = params.gasPrice * 1; // params.gas;
  const existingBalance = await web3.eth.getBalance(params.from);
  console.log('Wei required  =', weiRequired);
  console.log('Balance =', existingBalance);

  if (weiRequired > existingBalance) {
    console.log('*** WARNING: weiRequired > existingBalance: transaction may fail');
  } else {
    console.log('Balance should be enough');
  }

  console.log('Setting key:', key, 'to value:', value, '...');
  try {
    console.log('Before     :', await aventusApi.aventusStorage.methods.getUInt(key).call());
    console.log('Changing to:', value);
    // WARNING: Uncomment this line to make the actual change.
    // await aventusApi.aventusStorage.methods.setUInt(key, value).send(params);
    console.log('After      :', await aventusApi.aventusStorage.methods.getUInt(key).call());
    console.log('...done');
  } catch (e) {
    console.log('ERROR:', e);
  }

  aventusApi.tearDown();
}

return main();
