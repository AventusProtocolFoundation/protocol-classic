pragma solidity ^0.5.2;

interface IEventsManager {

  /**
   * @notice Event emitted for a createEvent transaction.
   */
  event LogEventCreated(uint indexed eventId, address indexed eventOwner, string eventDesc, uint eventTime,
      string eventSupportURL, uint onSaleTime, uint offSaleTime, uint averageTicketPriceInUSCents, uint depositInAVT);

  /**
   * @notice Event emitted for a registerRoleOnEvent transaction.
   */
  event LogEventRoleRegistered(uint indexed eventId, address indexed roleAddress, string role);

  /**
   * @notice Create an event
   * @param _eventDesc Description of the event
   * @param _eventTime Timestamp indicating when tickets for an event expire
   * @param _eventSupportURL Verifiable official supporting url for the event
   * @param _onSaleTime The start timestamp for ticket sales
   * @param _offSaleTime The end timestamp for ticket sales
   * @param _averageTicketPriceInUSCents Average ticket price in US Cents
   */
  function createEvent(string calldata _eventDesc, uint _eventTime, string calldata _eventSupportURL, uint _onSaleTime,
      uint _offSaleTime, uint _averageTicketPriceInUSCents) external;

  /**
   * @notice Register a member for an event. Can only be called by the event owner.
   * @param _eventId ID of the event
   * @param _roleAddress address associated with the role
   * @param _role must be either "Primary" or "Secondary"
   */
  function registerRoleOnEvent(uint _eventId, address _roleAddress, string calldata _role) external;

  /**
   * All below here is unique to Aventus Classic.
   */

  /**
   * @notice Event emitted when an event is taken off sale.
   */
  event LogEventTakenOffSale(uint indexed eventId);

  /**
   * @notice Event emitted for a endEvent transaction.
   */
  event LogEventEnded(uint indexed eventId);

  /**
   * @notice Event emitted for a cancelEvent transaction.
   */
  event LogEventCancelled(uint indexed eventId);

  /**
   * @notice Event emitted for a sellTicket transaction.
   */
  event LogTicketSold(uint indexed eventId, uint indexed ticketId, bytes32 vendorTicketRefHash, string ticketMetadata,
      address indexed buyer);

  /**
   * @notice Event emitted for a resellTicket transaction.
   */
  event LogTicketResold(uint indexed eventId, uint indexed ticketId, address indexed newBuyer);

  /**
   * @notice Event emitted for a cancelTicket transaction.
   */
  event LogTicketCancelled(uint indexed eventId, uint indexed ticketId);

  /**
   * @notice Event emitted for a challengeEvent transaction.
   */
  event LogEventChallenged(uint indexed eventId, uint indexed proposalId, uint lobbyingStart, uint votingStart,
      uint revealingStart, uint revealingEnd);

  /**
   * Event emitted for an endEventChallenge transaction.
   */
  event LogEventChallengeEnded(uint indexed eventId, uint indexed proposalId, uint votesFor, uint votesAgainst);

  /**
   * @notice Take event off sale in order to disable ticket sales/resales
   * @param _eventId ID of the event
   */
  function takeEventOffSale(uint _eventId) external;

  /**
   * @notice Cancel an event
   * @param _eventId Event id for the event to end
   */
  function cancelEvent(uint _eventId) external;

  /**
   * @notice End event, after eventTime, to remove the event from the protocol and unlock the event deposit.
   * @param _eventId event id for the event to end
   */
  function endEvent(uint _eventId) external;

  /**
   * @notice Sell ticket to the given buyer address. Can only be called by a registered vendor.
   * @param _eventId event id for the event to end
   * @param _vendorTicketRefHash hash of the vendor (event owner or primary) generated unique ticket reference for the event
   * @param _ticketMetadata ticket details
   * @param _buyer address of the ticket buyer
   */
  function sellTicket(uint _eventId, bytes32 _vendorTicketRefHash, string calldata _ticketMetadata, address _buyer) external;

  /**
  * @notice Sell multiple tickets. Can only be called by a registered vendor.
  * @param _eventId event id for the event to end
  * @param _tickets encoded vendorTicketRefHash, ticketMetadata and buyer address for each ticket
   */
  function sellMultipleTickets(uint _eventId, bytes calldata _tickets) external;

  /**
  * @notice Sell multiple tickets. Can only be called by a registered vendor.
  * @param _eventId event id for the event to end
  * @param _ticketMetadata ticket details
  * @param _tickets encoded vendorTicketRefHash and buyer address for each ticket
   */
  function sellMultipleTicketsSameMetaData(uint _eventId, string calldata _ticketMetadata, bytes calldata _tickets) external;

  /**
   * @notice Cancel ticket: transfers ownership to event owner. Can only be called by original vendor or event owner.
   * @param _eventId event id for the event in context
   * @param _ticketId ticket Id for the ticket to be cancelled
   */
  function cancelTicket(uint _eventId, uint _ticketId) external;

  /**
   * @notice Sell a ticket on the secondary market. Can only be called by a registered Reseller.
   * @param _eventId ID of the event
   * @param _ticketId identifier for the ticket: unique to this event.
   * @param _ticketOwnerPermission signed by the owner
   * @param _newBuyer address of the new buyer of the ticket.
   */
  function resellTicket(uint _eventId, uint _ticketId, bytes calldata _ticketOwnerPermission, address _newBuyer) external;

  /**
   * @notice Create a challenge for the specified event.
   * @param _eventId id of event to be challenged
   */
  function challengeEvent(uint _eventId) external;

  /**
   * @notice Ends a challenge on the specified event.
   * @param _eventId id of event to be cleared of challenge
   */
  function endEventChallenge(uint _eventId) external;

  /**
   * @notice Calculate the appropriate event deposit in AVT
   * @param _averageTicketPriceInUSCents average ticket price in US Cents
   * @return depositInAVT_ calculated deposit in AVT.
   */
  function getNewEventDeposit(uint _averageTicketPriceInUSCents)
    external
    view
    returns (uint depositInAVT_);

  /**
   * @notice Get the deposit that was made for the specified event
   * @param _eventId unique identifer for the event
   * @return eventDeposit_ the deposit that was made for the specified event
   */
  function getExistingEventDeposit(uint _eventId) external view returns(uint eventDeposit_);

  /**
  * @notice Get the time of an event
  * @param _eventId Event ID
  * @return Timestamp of when the event starts; zero if no matching eventId.
  */
  function getEventTime(uint _eventId) external view returns (uint eventTime_);

   /**
  * @notice Get the on sale time of an event
  * @param _eventId Event ID
  * @return Timestamp of when tickets for the event go on sale; zero if no matching eventId.
  */
  function getOnSaleTime(uint _eventId) external view returns (uint onSaleTime_);

   /**
  * @notice Get the off sale time of an event
  * @param _eventId Event ID
  * @return Timestamp of when tickets for the event go off sale; zero if no matching eventId.
  */
  function getOffSaleTime(uint _eventId) external view returns (uint offSaleTime_);
}