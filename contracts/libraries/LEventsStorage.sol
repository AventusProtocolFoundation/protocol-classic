pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";
import "./LAventusTime.sol";

library LEventsStorage {

  string constant eventsTable = "Events";
  string constant eventTable = "Event";

  bytes32 constant eventCountKey = keccak256(abi.encodePacked(eventsTable, "EventCount"));
  bytes32 constant MinimumEventReportingPeriodKey = keccak256(abi.encodePacked(eventsTable, "MinimumEventReportingPeriod"));
  bytes32 constant freeEventDepositAmountKey = keccak256(abi.encodePacked(eventsTable, "FreeEventDepositAmount"));
  bytes32 constant paidEventDepositAmountKey = keccak256(abi.encodePacked(eventsTable, "PaidEventDepositAmount"));

  function getFreeEventDepositInAVT(IAventusStorage _storage)
    external
    view
    returns (uint freeEventDeposit_)
  {
    freeEventDeposit_ = _storage.getUInt(freeEventDepositAmountKey);
  }

  function getPaidEventDepositInAVT(IAventusStorage _storage)
    external
    view
    returns (uint paidEventDeposit_)
  {
    paidEventDeposit_ = _storage.getUInt(paidEventDepositAmountKey);
  }

  function getEventCount(IAventusStorage _storage)
    external
    view
    returns (uint eventCount_)
  {
    eventCount_ = _storage.getUInt(eventCountKey);
  }

  function setEventCount(IAventusStorage _storage, uint _eventCount)
    external
  {
    _storage.setUInt(eventCountKey, _eventCount);
  }

  function isRoleOnEvent(IAventusStorage _storage, uint _eventId, address _roleAddress, string calldata _role)
    external
    view
    returns (bool isRegistered_)
  {
    bytes32 roleAddressKey = keccak256(abi.encodePacked(eventTable, _eventId, "Role", _role, "Address", _roleAddress));
    isRegistered_ = _storage.getBoolean(roleAddressKey);
  }

  function setRoleOnEvent(IAventusStorage _storage, uint _eventId, address _roleAddress, string calldata _role)
    external
  {
    _storage.setBoolean(keccak256(abi.encodePacked(eventTable, _eventId, "Role", _role, "Address", _roleAddress)), true);
  }

  function getTicketOwner(IAventusStorage _storage, uint _eventId, uint _ticketId)
    external
    view
    returns (address ticketOwner_)
  {
    ticketOwner_ = _storage.getAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Ticket", _ticketId, "TicketOwner")));
  }

  function setTicketOwner(IAventusStorage _storage, uint _eventId, uint _ticketId, address _ticketOwner)
    external
  {
    _storage.setAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Ticket", _ticketId, "TicketOwner")), _ticketOwner);
  }

  function getTicketVendor(IAventusStorage _storage, uint _eventId, uint _ticketId)
    external
    view
    returns (address vendor_)
  {
    vendor_ = _storage.getAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Ticket", _ticketId, "TicketVendor")));
  }

  function setTicketVendor(IAventusStorage _storage, uint _eventId, uint _ticketId, address _ticketVendor)
    external
  {
    _storage.setAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Ticket", _ticketId, "TicketVendor")), _ticketVendor);
  }

  function setOffSaleTime(IAventusStorage _storage, uint _eventId, uint _offSaleTime)
    external
  {
    uint onSaleTime = _storage.getUInt(keccak256(abi.encodePacked(eventTable, _eventId, "OnSaleTime")));
    require(_offSaleTime >= onSaleTime, "Tickets off-sale time cannot be before on-sale time");
    _storage.setUInt(keccak256(abi.encodePacked(eventTable, _eventId, "OffSaleTime")), _offSaleTime);
  }

  function getEventTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint eventTime_)
  {
    eventTime_ = _storage.getUInt(keccak256(abi.encodePacked(eventTable, _eventId, "EventTime")));
  }

  function setEventTime(IAventusStorage _storage, uint _eventId, uint _eventTime)
    external
  {
    require(_eventTime >= getOffSaleTime(_storage, _eventId), "Event time cannot be before tickets off-sale time");
    _storage.setUInt(keccak256(abi.encodePacked(eventTable, _eventId, "EventTime")), _eventTime);
  }

  function getOnSaleTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint onSaleTime_)
  {
    onSaleTime_ = _storage.getUInt(keccak256(abi.encodePacked(eventTable, _eventId, "OnSaleTime")));
  }

  function setOnSaleTime(IAventusStorage _storage, uint _eventId, uint _onSaleTime)
    external
  {
    uint minimumEventReportingPeriod = _storage.getUInt(MinimumEventReportingPeriodKey);
    uint minimumOnSaleTime = LAventusTime.getCurrentTime(_storage) + minimumEventReportingPeriod;
    require(_onSaleTime >= minimumOnSaleTime, "Tickets on-sale time is not far enough in the future");
    _storage.setUInt(keccak256(abi.encodePacked(eventTable, _eventId, "OnSaleTime")), _onSaleTime);
  }

  function getEventOwner(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (address eventOwner_)
  {
    eventOwner_ = _storage.getAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Owner")));
  }

  function setEventOwner(IAventusStorage _storage, uint _eventId, address _eventOwner)
    external
  {
    _storage.setAddress(keccak256(abi.encodePacked(eventTable, _eventId, "Owner")), _eventOwner);
  }

  function getAventityId(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint aventityId_)
  {
    aventityId_ = _storage.getUInt(keccak256(abi.encodePacked(eventTable, _eventId, "AventityId")));
  }

  function setAventityId(IAventusStorage _storage, uint _eventId, uint _aventityId)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(eventTable, _eventId, "AventityId")), _aventityId);
  }

  function clearAventityId(IAventusStorage _storage, uint _eventId)
    external
  {
    _storage.setUInt(keccak256(abi.encodePacked(eventTable, _eventId, "AventityId")), 0);
  }

  function getOffSaleTime(IAventusStorage _storage, uint _eventId)
    public
    view
    returns (uint offSaleTime_)
  {
    offSaleTime_ = _storage.getUInt(keccak256(abi.encodePacked(eventTable, _eventId, "OffSaleTime")));
  }
}