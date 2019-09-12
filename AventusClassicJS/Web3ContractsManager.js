const common = require('../migrations/common.js');
const erc20 = require('../api/erc20.js');
const Web3Provider = require('../scripts/Web3Provider.js');
const Web3 = require('web3');

class Web3ContractsManager {

  initialise(_network) {
    if (typeof web3 !== 'undefined') {
      console.log('Using injected web3'); // From Metamask, or similar.
      return;
    }

    if (_network.startsWith('rinkeby') || _network.startsWith('main')) {
      this.provider = Web3Provider.getWalletProvider();
      this.parameters.gasPrice = 20e9; // 20 GWei
    } else if (_network.startsWith('http')) {
      this.provider = new Web3.providers.HttpProvider(_network);
    } else {
      process.exit(1);
    }
    global.web3 = new Web3(this.provider);
  }

  tearDown() {
    if (this.provider && this.provider.engine) {
      this.provider.engine.stop();
    }
  }

  async getStorage() {
    if (!this.aventusStorage) {
      const storageDescriptor = await common.getStorageContractDescriptor(this.networkType);
      this.storageAddress = (this.networkType === 'main') ? MAINNET_STORAGE_ADDRESS : storageDescriptor.address;
      this.aventusStorage = new web3.eth.Contract(storageDescriptor.abi, this.storageAddress);
    }
    return this.aventusStorage;
  }

  async getAVTERC20() {
    if (!this.avtERC20) {
      const avtAddress = await this.aventusStorage.methods.getAddress(web3.utils.soliditySha3('AVTERC20Instance')).call();
      this.avtERC20 = new web3.eth.Contract(erc20.abi, avtAddress);
    }
    return this.avtERC20;
  }

  async getAvtManager() {
    if (!this.avtManager) this.avtManager = await this.getImplementation('IAVTManager-0.1');
    return this.avtManager;
  }

  async getImplementation(_interfaceName) {
    const numAbiParts = await this.aventusStorage.methods.getUInt(web3.utils.sha3(_interfaceName + '_Abi_NumParts')).call();
    let contractAbi = [];
    for (let i = 0; i < numAbiParts; ++i) {
      const part = JSON.parse(await this.aventusStorage.methods.getString(
          web3.utils.sha3(_interfaceName + '_Abi_Part_' + i)).call());
      contractAbi = contractAbi.concat(part);
    }
    const address = await this.aventusStorage.methods.getAddress(web3.utils.sha3(_interfaceName + '_Address')).call();
    return new web3.eth.Contract(contractAbi, address);
  }
}

module.exports = Web3ContractsManager;
