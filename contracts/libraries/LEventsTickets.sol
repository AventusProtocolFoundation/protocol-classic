pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";
import "./LEventsEvents.sol";
import "./LEventsRoles.sol";
import "./LEventsStorage.sol";
import "./zeppelin/LECRecovery.sol";

library LEventsTickets {

  // See IEventsManager interface for logs description
  event LogTicketSold(uint indexed eventId, uint indexed ticketId, bytes32 vendorTicketRefHash, string ticketMetadata,
      address indexed buyer);
  event LogTicketCancelled(uint indexed eventId, uint indexed ticketId);
  event LogTicketResold(uint indexed eventId, uint indexed ticketId, address indexed newBuyer);

  modifier onlyActiveTicket(IAventusStorage _storage, uint _eventId, uint _ticketId) {
    require(ticketIsActive(_storage, _eventId, _ticketId), "Ticket must be active");
    _;
  }

  modifier onlyActiveResellerOnEvent(IAventusStorage _storage, uint _eventId) {
    bool isActiveReseller = LEventsRoles.isEventOwnerOrRole(_storage, _eventId, msg.sender, "Secondary");
    require(isActiveReseller, "Sender must be active reseller on event");
    _;
  }

  modifier onlyActiveVendorOnEvent(IAventusStorage _storage, uint _eventId) {
    bool isActiveVendor = LEventsRoles.isEventOwnerOrRole(_storage, _eventId, msg.sender, "Primary");
    require(isActiveVendor, "Sender must be active vendor on event");
    _;
  }

  function sellTicket(IAventusStorage _storage, uint _eventId, bytes32 _vendorTicketRefHash, string calldata _ticketMetadata,
      address _buyer)
    external
    onlyActiveVendorOnEvent(_storage, _eventId)
  {
    doSellTicket(_storage, _eventId, _vendorTicketRefHash, _ticketMetadata, _buyer);
    registerInteractionIfNecessary(_storage, _eventId, "Primary");
  }

  function sellMultipleTickets(IAventusStorage _storage, uint _eventId, string calldata _ticketMetaData, bytes calldata _tickets)
    onlyActiveVendorOnEvent(_storage, _eventId)
    external
  {
    doSellMultipleTickets(_storage, _eventId, _ticketMetaData, _tickets);
    registerInteractionIfNecessary(_storage, _eventId, "Primary");
  }

  function sellMultipleTickets(IAventusStorage _storage, uint _eventId, bytes calldata _tickets)
    onlyActiveVendorOnEvent(_storage, _eventId)
    external
  {
    doSellMultipleTickets(_storage, _eventId, _tickets);
    registerInteractionIfNecessary(_storage, _eventId, "Primary");
  }

  function cancelTicket(IAventusStorage _storage, uint _eventId, uint _ticketId)
    external
  {
    doCancelTicket(_storage, _eventId, _ticketId);

    emit LogTicketCancelled(_eventId, _ticketId);
  }

  function resellTicket(IAventusStorage _storage, uint _eventId, uint _ticketId, bytes calldata _resellTicketTicketOwnerProof,
      address _newBuyer)
    external
  {
    doResellTicket(_storage, _eventId, _ticketId, _resellTicketTicketOwnerProof, _newBuyer);

    emit LogTicketResold(_eventId, _ticketId, _newBuyer);
  }

  function doCancelTicket(IAventusStorage _storage, uint _eventId, uint _ticketId)
    private
    onlyActiveVendorOnEvent(_storage, _eventId)
    onlyActiveTicket(_storage, _eventId, _ticketId)
  {
    address originalVendor = LEventsStorage.getTicketVendor(_storage, _eventId, _ticketId);
    address eventOwner = LEventsEvents.getEventOwner(_storage, _eventId);

    if (msg.sender != eventOwner)
      require(msg.sender == originalVendor, "Only original vendor can cancel ticket");

    LEventsStorage.setTicketOwner(_storage, _eventId, _ticketId, eventOwner);
  }

  function doSellTicket(IAventusStorage _storage, uint _eventId, bytes32 _vendorTicketRefHash, string memory _ticketMetadata,
      address _ticketOwner)
    private
  {
    // the vendor address is appended to ensure uniqueness if different vendors pass the same ticket ref
    uint ticketId = uint(keccak256(abi.encodePacked(_vendorTicketRefHash, msg.sender)));
    require(!ticketIsActive(_storage, _eventId, ticketId), "Ticket must not already be active");
    LEventsStorage.setTicketOwner(_storage, _eventId, ticketId, _ticketOwner);
    LEventsStorage.setTicketVendor(_storage, _eventId, ticketId, msg.sender);

    emit LogTicketSold(_eventId, ticketId, _vendorTicketRefHash, _ticketMetadata, _ticketOwner);
  }

  function doSellMultipleTickets(IAventusStorage _storage, uint _eventId, bytes memory tickets)
    private
  {
    (bytes32 vendorTicketRefHash, string memory ticketMetadata, address buyer, bytes memory moreTickets) =
        abi.decode(tickets, (bytes32, string, address, bytes));
    doSellTicket(_storage, _eventId, vendorTicketRefHash, ticketMetadata, buyer);

    if (moreTickets.length != 0)
      doSellMultipleTickets(_storage, _eventId, moreTickets);
  }

  function doSellMultipleTickets(IAventusStorage _storage, uint _eventId, string memory _ticketMetadata, bytes memory tickets)
    private
  {
    (bytes32 vendorTicketRefHash, address buyer, bytes memory moreTickets) = abi.decode(tickets, (bytes32, address, bytes));
    doSellTicket(_storage, _eventId, vendorTicketRefHash, _ticketMetadata, buyer);

    if (moreTickets.length != 0)
      doSellMultipleTickets(_storage, _eventId, _ticketMetadata, moreTickets);
  }

  function doResellTicket(IAventusStorage _storage, uint _eventId, uint _ticketId, bytes memory _ticketOwnerPermission,
      address _newBuyer)
    private
    onlyActiveResellerOnEvent(_storage, _eventId)
    onlyActiveTicket(_storage, _eventId, _ticketId)
  {
    address ticketOwner = LEventsStorage.getTicketOwner(_storage, _eventId, _ticketId);
    bytes32 msgHash = keccak256(abi.encodePacked(_eventId, _ticketId, ticketOwner, msg.sender));
    address signer = LECRecovery.recover(msgHash, _ticketOwnerPermission);
    require(signer == ticketOwner, "Resale must be signed by current owner");
    LEventsStorage.setTicketOwner(_storage, _eventId, _ticketId, _newBuyer);
    registerInteractionIfNecessary(_storage, _eventId, "Secondary");
  }

  function ticketIsActive(IAventusStorage _storage, uint _eventId, uint _ticketId)
    private
    view
    returns (bool isActive_)
  {
    address ticketOwner = LEventsStorage.getTicketOwner(_storage, _eventId, _ticketId);
    isActive_ = ticketOwner != address(0);
  }

  function registerInteractionIfNecessary(IAventusStorage _storage, uint _eventId, string memory _role)
    private
  {
    if (msg.sender != LEventsEvents.getEventOwner(_storage, _eventId)) {
      uint eventTime = LEventsEvents.getEventTime(_storage, _eventId);
      LEventsRoles.registerInteractionIfNecessary(_storage, msg.sender, _role, eventTime);
    }
  }
}