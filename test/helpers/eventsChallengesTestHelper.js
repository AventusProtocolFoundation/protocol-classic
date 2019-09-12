let testHelper, avtTestHelper, votingTestHelper;
let eventsManager;

const BN = web3.utils.BN;

async function init(_testHelper, _avtTestHelper, _votingTestHelper) {
  testHelper = _testHelper;
  avtTestHelper  =_avtTestHelper;
  votingTestHelper = _votingTestHelper;

  eventsManager = testHelper.getEventsManager();
}

async function challengeEventAndMarkAsFraudulent(_eventId, _challenger) {
  const challenge = await challengeEvent(_eventId, _challenger);

  await avtTestHelper.addAVT(avtTestHelper.oneAVTTo18SigFig, _challenger);
  await votingTestHelper.advanceTimeCastAndRevealVotes(challenge.proposalId, [{voter: _challenger, option: 1}]);
  await advanceTimeAndEndEventChallenge(_eventId, challenge.proposalId, _challenger);

  await withdrawSuccessfulChallengeWinnings(challenge.proposalId, _challenger, _challenger,
      _challenger, challenge.deposit);
  await avtTestHelper.withdrawAVT(avtTestHelper.oneAVTTo18SigFig, _challenger);

  return challenge;
}

async function challengeEvent(_eventId, _challengeOwner) {
  const existingDeposit = await eventsManager.getExistingEventDeposit(_eventId);
  await avtTestHelper.addAVT(existingDeposit, _challengeOwner);
  await eventsManager.challengeEvent(_eventId, {from: _challengeOwner});
  const logArgs = await testHelper.getLogArgs(eventsManager, 'LogEventChallenged');
  return {proposalId : logArgs.proposalId.toNumber(), deposit : existingDeposit};
}

async function advanceTimeAndEndEventChallenge(_eventId, _challengeProposalId, _challengeEnder) {
  await votingTestHelper.advanceTimeToEndOfProposal(_challengeProposalId);
  await eventsManager.endEventChallenge(_eventId, {from: _challengeEnder});
}

async function withdrawSuccessfulChallengeWinnings(_challengeProposalId, _challengeOwner, _challengeEnder, _voter, _deposit) {
  const challengeOwnerAndEnderWinnings = _deposit.div(new BN(10));
  await avtTestHelper.withdrawAVT(challengeOwnerAndEnderWinnings, _challengeOwner);
  await avtTestHelper.withdrawAVT(challengeOwnerAndEnderWinnings, _challengeEnder);

  await votingTestHelper.claimVoterWinnings(_challengeProposalId, _voter);
  const totalVoterWinnings = _deposit.sub(challengeOwnerAndEnderWinnings).sub(challengeOwnerAndEnderWinnings);

  await avtTestHelper.withdrawAVT(totalVoterWinnings, _voter);
  await avtTestHelper.withdrawAVT(_deposit, _challengeOwner);
  return totalVoterWinnings.mod(new BN(2));
}

// Keep exports alphabetical.
module.exports = {
  advanceTimeAndEndEventChallenge,
  challengeEvent,
  challengeEventAndMarkAsFraudulent,
  init,
};