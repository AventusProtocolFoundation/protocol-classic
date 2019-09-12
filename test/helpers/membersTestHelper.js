let testHelper, avtTestHelper, timeTestHelper, membersManager, evidenceURL;

const memberDesc = 'Some description';

const memberTypes = {
  primary: 'Primary',
  secondary: 'Secondary',
  bad: 'invalid'
};

async function init(_testHelper, _avtTestHelper, _timeTestHelper) {
  testHelper = _testHelper;
  avtTestHelper = _avtTestHelper;
  timeTestHelper = _timeTestHelper;

  membersManager = testHelper.getMembersManager();

  evidenceURL = testHelper.validEvidenceURL;
}

async function depositAndRegisterMember(_memberAddress, _memberType) {
  const deposit = await membersManager.getNewMemberDeposit(_memberType);
  await avtTestHelper.addAVT(deposit, _memberAddress);
  await membersManager.registerMember(_memberAddress, _memberType, evidenceURL, memberDesc);
  return deposit;
}

async function deregisterMemberAndWithdrawDeposit(_memberAddress, _memberType) {
  const deposit = await membersManager.getExistingMemberDeposit(_memberAddress, _memberType);
  await membersManager.deregisterMember(_memberAddress, _memberType);
  await avtTestHelper.withdrawAVT(deposit, _memberAddress);
}

async function getExistingMemberDeposit(_memberAddress, _memberType) {
  return membersManager.getExistingMemberDeposit(_memberAddress, _memberType);
}

async function getDeregistrationTime(_memberAddress, _memberType) {
  return membersManager.getDeregistrationTime(_memberAddress, _memberType);
}

async function advanceToDeregistrationTime(_memberAddress, _memberType) {
  return timeTestHelper.advanceToTime(await getDeregistrationTime(_memberAddress, _memberType));
}

// Keep exports alphabetical.
module.exports = {
  advanceToDeregistrationTime,
  depositAndRegisterMember,
  deregisterMemberAndWithdrawDeposit,
  getDeregistrationTime,
  getExistingMemberDeposit,
  init,
  memberTypes
};