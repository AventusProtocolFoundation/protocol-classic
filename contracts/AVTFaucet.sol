pragma solidity ^0.5.2;

import "./Owned.sol";
import "./Versioned.sol";
import "./interfaces/IAventusStorage.sol";
import "./interfaces/IERC20.sol";
import "./libraries/LAventusTime.sol";

contract AVTFaucet is Owned, Versioned {
  bytes32 constant avtContractAddressKey = keccak256(abi.encodePacked("AVTERC20Instance"));

  IAventusStorage public s;

  mapping(address => uint) nextPayment;
  uint public dripWindow = 24 hours;
  uint public dripAmount = 10**19;

  constructor(IAventusStorage _s)
    public
  {
    s = _s;
  }

  function drip()
    external
  {
    uint currentTime = LAventusTime.getCurrentTime(s);
    require(nextPayment[msg.sender] <= currentTime, "Not yet");
    IERC20 erc20 = IERC20(s.getAddress(avtContractAddressKey));
    require(erc20.transfer(msg.sender, dripAmount), "Transfer failed");
    nextPayment[msg.sender] = currentTime + dripWindow;
  }

  function getNextPaymentTime()
    view
    external
    returns (uint _nextPayment)
  {
    _nextPayment = nextPayment[msg.sender];
  }

  function updateDripWindow(uint _dripWindow)
    onlyOwner
    external
  {
    dripWindow = _dripWindow;
  }

  function updateDripAmount(uint _dripAmount)
    onlyOwner
    external
  {
    dripAmount = _dripAmount;
  }
}