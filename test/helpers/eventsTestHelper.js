let testHelper, timeTestHelper, avtTestHelper, eventsManager;

const roles = {
  primary: 'Primary',
  secondary: 'Secondary',
  invalid: 'invalid'
};

async function init(_testHelper, _timeTestHelper, _avtTestHelper) {
  testHelper = _testHelper;
  timeTestHelper = _timeTestHelper;
  avtTestHelper = _avtTestHelper;
  eventsManager = testHelper.getEventsManager();
}

async function depositAndCreateEvent(_eventOwner, _eventTime) {
  const ticketPrice = 0;
  const eventDeposit = await eventsManager.getNewEventDeposit(ticketPrice);
  await avtTestHelper.addAVT(eventDeposit, _eventOwner);

  const eventDesc = 'My event';
  const sixWeeks = timeTestHelper.oneWeek.mul(new web3.utils.BN(6));
  const onSaleTime = timeTestHelper.now().add(sixWeeks);
  const offSaleTime = onSaleTime.add(sixWeeks);
  const eventTime = _eventTime || offSaleTime;
  await eventsManager.createEvent(eventDesc, eventTime, testHelper.validEvidenceURL, onSaleTime, offSaleTime, ticketPrice,
      {from: _eventOwner});
  const eventArgs = await testHelper.getLogArgs(eventsManager, 'LogEventCreated');
  return eventArgs.eventId;
}

async function advanceTimeEndEventAndWithdrawDeposit(_eventOwner, _eventId) {
  const deposit = await getExistingEventDeposit(_eventId);
  await advanceTimeToEventTime(_eventId);
  await eventsManager.endEvent(_eventId);
  await avtTestHelper.withdrawAVT(deposit, _eventOwner);
}

async function getExistingEventDeposit(_eventId) {
  return eventsManager.getExistingEventDeposit(_eventId);
}

async function advanceTimeToEventTime(_eventId) {
  const eventTime = await eventsManager.getEventTime(_eventId);
  await timeTestHelper.advanceToTime(eventTime);
}

async function advanceTimeToOffSaleTime(_eventId) {
  const offSaleTime = await eventsManager.getOffSaleTime(_eventId);
  await timeTestHelper.advanceToTime(offSaleTime);
}

async function advanceTimeToOnSaleTime(_eventId) {
  const onSaleTime = await eventsManager.getOnSaleTime(_eventId);
  await timeTestHelper.advanceToTime(onSaleTime);
}

async function registerRoleOnEvent(_eventId, _roleAddress, _role, _sender) {
  return eventsManager.registerRoleOnEvent(_eventId, _roleAddress, _role, {from: _sender});
}

async function sellTicket(_eventId, _buyer, _sender) {
  return eventsManager.sellTicket(_eventId, testHelper.hash("ticket"), "metadata", _buyer, {from: _sender});
}

// Keep exports alphabetical.
module.exports = {
  advanceTimeEndEventAndWithdrawDeposit,
  advanceTimeToEventTime,
  advanceTimeToOffSaleTime,
  advanceTimeToOnSaleTime,
  depositAndCreateEvent,
  getExistingEventDeposit,
  init,
  registerRoleOnEvent,
  roles,
  sellTicket
};