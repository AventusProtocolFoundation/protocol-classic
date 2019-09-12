pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";
import "./LEventsClassic.sol";
import "./LEventsEvents.sol";
import "./LEventsRoles.sol";
import "./LEventsTickets.sol";

/* @dev All external methods which are only called from EventsManager have the same function signature (and interface
 * documentation) as their namesakes in EventsManager.
 *
 * All external methods here should do the following and ONLY the following:
 *   - check that the event is in the correct state
 *   - call the method of the same name in a sublibrary to actually make the required change
 *   - emit the correct log if necessary
 * In particular, the methods SHOULD NOT check proofs or msg.sender validity - these checks should be done in the sublibrary.
 */

library LEvents {

  // See IEventsManager interface for logs description
  event LogEventCreated(uint indexed eventId, address indexed eventOwner, string eventDesc, uint eventTime,
      string eventSupportURL, uint onSaleTime, uint offSaleTime, uint averageTicketPriceInUSCents, uint depositInAVT);
  event LogEventRoleRegistered(uint indexed eventId, address indexed roleAddress, string role);

  modifier onlyWhenExistent(IAventusStorage _storage, uint _eventId) {
    require(LEventsClassic.exists(_storage, _eventId), "Event must exist");
    _;
  }

  function createEvent(IAventusStorage _storage, string calldata _eventDesc, uint _eventTime,
      string calldata _eventSupportURL, uint _onSaleTime, uint _offSaleTime, uint _averageTicketPriceInUSCents)
    external
  {
    (uint eventId, uint depositInAVT) = LEventsEvents.createEvent(_storage, _eventDesc, _eventTime,
        _onSaleTime, _offSaleTime, _averageTicketPriceInUSCents, msg.sender);

    emit LogEventCreated(eventId, msg.sender, _eventDesc, _eventTime, _eventSupportURL, _onSaleTime, _offSaleTime,
        _averageTicketPriceInUSCents, depositInAVT);

    require(bytes(_eventSupportURL).length != 0, "Event requires a non-empty support URL");
  }

  function registerRoleOnEvent(IAventusStorage _storage, uint _eventId, address _roleAddress, string calldata _role)
    external
    onlyWhenExistent(_storage, _eventId)
  {
    LEventsRoles.registerRoleOnEvent(_storage, _eventId, _roleAddress, _role);
    emit LogEventRoleRegistered(_eventId, _roleAddress, _role);
  }

  function getEventTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint eventTime_)
  {
    eventTime_ = LEventsEvents.getEventTime(_storage, _eventId);
  }

  function getOnSaleTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint onSaleTime_)
  {
    onSaleTime_ = LEventsEvents.getOnSaleTime(_storage, _eventId);
  }

  function getOffSaleTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint offSaleTime_)
  {
    offSaleTime_ = LEventsEvents.getOffSaleTime(_storage, _eventId);
  }
}