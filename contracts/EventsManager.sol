pragma solidity ^0.5.2;

import "./interfaces/IAventusStorage.sol";
import "./interfaces/IEventsManager.sol";
import "./libraries/LEvents.sol";
import "./libraries/LEventsClassic.sol";
import "./Owned.sol";
import "./Versioned.sol";

contract EventsManager is IEventsManager, Owned, Versioned {

  IAventusStorage public s;

  constructor(IAventusStorage _s)
    public
  {
    s = _s;
  }

  function createEvent(string calldata _eventDesc, uint _eventTime, string calldata _eventSupportURL, uint _onSaleTime,
      uint _offSaleTime, uint _averageTicketPriceInUSCents)
    external
  {
    LEvents.createEvent(s, _eventDesc, _eventTime, _eventSupportURL, _onSaleTime, _offSaleTime, _averageTicketPriceInUSCents);
  }

  function registerRoleOnEvent(uint _eventId, address _roleAddress, string calldata _role)
    external
  {
    LEvents.registerRoleOnEvent(s, _eventId, _roleAddress, _role);
  }

  function takeEventOffSale(uint _eventId)
    external
  {
    LEventsClassic.takeEventOffSale(s, _eventId);
  }

  function cancelEvent(uint _eventId)
    external
  {
    LEventsClassic.cancelEvent(s, _eventId);
  }

  function endEvent(uint _eventId)
    external
  {
    LEventsClassic.endEvent(s, _eventId);
  }

  function challengeEvent(uint _eventId)
    external
  {
    LEventsClassic.challengeEvent(s, _eventId);
  }

  function endEventChallenge(uint _eventId)
    external
  {
    LEventsClassic.endEventChallenge(s, _eventId);
  }

  function getNewEventDeposit(uint _averageTicketPriceInUSCents)
    external
    view
    returns (uint depositInAVT_)
  {
    (depositInAVT_) = LEventsClassic.getNewEventDeposit(s, _averageTicketPriceInUSCents);
  }

  function getExistingEventDeposit(uint _eventId)
    external
    view
    returns(uint eventDeposit_)
  {
    eventDeposit_ = LEventsClassic.getExistingEventDeposit(s, _eventId);
  }

  function sellTicket(uint _eventId, bytes32 _vendorTicketRefHash, string calldata _ticketMetadata, address _buyer)
    external
  {
    LEventsClassic.sellTicket(s, _eventId, _vendorTicketRefHash, _ticketMetadata, _buyer);
  }

  function sellMultipleTickets(uint _eventId, bytes calldata _tickets)
    external
  {
    LEventsClassic.sellMultipleTickets(s, _eventId, _tickets);
  }

  function sellMultipleTicketsSameMetaData(uint _eventId, string calldata _ticketMetaData, bytes calldata _tickets)
    external
  {
    LEventsClassic.sellMultipleTickets(s, _eventId, _ticketMetaData, _tickets);
  }

  function cancelTicket(uint _eventId, uint _ticketId)
    external
  {
    LEventsClassic.cancelTicket(s, _eventId, _ticketId);
  }

  function resellTicket(uint _eventId, uint _ticketId, bytes calldata _ticketOwnerPermission, address _newBuyer)
    external
  {
    LEventsClassic.resellTicket(s, _eventId, _ticketId, _ticketOwnerPermission, _newBuyer);
  }

  function getEventTime(uint _eventId)
    external
    view
    returns (uint eventTime_)
  {
    eventTime_ = LEvents.getEventTime(s, _eventId);
  }

  function getOnSaleTime(uint _eventId)
    external
    view
    returns (uint onSaleTime_)
  {
    onSaleTime_ = LEvents.getOnSaleTime(s, _eventId);
  }

  function getOffSaleTime(uint _eventId)
    external
    view
    returns (uint offSaleTime_)
  {
    offSaleTime_ = LEvents.getOffSaleTime(s, _eventId);
  }
}