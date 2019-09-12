pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";

library LAventitiesStorage {

  string constant aventitiesTable = "Aventities";
  string constant aventityTable = "Aventity";

  bytes32 constant aventityCountKey = keccak256(abi.encodePacked(aventitiesTable, "AventityCount"));
  bytes32 constant challengeLobbyingPeriodKey = keccak256(abi.encodePacked(aventitiesTable, "ChallengeLobbyingPeriod"));
  bytes32 constant challengeVotingPeriodKey = keccak256(abi.encodePacked(aventitiesTable, "ChallengeVotingPeriod"));
  bytes32 constant challengeRevealingPeriodKey = keccak256(abi.encodePacked(aventitiesTable, "ChallengeRevealingPeriod"));
  bytes32 constant winningsForChallengeWinnerPercentageKey = keccak256(abi.encodePacked(aventitiesTable,
      "WinningsForChallengeWinnerPercentage"));
  bytes32 constant winningsForChallengeEnderPercentageKey = keccak256(abi.encodePacked(aventitiesTable,
      "WinningsForChallengeEnderPercentage"));

  function getAventityCount(IAventusStorage _storage)
    external
    view
    returns (uint aventityCount_)
  {
    aventityCount_ = _storage.getUInt(aventityCountKey);
  }

  function setAventityCount(IAventusStorage _storage, uint _aventityCount)
    external
  {
    _storage.setUInt(aventityCountKey, _aventityCount);
  }

  function getLobbyingPeriod(IAventusStorage _storage)
    external
    view
    returns (uint lobbyingPeriod_)
  {
    lobbyingPeriod_ = _storage.getUInt(challengeLobbyingPeriodKey);
  }

  function getVotingPeriod(IAventusStorage _storage)
    external
    view
    returns (uint votingPeriod_)
  {
    votingPeriod_ = _storage.getUInt(challengeVotingPeriodKey);
  }

  function getRevealingPeriod(IAventusStorage _storage)
    external
    view
    returns (uint revealingPeriod_)
  {
    revealingPeriod_ = _storage.getUInt(challengeRevealingPeriodKey);
  }

  function getWinningsForChallengeWinnerPercentage(IAventusStorage _storage)
    external
    view
    returns (uint winnerPercentage_)
  {
    winnerPercentage_ = _storage.getUInt(winningsForChallengeWinnerPercentageKey);
  }

  function getWinningsForChallengeEnderPercentage(IAventusStorage _storage)
    external
    view
    returns (uint enderPercentage_)
  {
    enderPercentage_ = _storage.getUInt(winningsForChallengeEnderPercentageKey);
  }

  function getDepositor(IAventusStorage _storage, uint _aventityId)
    external
    view
    returns (address depositor_)
  {
    depositor_ = _storage.getAddress(keccak256(abi.encodePacked(aventityTable, _aventityId, "Depositor")));
  }

  function setDepositor(IAventusStorage _storage, uint _aventityId, address _depositor)
    external
  {
    _storage.setAddress(keccak256(abi.encodePacked(aventityTable, _aventityId, "Depositor")), _depositor);
  }

  function getChallengeProposalId(IAventusStorage _storage, uint _aventityId)
    external
    view
    returns (uint challengeProposalId_)
  {
    challengeProposalId_ = _storage.getUInt(keccak256(abi.encodePacked(aventityTable, _aventityId, "Challenge")));
  }

  function setChallengeProposalId(IAventusStorage _storage, uint _aventityId, uint _challengeProposalId)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(aventityTable, _aventityId, "Challenge")), _challengeProposalId);
  }

  function getDeposit(IAventusStorage _storage, uint _aventityId)
    external
    view
    returns (uint deposit_)
  {
    deposit_ = _storage.getUInt(keccak256(abi.encodePacked(aventityTable, _aventityId, "Deposit")));
  }

  function setDeposit(IAventusStorage _storage, uint _aventityId, uint _deposit)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(aventityTable, _aventityId, "Deposit")), _deposit);
  }
}