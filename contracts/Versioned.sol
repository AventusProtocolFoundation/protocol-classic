pragma solidity ^0.5.2;

contract Versioned {

  string public constant versionMajor = "1";
  string public constant versionMinor = "0";
  string public constant versionPoint = "0";

  function getVersion()
    public
    pure
    returns (string memory version_)
  {
    version_ = string(abi.encodePacked(versionMajor, ".", versionMinor, ".", versionPoint));
  }

  function getVersionMajorMinor()
    public
    pure
    returns (string memory version_)
  {
    version_ = string(abi.encodePacked(versionMajor, ".", versionMinor));
  }
}