import React, { Component } from 'react'
import Modal from 'components/Modal'
import { fbt } from 'fbt-runtime'

import DisputeOffer from './mutations/DisputeOffer'
import Stages from 'components/TransactionStages'

class OfferAcceptedSeller extends Component {
  state = {}

  render() {
    const { offer } = this.props
    return (
      <div className="transaction-progress">
        <div className="top">
          <h4>
            <fbt desc="WaitForFinalize.youVeAcceptedOffer">
              You&apos;ve accepted this offer.
            </fbt>
          </h4>
          <Stages className="mt-4" mini="true" offer={offer} />
          <div className="help mt-3 mb-0">
            <fbt desc="WaitForFinalize.makeSureYouFullfillOrder">
              Make sure to fulfill the order promptly. Message the buyer if
              there is any information that you need.
            </fbt>
          </div>
          <button
            className="btn btn-link mt-2 mr-auto"
            onClick={() => this.setState({ open: true })}
            children=""
          >
            <fbt desc="WaitForFinalize.viewFullfillment">
              View Fulfillment Checklist
            </fbt>{' '}
          </button>

          <DisputeOffer
            offer={this.props.offer}
            party="seller"
            className="btn btn-link withdraw mt-3 mr-auto"
          >
            <fbt desc="WaitForFinalize.reportProblme">Report a Problem</fbt>
          </DisputeOffer>
        </div>

        {!this.state.open ? null : (
          <Modal
            className="offer-accepted-seller"
            onClose={() => this.setState({ open: false, shouldClose: false })}
            shouldClose={this.state.shouldClose}
          >
            <div className="d-flex flex-column content">
              <div className="checklist">
                <h2>
                  <fbt desc="WaitForFinalize.fuulfillmentChecklist">
                    Fulfillment Checklist
                  </fbt>
                </h2>
                <div>
                  <span className="table-cell">
                    <span className="step">1</span>
                  </span>
                  <span className="text">
                    <fbt desc="WaitForFinalize.verifyVariants">
                      Verify the variants with the seller
                    </fbt>
                  </span>
                </div>
                <div>
                  <span className="table-cell">
                    <span className="step">2</span>
                  </span>
                  <span className="text">
                    <fbt desc="WaitForFinalize.packageProduct">
                      Package the product and send it out
                    </fbt>
                  </span>
                </div>
                <div>
                  <span className="table-cell">
                    <span className="step">3</span>
                  </span>
                  <span className="text">
                    <fbt desc="WaitForFinalize.notifyBuyer">
                      Notify buyer and provide tracking number
                    </fbt>
                  </span>
                </div>
                <div>
                  <span className="table-cell">
                    <span className="step">4</span>
                  </span>
                  <span className="text">
                    <fbt desc="WaitForFinalize.waitForBuyer">
                      Wait for buyer to receive product
                    </fbt>
                  </span>
                </div>
                <div>
                  <span className="table-cell">
                    <span className="step">5</span>
                  </span>
                  <span className="text">
                    <fbt desc="WaitForFinalize.withdrawYourFuns">
                      Withdraw your funds
                    </fbt>
                  </span>
                </div>
              </div>
              <button
                className="btn btn-outline-light"
                onClick={() => this.setState({ shouldClose: true })}
                children={fbt('OK', 'OK')}
              />
            </div>
          </Modal>
        )}
      </div>
    )
  }
}

export default OfferAcceptedSeller

require('react-styl')(`
  .offer-accepted-seller
    max-width: 580px

    .content
      height: 100%
      text-align: left
      h2
        text-align: center
      .step
        background: var(--dark)
        color: var(--white)
        min-width: 1.6rem
        padding: 0.2rem 0.5rem
        height: 1.6rem
        border-radius: 2rem
        line-height: 1.6rem
        text-align: center
        margin-right: 0.5rem
      .checklist
        padding-bottom: 2rem
        > div
          margin-bottom: 1rem
        span
          &.text
            display: table-cell
            padding-left: 0.5rem

    .table-cell
      display: table-cell

    .btn-outline-light
      width: 50%
      align-self: center

  @media (max-width: 576px)
    .offer-accepted-seller
      padding: 1rem !important
`)
