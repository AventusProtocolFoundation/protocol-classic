const testHelper = require('./helpers/testHelper');
const avtTestHelper = require('./helpers/avtTestHelper');
const timeTestHelper = require('./helpers/timeTestHelper');
const eventsTestHelper = require('./helpers/eventsTestHelper');
const membersTestHelper = require('./helpers/membersTestHelper');

const BN = testHelper.BN;
const BN_ZERO = new BN(0);
const BN_ONE = new BN(1);

contract('EventsManager - events', async () => {
  let eventsManager, accounts, eventOwner, notEventOwner;
  let goodCreateEventParams, goodEventDeposit, goodEventId;

  const badEventId = 9999;
  const minimumEventReportingPeriod = timeTestHelper.oneDay.mul(new BN(30));
  const eventOnSaleFor = timeTestHelper.oneDay.mul(new BN(10));

  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);
    await eventsTestHelper.init(testHelper, timeTestHelper, avtTestHelper);
    await membersTestHelper.init(testHelper, avtTestHelper, timeTestHelper);

    eventsManager = testHelper.getEventsManager();
    accounts = testHelper.getAccounts('eventOwner', 'notEventOwner');
    notEventOwner = accounts.notEventOwner;
    eventOwner = accounts.eventOwner;
  });

  after(async () => {
    await avtTestHelper.checkBalancesAreZero(accounts);
  });

  function generateGoodCreateEventParams() {
    const eventSupportURL = testHelper.validEvidenceURL;
    const onSaleTime = timeTestHelper.now().add(minimumEventReportingPeriod);
    const eventDesc = 'My event';
    const offSaleTime = onSaleTime.add(eventOnSaleFor);
    const eventTime = offSaleTime;
    const sender = accounts.eventOwner;
    const averageTicketPriceInUSCents = BN_ZERO;
    return {
      eventDesc, eventTime, eventSupportURL, onSaleTime, offSaleTime, averageTicketPriceInUSCents, eventOwner, sender
    };
  }

  async function makeEventDeposit(_averageTicketPriceInUSCents) {
    const eventDepositInAVT = await eventsManager.getNewEventDeposit(_averageTicketPriceInUSCents);
    await avtTestHelper.addAVT(eventDepositInAVT, eventOwner, 'deposit');
    return eventDepositInAVT;
  }

  async function createEvent(_createEventParams) {
    await eventsManager.createEvent(
        _createEventParams.eventDesc,
        _createEventParams.eventTime,
        _createEventParams.eventSupportURL,
        _createEventParams.onSaleTime,
        _createEventParams.offSaleTime,
        _createEventParams.averageTicketPriceInUSCents,
        {from: _createEventParams.sender}
    );
    const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventCreated');
    return logArgs.eventId;
  }

  async function endEvent(_eventId) {
    await eventsManager.endEvent(_eventId);
    return testHelper.getLogArgs(eventsManager, 'LogEventEnded');
  }

  async function withdrawDeposit(_deposit, _depositer) {
    return avtTestHelper.withdrawAVT(_deposit, _depositer);
  }

  context('getNewEventDeposit()', async () => {
    async function getNewEventDepositSucceeds(_averageTicketPriceInUSCents, _expectedDepositInAVT) {
      const actualDepositInAVT = await eventsManager.getNewEventDeposit(_averageTicketPriceInUSCents);
      assert.equal(actualDepositInAVT.toString(), _expectedDepositInAVT.toString());
    }

    context('all-good', async () => {
      it('for a new free event', async () => {
        const goodFreeAverageTicketPriceInUsCents = BN_ZERO;
        const expectedDepositInAVT = avtTestHelper.toNat(new BN(1000));  // From ParameterRegistry.
        await getNewEventDepositSucceeds(goodFreeAverageTicketPriceInUsCents, expectedDepositInAVT);
      });

      it('for a new paid event', async () => {
        const goodNonFreeAverageTicketPriceInUSCents = BN_ONE;
        const expectedDepositInAVT = avtTestHelper.toNat(new BN(2000));  // From ParameterRegistry.
        await getNewEventDepositSucceeds(goodNonFreeAverageTicketPriceInUSCents, expectedDepositInAVT);
      });
    });

    // NOTE: There are no bad arguments or bad states for getting a new event deposit.
  });

  context('getExistingEventDeposit()', async () => {
    after(async () => {
      await avtTestHelper.checkBalancesAreZero(accounts);
    });

    beforeEach(async () => {
      goodCreateEventParams = generateGoodCreateEventParams();
      goodEventDeposit = await makeEventDeposit(goodCreateEventParams.averageTicketPriceInUSCents);
      goodEventId = await createEvent(goodCreateEventParams);
    });

    async function getExistingEventDepositSucceeds() {
      const actualDepositInAVT = await eventsManager.getExistingEventDeposit(goodEventId);
      assert.equal(actualDepositInAVT.toString(), goodEventDeposit.toString());
    }

    async function getExistingEventDepositFails(_eventId, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.getExistingEventDeposit(_eventId), _expectedError);
    }

    context('good state: event exists', async () => {
      afterEach(async () => {
        await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(goodCreateEventParams.eventOwner, goodEventId);
      });

      it('good parameters', async () => {
        await getExistingEventDepositSucceeds();
      });

      it('bad parameter: event id does not exist', async () => {
        await getExistingEventDepositFails(999, 'Event must exist');
      });
    });

    it('bad state: event has ended', async () => {
      await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(goodCreateEventParams.eventOwner, goodEventId);
      await getExistingEventDepositFails(goodEventId, 'Event must exist');
    });
  });

  context('createEvent()', async () => {
    after(async () => {
      await avtTestHelper.checkBalancesAreZero(accounts);
    });

    beforeEach(async () => {
      // Set up the goodness for all tests.
      goodCreateEventParams = generateGoodCreateEventParams();
      goodEventDeposit = await makeEventDeposit(goodCreateEventParams.averageTicketPriceInUSCents);
    });

    async function createEventSucceeds() {
      await eventsManager.createEvent(
          goodCreateEventParams.eventDesc,
          goodCreateEventParams.eventTime,
          goodCreateEventParams.eventSupportURL,
          goodCreateEventParams.onSaleTime,
          goodCreateEventParams.offSaleTime,
          goodCreateEventParams.averageTicketPriceInUSCents,
          {from: goodCreateEventParams.sender}
      );
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventCreated');
      assert.equal(logArgs.eventDesc, goodCreateEventParams.eventDesc);
      testHelper.assertBNEquals(logArgs.eventTime, goodCreateEventParams.eventTime);
      testHelper.assertBNEquals(logArgs.onSaleTime, goodCreateEventParams.onSaleTime);
      assert.equal(logArgs.eventOwner, goodCreateEventParams.eventOwner);
      assert.equal(logArgs.eventSupportURL, goodCreateEventParams.eventSupportURL);
      testHelper.assertBNEquals(logArgs.offSaleTime, goodCreateEventParams.offSaleTime);
      testHelper.assertBNEquals(logArgs.averageTicketPriceInUSCents, goodCreateEventParams.averageTicketPriceInUSCents);
      testHelper.assertBNEquals(logArgs.depositInAVT, goodEventDeposit);
      return goodEventId = logArgs.eventId;
    }

    async function createEventFails(_params, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.createEvent(_params.eventDesc, _params.eventTime,
          _params.eventSupportURL, _params.onSaleTime, _params.offSaleTime, _params.averageTicketPriceInUSCents,
          {from: _params.sender}), _expectedError);
    }

    context('succeeds with', async () => {
      context('good parameters', async () => {
        it('can create an event', async () => {
          await createEventSucceeds();
          await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(goodCreateEventParams.eventOwner, goodEventId);
        });
      });

      context('good state', async () => {
        it('can create a duplicate event', async () => {
          const firstEventId = await createEventSucceeds();
          await makeEventDeposit(goodCreateEventParams.averageTicketPriceInUSCents);
          const secondEventId = await createEventSucceeds();
          assert.notEqual(firstEventId, secondEventId);
          await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, firstEventId);
          await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, secondEventId);
        });
      });
    });

    context('fails with', async () => {
      context('bad state', async () => {
        it('insufficient deposit', async () => {
          await withdrawDeposit(1, eventOwner);
          await createEventFails(goodCreateEventParams, 'Insufficient balance to cover deposits');
          // Event was NOT created: clear out the remainder of the deposit.
          await withdrawDeposit(goodEventDeposit.sub(BN_ONE), eventOwner);
        });
      });

      context('bad parameters', async () => {
        let badParams;

        beforeEach(async () => {
          badParams = goodCreateEventParams;
        });

        afterEach(async () => {
          // Event was NOT created: clear out the deposit.
          await withdrawDeposit(goodEventDeposit, eventOwner);
        });

        async function createEventFailsWithBadParams(_errorString) {
          return createEventFails(badParams, _errorString);
        }

        it('event description', async () => {
          badParams.eventDesc = '';
          await createEventFailsWithBadParams('Event requires a non-empty description');
        });

        it('event support URL is empty', async () => {
          badParams.eventSupportURL = '';
          await createEventFailsWithBadParams('Event requires a non-empty support URL');
        });

        it('event time', async () => {
          badParams.eventTime = badParams.offSaleTime.sub(BN_ONE);
          await createEventFailsWithBadParams('Event time cannot be before tickets off-sale time');
        });

        it('off sale time', async () => {
          badParams.offSaleTime = badParams.onSaleTime.sub(BN_ONE);
          await createEventFailsWithBadParams('Tickets off-sale time cannot be before on-sale time');
        });

        it('on sale time is in the past', async () => {
          badParams.onSaleTime = timeTestHelper.now().sub(BN_ONE);
          await createEventFailsWithBadParams('Tickets on-sale time is not far enough in the future');
        });

        it('on sale time is not far enough in the future', async () => {
          badParams.onSaleTime = badParams.onSaleTime.sub(BN_ONE);
          await createEventFailsWithBadParams('Tickets on-sale time is not far enough in the future');
        });

        it('average ticket price does not match the price used to determine deposit', async () => {
          badParams.averageTicketPriceInUSCents++;
          await createEventFailsWithBadParams('Insufficient balance to cover deposits');
        });
      });
    });
  });

  context('takeEventOffSale()', async () => {
    after(async () => {
      await avtTestHelper.checkBalancesAreZero(accounts);
    });

    beforeEach(async () => {
      goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
    });

    afterEach(async () => {
      await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, goodEventId);
    });

    async function takeEventOffSaleSucceeds() {
      await eventsManager.takeEventOffSale(goodEventId, {from: eventOwner});
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventTakenOffSale');
      assert.equal(logArgs.eventId.toNumber(), goodEventId);
    }

    context('succeeds with', async () => {
      context('good parameters', async () => {
        it('via event owner', async () => {
          await eventsTestHelper.advanceTimeToOnSaleTime(goodEventId);
          await takeEventOffSaleSucceeds();
        });
      });
    });

    context('fails with', async () => {
      async function takeEventOffSaleFails(_eventId, _sender, _expectedError) {
        await testHelper.expectRevert(() => eventsManager.takeEventOffSale(_eventId, {from: _sender}), _expectedError);
      }

      context('bad parameters', async () => {
        beforeEach(async () => {
          await eventsTestHelper.advanceTimeToOnSaleTime(goodEventId);
        });

        it('event id', async () => {
          await takeEventOffSaleFails(badEventId, eventOwner, 'Event must be trading');
        });

        it('sender', async () => {
          await takeEventOffSaleFails(goodEventId, notEventOwner, 'Sender must be owner on event');
        });
      });

      context('bad state', async () => {
        it ('event is in reporting period', async () => {
          await takeEventOffSaleFails(badEventId, eventOwner, 'Event must be trading');
        });

        it ('event is off sale', async () => {
          await eventsTestHelper.advanceTimeToOffSaleTime(goodEventId);
          await takeEventOffSaleFails(badEventId, eventOwner, 'Event must be trading');
        });
      });
    });
  });

  context('endEvent()', async () => {
    after(async () => {
      await avtTestHelper.checkBalancesAreZero(accounts);
    });

    beforeEach(async () => {
      goodCreateEventParams = generateGoodCreateEventParams();
      // Distinct eventTime allows us to distinguish between them for failure test.
      goodCreateEventParams.eventTime = goodCreateEventParams.offSaleTime.add(BN_ONE);
      goodEventDeposit = await makeEventDeposit(goodCreateEventParams.averageTicketPriceInUSCents);
      goodEventId = await createEvent(goodCreateEventParams);
    });

    afterEach(async () => {
      // Tests must end the event.
      await withdrawDeposit(goodEventDeposit, eventOwner);
    });

    async function endEventSucceeds() {
      await eventsManager.endEvent(goodEventId);
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventEnded');
      assert.equal(logArgs.eventId.toNumber(), goodEventId);
    }

    async function endEventFails(_eventId, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.endEvent(_eventId), _expectedError);
    }

    context('all-good', async () => {
      it('good state: after off-sale time', async () => {
        await eventsTestHelper.advanceTimeToEventTime(goodEventId);
        await endEventSucceeds();
      });
    });

    context('fails', async () => {
      it('good state, bad parameter: eventId', async () => {
        await eventsTestHelper.advanceTimeToEventTime(goodEventId);
        await endEventFails(badEventId, 'Event must be inactive');
        await endEvent(goodEventId);
      });

      it('bad state: before event time', async () => {
        await eventsTestHelper.advanceTimeToOnSaleTime(goodEventId);
        await endEventFails(goodEventId, 'Event must be inactive');
        await eventsTestHelper.advanceTimeToOffSaleTime(goodEventId);
        await endEventFails(goodEventId, 'Event must be inactive');
        await eventsTestHelper.advanceTimeToEventTime(goodEventId);
        await endEvent(goodEventId);
      });
    });
  });

  context('cancelEvent()', async () => {
    after(async () => {
      await avtTestHelper.checkBalancesAreZero(accounts);
    });

    beforeEach(async () => {
      goodCreateEventParams = generateGoodCreateEventParams();
      goodEventDeposit = await makeEventDeposit(goodCreateEventParams.averageTicketPriceInUSCents);
      goodEventId = await createEvent(goodCreateEventParams);
    });

    afterEach(async () => {
      // Tests must end the event.
      await withdrawDeposit(goodEventDeposit, eventOwner);
    });

    async function cancelEventSucceeds() {
      await eventsManager.cancelEvent(goodEventId, {from: eventOwner});
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventCancelled');
      assert.equal(logArgs.eventId.toNumber(), goodEventId);
    }

    async function cancelEventFails(_eventId, _sender, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.cancelEvent(_eventId, {from: _sender}), _expectedError);
    }

    context('all-good', async () => {
      it('good state: event is before on-sale time', async () => {
        await cancelEventSucceeds();
      });
    });

    context('fails', async () => {
      afterEach(async () => {
        await eventsTestHelper.advanceTimeToEventTime(goodEventId);
        await endEvent(goodEventId);
      });

      it('bad state: event is trading', async () => {
        await eventsTestHelper.advanceTimeToOnSaleTime(goodEventId);
        await cancelEventFails(goodEventId, eventOwner, 'Event must be reporting');
      });

      context('bad parameter', async () => {
        it('event does not exist', async () => {
          await cancelEventFails(badEventId, eventOwner, 'Event must be reporting');
        });

        it('sender is not event owner ', async () => {
          await cancelEventFails(goodEventId, notEventOwner, 'Sender must be owner on event');
        });
      });
    });
  });
});
