class AVTManager {

  constructor(_aventusApi, _avtERC20) {
    this.aventusApi = _aventusApi;
    this.avtERC20 = _avtERC20;
    this.avtManager = _aventusApi.avtManager;
    this.storageAddress = _aventusApi.aventusStorage._address;
  }

  /******************
   * Helper methods *
   ******************/

   approve(_amount) {
     return this.avtERC20.approve(this.storageAddress, _amount);
   }

  /**
   * @desc Approve and deposit AVT from the current account into the protocol. If _to is set, transfer to that account.
   * @param {string} _amount the amount of attoAVT to deposit
   * @param {address} _to the account to make the deposit to (default is main account)
   */
  async approveAndDeposit(_amount, _to) {
    _to = _to || this.aventusApi.parameters.from;
    await this.approve(_amount);
    await this.deposit(_amount, _to);
    if (_to != this.aventusApi.parameters.from) {
      await this.transfer(_amount, _to);
    }
  }

  /**
   * @notice Withdraw AVT from the protocol into the current account. If from is set, withdraw from that account.
   * @param {string} _amount Amount of attoAVT to withdraw.
   * @param {address} _from the account to make the withdrawl from
   */
  async withdrawFrom(_amount, _from) {
    if (_from && _from != this.aventusApi.parameters.from) {
      const currentAccount = this.aventusApi.parameters.from;
      this.aventusApi.saveParameters();
      this.aventusApi.parameters.from = _from;
      await this.transfer(_amount, currentAccount);
      this.aventusApi.restoreParameters();
    }
    await this.withdraw(_amount);
  }

  /*************************************************
   * Direct-to-contract methods
   *
   * See IAVTManager.sol in AventusClassic protocol
   ************************************************/

  /**
   * @notice Withdraw AVT that is not locked up.
   * @param {uint} _amount Amount of attoAVT to withdraw.
   */
  withdraw(_amount) {
    return this.avtManager.methods.withdraw(_amount).send(this.aventusApi.parameters);
  }

  /**
   * @notice Deposit AVT.
   * @param {uint} _amount Amount of attoAVT to deposit.
   */
  deposit(_amount) {
    return this.avtManager.methods.deposit(_amount).send(this.aventusApi.parameters);
  }

  /**
   * @notice Transfer AVT between two accounts.
   * @param {uint} _amount Amount of attoAVT to withdraw.
   * @param {address} _toAddress Address to be credited.
   */
  transfer(_amount, _toAddress) {
    return this.avtManager.methods.transfer(_amount, _toAddress).send(this.aventusApi.parameters);
  }

  /**
   * @return the current amount of attoAVT stored for the given address.
   * @param {address} _account the address that we want the balance of.
   */
  getBalance(_account) {
    return this.avtManager.methods.getBalance(_account).call(this.aventusApi.parameters);
  }

  /**
   * @return the amount of attoAVT stored for the given address at a specified timestamp.
   * @param {address} _account the address that we want the balance of.
   * @param {uint} _timestamp the time at which we want to know the balance.
   */
  getHistoricBalance(_account, _timestamp) {
    return this.avtManager.methods.getHistoricBalance(_account, _timestamp).call(this.aventusApi.parameters);
  }
}

module.exports = AVTManager;
