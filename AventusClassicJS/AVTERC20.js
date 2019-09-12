/**
 * AventusClassicJS wrapper for all methods in IERC20 interface.
 */

class AVTERC20 {

  constructor(_aventusApi) {
    this.aventusApi = _aventusApi;
    this.avt = this.aventusApi.avtERC20;
  }

  totalSupply() {
    return this.avt.methods.totalSupply().call();
  }

  balanceOf(_owner) {
    return this.avt.methods.balanceOf(_owner).call();
  }

  transfer(_to, _value) {
    return this.avt.methods.transfer(_to, _value).send(this.aventusApi.parameters);
  }

  transferFrom(_from, _to, _value) {
    return this.avt.methods.transferFrom(_from, _to, _value).send(this.aventusApi.parameters);
  }

  approve(_spender, _value) {
    return this.avt.methods.approve(_spender, _value).send(this.aventusApi.parameters);
  }

  allowance(_owner, _spender) {
    return this.avt.methods.allowance(_owner, _spender).send(this.aventusApi.parameters);
  }
}

module.exports = AVTERC20;