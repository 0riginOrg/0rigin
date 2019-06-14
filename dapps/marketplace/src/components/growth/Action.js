import React, { Fragment, useState } from 'react'
import { fbt } from 'fbt-runtime'
import { Link } from 'react-router-dom'
import { formatTokens } from 'utils/growthTools'

const GrowthEnum = require('Growth$FbtEnum')

function Action(props) {
  const {
    type,
    status,
    //reward,
    //rewardEarned,
    unlockConditions,
    listingId,
    titleKey,
    detailsKey,
    iconSrc
  } = props.action

  const reward = {currency: 'OGN', amount: '123000000000000000000'}
  const rewardEarned = {currency: 'OGN', amount: '155000000000000000000'}

  const detailsEmpty =
    !detailsKey || detailsKey === 'growth.purchase.empty.details'
  const { isMobile, onMobileLockClick, hasBorder } = props

  //const actionLocked = status === 'Inactive'
  //const actionLocked = false // TODO: do not forget to comment this out

  //const actionCompleted = ['Exhausted', 'Completed'].includes(status)
  const actionCompleted = Math.random() < 0.5
  const actionLocked = !actionCompleted && Math.random() < 0.5

  const [detailsToggled, toggleDetails] = useState(false)

  let foregroundImgSrc
  let title
  let isVerificationAction = true
  let buttonLink = '/profile'
  const buttonOnClick = () => {
    window.scrollTo(0, 0)
  }

  if (type === 'Email') {
    foregroundImgSrc = 'images/growth/email-icon.svg'
    title = fbt('Verify your Email', 'RewardActions.emailTitle')
  } else if (type === 'Profile') {
    foregroundImgSrc = 'images/growth/profile-icon.svg'
    title = fbt('Add name and photo to profile', 'RewardActions.profileTitle')
  } else if (type === 'Phone') {
    foregroundImgSrc = 'images/growth/phone-icon.svg'
    title = fbt('Verify your Phone Number', 'RewardActions.phoneTitle')
  } else if (type === 'Twitter') {
    foregroundImgSrc = 'images/growth/twitter-icon.svg'
    title = fbt('Verify your Twitter Profile', 'RewardActions.twitterTitle')
  } else if (type === 'Airbnb') {
    foregroundImgSrc = 'images/growth/airbnb-icon.svg'
    title = fbt('Verify your Airbnb Profile', 'RewardActions.airbnbTitle')
  } else if (type === 'Facebook') {
    foregroundImgSrc = 'images/growth/facebook-icon.svg'
    title = fbt('Verify your Facebook Profile', 'RewardActions.facebookTitle')
  } else if (type === 'Google') {
    foregroundImgSrc = 'images/growth/google-icon.svg'
    title = fbt('Verify your Google Profile', 'RewardActions.googleTitle')
  } else if (type === 'ListingCreated') {
    foregroundImgSrc = 'images/growth/purchase-icon.svg'
    title = fbt('Create a Listing', 'RewardActions.listingCreatedTitle')
    buttonLink = '/create'
    isVerificationAction = false
  } else if (type === 'ListingPurchased') {
    foregroundImgSrc = 'images/growth/purchase-icon.svg'
    title = fbt('Purchase a Listing', 'RewardActions.listingPurchasedTitle')
    buttonLink = '/'
    isVerificationAction = false
  } else if (type === 'ListingIdPurchased') {
    foregroundImgSrc = iconSrc
    title = (
      <Fragment>
        <fbt desc="growth">
          <fbt:enum enum-range={GrowthEnum} value={titleKey} />
        </fbt>
      </Fragment>
    )
    buttonLink = `/listing/${listingId}`
    isVerificationAction = false
  } else if (type === 'ListingSold') {
    foregroundImgSrc = 'images/growth/sell-icon.svg'
    title = fbt('Sell a Listing', 'RewardActions.listingSoldTitle')
    buttonLink = '/create'
    isVerificationAction = false
  }

  const renderReward = amount => {
    return (
      <div
        className={`reward d-flex align-items-left pl-2 justify-content-center ${
          isMobile ? 'pr-0' : ''
        } align-items-center flex-grow-1`}
      >
        <img src="images/ogn-icon.svg" />
        <div className="value">
          {formatTokens(amount, props.decimalDivision)}
        </div>
      </div>
    )
  }

  let showPossibleRewardAmount = !actionCompleted && reward !== null
  const isInteractable = !actionCompleted && !actionLocked
  const showUnlockModalOnClick =
    actionLocked && isMobile && unlockConditions.length > 0

  // let showReferralPending,
  //   showReferralEarned = false

  // with Invite Friends reward show how much of a reward a
  // user can earn only if pending and earned are both 0
  // if (type === 'Referral') {
  //   showReferralEarned = rewardEarned !== null && rewardEarned.amount !== '0'
  //   showReferralPending = rewardPending !== null && rewardPending.amount !== '0'

  //   // when on mobile layout show only 1 reward type at a time
  //   showReferralPending = isMobile
  //     ? showReferralPending && !showReferralEarned
  //     : showReferralPending

  //   showPossibleRewardAmount = !showReferralPending && !showReferralEarned
  // }

  const unlockConditionText = (
    <Fragment>
      <fbt desc="RewardActions.requires">Requires:</fbt>{' '}
      {unlockConditions
        .map(unlockCondition => {
          return GrowthEnum[unlockCondition.messageKey] ? (
            <fbt desc="growth">
              <fbt:enum
                enum-range={GrowthEnum}
                value={unlockCondition.messageKey}
              />
            </fbt>
          ) : (
            'Missing translation'
          )
        })
        .join(', ')}
    </Fragment>
  )

  const wrapIntoInteraction = actionComponent => {
    return (
      <Fragment>
        {isInteractable && (
          <div>
            {buttonLink && (
              <Link
                to={buttonLink}
                className="mt-auto mb-auto"
                onClick={() => buttonOnClick()}
              >
                {actionComponent}
              </Link>
            )}
            {!buttonLink && (
              <div className="mt-auto mb-auto" onClick={() => buttonOnClick()}>
                {actionComponent}
              </div>
            )}
          </div>
        )}
        {!isInteractable && !showUnlockModalOnClick && actionComponent}
        {showUnlockModalOnClick && (
          <div
            className="mt-auto mb-auto"
            onClick={() => onMobileLockClick(unlockConditionText)}
          >
            {actionComponent}
          </div>
        )}
      </Fragment>
    )
  }

  const detailsLink = !detailsEmpty && (
    <div
      className={`toggle-details mr-1 mr-md-3`}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        toggleDetails(!detailsToggled)
      }}
    >
      {detailsToggled ? (
        <fbt desc="RewardActions.lessDetails">Less Details</fbt>
      ) : (
        <fbt desc="RewardActions.viewDetails">View Details</fbt>
      )}
    </div>
  )

  return wrapIntoInteraction(
    <div
      className={`action ${isInteractable ? 'active' : ''} ${
        isMobile ? 'mobile' : ''
      } ${hasBorder ? 'has-border' : ''}`}
    >
      <div className="d-flex action-main">
        <div className="col-2 col-md-1 pr-0 pl-0 d-flex justify-content-center align-items-center">
          <div className="listing-icon-holder">
            {type === 'ListingIdPurchased' ? (
              <img className={type.toLowerCase()} src={foregroundImgSrc} />
            ) : (
              <div className="icon-holder">
                <img className="verification-icon" src={foregroundImgSrc} />
              </div>
            )}
            {isMobile && actionLocked && (
              <img className={`status-icon ${isVerificationAction ? 'verification' : ''}`} src="images/growth/lock-icon.svg" />
            )}
            {isMobile && actionCompleted && (
              <img className={`status-icon ${isVerificationAction ? 'verification' : ''}`} src="images/growth/green-tick-icon.svg" />
            )}
          </div>
        </div>
        <div
          className={`d-flex flex-column p-2 p-md-3 justify-content-center col-7 col-md-8`}
        >
          <div className="title">{title}</div>
          {actionLocked && !isMobile && unlockConditions.length > 0 && (
            <Fragment>
              <div className="requirement pr-2 d-flex align-items-center ">
                {unlockConditionText}
              </div>
            </Fragment>
          )}
          {!actionLocked && detailsLink}
        </div>
        <div className="pr-0 pr-md-3 pl-0 pl-md-3 col-3 col-md-3 d-flex align-items-center justify-content-end">
          {/*{showReferralPending && (
            <div className="d-flex flex-column flex-grow-1">
              {renderReward(rewardPending.amount)}
              <div className="sub-text ml-2">
                <fbt desc="RewardActions.pending">Pending</fbt>
              </div>
            </div>
          )}
          {showReferralEarned && (
            <div className="d-flex flex-column flex-grow-1">
              {renderReward(rewardEarned.amount)}
              <div className="d-center sub-text ml-2">
                <fbt desc="RewardActions.earned">Earned</fbt>
              </div>
            </div>
          )}*/}
          {actionCompleted &&
            rewardEarned !== null &&
            rewardEarned.amount !== '0' && (
              <div className="d-flex flex-column flex-grow-1 align-items-center">
                {renderReward(rewardEarned.amount)}
                <div className="d-center sub-text ml-2">
                  <fbt desc="RewardActions.earned">Earned</fbt>
                </div>
              </div>
            )}
          {showPossibleRewardAmount && renderReward(reward.amount)}
          {!actionCompleted && !actionLocked && !isMobile && (
            <div className="btn btn-primary mt-2 mb-2">
              <img className="button-caret" src="images/caret-white.svg" />
            </div>
          )}
          {!isMobile && actionLocked && (
            <img className="status-icon" src="images/growth/lock-icon.svg" />
          )}
          {/* Just a padding placeholder*/}
          {!isMobile && actionCompleted && (
            <img className="status-icon" src="images/growth/green-tick-icon.svg" />
          )}
        </div>
      </div>
      {detailsEmpty || !detailsToggled ? null : (
        <div className="details">
          <fbt desc="growth">
            <fbt:enum enum-range={GrowthEnum} value={detailsKey} />
          </fbt>
        </div>
      )}
    </div>
  )
}

