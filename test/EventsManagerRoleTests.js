const avtTestHelper = require('./helpers/avtTestHelper');
const eventsTestHelper = require('./helpers/eventsTestHelper');
const membersTestHelper = require('./helpers/membersTestHelper');
const testHelper = require('./helpers/testHelper');
const timeTestHelper = require('./helpers/timeTestHelper');

contract('EventsManager - role management', async () => {
  let eventsManager, accounts,
      goodEventOwner, goodEventId, goodRoleAddress, goodRole, goodSender,
      goodRegisterRoleEventOwnerProof, badEventOwner, badEventId, badRole, badSender;

  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);
    await membersTestHelper.init(testHelper, avtTestHelper, timeTestHelper);
    await eventsTestHelper.init(testHelper, timeTestHelper, avtTestHelper);

    eventsManager = testHelper.getEventsManager();
    accounts = testHelper.getAccounts('eventOwner', 'primary', 'invalid');
    goodEventOwner = accounts.eventOwner;
    goodRoleAddress = accounts.primary;
    goodRole = eventsTestHelper.roles.primary;
    goodSender = goodEventOwner;
    badEventOwner = accounts.invalid;
    badEventId = 999;
    badRole = eventsTestHelper.roles.invalid;
    badSender = accounts.invalid;

    await membersTestHelper.depositAndRegisterMember(goodRoleAddress, goodRole);
  });

  after(async () => {
    await avtTestHelper.checkBalancesAreZero(accounts);
  });

  context('registerRoleOnEvent()', async () => {
    async function registerRoleOnEventSucceeds(_sender) {
      await eventsManager.registerRoleOnEvent(goodEventId, goodRoleAddress, goodRole, {from: _sender});
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventRoleRegistered');
      assert.equal(logArgs.eventId.toNumber(), goodEventId.toNumber());
      assert.equal(logArgs.roleAddress, goodRoleAddress);
      assert.equal(logArgs.role, goodRole);
    }

    async function registerRoleOnEventFails(_eventId, _roleAddress, _role, _sender, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.registerRoleOnEvent(_eventId, _roleAddress, _role,
          {from: _sender}), _expectedError);
    }

    beforeEach(async () => {
      goodEventId = await eventsTestHelper.depositAndCreateEvent(goodEventOwner);
    });

    afterEach(async () => {
      await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(goodEventOwner, goodEventId);
    });

    context('succeeds with good parameters', async () => {
      it('via event owner', async () => {
        await registerRoleOnEventSucceeds(goodSender);
      });
    });

    context('fails with', async () => {
      context('bad parameters', async () => {
        it('eventId', async () => {
          await registerRoleOnEventFails(badEventId, goodRoleAddress, goodRole, goodSender, 'Event must exist');
        });

        it('role', async () => {
          await registerRoleOnEventFails(goodEventId, goodRoleAddress, badRole, goodSender,
              'Role is not registrable: ' + badRole);
        });

        it('sender', async () => {
          await registerRoleOnEventFails(goodEventId, goodRoleAddress, goodRole, badSender, 'Sender must be owner on event');
        });
      });

      context('bad state', async () => {
        it('address is already registered for this role on event', async () => {
          await eventsManager.registerRoleOnEvent(goodEventId, goodRoleAddress, goodRole);
          await registerRoleOnEventFails(goodEventId, goodRoleAddress, goodRole, goodSender,
              'Role is already registered on event');
        });

        it('role is not registered as a member on the protocol', async () => {
          await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodRoleAddress, goodRole);
          await registerRoleOnEventFails(goodEventId, goodRoleAddress, goodRole, goodSender,
              'Must be active member on protocol');
        });
      });
    });
  });
});
