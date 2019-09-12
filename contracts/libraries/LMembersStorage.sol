pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";

library LMembersStorage {

  bytes32 constant primaryHash = keccak256(abi.encodePacked("Primary"));
  bytes32 constant secondaryHash = keccak256(abi.encodePacked("Secondary"));

  string constant membersTable = "Members";
  string constant memberTable = "Member";

  function getFixedDepositAmount(IAventusStorage _storage, string calldata _memberType)
    external
    view
    returns (uint fixedDepositAmount_)
  {
    fixedDepositAmount_ = _storage.getUInt(keccak256(abi.encodePacked(membersTable, _memberType, "FixedDepositAmount")));
  }

  function getAventityId(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
    view
    returns (uint aventityId_)
  {
    bytes32 memberKey = keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "AventityId"));
    aventityId_ = _storage.getUInt(memberKey);
  }

  function setAventityId(IAventusStorage _storage, address _memberAddress, string calldata _memberType, uint _aventityId)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "AventityId")), _aventityId);
  }

  function clearAventityId(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "AventityId")), 0);
  }

  function getDeregistrationTime(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
    view
    returns (uint deregistrationTime_)
  {
    bytes32 key = keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "ExpiryTime"));
    uint expiryTime = _storage.getUInt(key);
    if (expiryTime != 0) {
      uint coolingOffPeriod = getCoolingOffPeriod(_storage, _memberType);
      deregistrationTime_ = expiryTime + coolingOffPeriod;
    }
  }

  function updateExpiryTimeIfNecessary(IAventusStorage _storage, address _memberAddress, string calldata _memberType,
      uint _expiryTime)
    external
  {
    bytes32 key = keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "ExpiryTime"));
    if (_expiryTime > _storage.getUInt(key))
      _storage.setUInt(key, _expiryTime);
  }

  function clearExpiryTime(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
  {
    bytes32 key = keccak256(abi.encodePacked(memberTable, _memberAddress, "Type", _memberType, "ExpiryTime"));
    _storage.setUInt(key, 0);
  }

  function isValidMemberType(string calldata _memberType)
    external
    pure
    returns (bool isValid_)
  {
    bytes32 hashedType = keccak256(abi.encodePacked(_memberType));
    isValid_ = hashedType == primaryHash || hashedType == secondaryHash;
  }

  function getCoolingOffPeriod(IAventusStorage _storage, string memory _memberType)
    private
    view
    returns (uint coolingOffPeriod_)
  {
    bytes32 coolingOffPeriodKey = keccak256(abi.encodePacked(membersTable, _memberType, "CoolingOffPeriod"));
    coolingOffPeriod_ = _storage.getUInt(coolingOffPeriodKey);
  }
}