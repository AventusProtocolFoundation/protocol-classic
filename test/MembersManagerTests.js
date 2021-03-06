const testHelper = require('./helpers/testHelper');
const avtTestHelper = require('./helpers/avtTestHelper');
const membersTestHelper = require('./helpers/membersTestHelper');
const timeTestHelper = require('./helpers/timeTestHelper');
const eventsTestHelper = require('./helpers/eventsTestHelper');

const BN = testHelper.BN;

contract('MembersManager', async () => {
  let membersManager, accounts, goodMember;

  const goodEvidenceURL = testHelper.validEvidenceURL;
  const goodMemberDescription = 'Some member to be registered';
  const goodMemberType = membersTestHelper.memberTypes.primary;
  const badMemberType = membersTestHelper.memberTypes.bad;
  const badMemberAddress = testHelper.zeroAddress;
  const memberDepositInAVTDecimals = avtTestHelper.toNat(new BN(5000)); // From ParameterRegistry


  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);
    await membersTestHelper.init(testHelper, avtTestHelper, timeTestHelper);
    await eventsTestHelper.init(testHelper, timeTestHelper, avtTestHelper);

    membersManager = testHelper.getMembersManager();
    accounts = testHelper.getAccounts('member', 'otherMember', 'eventOwner', 'ticketBuyer');
    goodMember = accounts.member;
  });

  after(async () => {
    await avtTestHelper.checkBalancesAreZero(accounts);
  });

  async function makeDepositForNewMember(_account) {
    let deposit = memberDepositInAVTDecimals;
    await avtTestHelper.addAVT(deposit, _account);
    return deposit;
  }

  async function withdrawDepositForNewMember(_account) {
    let deposit = memberDepositInAVTDecimals;
    await avtTestHelper.withdrawAVT(deposit, _account);
  }

  context('registerMember()', async () => {
    let goodMemberDeposit;

    async function registerMemberSucceeds(_expectedDeposit) {
      await membersManager.registerMember(accounts.member, goodMemberType, goodEvidenceURL, goodMemberDescription);

      const logArgs = await testHelper.getLogArgs(membersManager, 'LogMemberRegistered');
      assert.equal(logArgs.memberAddress, accounts.member);
      assert.equal(logArgs.memberType, goodMemberType);
      assert.equal(logArgs.evidenceUrl, goodEvidenceURL);
      assert.equal(logArgs.desc, goodMemberDescription);
      testHelper.assertBNEquals(logArgs.deposit, _expectedDeposit);
    }

    async function registerMemberFails(_memberAddress, _memberType, _evidenceURL, _description, _expectedError) {
      await testHelper.expectRevert(() => membersManager.registerMember(_memberAddress, _memberType, _evidenceURL,
          _description), _expectedError);
    }

    context('succeeds with', async () => {
      it('good parameters', async () => {
        goodMemberDeposit = await makeDepositForNewMember(goodMember);
        await registerMemberSucceeds(goodMemberDeposit);
        await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
      });
    });

    context('fails with', async () => {
      context('bad parameters', async () => {
        beforeEach(async () => {
          goodMemberDeposit = await makeDepositForNewMember(goodMember);
        });

        afterEach(async () => {
          await avtTestHelper.withdrawAVT(goodMemberDeposit, goodMember);
        });

        it('memberType', async () => {
          await registerMemberFails(goodMember, badMemberType, goodEvidenceURL, goodMemberDescription,
              'Member type is not valid');
        });

        it('evidenceURL', async () => {
          await registerMemberFails(goodMember, goodMemberType, '', goodMemberDescription,
              'Member requires a non-empty evidence URL');
        });

        it('desc', async () => {
          await registerMemberFails(goodMember, goodMemberType, goodEvidenceURL, '', 'Member requires a non-empty description');
        });
      });

      context('bad state', async () => {
        it('member has already been registered', async () => {
          await membersTestHelper.depositAndRegisterMember(goodMember, goodMemberType);
          await registerMemberFails(goodMember, goodMemberType, goodEvidenceURL, goodMemberDescription,
              'Member must not be registered');
          await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
        });

        it('insufficient deposit', async () => {
          let badDeposit = memberDepositInAVTDecimals.div(new BN(2));
          await avtTestHelper.addAVT(badDeposit, goodMember);
          await registerMemberFails(goodMember, goodMemberType, goodEvidenceURL, goodMemberDescription,
              'Insufficient balance to cover deposits');
          await avtTestHelper.withdrawAVT(badDeposit, goodMember);
        });
      });
    });
  });

  context('deregisterMember()', async () => {
    async function deregisterMemberSucceeds() {
      await membersManager.deregisterMember(goodMember, goodMemberType);

      const logArgs = await testHelper.getLogArgs(membersManager, 'LogMemberDeregistered');
      assert.equal(logArgs.memberAddress, goodMember);
      assert.equal(logArgs.memberType, goodMemberType);
    }

    async function deregisterMemberFails(_memberAddress, _memberType, _expectedError) {
      await testHelper.expectRevert(() => membersManager.deregisterMember(_memberAddress, _memberType), _expectedError);
    }

    beforeEach(async () => {
      await membersTestHelper.depositAndRegisterMember(goodMember, goodMemberType);
    });

    context('succeeds with', async () => {
      it('good parameters', async () => {
        await deregisterMemberSucceeds();
        await withdrawDepositForNewMember(goodMember, goodMemberType);
      });
    });

    context('fails with', async () => {
      context('bad parameters', async () => {
        afterEach(async () => {
          await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
        });

        it('memberAddress', async () => {
          await deregisterMemberFails(badMemberAddress, goodMemberType, 'Member is not registered');
        });

        it('memberType', async () => {
          await deregisterMemberFails(goodMember, badMemberType, 'Member is not registered');
        });
      });

      context('bad state', async () => {
        it('member has already been deregistered', async () => {
          await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
          await deregisterMemberFails(goodMember, goodMemberType, 'Member is not registered');
        });

        it('member has interacted and tries to deregister before the end of the cooling off period', async () => {
          // Other tests are type agnostic, but this test is hard coded for Primary.
          assert.equal(goodMemberType, membersTestHelper.memberTypes.primary);

          const eventRole = eventsTestHelper.roles.primary;
          assert.equal(goodMemberType, eventRole);
          const eventId = await eventsTestHelper.depositAndCreateEvent(accounts.eventOwner);
          await eventsTestHelper.registerRoleOnEvent(eventId, goodMember, eventRole, accounts.eventOwner);
          await eventsTestHelper.advanceTimeToOnSaleTime(eventId);
          await eventsTestHelper.sellTicket(eventId, accounts.ticketBuyer, goodMember);
          await deregisterMemberFails(goodMember, goodMemberType, 'Member cannot be deregistered yet');
          await eventsTestHelper.advanceTimeEndEventAndWithdrawDeposit(accounts.eventOwner, eventId);
          await deregisterMemberFails(goodMember, goodMemberType, 'Member cannot be deregistered yet');

          // Tear down
          await membersTestHelper.advanceToDeregistrationTime(goodMember, goodMemberType);
          await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
        });
      });
    });
  });

  context('getNewMemberDeposit()', async () => {
    async function getNewMemberDepositSucceeds(_expectedDeposit) {
      const newMemberDeposit = await membersManager.getNewMemberDeposit(goodMemberType);
      testHelper.assertBNEquals(newMemberDeposit, _expectedDeposit);
    }

    async function getNewMemberDepositFails(_type, _expectedError) {
      await testHelper.expectRevert(() => membersManager.getNewMemberDeposit(_type), _expectedError);
    }

    context('succeeds with', async () => {
      it('good parameters', async () => {
        await getNewMemberDepositSucceeds(memberDepositInAVTDecimals);
      });
    });

    context('fails with', async () => {
      context('bad parameters', async () => {
        it('memberType', async () => {
          await getNewMemberDepositFails(badMemberType, 'Member type is not valid');
        });
      });
      // There is not a bad state test for this method. The function to be tested only reads values from the ParameterRegistry.
    });
  });

  context('getExistingMemberDeposit()', async () => {
    async function getExistingMemberDepositSucceeds(_expectedDeposit) {
      const existingMemberDeposit = await membersManager.getExistingMemberDeposit(goodMember, goodMemberType);
      testHelper.assertBNEquals(existingMemberDeposit, _expectedDeposit);
    }

    async function getExistingMemberDepositFails(_memberAddress, _memberType, _expectedError) {
      await testHelper.expectRevert(() => membersManager.getExistingMemberDeposit(_memberAddress, _memberType), _expectedError);
    }

    before(async () => {
      await membersTestHelper.depositAndRegisterMember(goodMember, goodMemberType);
    });

    after(async () => {
      await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
    });

    context('succeeds with', async () => {
      it('good parameters', async () => {
        await getExistingMemberDepositSucceeds(memberDepositInAVTDecimals);
      });
    });

    context('fails with', async () => {
      context('bad parameters', async () => {
        it('memberType', async () => {
          await getExistingMemberDepositFails(goodMember, badMemberType, 'Member is not registered');
        });
      });

      context('bad state', async () => {
        it('member is not registered', async () => {
          await getExistingMemberDepositFails(accounts.otherMember, goodMemberType, 'Member is not registered');
        });
      });
    });
  });

  // NOTE: See event ticket testing for proper deregistration time tests.
  context('getDeregistrationTime() - branch coverage', async () => {
    before(async () => {
      await membersTestHelper.depositAndRegisterMember(goodMember, goodMemberType);
    });

    after(async () => {
      await membersTestHelper.deregisterMemberAndWithdrawDeposit(goodMember, goodMemberType);
    });

    it('succeeds with non-existent member', async () => {
      const deregistrationTime = await membersManager.getDeregistrationTime(goodMember, 'Secondary');
      assert.equal(deregistrationTime, 0);
    });

    it('fails with invalid memberType', async () => {
      await testHelper.expectRevert(() => membersManager.getDeregistrationTime(goodMember, badMemberType),
          'Member type is not valid');
    });
  });
});
