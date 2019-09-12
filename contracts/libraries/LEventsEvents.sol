pragma solidity ^0.5.2;

import "./LAventities.sol";
import "./LEventsClassic.sol";
import "./LEventsStorage.sol";

library LEventsEvents {

  modifier onlyWithEventDescription(IAventusStorage _storage, string memory _eventDesc) {
    require(bytes(_eventDesc).length != 0, "Event requires a non-empty description");
    _;
  }

  function createEvent(IAventusStorage _storage, string calldata _eventDesc, uint _eventTime, uint _onSaleTime,
      uint _offSaleTime, uint _averageTicketPriceInUSCents, address _eventOwner)
    external
    onlyWithEventDescription(_storage, _eventDesc)
    returns (uint eventId_, uint depositInAVT_)
  {
    eventId_ = LEventsStorage.getEventCount(_storage) + 1;
    depositInAVT_ = getNewEventDeposit(_storage, _averageTicketPriceInUSCents);
    uint aventityId = LAventities.registerAventity(_storage, _eventOwner, depositInAVT_);
    LEventsStorage.setAventityId(_storage, eventId_, aventityId);

    LEventsStorage.setEventCount(_storage, eventId_);
    LEventsStorage.setEventOwner(_storage, eventId_, _eventOwner);
    LEventsStorage.setOnSaleTime(_storage, eventId_, _onSaleTime);
    LEventsStorage.setOffSaleTime(_storage, eventId_, _offSaleTime);
    LEventsStorage.setEventTime(_storage, eventId_, _eventTime);
  }

  function getEventTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint eventTime_)
  {
    eventTime_ = LEventsStorage.getEventTime(_storage, _eventId);
  }

  function getOnSaleTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint onSaleTime_)
  {
    onSaleTime_ = LEventsStorage.getOnSaleTime(_storage, _eventId);
  }

  function getOffSaleTime(IAventusStorage _storage, uint _eventId)
    external
    view
    returns (uint offSaleTime_)
  {
    offSaleTime_ = LEventsStorage.getOffSaleTime(_storage, _eventId);
  }

  function senderMustBeEventOwner(IAventusStorage _storage, uint _eventId)
    external
    view
  {
    require(isEventOwner(_storage, _eventId, msg.sender), "Sender must be owner on event");
  }

  function getEventOwner(IAventusStorage _storage, uint _eventId)
    public
    view
    returns (address eventOwner_)
  {
    eventOwner_ = LEventsStorage.getEventOwner(_storage, _eventId);
  }

  function isEventOwner(IAventusStorage _storage, uint _eventId, address _owner)
    public
    view
    returns (bool valid_)
  {
    valid_ = _owner == getEventOwner(_storage, _eventId);
  }

  function getNewEventDeposit(IAventusStorage _storage, uint _averageTicketPriceInUSCents)
    public
    view
    returns (uint depositInAVT_)
  {
    if (_averageTicketPriceInUSCents == 0)
      depositInAVT_ = LEventsStorage.getFreeEventDepositInAVT(_storage);
    else
      depositInAVT_ = LEventsStorage.getPaidEventDepositInAVT(_storage);
  }
}