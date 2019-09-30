class AventusAPI {
  async initialise(_contractsManager) {
    this.contractsManager = _contractsManager;

    this.networkType = await web3.eth.net.getNetworkType();
    this.accounts = await web3.eth.getAccounts();

    this.parameters = {
      from: this.accounts[0],
      gas: 7000000,
      gasPrice: 10e9  // 10 GWei
    };

    if (this.networkType.startsWith('rinkeby') || this.networkType.startsWith('main'))
      this.parameters.gasPrice = 20e9; // 20 GWei

    this.aventusStorage = await this.contractsManager.getStorage(this.networkType);
    this.avtERC20 = await this.contractsManager.getAVTERC20();
    this.avtManager = await this.contractsManager.getAvtManager();
    this.avtFaucet = await this.contractsManager.getAvtFaucet();
  }

  saveParameters() {
    this.savedParameters = Object.assign({}, this.parameters);
  }

  restoreParameters() {
    this.parameters = Object.assign({}, this.savedParameters);
  }

  tearDown() {
    this.contractsManager.tearDown();
  }
}

module.exports = AventusAPI;
