const common = require('./common.js');
const eip55 = require('eip55');
const fs = require('fs');

const IAventusStorage = artifacts.require('IAventusStorage');

const AVTFaucet = artifacts.require('AVTFaucet');

const AVTManager = artifacts.require('AVTManager');
const AVTManagerInterface = artifacts.require('IAVTManager');

const ProposalsManager = artifacts.require('ProposalsManager');
const ProposalsManagerInterface = artifacts.require('IProposalsManager');

const MembersManager = artifacts.require('MembersManager');
const MembersManagerInterface = artifacts.require('IMembersManager');

const EventsManager = artifacts.require('EventsManager');
const EventsManagerInterface = artifacts.require('IEventsManager');

const TimeMachine = artifacts.require('TimeMachine');
const TimeMachineInterface = artifacts.require('ITimeMachine');

const ParameterRegistry = artifacts.require('ParameterRegistry');
const abiPartLength = 16;

const Versioned = artifacts.require('Versioned');

module.exports = async function(_deployer, _networkName, _accounts) {
  await deployContracts(_deployer, _networkName);
  console.log('*** CONTRACTS DEPLOY COMPLETE');
};

let deployAVTFaucet;
let deployAVTManager;
let deployProposalsManager;
let deployMembersManager;
let deployEventsManager;
let deployParameterRegistry;
let deployTimeMachine;

let version;

async function deployContracts(_deployer, _networkName) {
  console.log('Deploying Contracts...');
  const developmentMode = common.isTestNetwork(_networkName)

  // ALWAYS deploy to development, NEVER to another network unless hard coded.
  deployAVTFaucet = developmentMode;
  deployAVTManager = developmentMode;
  deployProposalsManager = developmentMode;
  deployMembersManager = developmentMode;
  deployEventsManager = developmentMode;
  deployParameterRegistry = developmentMode;
  deployTimeMachine = developmentMode;

  version = await common.getVersion(Versioned);
  console.log('Deploying contracts with version', version);

  const storage = await common.getStorageContractFromJsonFile(IAventusStorage, _networkName);
  await doDeployProposalsManager(_deployer, storage);
  await doDeployAVTFaucet(_deployer, storage);
  await doDeployAVTManager(_deployer, storage);
  await doDeployMembersManager(_deployer, storage);
  await doDeployEventsManager(_deployer, storage);
  await doDeployParameterRegistry(_deployer, storage);
  await doDeployTimeMachine(_deployer, storage);
}

async function doDeployProposalsManager(_deployer, _storage) {
  if (!deployProposalsManager) return;
  await common.deploy(_deployer, ProposalsManager, _storage.address);
  await saveInterfaceToStorage(_storage, 'IProposalsManager', ProposalsManagerInterface, ProposalsManager);
  await _storage.allowAccess('write', ProposalsManager.address);
}

async function doDeployAVTManager(_deployer, _storage) {
  if (!deployAVTManager) return;
  await common.deploy(_deployer, AVTManager, _storage.address);
  await saveInterfaceToStorage(_storage, 'IAVTManager', AVTManagerInterface, AVTManager);
  await _storage.allowAccess('write', AVTManager.address);
  await _storage.allowAccess('transferAVT', AVTManager.address);
}

async function doDeployAVTFaucet(_deployer, _storage) {
  if (!deployAVTFaucet) return;
  console.log("deploying faucet");
  await common.deploy(_deployer, AVTFaucet, _storage.address);
  console.log("deployed faucet");
}

async function doDeployMembersManager(_deployer, _storage) {
  if (!deployMembersManager) return;
  await common.deploy(_deployer, MembersManager, _storage.address);
  await saveInterfaceToStorage(_storage, 'IMembersManager', MembersManagerInterface, MembersManager);
  await _storage.allowAccess('write', MembersManager.address);
}

async function doDeployEventsManager(_deployer, _storage) {
  if (!deployEventsManager) return;
  await common.deploy(_deployer, EventsManager, _storage.address);
  await saveInterfaceToStorage(_storage, 'IEventsManager', EventsManagerInterface, EventsManager);
  await _storage.allowAccess('write', EventsManager.address);
}

async function doDeployParameterRegistry(_deployer, _storage) {
  if (!deployParameterRegistry) return;
  await common.deploy(_deployer, ParameterRegistry, _storage.address);
  await _storage.allowAccess('write', ParameterRegistry.address);
  const parameterRegistry = await ParameterRegistry.deployed();
  await parameterRegistry.init();
}

async function doDeployTimeMachine(_deployer, _storage) {
  if (!deployTimeMachine) return;
  await common.deploy(_deployer, TimeMachine, _storage.address);
  await saveInterfaceToStorage(_storage, 'ITimeMachine', TimeMachineInterface, TimeMachine);
  await _storage.allowAccess('write', TimeMachine.address);
  const timeMachine = await TimeMachine.deployed();
  await timeMachine.init()
}

async function saveInterfaceToStorage(_storage, _interfaceName, _interfaceInstance, _implementation) {
  const versionedInterfaceName = _interfaceName + '-' + version;
  console.log('+ saveInterfaceToStorage', versionedInterfaceName);
  await _storage.setAddress(web3.utils.sha3(versionedInterfaceName + '_Address'), eip55.encode(_implementation.address));
  const numParts = Math.ceil(_interfaceInstance.abi.length / abiPartLength);
  await _storage.setUInt(web3.utils.sha3(versionedInterfaceName + '_Abi_NumParts'), numParts);
  console.log('Splitting ' + versionedInterfaceName + ' ABI into', numParts);

  for (let i = 0; i < numParts; ++i) {
    const start = i * abiPartLength;
    const end = start + abiPartLength;
    const part = JSON.stringify(_interfaceInstance.abi.slice(start, end), null, 0);
    await _storage.setString(web3.utils.sha3(versionedInterfaceName + '_Abi_Part_' + i), part);
  }
}