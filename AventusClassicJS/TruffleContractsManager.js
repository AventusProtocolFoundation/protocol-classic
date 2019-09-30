const AventusStorage = artifacts.require('AventusStorage');
const AVTContractForTesting = artifacts.require('AVTContractForTesting');
const AVTFaucet = artifacts.require('AVTFaucet');
const AVTManager = artifacts.require('AVTManager');

class TruffleContractsManager {

  initialise(_network) {
    // Do nothing.
  }

  tearDown() {
    // Do nothing.
  }

  async getStorage() {
    if (!this.aventusStorage) this.aventusStorage = await AventusStorage.deployed().contract;
    return this.aventusStorage;
  }

  async getAVTERC20() {
    if (!this.avtERC20) this.avtERC20 = await AVTContractForTesting.deployed().contract;
    return this.avtERC20;
  }

  async getAvtFaucet() {
    if (!this.avtFaucet) this.avtFaucet = await AVTFaucet.deployed().contract;
    return this.avtFaucet;
  }

  async getAvtManager() {
    if (!this.avtManager) this.avtManager = await AVTManager.deployed().contract;
    return this.avtManager;
  }
}

module.exports = TruffleContractsManager;
