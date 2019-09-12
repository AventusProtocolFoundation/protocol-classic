pragma solidity ^0.5.2;

import "./interfaces/IAventusStorage.sol";
import "./Owned.sol";
import "./Versioned.sol";

contract ParameterRegistry is Owned, Versioned {

  string private constant aventitiesTable = "Aventities";
  string private constant membersTable = "Members";
  string private constant parameterRegistryTable = "ParameterRegistry";
  string private constant proposalsTable = "Proposals";
  string private constant eventsTable = "Events";

  uint private constant oneAVTInNat = 10**18;

  // Proposal default values.
  uint private constant COMMUNITY_PROPOSAL_LOBBYING_PERIOD = 2 weeks;
  uint private constant COMMUNITY_PROPOSAL_VOTING_PERIOD = 1 weeks;
  uint private constant COMMUNITY_PROPOSAL_REVEALING_PERIOD = 1 weeks;
  uint private constant COMMUNITY_PROPOSAL_DEPOSIT = 100 * oneAVTInNat; // In AVT
  uint private constant GOVERNANCE_PROPOSAL_LOBBYING_PERIOD = 2 weeks;
  uint private constant GOVERNANCE_PROPOSAL_VOTING_PERIOD = 1 weeks;
  uint private constant GOVERNANCE_PROPOSAL_REVEALING_PERIOD = 1 weeks;
  uint private constant GOVERNANCE_PROPOSAL_DEPOSIT = 100 * oneAVTInNat; // In AVT
  uint private constant AVENTITY_CHALLENGE_LOBBYING_PERIOD = 2 weeks;
  uint private constant AVENTITY_CHALLENGE_VOTING_PERIOD = 1 weeks;
  uint private constant AVENTITY_CHALLENGE_REVEALING_PERIOD = 1 weeks;
  uint private constant AVENTITY_CHALLENGE_PERIOD = AVENTITY_CHALLENGE_LOBBYING_PERIOD + AVENTITY_CHALLENGE_VOTING_PERIOD +
      AVENTITY_CHALLENGE_REVEALING_PERIOD;
  uint private constant AVENTITY_WINNINGS_FOR_CHALLENGE_ENDER_PERCENTAGE = 10;
  uint private constant AVENTITY_WINNINGS_FOR_CHALLENGE_WINNER_PERCENTAGE = 10;

  // Member default values.
  uint private constant PRIMARY_DEPOSIT = 5000 * oneAVTInNat; // In AVT
  uint private constant SECONDARY_DEPOSIT = 5000 * oneAVTInNat; // In AVT
  // Time after last trade that trader can be deregistered.
  uint private constant PRIMARY_COOLING_OFF_PERIOD = 2 weeks;
  uint private constant SECONDARY_COOLING_OFF_PERIOD = 2 weeks;
  // Events default values.
  uint private constant EVENT_FREE_DEPOSIT = 1000 * oneAVTInNat; // In AVT
  uint private constant EVENT_PAID_DEPOSIT = 2000 * oneAVTInNat; // In AVT
  uint private constant EVENT_INVESTIGATION_PERIOD = 2 days;
  uint private constant EVENT_MINIMUM_REPORTING_PERIOD = EVENT_INVESTIGATION_PERIOD + AVENTITY_CHALLENGE_PERIOD;

  IAventusStorage public s;

  constructor(IAventusStorage _s)
    public
  {
    s = _s;
  }

  // @dev This must be called ONCE and ONCE ONLY, after the permission is given to write to storage as part of migration.
  function init()
    external
    onlyOwner
  {
    require(!s.getBoolean(keccak256(abi.encodePacked(parameterRegistryTable, "Init"))), "Cannot reinit ParameterRegistry");

    s.setBoolean(keccak256(abi.encodePacked(parameterRegistryTable, "Init")), true);

    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "CommunityProposalLobbyingPeriod")),
        COMMUNITY_PROPOSAL_LOBBYING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "CommunityProposalVotingPeriod")), COMMUNITY_PROPOSAL_VOTING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "CommunityProposalRevealingPeriod")),
        COMMUNITY_PROPOSAL_REVEALING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "CommunityProposalFixedDeposit")), COMMUNITY_PROPOSAL_DEPOSIT);

    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "GovernanceProposalLobbyingPeriod")),
        GOVERNANCE_PROPOSAL_LOBBYING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "GovernanceProposalVotingPeriod")), GOVERNANCE_PROPOSAL_VOTING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "GovernanceProposalRevealingPeriod")),
        GOVERNANCE_PROPOSAL_REVEALING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(proposalsTable, "GovernanceProposalFixedDeposit")), GOVERNANCE_PROPOSAL_DEPOSIT);

    s.setUInt(keccak256(abi.encodePacked(aventitiesTable, "ChallengeLobbyingPeriod")), AVENTITY_CHALLENGE_LOBBYING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(aventitiesTable, "ChallengeVotingPeriod")), AVENTITY_CHALLENGE_VOTING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(aventitiesTable, "ChallengeRevealingPeriod")), AVENTITY_CHALLENGE_REVEALING_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(aventitiesTable, "WinningsForChallengeEnderPercentage")),
        AVENTITY_WINNINGS_FOR_CHALLENGE_ENDER_PERCENTAGE);
    s.setUInt(keccak256(abi.encodePacked(aventitiesTable, "WinningsForChallengeWinnerPercentage")),
        AVENTITY_WINNINGS_FOR_CHALLENGE_WINNER_PERCENTAGE);

    s.setUInt(keccak256(abi.encodePacked(membersTable, "Primary", "FixedDepositAmount")), PRIMARY_DEPOSIT);
    s.setUInt(keccak256(abi.encodePacked(membersTable, "Primary", "CoolingOffPeriod")), PRIMARY_COOLING_OFF_PERIOD);
    s.setUInt(keccak256(abi.encodePacked(membersTable, "Secondary", "FixedDepositAmount")), SECONDARY_DEPOSIT);
    s.setUInt(keccak256(abi.encodePacked(membersTable, "Secondary", "CoolingOffPeriod")), SECONDARY_COOLING_OFF_PERIOD);

    s.setUInt(keccak256(abi.encodePacked(eventsTable, "FreeEventDepositAmount")), EVENT_FREE_DEPOSIT);
    s.setUInt(keccak256(abi.encodePacked(eventsTable, "PaidEventDepositAmount")), EVENT_PAID_DEPOSIT);
    s.setUInt(keccak256(abi.encodePacked(eventsTable, "MinimumEventReportingPeriod")), EVENT_MINIMUM_REPORTING_PERIOD);
  }
}