import React from 'react'
import { fbt } from 'fbt-runtime'
import { formatTokens } from 'utils/growthTools'
import Link from 'components/Link'

function ActionGroup(props) {
  const {
    isMobile,
    type,
    hasBorder,
    completedActions,
    notCompletedActions
  } = props

  let iconSource, title

  if (type === 'verifications') {
    iconSource = 'images/growth/verifications-icon.svg'
    title = fbt('Verifications', 'growth.actionGroup.verifications')
  } else if (type === 'purchases') {
    iconSource = 'images/growth/purchases-icon.svg'
    title = fbt('Purchases', 'growth.actionGroup.purchases')
  } else if (type === 'invitations') {
    iconSource = 'images/growth/invitations-icon.svg'
    title = fbt('Invitations', 'growth.actionGroup.invitations')
  }

  const sumActionRewards = (actions, type, mode = 'earned') => {
    if (!['earned', 'available'].includes(mode))
      throw new Error(`Unrecognised mode sum action mode: ${mode}`)

    let aggregate = web3.utils.toBN('0')
    actions.forEach(action => {
      if (type === 'invitations') {
        if (mode === 'earned') {
          if (action.rewardEarned)
            aggregate = web3.utils
              .toBN(action.rewardEarned.amount)
              .add(aggregate)
        } else {
          if (action.reward) {
            aggregate = web3.utils
              .toBN(action.reward.amount)
              .mul(web3.utils.toBN(25))
              .add(aggregate)
          }
        }
      } else {
        const rewardField = mode === 'earned' ? 'rewardEarned' : 'reward'
        if (action[rewardField])
          aggregate = web3.utils.toBN(action[rewardField].amount).add(aggregate)
      }
    })
    return aggregate
  }

  const renderReward = amount => {
    return (
      <div className="reward d-flex pl-2 justify-content-start align-items-center flex-grow-1">
        <img className="act-group-ogn-icon mr-1" src="images/ogn-icon.svg" />
        <div className="value">
          {formatTokens(amount, props.decimalDivision)}
        </div>
      </div>
    )
  }

  const renderRewardHolder = (amount, text, className) => {
    return (
      <div
        className={`d-flex align-items-center ${
          isMobile ? 'm-2 flex-column' : 'm-3 flex-row'
        } ${className ? className : ''}`}
      >
        {isMobile && renderReward(amount)}
        <div className="sub-text ml-2">{text}</div>
        {!isMobile && renderReward(amount)}
      </div>
    )
  }

  return (
    <Link
      className={`growth-action-group d-flex align-items-center ${
        isMobile ? 'mobile' : ''
      } ${hasBorder ? 'with-border' : ''}`}
      to={`campaigns/${type}`}
    >
      <img className="icon" src={iconSource} />
      <div className="title">{title}</div>
      {renderRewardHolder(
        sumActionRewards(
          type === 'invitations'
            ? [...completedActions, ...notCompletedActions]
            : notCompletedActions,
          type,
          'available'
        ),
        fbt('Available', 'RewardActions.available'),
        'ml-auto'
      )}
      {renderRewardHolder(
        sumActionRewards(
          type === 'invitations'
            ? [...completedActions, ...notCompletedActions]
            : completedActions,
          type,
          'earned'
        ),
        fbt('Earned', 'RewardActions.earned'),
        'ml-3'
      )}
    </Link>
  )
}

export default ActionGroup

require('react-styl')(`
  .growth-action-group.with-border
    border-bottom: 1px solid #c0cbd4
  .growth-action-group.mobile
    padding-top: 20px
    padding-bottom: 20px
    .icon
      width: 40px
    .title
      font-size: 18px
      margin-left: 11px
    .act-group-ogn-icon
      width: 14px
    .value
      font-size: 0.875rem
    .sub-text
      margin-top: -5px
      font-size: 11px
  .growth-action-group
    padding-top: 30px
    padding-bottom: 30px
    cursor: pointer
    .icon
      width: 60px
    .title
      font-size: 24px
      font-family: Lato
      font-weight: bold
      color: black
      margin-left: 25px
      cursor: pointer
    .act-group-ogn-icon
      width: 20px
    .value
      font-size: 18px
      font-weight: bold
      color: var(--clear-blue)
    .sub-text
      font-size: 16px
      font-weight: normal
      line-height: 2.45
      text-align: center
      color: #455d75
`)
