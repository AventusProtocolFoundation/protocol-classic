const testHelper = require('./helpers/testHelper');
const avtTestHelper = require('./helpers/avtTestHelper');
const timeTestHelper = require('./helpers/timeTestHelper');
const eventsTestHelper = require('./helpers/eventsTestHelper');
const signingTestHelper = require('./helpers/signingTestHelper');
const membersTestHelper = require('./helpers/membersTestHelper');

let eventsManager;

contract('EventsManager - tickets', async () => {

  let accounts;
  const ticketMetadata = 'Some metadata';
  const baseVendorTicketRef = 'Vendor ref ';

  let vendorTicketNumber = 0;
  let goodEventId, vendorTicketRefHash;

  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);
    await signingTestHelper.init(testHelper);
    await eventsTestHelper.init(testHelper, timeTestHelper, avtTestHelper);
    await membersTestHelper.init(testHelper, avtTestHelper, timeTestHelper);

    eventsManager = await testHelper.getEventsManager();

    accounts = testHelper.getAccounts('eventOwner', 'buyer', 'newBuyer', 'primary', 'otherPrimary', 'secondary', 'nobody');

    await membersTestHelper.depositAndRegisterMember(accounts.primary, "Primary");
    await membersTestHelper.depositAndRegisterMember(accounts.secondary, "Secondary");
  });

  after(async () => {
    await membersTestHelper.advanceToDeregistrationTime(accounts.primary, "Primary");
    await membersTestHelper.deregisterMemberAndWithdrawDeposit(accounts.primary, "Primary");
    await membersTestHelper.deregisterMemberAndWithdrawDeposit(accounts.secondary, "Secondary");

    await avtTestHelper.checkBalancesAreZero(accounts);
  });

  function createUniqueTicket() {
    const vendorTicketRef = baseVendorTicketRef + vendorTicketNumber;
    vendorTicketRefHash = testHelper.hash(vendorTicketRef);
    vendorTicketNumber++;
  }

  beforeEach(async () => {
    goodEventId = await eventsTestHelper.depositAndCreateEvent(accounts.eventOwner);
    await eventsTestHelper.advanceTimeToOnSaleTime(goodEventId);
    createUniqueTicket();
  });

  afterEach(async () => {
    await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(accounts.eventOwner, goodEventId);
  });

  async function doSellTicket(_params) {
    await eventsManager.sellTicket(_params.eventId, vendorTicketRefHash, ticketMetadata, accounts.buyer,
        {from: _params.sender});

    const logArgs = await testHelper.getLogArgs(eventsManager, 'LogTicketSold');
    return logArgs.ticketId;
  }

  async function doResellTicket(_params) {
    await eventsManager.resellTicket(_params.eventId, _params.ticketId, _params.ticketOwnerPermission, accounts.newBuyer,
        {from: _params.sender});
  }

  async function doCancelTicket(_params) {
    await eventsManager.cancelTicket(_params.eventId, _params.ticketId, {from: _params.sender});
  }

  async function sellTicketFails(_params, _expectedError) {
    await testHelper.expectRevert(() => eventsManager.sellTicket(_params.eventId, vendorTicketRefHash, ticketMetadata,
        accounts.buyer, {from: _params.sender}), _expectedError);
  }

  context('sellTicket()', async () => {
    async function sellTicketSucceeds(_params) {
      await eventsManager.sellTicket(_params.eventId, vendorTicketRefHash, ticketMetadata, accounts.buyer,
          {from: _params.sender});

      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogTicketSold');
      testHelper.assertBNEquals(logArgs.eventId, _params.eventId);
      assert.equal(logArgs.vendorTicketRefHash, vendorTicketRefHash);
      assert.equal(logArgs.ticketMetadata, ticketMetadata);
      assert.equal(logArgs.buyer, accounts.buyer);
    }

    context('good parameters', async () => {
      let goodParams;

      beforeEach(async () => {
        await eventsManager.registerRoleOnEvent(goodEventId, accounts.primary, "Primary");
        goodParams = {
          eventId: goodEventId,
          sender: accounts.primary
        };
      });

      context('succeeds with good state', async () => {
        it('via primary', async () => {
          await sellTicketSucceeds(goodParams);
        });

        it('via event owner', async () => {
          goodParams.sender = accounts.eventOwner;
          await sellTicketSucceeds(goodParams);
        });

        it('multiple tickets', async () => {
          let encodedTickets = '0x';
          const numTickets = 100; // MAX 109 in isolation
          for (i = 0; i < numTickets; i++) {
            encodedTickets = web3.eth.abi.encodeParameters(['uint', 'string', 'address', 'bytes'],
                [vendorTicketRefHash, ticketMetadata, accounts.buyer, encodedTickets]);
            createUniqueTicket();
          }
          await eventsManager.sellMultipleTickets(goodParams.eventId, encodedTickets, {from: goodParams.sender});
        });

        it('multiple tickets with same metadata', async () => {
          let encodedTickets = '0x';
          const numTickets = 100; // MAX 112 in isolation
          for (i = 0; i < numTickets; i++) {
            encodedTickets = web3.eth.abi.encodeParameters(['uint', 'address', 'bytes'],
                [vendorTicketRefHash, accounts.buyer, encodedTickets]);
            createUniqueTicket();
          }
          await eventsManager.sellMultipleTicketsSameMetaData(goodParams.eventId, ticketMetadata, encodedTickets,
              {from: goodParams.sender});
        });
      });

      context('fails with bad state', async () => {
        it('ticket has already been sold', async () => {
          await doSellTicket(goodParams);
          await sellTicketFails(goodParams, 'Ticket must not already be active');
        });

        it('event has gone off sale', async () => {
          await eventsTestHelper.advanceTimeToOffSaleTime(goodEventId);
          await sellTicketFails(goodParams, 'Event must be trading');
        });
      });

      context('extra tests for coverage', async () => {
        let futureEventId;
        const futureTimestamp = new testHelper.BN(17521543833); // In the year 2525

        before(async () => {
          futureEventId = await eventsTestHelper.depositAndCreateEvent(accounts.eventOwner, futureTimestamp);
          await eventsManager.registerRoleOnEvent(futureEventId, accounts.primary, "Primary");
          await eventsTestHelper.advanceTimeToOnSaleTime(futureEventId);
          await eventsManager.sellTicket(futureEventId, testHelper.hash("future party ticket"), "row 3, seat 3", accounts.buyer,
              {from: accounts.primary});
        });

        after(async () => {
          await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(accounts.eventOwner, futureEventId);
        });

        function assertBNGreaterThan(_a, _b, _msg) {
          assert(web3.utils.isBN(_a), "_a must be a BN");
          assert(web3.utils.isBN(_b), "_b must be a BN");
          const msg = _msg || `Expected ${_a} to be GREATER THAN ${_b}`;
          assert(_a.gt(_b), msg);
        }

        it('updateExpiryTimeIfNecessary: member expiry time does not update', async () => {
          const deregistrationTime1 = await membersTestHelper.getDeregistrationTime(accounts.primary, "Primary");
          assertBNGreaterThan(deregistrationTime1, futureTimestamp);
          await sellTicketSucceeds(goodParams);
          const deregistrationTime2 = await membersTestHelper.getDeregistrationTime(accounts.primary, "Primary");
          testHelper.assertBNEquals(deregistrationTime1, deregistrationTime2);
        });
      });
    });

    context('fails with bad parameters', async () => {
      let badParams;

      beforeEach(async () => {
        badParams = {
          eventId: goodEventId,
          sender: accounts.eventOwner
        };
      });

      async function sellTicketFailsWithBadParams(_expectedError) {
        await sellTicketFails(badParams, _expectedError);
      }

      it('event id', async () => {
        badParams.eventId = 9999;

        await sellTicketFailsWithBadParams('Event must be trading');
      });

      it('sender is not registered on event', async () => {
        badParams.sender = accounts.nobody;

        await sellTicketFailsWithBadParams('Sender must be active vendor on event');
      });

      it('sender is secondary', async () => {
        badParams.sender = accounts.secondary;

        await sellTicketFailsWithBadParams('Sender must be active vendor on event');
      });
    });
  });

  context('resellTicket()', async () => {
    let goodParams, goodTicketId;

    beforeEach(async () => {
      await eventsManager.registerRoleOnEvent(goodEventId, accounts.secondary, "Secondary");
      goodTicketId = await doSellTicket({eventId: goodEventId, sender: accounts.eventOwner});
    });

    async function createGoodParams() {
      const ticketOwnerPermission = await signingTestHelper.getResellTicketTicketOwnerPermission(goodEventId,
        goodTicketId, accounts.buyer, accounts.secondary);

      goodParams = {
        eventId: goodEventId,
        ticketId: goodTicketId,
        ticketOwnerPermission: ticketOwnerPermission,
        sender: accounts.secondary
      };
    }

    async function resellTicketSucceeds(_params) {
      await eventsManager.resellTicket(_params.eventId, _params.ticketId, _params.ticketOwnerPermission, accounts.newBuyer,
          {from: _params.sender});

      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogTicketResold');
      testHelper.assertBNEquals(logArgs.eventId, _params.eventId);
      testHelper.assertBNEquals(logArgs.ticketId, _params.ticketId);
      assert.equal(logArgs.newBuyer, accounts.newBuyer);
    }

    async function resellTicketFails(_params, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.resellTicket(_params.eventId, _params.ticketId,
          _params.ticketOwnerPermission, accounts.newBuyer, {from: _params.sender}), _expectedError);
    }

    context('good parameters', async () => {

      beforeEach(async () => {
        await createGoodParams();
      });

      context('succeeds with good state', async () => {


        it('via event owner', async () => {
          goodParams.sender = accounts.eventOwner;
          goodParams.ticketOwnerPermission = await signingTestHelper.getResellTicketTicketOwnerPermission(goodEventId,
            goodTicketId, accounts.buyer, accounts.eventOwner);
          await resellTicketSucceeds(goodParams);
        });

        it('via secondary', async () => {
          await resellTicketSucceeds(goodParams);
        });
      });

      context('fails with bad state', async () => {
        it('ticket has already been resold', async () => {
          await doResellTicket(goodParams);
          await resellTicketFails(goodParams, 'Resale must be signed by current owner');
        });

        it('event has gone off sale', async () => {
          await eventsTestHelper.advanceTimeToOffSaleTime(goodEventId);
          await resellTicketFails(goodParams, 'Event must be trading');
        });

        it('secondary is not registered on protocol', async () => {
           await membersTestHelper.deregisterMemberAndWithdrawDeposit(accounts.secondary, "Secondary");
           await resellTicketFails(goodParams, 'Sender must be active reseller on event');
           await membersTestHelper.depositAndRegisterMember(accounts.secondary, "Secondary");
           await resellTicketSucceeds(goodParams);
        });
      });
    });

    context('fails with bad parameters', async () => {
      let badParams;

      async function resellTicketFailsWithBadParams(_expectedError) {
        if (badParams.ticketOwnerPermission === undefined) {
          badParams.ticketOwnerPermission = await signingTestHelper.getResellTicketTicketOwnerPermission(
              badParams.eventId, badParams.ticketId, accounts.buyer, accounts.secondary);
        }

        await resellTicketFails(badParams, _expectedError);
      }

      beforeEach(async () => {
        badParams = {
          eventId: goodEventId,
          ticketId: goodTicketId,
          sender: accounts.secondary
        };
      });

      it('event id', async () => {
        badParams.eventId = 9999;

        await resellTicketFailsWithBadParams('Event must be trading');
      });

      it('ticket id', async () => {
        badParams.ticketId = 9999;

        await resellTicketFailsWithBadParams('Ticket must be active');
      });

      it('ticket owner permission', async () => {
        badParams.ticketOwnerPermission = '0x';

        await resellTicketFailsWithBadParams('Resale must be signed by current owner');
      });

      it('sender', async () => {
        badParams.sender = accounts.nobody;

        await resellTicketFailsWithBadParams('Sender must be active reseller on event');
      });
    });
  });

  context('cancelTicket()', async () => {
    let goodTicketId;

    beforeEach(async () => {
      goodTicketId = await doSellTicket({eventId: goodEventId, sender: accounts.eventOwner});
    });

    async function cancelTicketSucceeds(_params) {
      await eventsManager.cancelTicket(_params.eventId, _params.ticketId, {from: _params.sender});

      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogTicketCancelled');
      testHelper.assertBNEquals(logArgs.eventId, _params.eventId);
      testHelper.assertBNEquals(logArgs.ticketId, _params.ticketId);
    }

    async function cancelTicketFails(_params, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.cancelTicket(_params.eventId, _params.ticketId, {from: _params.sender}),
          _expectedError);
    }

    context('good parameters', async () => {
      let goodParams;

      beforeEach(async () => {
        goodParams = {
          eventId: goodEventId,
          ticketId: goodTicketId,
          sender: accounts.eventOwner
        };
      });

      context('succeeds with good state', async () => {
        it('via event owner', async () => {
          await cancelTicketSucceeds(goodParams);
        });
      });
    });

    context('fails with bad parameters', async () => {
      let badParams;

      beforeEach(async () => {
        badParams = {
          eventId: goodEventId,
          ticketId: goodTicketId,
          sender: accounts.eventOwner
        };
      });

      async function cancelTicketFailsWithBadParams(_expectedError) {
        await cancelTicketFails(badParams, _expectedError);
      }

      it('event id', async () => {
        badParams.eventId = 9999;

        await cancelTicketFailsWithBadParams('Event must be trading');
      });

      it('ticket id', async () => {
        badParams.ticketId = 9999;

        await cancelTicketFailsWithBadParams('Ticket must be active');
      });

      it('sender', async () => {
        badParams.sender = accounts.nobody;

        await cancelTicketFailsWithBadParams('Sender must be active vendor on event');
      });
    });
    context('extra tests for coverage', async () => {
      let goodParams, goodTicketId;

      beforeEach(async () => {
        await eventsManager.registerRoleOnEvent(goodEventId, accounts.primary, "Primary");
        goodTicketId = await doSellTicket({eventId: goodEventId, sender: accounts.primary});
        goodParams = {
          eventId: goodEventId,
          ticketId: goodTicketId,
          sender: accounts.primary
        };
      });

      it('succeeds cancelling from original vendor', async () => {
        await cancelTicketSucceeds(goodParams);
      });

      it('succeeds cancelling from event owner', async () => {
        goodParams.sender = accounts.eventOwner;
        await cancelTicketSucceeds(goodParams);
      });

      it('fails cancelling from other registered vendor', async () => {
        await membersTestHelper.depositAndRegisterMember(accounts.otherPrimary, "Primary");
        await eventsManager.registerRoleOnEvent(goodEventId, accounts.otherPrimary, "Primary");
        goodParams.sender = accounts.otherPrimary;
        await cancelTicketFails(goodParams, "Only original vendor can cancel ticket");
        await membersTestHelper.deregisterMemberAndWithdrawDeposit(accounts.otherPrimary, "Primary");
      });
    });
  });
});
