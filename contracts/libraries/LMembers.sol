pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";
import "./LAventities.sol";
import "./LProposals.sol";
import "./LMembersStorage.sol";

library LMembers {

  // See IMembersManager interface for logs description.
  event LogMemberRegistered(address indexed memberAddress, string memberType, string evidenceUrl, string desc, uint deposit);
  event LogMemberDeregistered(address indexed memberAddress, string memberType);
  event LogMemberChallenged(address indexed memberAddress, string memberType, uint indexed proposalId, uint lobbyingStart,
      uint votingStart, uint revealingStart, uint revealingEnd);
  event LogMemberChallengeEnded(address indexed memberAddress, string memberType, uint indexed proposalId, uint votesFor,
      uint votesAgainst);

  modifier onlyValidMemberType(string memory _memberType) {
    require(isValidMemberType(_memberType), "Member type is not valid");
    _;
  }

  modifier onlyAfterDeregistrationTime(IAventusStorage _storage, address _memberAddress, string memory _memberType) {
    uint deregistrationTime = getDeregistrationTime(_storage, _memberAddress, _memberType);
    require(LAventusTime.getCurrentTime(_storage) >= deregistrationTime, "Member cannot be deregistered yet");
    _;
  }

  modifier onlyIfNotAlreadyRegistered(IAventusStorage _storage, address _memberAddress, string memory _memberType) {
    require(0 == getAventityIdForMember(_storage, _memberAddress, _memberType), "Member must not be registered");
    _;
  }

  modifier onlyIfRegistered(IAventusStorage _storage, address _memberAddress, string memory _memberType) {
    require(getAventityIdForMember(_storage, _memberAddress, _memberType) != 0, "Member is not registered");
    _;
  }

  function registerMember(IAventusStorage _storage, address _memberAddress, string calldata _memberType,
      string calldata _evidenceUrl, string calldata _desc)
    external
    onlyValidMemberType(_memberType)
    onlyIfNotAlreadyRegistered(_storage, _memberAddress, _memberType)
  {
    require(bytes(_evidenceUrl).length != 0, "Member requires a non-empty evidence URL");
    require(bytes(_desc).length != 0, "Member requires a non-empty description");

    uint memberDeposit = getNewMemberDeposit(_storage, _memberType);
    uint aventityId = LAventities.registerAventity(_storage, _memberAddress, memberDeposit);

    // In addition to the standard aventity data, members need a mapping from member address and type to aventityId.
    LMembersStorage.setAventityId(_storage, _memberAddress, _memberType, aventityId);
    emit LogMemberRegistered(_memberAddress, _memberType, _evidenceUrl, _desc, memberDeposit);
  }

  function deregisterMember(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
    onlyIfRegistered(_storage, _memberAddress, _memberType)
    onlyAfterDeregistrationTime(_storage, _memberAddress, _memberType)
  {
    uint aventityId = getAventityIdForMember(_storage, _memberAddress, _memberType);
    LAventities.deregisterAventity(_storage, aventityId);

    // Reset back to as if the member had never been registered.
    LMembersStorage.clearAventityId(_storage, _memberAddress, _memberType);
    LMembersStorage.clearExpiryTime(_storage, _memberAddress, _memberType);

    emit LogMemberDeregistered(_memberAddress, _memberType);
  }

  function challengeMember(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
  {
    uint aventityId = getAventityIdForMember(_storage, _memberAddress, _memberType);
    uint proposalId = LAventities.challengeAventity(_storage, aventityId);
    (uint lobbyingStart, uint votingStart, uint revealingStart, uint revealingEnd) =
        LProposals.getTimestamps(_storage, proposalId);
    emit LogMemberChallenged(_memberAddress, _memberType, proposalId, lobbyingStart, votingStart, revealingStart, revealingEnd);
  }

  function endMemberChallenge(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
  {
    uint aventityId = getAventityIdForMember(_storage, _memberAddress, _memberType);
    require(aventityId != 0, "Member is not registered");

    (uint proposalId, uint votesFor, uint votesAgainst, bool challengeWon) =
        LAventities.endAventityChallenge(_storage, aventityId);

    if (challengeWon)
      LMembersStorage.clearAventityId(_storage, _memberAddress, _memberType);

    emit LogMemberChallengeEnded(_memberAddress, _memberType, proposalId, votesFor, votesAgainst);
  }

  function getExistingMemberDeposit(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
    view
    onlyIfRegistered(_storage, _memberAddress, _memberType)
    returns (uint memberDepositInAVT_)
  {
    uint aventityId = getAventityIdForMember(_storage, _memberAddress, _memberType);
    memberDepositInAVT_ = LAventities.getExistingAventityDeposit(_storage, aventityId);
  }

  function updateExpiryTimeIfNecessary(IAventusStorage _storage, address _memberAddress, string calldata _memberType,
      uint _expiryTime)
    external
  {
    LMembersStorage.updateExpiryTimeIfNecessary(_storage, _memberAddress, _memberType, _expiryTime);
  }

  function memberIsActive(IAventusStorage _storage, address _memberAddress, string calldata _memberType)
    external
    view
    returns (bool aventityIsRegistered_)
  {
    uint aventityId = getAventityIdForMember(_storage, _memberAddress, _memberType);
    aventityIsRegistered_ = LAventities.aventityIsActive(_storage, aventityId);
  }

  function getNewMemberDeposit(IAventusStorage _storage, string memory _memberType)
    public
    view
    onlyValidMemberType(_memberType)
    returns (uint depositinAVT_)
  {
    depositinAVT_ = LMembersStorage.getFixedDepositAmount(_storage, _memberType);
  }

  function getAventityIdForMember(IAventusStorage _storage, address _memberAddress, string memory _memberType)
    public
    view
    returns (uint aventityId_)
  {
    aventityId_ = LMembersStorage.getAventityId(_storage, _memberAddress, _memberType);
  }

  function getDeregistrationTime(IAventusStorage _storage, address _memberAddress, string memory _memberType)
    public
    view
    onlyValidMemberType(_memberType)
    returns (uint deregistrationTime_)
  {
    deregistrationTime_ = LMembersStorage.getDeregistrationTime(_storage, _memberAddress, _memberType);
  }

  function isValidMemberType(string memory _memberType)
    private
    pure
    returns (bool isValid_)
  {
    isValid_ = LMembersStorage.isValidMemberType(_memberType);
  }
}