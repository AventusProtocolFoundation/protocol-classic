const eip55 = require('eip55');
const fs = require('fs');
const path = require('path');

const storageJsonFilePath = path.join(__dirname, '..', '/api/');

/**
 * @return TruffleContract for AventusStorage.
 * NOTE: Be aware that 'at' returns a 'thenable' contract that is not really a promise. It has a
 * 'then' method and the storage methods:
 * see https://github.com/trufflesuite/truffle-contract/blob/develop/contract.js
 */
function getStorageContractFromJsonFile(_aventusStorage, _network = '') {
  const storageJsonFile = getStorageFileName(_network);
  const rawdata = fs.readFileSync(storageJsonFile);
  return _aventusStorage.at(JSON.parse(rawdata).address);
}

function getStorageContractDescriptor(_network = '') {
  const storageJsonFile = getStorageFileName(_network);
  const rawdata = fs.readFileSync(storageJsonFile);
  return JSON.parse(rawdata);
}

function saveStorageContractToJsonFile(_aventusStorage, _network = '') {
  const storageJsonFile = getStorageFileName(_network);
  const sAddress = _aventusStorage.address;
  const storageObject = { address: eip55.encode(sAddress), abi: _aventusStorage.abi };
  fs.writeFileSync(storageJsonFile, JSON.stringify(storageObject, null, 4));
}

function getStorageFileName(_network) {
  var networkSuffix = '';
  // Use startsWith in case we are doing a dry-run truffle migration.
  if (_network.startsWith('rinkeby'))
    networkSuffix = 'rinkeby';
  else if (_network.startsWith('main'))
    networkSuffix = 'main';
  return storageJsonFilePath + 'storage' + networkSuffix + '.json'
}

async function getVersion(versioned) {
  const versionedInstance = await versioned.deployed();
  const version = await versionedInstance.getVersionMajorMinor();
  console.log('Deploying libraries and proxies with version', version);
  return version;
}

async function deploy(_deployer, _contract, ..._contractArguments) {
  const gasEstimate = await _contract.new.estimateGas(..._contractArguments);
  return _deployer.deploy(_contract, ..._contractArguments, {gas: gasEstimate});
}

function isTestNetwork(_networkName) {
  // NOTE: truffle dry-run migrations add a suffix: always check with startsWith.
  return _networkName.startsWith('development') || _networkName.startsWith('coverage') || _networkName.startsWith('rinkeby');
}

module.exports = {
  deploy,
  getStorageContractFromJsonFile,
  isTestNetwork,
  saveStorageContractToJsonFile,
  getStorageContractDescriptor,
  getVersion
};
