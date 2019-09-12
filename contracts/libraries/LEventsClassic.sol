pragma solidity ^0.5.2;

import "./LEventsStorage.sol";
import "./LAventities.sol";
import "./LAventusTime.sol";
import "./LEventsEvents.sol";
import "./LEventsTickets.sol";
import "./LProposals.sol";

library LEventsClassic {

  enum EventState {NonExistent, Reporting, Trading, OffSale, Inactive}

  // See IEventsManager interface for logs description
  event LogEventTakenOffSale(uint indexed eventId);
  event LogEventCancelled(uint indexed eventId);
  event LogEventEnded(uint indexed eventId);
  event LogEventChallenged(uint indexed eventId, uint indexed proposalId, uint lobbyingStart, uint votingStart,
      uint revealingStart, uint revealingEnd);
  event LogEventChallengeEnded(uint indexed eventId, uint indexed proposalId, uint votesFor, uint votesAgainst);

  modifier onlyEventOwner(IAventusStorage _storage, uint _eventId) {
    LEventsEvents.senderMustBeEventOwner(_storage, _eventId);
    _;
  }

  modifier onlyWhenExistent(IAventusStorage _storage, uint _eventId) {
    require(exists(_storage, _eventId), "Event must exist");
    _;
  }

  modifier onlyWhenReporting(IAventusStorage _storage, uint _eventId) {
    require(EventState.Reporting == getEventState(_storage, _eventId), "Event must be reporting");
    _;
  }

  modifier onlyWhenTrading(IAventusStorage _storage, uint _eventId) {
    require(EventState.Trading == getEventState(_storage, _eventId), "Event must be trading");
    _;
  }

  modifier onlyWhenInactive(IAventusStorage _storage, uint _eventId) {
    require(EventState.Inactive == getEventState(_storage, _eventId), "Event must be inactive");
    _;
  }

  function takeEventOffSale(IAventusStorage _storage, uint _eventId)
    external
    onlyWhenTrading(_storage, _eventId)
    onlyEventOwner(_storage, _eventId)
  {
    uint currentTime = LAventusTime.getCurrentTime(_storage);
    LEventsStorage.setOffSaleTime(_storage, _eventId, currentTime);

    emit LogEventTakenOffSale(_eventId);
  }

 function cancelEvent(IAventusStorage _storage, uint _eventId)
    external
    onlyWhenReporting(_storage, _eventId)
    onlyEventOwner(_storage, _eventId)
  {
    deregisterEvent(_storage, _eventId);

    emit LogEventCancelled(_eventId);
  }

  function endEvent(IAventusStorage _storage, uint _eventId)
    external
    onlyWhenInactive(_storage, _eventId)
  {
    deregisterEvent(_storage, _eventId);

    emit LogEventEnded(_eventId);
  }

  function challengeEvent(IAventusStorage _storage, uint _eventId)
    external
    returns (uint proposalId_, uint lobbyingStart_, uint votingStart_, uint revealingStart_, uint revealingEnd_)
  {
    uint aventityId = LEventsStorage.getAventityId(_storage, _eventId);
    proposalId_ = LAventities.challengeAventity(_storage, aventityId);
    (lobbyingStart_, votingStart_, revealingStart_, revealingEnd_) = LProposals.getTimestamps(_storage, proposalId_);

    emit LogEventChallenged(_eventId, proposalId_, lobbyingStart_, votingStart_, revealingStart_, revealingEnd_);
  }

  function endEventChallenge(IAventusStorage _storage, uint _eventId)
    external
    returns (uint proposalId_, uint votesFor_, uint votesAgainst_)
  {
    uint aventityId = LEventsStorage.getAventityId(_storage, _eventId);
    require(aventityId != 0, "Event does not exist");
    bool challengeWon;
    (proposalId_, votesFor_, votesAgainst_, challengeWon) = LAventities.endAventityChallenge(_storage, aventityId);

    if (challengeWon)
      LEventsStorage.clearAventityId(_storage, _eventId);

    emit LogEventChallengeEnded(_eventId, proposalId_, votesFor_, votesAgainst_);
  }

  function getNewEventDeposit(IAventusStorage _storage, uint _averageTicketPriceInUSCents)
    external
    view
    returns (uint depositInAVT_)
  {
    depositInAVT_ = LEventsEvents.getNewEventDeposit(_storage, _averageTicketPriceInUSCents);
  }

  function getExistingEventDeposit(IAventusStorage _storage, uint _eventId)
    external
    view
    onlyWhenExistent(_storage, _eventId)
    returns (uint eventDeposit_)
  {
    uint aventityId = LEventsStorage.getAventityId(_storage, _eventId);
    eventDeposit_ = LAventities.getExistingAventityDeposit(_storage, aventityId);
  }

  function sellTicket(IAventusStorage _storage, uint _eventId, bytes32 _vendorTicketRefHash, string calldata _ticketMetadata,
      address _buyer)
    external
    onlyWhenTrading(_storage, _eventId)
  {
    LEventsTickets.sellTicket(_storage, _eventId, _vendorTicketRefHash, _ticketMetadata, _buyer);
  }

  function sellMultipleTickets(IAventusStorage _storage, uint _eventId, string calldata _ticketMetaData, bytes calldata _tickets)
    external
    onlyWhenTrading(_storage, _eventId)
  {
    LEventsTickets.sellMultipleTickets(_storage, _eventId, _ticketMetaData, _tickets);
  }

  function sellMultipleTickets(IAventusStorage _storage, uint _eventId, bytes calldata _tickets)
    external
    onlyWhenTrading(_storage, _eventId)
  {
    LEventsTickets.sellMultipleTickets(_storage, _eventId, _tickets);
  }

  function cancelTicket(IAventusStorage _storage, uint _eventId, uint _ticketId)
    external
    onlyWhenTrading(_storage, _eventId)
  {
    LEventsTickets.cancelTicket(_storage, _eventId, _ticketId);
  }

  function resellTicket(IAventusStorage _storage, uint _eventId, uint _ticketId, bytes calldata _resellTicketTicketOwnerProof,
      address _newBuyer)
    external
    onlyWhenTrading(_storage, _eventId)
  {
    LEventsTickets.resellTicket(_storage, _eventId, _ticketId, _resellTicketTicketOwnerProof, _newBuyer);
  }

  function exists(IAventusStorage _storage, uint _eventId)
    public
    view
    returns (bool exists_)
  {
    uint eventAventityId = LEventsStorage.getAventityId(_storage, _eventId);
    exists_ = LAventities.aventityIsActive(_storage, eventAventityId);
  }

  function deregisterEvent(IAventusStorage _storage, uint _eventId)
    private
  {
    uint aventityId = LEventsStorage.getAventityId(_storage, _eventId);
    LAventities.deregisterAventity(_storage, aventityId);
  }

  function getEventState(IAventusStorage _storage, uint _eventId)
    private
    view
    returns (EventState)
  {
    if (!exists(_storage, _eventId))
      return EventState.NonExistent;

    uint currentTime = LAventusTime.getCurrentTime(_storage);

    if (currentTime >= LEventsEvents.getEventTime(_storage, _eventId))
      return EventState.Inactive;
    if (currentTime >= LEventsStorage.getOffSaleTime(_storage, _eventId))
      return EventState.OffSale;
    if (currentTime >= LEventsStorage.getOnSaleTime(_storage, _eventId))
      return EventState.Trading;

    return EventState.Reporting;
  }
}