pragma solidity ^0.5.2;

import "../interfaces/IAventusStorage.sol";
import "./LEventsEvents.sol";
import "./LEventsStorage.sol";
import "./LMembers.sol";

library LEventsRoles {

  bytes32 constant primaryHash = keccak256(abi.encodePacked("Primary"));
  bytes32 constant secondaryHash = keccak256(abi.encodePacked("Secondary"));

  modifier onlyEventOwner(IAventusStorage _storage, uint _eventId) {
    LEventsEvents.senderMustBeEventOwner(_storage, _eventId);
    _;
  }

  modifier onlyIfRegistrable(IAventusStorage _storage, address _roleAddress, string memory _role) {
    bytes32 roleHash = keccak256(abi.encodePacked(_role));
    bool validRole = roleHash == primaryHash || roleHash == secondaryHash;
    require(validRole, string(abi.encodePacked("Role is not registrable: ", _role)));
    require(LMembers.memberIsActive(_storage, _roleAddress, _role), "Must be active member on protocol");
    _;
  }

  modifier onlyIfNotAlreadyRegistered(IAventusStorage _storage, uint _eventId, address _roleAddress, string memory _role) {
    require(!LEventsStorage.isRoleOnEvent(_storage, _eventId, _roleAddress, _role), "Role is already registered on event");
    _;
  }

  function registerRoleOnEvent(IAventusStorage _storage, uint _eventId, address _roleAddress, string calldata _role)
    external
    onlyEventOwner(_storage, _eventId)   
  {
    doRegisterRoleOnEvent(_storage, _eventId, _roleAddress, _role);
  }

  function isEventOwnerOrRole(IAventusStorage _storage, uint _eventId, address _address, string memory _role)
    public
    view
    returns (bool isOwnerOrRole_)
  {
    bool isActiveRole = (LEventsStorage.isRoleOnEvent(_storage, _eventId, _address, _role) &&
        LMembers.memberIsActive(_storage, _address, _role));
    bool isEventOwner = LEventsEvents.isEventOwner(_storage, _eventId, _address);
    isOwnerOrRole_ = isActiveRole || isEventOwner;
  }

  function registerInteractionIfNecessary(IAventusStorage _storage, address _address, string calldata _role, uint _eventTime)
    external
  {
    LMembers.updateExpiryTimeIfNecessary(_storage, _address, _role, _eventTime);
  }

  // Separate method due to stack too deep in main protocol - easier for diffing if we don't inline this.
  function doRegisterRoleOnEvent(IAventusStorage _storage, uint _eventId, address _roleAddress, string memory _role)
    private
    onlyIfRegistrable(_storage, _roleAddress, _role)
    onlyIfNotAlreadyRegistered(_storage, _eventId, _roleAddress, _role)
  {
    LEventsStorage.setRoleOnEvent(_storage, _eventId, _roleAddress, _role);
  }
}