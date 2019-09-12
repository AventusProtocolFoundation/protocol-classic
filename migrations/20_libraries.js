const common = require('./common.js');
const librariesCommon = require('./librariesCommon.js');

const IAventusStorage = artifacts.require('IAventusStorage');
const ProposalsManager = artifacts.require('ProposalsManager');
const AVTFaucet = artifacts.require('AVTFaucet');
const AVTManager = artifacts.require('AVTManager');
const Versioned = artifacts.require('Versioned');

// Libraries
const LAventities = artifacts.require('LAventities');
const LMembers = artifacts.require('LMembers');
const LAventusTime = artifacts.require('LAventusTime');
const LAventusTimeMock = artifacts.require('LAventusTimeMock');
const LAventitiesChallenges = artifacts.require('LAventitiesChallenges');
const LProposalsEnact = artifacts.require('LProposalsEnact');
const LEvents = artifacts.require('LEvents');
const LAVTManager = artifacts.require('LAVTManager');
const LProposalsVoting = artifacts.require('LProposalsVoting');
const LProposals = artifacts.require('LProposals');
const LEventsStorage = artifacts.require('LEventsStorage');
const LEventsClassic = artifacts.require('LEventsClassic');
const LMembersStorage = artifacts.require('LMembersStorage');
const LAVTStorage = artifacts.require('LAVTStorage');
const TimeMachine = artifacts.require('TimeMachine');

// Proxies
const PAventusTime = artifacts.require('PAventusTime');
const PAVTManager = artifacts.require('PAVTManager');

module.exports = async function(_deployer, _networkName, _accounts) {
    console.log('*** Deploying Libraries (Part A)...');
    await deployLibraries(_deployer, _networkName);
    console.log('*** LIBRARIES PART A DEPLOY COMPLETE');
};

let deployLAventusTime;
let deployLAVTManager;
let deployLAventusTimeMock;
let version;

async function deployLibraries(_deployer, _networkName) {
  const testMode = common.isTestNetwork(_networkName);

  deployLAventusTime = testMode;
  deployLAVTManager = testMode;
  deployLAventusTimeMock = testMode;  // TODO: Do we ALWAYS want Rinkeby to use mock time mode?

  await doDeployVersion(_deployer);
  const storageContract = await common.getStorageContractFromJsonFile(IAventusStorage, _networkName);
  await doDeployLAventusTime(_deployer, storageContract);
  await doDeployLAVTManager(_deployer, storageContract);
}

async function deploySubLibraries(_deployer, _library) {
  if (_library === LAVTManager) {
    await common.deploy(_deployer, LAVTStorage);
    await _deployer.link(LAVTStorage, LAVTManager);
  }
}

async function doDeployVersion(_deployer) {
  await common.deploy(_deployer, Versioned);
  version = await common.getVersion(Versioned);
}

async function doDeployLAventusTime(_deployer, _storage) {
  const libraryName = 'LAventusTimeInstance';
  const proxyName = 'PAventusTimeInstance';
  const library = LAventusTime;
  const proxy = PAventusTime;
  const deployLibraryAndProxy = deployLAventusTime;
  const dependents = [LAVTStorage, LEventsClassic, LEvents, LEventsStorage, LMembers, LMembersStorage,
      LProposalsEnact, LProposals, AVTFaucet];

  await librariesCommon.doDeployLibraryAndProxy(web3, version, deploySubLibraries, _deployer, _storage, libraryName, proxyName,
      library, proxy, deployLibraryAndProxy, dependents);
  if (deployLAventusTimeMock) {
    await common.deploy(_deployer, LAventusTimeMock);
    await _deployer.link(LAventusTimeMock, TimeMachine);
    await librariesCommon.setProxiedLibraryAddress(web3, version, _storage, libraryName, LAventusTimeMock.address);
  }
}

function doDeployLAVTManager(_deployer, _storage) {
  const libraryName = 'LAVTManagerInstance';
  const proxyName = 'PAVTManagerInstance';
  const library = LAVTManager;
  const proxy = PAVTManager;
  const deployLibraryAndProxy = deployLAVTManager;
  const dependents = [LAventitiesChallenges, LProposalsVoting, LAventities, AVTManager, LProposalsEnact];

  return librariesCommon.doDeployLibraryAndProxy(web3, version, deploySubLibraries, _deployer, _storage, libraryName,
      proxyName, library, proxy, deployLibraryAndProxy, dependents);
}