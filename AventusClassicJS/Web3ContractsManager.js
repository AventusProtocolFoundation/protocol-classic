const common = require('../migrations/common.js');
const erc20 = require('../api/erc20.js');
const AVTFaucet = require('../api/AVTFaucet.js');
const Web3Provider = require('../scripts/Web3Provider.js');
const Web3 = require('web3');

class Web3ContractsManager {

  initialise(_networkType) {
    if (_networkType == null || _networkType == "")
      _networkType = process.env.ETH_truffleNetwork;

    this.networkType = _networkType;

    console.log('Connecting to network:', this.networkType);

    if (typeof web3 !== 'undefined') {
      console.log('Using injected web3'); // From Metamask, or similar.
      return;
    }

    if (this.networkType.startsWith('rinkeby') || this.networkType.startsWith('main')) {
      this.provider = Web3Provider.getWalletProvider();
    } else if (this.networkType.startsWith('http')) {
      this.provider = new Web3.providers.HttpProvider(this.networkType);
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
      this.storageAddress = storageDescriptor.address;
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

  async getAvtFaucet() {
    const avtFaucetAddressGanache = '0xaC5b759bDF8E951d41FA1914e1a2F07E1497A07d';
    const avtFaucetAddressRinkeby = '0x3D125E619955623d463Cf1a62A316356bB3b1C2D';
    const avtFaucetAddress = (this.networkType.startsWith('rinkeby')) ? avtFaucetAddressRinkeby : avtFaucetAddressGanache;

    if (!this.avtFaucet) {
      this.avtFaucet = new web3.eth.Contract(AVTFaucet.abi, avtFaucetAddress);
    }
    return this.avtFaucet;
  }

  async getAvtManager() {
    if (!this.avtManager) this.avtManager = await this.getImplementation('IAVTManager-1.0');
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