export default Action

require('react-styl')(`
  .growth-campaigns.container
    .action
      min-height: 80px
      color: var(--dark)
      .action-main
        padding: 30px 20px
      &.has-border
        border-bottom: 1px solid #c0cbd4
      .listing-icon-holder
        position:relative
        .status-icon
          position: absolute
          right: -5px
          bottom: -5px
          &.verification
            right: -4px
            bottom: 4px
      .verification-icon
        width: 3.5rem
      .icon-holder
        position: relative
      .background
        width: 60px
      .profile
        position: absolute
        left: 16.5px
        top: 16px
        width: 27px
      .listingsold
        position: absolute
        left: 12px
        top: 15px
        width: 37px
      .listingpurchased
        position: absolute
        left: 13px
        top: 17px
        width: 35px
      .listingidpurchased
        width: 60px
        border-radius: 5px
      .referral
        position: absolute
        left: 15px
        top: 16px
        width: 29px
      .status-icon
        width: 2.5rem
      .image-holder
        position: relative
      .title
        font-size: 1.31rem
        font-weight: bold
        line-height: 1.25
      .info-text
        font-size: 18px
        font-weight: 300
      .reward
        padding-right: 10px
        height: 28px
        font-size: 18px
        font-weight: bold
        color: var(--clear-blue)
      .reward .value
        padding-bottom: 1px
      .sub-text
        font-size: 14px
        font-weight: normal
        color: var(--dusk)
      .reward img
        margin-right: 6px
        width: 20px
      .requirement
        color: var(--dusk)
        font-size: 14px
        font-weight: normal
      .details
        color: var(--dusk)
        font-size: 14px
        font-weight: normal
        background-color: #f7f8f8
        text-align: center
        border-radius: 5px
        padding: 10px 40px
        margin-bottom: 10px
      .btn
        border-radius: 15rem
        width: 2.5rem
        height: 2.5rem
        padding-left: 0.6rem
      .button-caret
        transform: rotate(90deg)
        width: 20px
        margin-bottom: 3px
      .button-holder
        padding-left: 0px
      .placeholder
        width: 40px
      .toggle-details
        font-size: 14px
        font-weight: normal
        white-space: nowrap
        color: var(--clear-blue)
  .growth-campaigns.container.mobile
    .action
      min-height: 80px
      .action-main
        padding: 18px 0px
      .background
        width: 2.5rem
      .reward .value
        font-size: 0.875rem
      .listingsold
        left: 9px
        top: 10px
        width: 24.5px
      .listingpurchased
        left: 0px
        top: 0px
        width: 23px
      .title
        font-size: 14px
        line-height: 1.1rem
        // only allow 2 lines of height in the title
        max-height: 2.2rem
        overflow: hidden
      .btn
        border-radius: 7rem
        width: 1.65rem
        height: 1.65rem
        padding-left: 0.6rem
      .button-caret
        width: 16px
        margin-bottom: 15px
        margin-left: -4px
      .status-icon
        width: 1.56rem
      .listingpurchased
        left: 13px
        top: 17px
        width: 35px
      .listingidpurchased
        width: 44px
`)
