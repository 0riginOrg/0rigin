const BigNumber = require('bignumber.js')

const db = require('../models')
const db2 = require('origin-identity/src/models')
const logger = require('../logger')

const { GrowthCampaign } = require('./campaign')
const { CampaignRules } = require('../rules/rules')

class GrowthInvite {
  /**
   * Returns a list of pending rewards:
   *  - get list of referees from growth_referral. Note: for now we only care
   *    about referees that published their profiles. We ignore others
   *    that haven't made it that far.
   *  - filter out invites completed during the current campaign.
   *  - filter out invites completed during prior campaigns.
   * @param {string} referrer: ethAddress of the referrer.
   * @param {Array<string>} ignore: list of accounts to ignore
   * @param rewardValue
   * @returns {Promise<*>}
   * @private
   */
  //
  //
  static async _getPendingRewards(referrer, ignore, rewardValue) {
    // Load all invites.
    const referrals = db.GrowthReferall.findAll({
      where: { referrerEthAddress: referrer }
    })
    const allReferees = referrals.map(r => r.refereeEthAddress)

    // Filter out referrals we are supposed to ignore.
    const pendingReferees = allReferees.filter(r => !ignore.includes(r))

    // Load prior campaigns and filter out referrals completed during those.
    const pastCampaigns = GrowthCampaign.getPast(referrer)
    for (const campaign of pastCampaigns) {
      // TODO(franck): for a campaign for which rewards have already been
      // distributed, it could be faster to load the data from the
      // growth_reward table as opposed to recalculating the rules.
      const rewards = await campaign.getRewards(referrer, false)
      // Get list of addresses for referees for which referral was completed
      // during that campaign.
      const referees = rewards
        .filter(r => r.constructor.name === 'ReferralReward') // Filter out non-referral rewards.
        .map(r => r.refereeEthAddress)
      // Filter out those completed referrals from our pendingReferees list.
      pendingReferees.filter(r => !referees.includes(r))
    }

    return pendingReferees.map(r => {
      return {
        refereeEthAddress: r,
        value: rewardValue
      }
    })
  }

  /**
   *
   * @param {ReferralReward} reward of type referral.
   * @param {string} status to set
   * @returns {Promise<{status:string, walletAddress:string, contactName:string, reward:{amount:string, currency:string}}>}
   * @private
   */
  static async _decorate(reward, status) {
    const referee = reward.refereeEthAddress

    let identity = await db2.Identity.findOne({
      where: { ethAddress: referee }
    })
    if (!identity) {
      // Defensive coding. This should theoretically not happen.
      logger.error(`Failed loading identity for referee ${referee}`)
      identity = { firstName: '', lastName: '' }
    }

    return {
      status,
      walletAddress: referee,
      contactName: (identity.firstName || '') + ' ' + (identity.lastName || ''),
      reward: reward.value
    }
  }

  // Returns information about pending and completed referrals for a campaign
  static async getReferralsInfo(ethAddress, campaignId) {
    // Load the campaign.
    const campaign = await db.GrowthCampaign.findOne({
      where: { id: campaignId }
    })
    if (!campaign) {
      throw new Error('Failed loading campaign with id ${campaignId}')
    }

    // Get list of referrals completed during the campaign by evaluating its rules.
    const crules = new CampaignRules(campaign, JSON.parse(campaign.rules))
    const rewards = await crules.getRewards(ethAddress, false)
    const completedInvites = rewards
      .filter(r => r.constructor.name === 'ReferralReward') // Filter out non-referral rewards.
      .map(r => GrowthInvite._decorate(r, 'Completed')) // Decorate with extra info.

    // We need to compute pending invites only if the campaign is active.
    let pendingInvites = []
    const now = new Date()
    const isActive = campaign.startDate >= now && campaign.endDate <= now
    if (isActive) {
      const ignore = completedInvites.map(i => i.walletAddress)
      const pendingRewards = await GrowthInvite._getPendingRewards(
        ethAddress,
        ignore,
        rewardValue
      )
      pendingInvites = pendingRewards.map(r =>
        GrowthInvite._decorate(r, 'Pending')
      )
    }

    const allInvites = completedInvites.concat(pendingInvites)

    // Calculate total rewards earned and pending.
    const rewardValue = crules.getReferralRewardValue()
    const rewardAmount = rewardValue
      ? BigNumber(rewardValue.amount)
      : BigNumber(0)
    const earnedAmount = rewardAmount.times(completedInvites.length)
    const pendingAmount = rewardAmount.times(pendingInvites.length)

    return {
      rewardEarned: {
        amount: earnedAmount.toFixed(),
        currency: campaign.currency
      },
      rewardPending: {
        amount: pendingAmount.toFixed(),
        currency: campaign.currency
      },
      reward: rewardValue,
      // TODO: honor invites first and after parameter.
      invites: {
        nodes: allInvites,
        pageInfo: {
          // TODO: implement pagination.
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null
        },
        totalCount: allInvites.length
      }
    }
  }

  // Returns referrer's information based on an invite code.
  static async getReferrerInfo(code) {
    // Lookup the code.
    const inviteCode = await db.GrowthInviteCode.findOne({ where: { code } })
    if (!inviteCode) {
      throw new Error('Invalid invite code')
    }
    const referrer = inviteCode.ethAddress

    // Load the referrer's identity.
    // TODO(franck): Once our data model and GraphQL services interfaces are
    // stable, we should consider:
    //  a. fetching identity by making a call to the identity graphql endpoint.
    //  b. putting all the identity code in a separate origin-identity package.
    const identity = await db2.Identity.findOne({
      where: { ethAddress: referrer }
    })
    if (!identity) {
      // This should never happen since before being allowed to send any
      // referral invitation, a referrer must publish their profile.
      logger.error(`Failed loading identity for referrer ${referrer}`)
      return { firstName: '', lastName: '' }
    }

    return {
      firstName: identity.firstName,
      lastName: identity.lastName
    }
  }
}

module.exports = { GrowthInvite }
