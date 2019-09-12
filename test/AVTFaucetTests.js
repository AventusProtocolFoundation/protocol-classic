const testHelper = require('./helpers/testHelper');
const avtTestHelper = require('./helpers/avtTestHelper');
const timeTestHelper = require('./helpers/timeTestHelper');

const BN = testHelper.BN;

contract('AVTFaucet', async () => {
  let avtFaucet, avt, aventusStorage, accounts, dripAmount;

  before(async () => {
    await testHelper.init();
    await avtTestHelper.init(testHelper);
    await timeTestHelper.init(testHelper);

    aventusStorage = testHelper.getAventusStorage();
    avt = testHelper.getAVTIERC20();
    avtFaucet = testHelper.getAVTFaucet();
    accounts = testHelper.getAccounts('owner', 'dripee1', 'dripee2', 'dripee3');

    dripAmount = new BN(10).pow(new BN(19));
    // Give the faucet something to drip!
    await avt.transfer(avtFaucet.address, dripAmount.mul(new BN(100)));
  });

  async function dripSucceeds(_fromAccount) {
    const balanceBefore = await avt.balanceOf(_fromAccount);
    await avtFaucet.drip({from: _fromAccount});
    const balanceAfter = await avt.balanceOf(_fromAccount);
    testHelper.assertBNEquals(balanceBefore.add(dripAmount), balanceAfter);
  }

  context('drip and getNextPaymentTime', async () => {
    async function dripFails(_fromAccount, _expectedError) {
      await testHelper.expectRevert(() => avtFaucet.drip({from: _fromAccount}), _expectedError);
    }

    it('drip succeeds', async () => {
      await dripSucceeds(accounts.dripee1);
    });

    it('getNextPaymentTime', async() => {
      const oneDayFromNow = timeTestHelper.now().add(timeTestHelper.oneDay);
      testHelper.assertBNEquals(oneDayFromNow, await avtFaucet.getNextPaymentTime({from: accounts.dripee1}));
      testHelper.assertBNZero(await avtFaucet.getNextPaymentTime({from: accounts.dripee2}));
      testHelper.assertBNZero(await avtFaucet.getNextPaymentTime({from: accounts.dripee3}));
    });

    it('drip fails if not enough time has passed', async () => {
      await dripSucceeds(accounts.dripee2);
      const shortWindow = timeTestHelper.oneDay.sub(new BN(1));
      await timeTestHelper.advanceToTime(timeTestHelper.now().add(shortWindow));
      await dripFails(accounts.dripee1, 'Not yet');
      await dripSucceeds(accounts.dripee3);
      await timeTestHelper.advanceToTime(timeTestHelper.now().add(new BN(1)));
      await dripSucceeds(accounts.dripee2);
      await dripFails(accounts.dripee2, 'Not yet');
    });
  });

  context('updates', async () => {
    it('dripWindow', async () => {
      await avtFaucet.updateDripWindow(0);
      await dripSucceeds(accounts.dripee1);
      await dripSucceeds(accounts.dripee1);
    });

    it('dripAmount', async () => {
      dripAmount = dripAmount.mul(new BN(2));
      await avtFaucet.updateDripAmount(dripAmount);
      await dripSucceeds(accounts.dripee1);
    });
  });
});