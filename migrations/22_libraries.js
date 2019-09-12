const common = require('./common.js');
const librariesCommon = require('./librariesCommon.js');

const IAventusStorage = artifacts.require('IAventusStorage');
const EventsManager = artifacts.require('EventsManager');
const Versioned = artifacts.require('Versioned');

// Libraries
const LEventsRoles = artifacts.require('LEventsRoles');
const LEventsEvents = artifacts.require('LEventsEvents');

const LEvents = artifacts.require('LEvents');
const LEventsClassic = artifacts.require('LEventsClassic');
const LEventsTickets = artifacts.require('LEventsTickets');
const LEventsStorage = artifacts.require('LEventsStorage');

// Proxies
const PEvents = artifacts.require('PEvents');
const PEventsClassic = artifacts.require('PEventsClassic');

module.exports = async function(_deployer, _networkName, _accounts) {
  console.log('*** Deploying Libraries (Part C)...');
  await deployLibraries(_deployer, _networkName);
  console.log('*** LIBRARIES PART C DEPLOY COMPLETE');
};

let deployLEvents, deployLEventsClassic;
let version;

async function deployLibraries(_deployer, _networkName) {
  const developmentMode = common.isTestNetwork(_networkName);

  deployLEvents = developmentMode;
  deployLEventsClassic = developmentMode;

  version = await common.getVersion(Versioned);
  const storageContract = await common.getStorageContractFromJsonFile(IAventusStorage, _networkName);
  await doDeployLEventsClassic(_deployer, storageContract);
  await doDeployLEvents(_deployer, storageContract);
}

async function deploySubLibraries(_deployer, _library) {
  if (_library === LEventsClassic) {
    await common.deploy(_deployer, LEventsStorage);
    await librariesCommon.linkMultiple(_deployer, LEventsStorage, [LEventsClassic, LEventsEvents, LEventsRoles, LEventsTickets]);
    await common.deploy(_deployer, LEventsEvents);
    await librariesCommon.linkMultiple(_deployer, LEventsEvents, [LEvents, LEventsClassic, LEventsRoles, LEventsTickets]);
    await common.deploy(_deployer, LEventsRoles);
    await librariesCommon.linkMultiple(_deployer, LEventsRoles, [LEvents, LEventsTickets]);
    await common.deploy(_deployer, LEventsTickets);
    await _deployer.link(LEventsTickets, LEventsClassic);
  }
}

function doDeployLEvents(_deployer, _storage) {
  const libraryName = 'LEventsInstance';
  const proxyName = 'PEventsInstance';
  const library = LEvents;
  const proxy = PEvents;
  const deployLibraryAndProxy = deployLEvents;
  const dependents = [EventsManager];

  return librariesCommon.doDeployLibraryAndProxy(web3, version, deploySubLibraries, _deployer, _storage, libraryName,
      proxyName, library, proxy, deployLibraryAndProxy, dependents);
}

function doDeployLEventsClassic(_deployer, _storage) {
  const libraryName = 'LEventsClassicInstance';
  const proxyName = 'PEventsClassicInstance';
  const library = LEventsClassic;
  const proxy = PEventsClassic;
  const deployLibraryAndProxy = deployLEventsClassic;
  const dependents = [LEvents, EventsManager];

  return librariesCommon.doDeployLibraryAndProxy(web3, version, deploySubLibraries, _deployer, _storage, libraryName,
      proxyName, library, proxy, deployLibraryAndProxy, dependents);
}
