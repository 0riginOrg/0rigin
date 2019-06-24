import React from 'react'
import { fbt } from 'fbt-runtime'

import CoinPrice from 'components/CoinPrice'
import Price from 'components/Price'
import Tooltip from 'components/Tooltip'

import numberFormat from 'utils/numberFormat'

const WarningIcon = ({ tooltip }) => (
  <Tooltip tooltip={tooltip} placement="top">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="21"
      viewBox="0 0 22 21"
      className="warning-icon"
    >
      <path
        fill="#F4C110"
        fillRule="evenodd"
        d="M11 17.646a1.146 1.146 0 1 1 0-2.293 1.146 1.146 0 0 1 0 2.293zm-.917-3.896h1.834V7.333h-1.834v6.417zM11 0L0 20.167h22L11 0z"
      />
    </svg>
  </Tooltip>
)

function escrowIsHeld(status) {
  return status.match(/accepted|disputed|pending/i)
}

function escrowStatus(status) {
  return escrowIsHeld(status)
    ? fbt('Held', 'EscrowDetails.held')
    : fbt('Released', 'EscrowDetails.released')
}

const EscrowDetails = ({ offer }) => (
  <ul className="escrow-details list-unstyled">
    <li className="escrow-amount">
      <span>
        <fbt desc="EscrowDetails.amount">Amount</fbt>
      </span>
      <span>
        {offer.totalPrice.currency.id.match('DAI') && (
          <>
            <CoinPrice iconOnly smaller coin="dai" />
            {numberFormat(offer.totalPrice.amount, 2)}
            &nbsp;
            {'DAI'}
          </>
        )}
        {offer.totalPrice.currency.id.match('ETH') && (
          <>
            <CoinPrice iconOnly smaller coin="eth" />
            {numberFormat(offer.totalPrice.amount, 5)}
            &nbsp;
            {'ETH'}
          </>
        )}
      </span>
    </li>
    <li className="escrow-value">
      <span>
        <fbt desc="EscrowDetails.value">Current Value</fbt>
        {offer.totalPrice.currency.id.match('ETH') && (
          <WarningIcon
            tooltip={fbt(
              'Ether is highly volatile and it’s value can change significantly in a short period of time.',
              'EscrowDetails.volatility'
            )}
          />
        )}
      </span>
      <span>
        <Price price={offer.totalPrice} />
      </span>
    </li>
    <li className="escrow-status">
      <span>
        <fbt desc="EscrowDetails.status">Status</fbt>
      </span>
      <span className={escrowIsHeld(offer.statusStr) ? 'held' : 'released'}>{escrowStatus(offer.statusStr)}</span>
    </li>
  </ul>
)

export default EscrowDetails

require('react-styl')(`
  .escrow-details
    font-size: 14px
    font-weight: normal
    li
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0 0.375rem 0
      padding: 0.375rem 0 0.375rem 0
      > span:nth-child(1)
        font-weight: normal
      > span:nth-child(2)
        font-weight: bold
      > span
          color: #000
          &.held
            color: var(--golden-rod)
          &.released
            color: #00d693
      background-position: left center
      background-repeat: no-repeat
      background-size: 0.75rem
      &.escrow-value
        .warning-icon
          margin-left: 0.5rem
          vertical-align: sub

  @media (max-width: 767.98px)
    .escrow-details
      font-size: 18px
`)
