let testHelper;

async function init(_testHelper) {
  testHelper = _testHelper;
}

async function getResellTicketTicketOwnerPermission(_eventId, _ticketId, _currentOwner, _reseller) {
  const msgHash = testHelper.hash(_eventId, _ticketId, _currentOwner, _reseller);
  return testHelper.sign(_currentOwner, msgHash);
}

async function getRevealVoteSignedMessage(_address, _proposalId, _optionId) {
  const hexString = convertToBytes32HexString(_proposalId * 10 + _optionId);
  const data = testHelper.hash('0x' + hexString);
  return testHelper.sign(_address, data);
}

async function getCastVoteSecret(_address, _proposalId, _optionId) {
  const signedMessage = await getRevealVoteSignedMessage(_address, _proposalId, _optionId);
  return testHelper.hash(signedMessage);
}

// convert a number to hex-64 zero-padded string
function convertToBytes32HexString(_num) {
  let n = _num.toString(16);
  return new Array(64 - n.length + 1).join('0') + n;
}

// Keep exports alphabetical.
module.exports = {
  getCastVoteSecret,
  getResellTicketTicketOwnerPermission,
  getRevealVoteSignedMessage,
  init,
};
