const testHelper = require('./helpers/testHelper');
const avtTestHelper = require('./helpers/avtTestHelper');
const eventsTestHelper = require('./helpers/eventsTestHelper');
const timeTestHelper = require('./helpers/timeTestHelper');
const votingTestHelper = require('./helpers/votingTestHelper');
const signingTestHelper = require('./helpers/signingTestHelper');
const challengesTestHelper = require('./helpers/eventsChallengesTestHelper');

contract('Member challenges', async () => {
  const badEventId = 99999;
  let accounts;

  let eventsManager, proposalsManager;

  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);
    await eventsTestHelper.init(testHelper, timeTestHelper, avtTestHelper);
    await signingTestHelper.init(testHelper);
    await votingTestHelper.init(testHelper, timeTestHelper, signingTestHelper);
    await challengesTestHelper.init(testHelper, avtTestHelper, votingTestHelper);

    eventsManager = testHelper.getEventsManager();
    proposalsManager = testHelper.getProposalsManager();
    accounts = testHelper.getAccounts('eventOwner', 'challenger', 'otherMember', 'challengeEnder');
  });

  after(async () => {
    await avtTestHelper.checkBalancesAreZero(accounts);
  });

  async function makeChallengeDeposit(_eventId, _challenger) {
    let deposit = await eventsTestHelper.getExistingEventDeposit(_eventId);
    await avtTestHelper.addAVT(deposit, _challenger);
  }

  context('challengeEvent()', async () => {
    let eventOwner, goodChallenger;

    async function challengeEventSucceeds() {
      await eventsManager.challengeEvent(goodEventId, {from: goodChallenger});
      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventChallenged');
      assert.equal(logArgs.eventId.toNumber(), goodEventId, "event id mismatch");
      assert.notEqual(logArgs.proposalId.toNumber(), 0);
      return logArgs.proposalId.toNumber();
    }

    async function challengeEventFails(_eventId, _challenger, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.challengeEvent(_eventId, {from: _challenger}), _expectedError);
    }

    before(async () => {
      eventOwner = accounts.eventOwner;
      goodChallenger = accounts.challenger;
    });

    context('good state', async () => {

      before(async () => {
        goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
        await makeChallengeDeposit(goodEventId, goodChallenger);
      });

      after(async () => {
        await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, goodEventId);
        // After the challenge has ended, winnings distribution means that the AVT deposits of the accounts
        // may be different from their value after setup.
        // At this level, we don't need to exactly calculate this distribution, as they'll be tested in a dedicated context.
        // So, we just clear whatever AVT remains in the accounts
        await avtTestHelper.clearAVTAccount(eventOwner);
        await avtTestHelper.clearAVTAccount(goodChallenger);
      });

      context('succeeds with', async () => {
        it('good parameters', async () => {
          let proposalId = await challengeEventSucceeds();
          await challengesTestHelper.advanceTimeAndEndEventChallenge(goodEventId, proposalId, goodChallenger);
        });
      });

      context('fails with bad parameters', async () => {
        it('event id', async () => {
          await challengeEventFails(badEventId, goodChallenger, 'Must be valid and not under challenge');
        });
      });
    });

    context('fails with bad state', async () => {

      before(async () => {
        goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
      });

      after(async () => {
        await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, goodEventId);
        // Clear remaining AVT resulting from challenge winnings
        await avtTestHelper.clearAVTAccount(eventOwner);
        await avtTestHelper.clearAVTAccount(goodChallenger);
      });

      it('event is under challenge', async () => {
        let challenge = await challengesTestHelper.challengeEvent(goodEventId, goodChallenger);
        await challengeEventFails(goodEventId, goodChallenger, 'Must be valid and not under challenge');
        await challengesTestHelper.advanceTimeAndEndEventChallenge(goodEventId, challenge.proposalId, goodChallenger);
      });
    });
  });

  context('endEventChallenge()', async () => {
    let eventOwner, goodEventId, challengeEnder, goodProposalId;

    async function endEventChallengeSucceeds() {
      await eventsManager.endEventChallenge(goodEventId, {from: challengeEnder});

      const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventChallengeEnded');
      assert.equal(logArgs.eventId.toNumber(), goodEventId.toNumber());
      assert.equal(logArgs.proposalId.toNumber(), goodProposalId);
      assert.equal(logArgs.votesFor.toNumber(), 0);
      assert.equal(logArgs.votesAgainst.toNumber(), 0);
    }

    // Anyone can end a challenge, without needing a deposit or any specific setup.
    // Therefore, we don't test for a bad challenge ender
    async function endEventChallengeFails(_eventId, _expectedError) {
      await testHelper.expectRevert(() => eventsManager.endEventChallenge(_eventId, {from: challengeEnder}), _expectedError);
    }

    before(async () => {
      eventOwner = accounts.eventOwner;
      challengeEnder = accounts.challenger;
    });

    context('good state', async () => {
      before(async () => {
        goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
      });

      after(async () => {
        await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, goodEventId);
        // After the challenge has ended, winnings distribution means that the AVT deposits of the accounts
        // may be different from their value after setup.
        // At this level, we don't need to exactly calculate this distribution, as they'll be tested in a dedicated context.
        // So, we just clear whatever AVT remains in the accounts
        await avtTestHelper.clearAVTAccount(eventOwner);
      });

      beforeEach(async () => {
        const challenge = await challengesTestHelper.challengeEvent(goodEventId, challengeEnder);
        goodProposalId = challenge.proposalId;
        await votingTestHelper.advanceTimeToEndOfProposal(goodProposalId);
      });

      context('succeeds with', async () => {
        it('good parameters', async () => {
          await endEventChallengeSucceeds();
          await avtTestHelper.clearAVTAccount(challengeEnder);
        });
      });

      context('fails with bad parameters', async () => {
        afterEach(async () => {
          await eventsManager.endEventChallenge(goodEventId, {from: challengeEnder});
          await avtTestHelper.clearAVTAccount(challengeEnder);
        });

        it('event id', async () => {
          await endEventChallengeFails(badEventId, 'Event does not exist');
        });
      });
    });

    context('fails with bad state', async () => {
      it('event has already failed a challenge', async () => {
        goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
        await challengesTestHelper.challengeEventAndMarkAsFraudulent(goodEventId, challengeEnder);
        await endEventChallengeFails(goodEventId, 'Event does not exist');
        await avtTestHelper.clearAVTAccount(challengeEnder);
        await avtTestHelper.clearAVTAccount(eventOwner);
      });

      it('event has no active challenge', async () => {
        goodEventId = await eventsTestHelper.depositAndCreateEvent(eventOwner);
        await endEventChallengeFails(goodEventId, 'Challenge does not exist');
        await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(eventOwner, goodEventId);
        await avtTestHelper.clearAVTAccount(eventOwner);
      });
    });
  });

});