const AventusStorage = artifacts.require('AventusStorage');
const AVTManager = artifacts.require('AVTManager');
const IERC20 = artifacts.require('IERC20');

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

  async getAvtManager() {
    if (!this.avtManager) this.avtManager = await AVTManager.deployed().contract;
    return this.avtManager;
  }
}

module.exports = TruffleContractsManager;
