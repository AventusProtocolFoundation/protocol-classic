/**
 * AventusClassicJS wrapper for public methods in AVTFaucet contract.
 */

class AVTFaucet {

  constructor(_aventusApi) {
    this.aventusApi = _aventusApi;
    this.avtFaucet = this.aventusApi.avtFaucet;
  }

  getAddress() {
    return this.avtFaucet._address;
  }

  getNextPaymentTime() {
    return this.avtFaucet.methods.getNextPaymentTime().call();
  }

  drip() {
    return this.avtFaucet.methods.drip().send(this.aventusApi.parameters);
  }
}

module.exports = AVTFaucet;