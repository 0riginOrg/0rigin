import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment-timezone'
import { FormattedMessage, injectIntl } from 'react-intl'

import OfferStatusEvent from 'components/offer-status-event'
import PurchaseProgress from 'components/purchase-progress'

import { offerStatusToStep } from 'utils/offer'

class MyPurchaseCard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      listing: {},
      purchasedSlots: [],
      loading: false
    }

    this.getPrice = this.getPrice.bind(this)
  }

  getPrice() {
    let price

    if (this.state.listing.listingType === 'fractional') {
      price = this.state.purchasedSlots.reduce((totalPrice, nextPrice) => totalPrice + nextPrice.price, 0)
    } else {
      price = Number(this.state.listing.price).toLocaleString(undefined, { minimumFractionDigits: 3 })
    }

    return price
  }

  getBookingDates(whichDate) {
    const { purchasedSlots, listing } = this.state
    const timeFormat = listing.slotLengthUnit === 'schema.hours' ? 'l LT' : 'LL'
    const index = whichDate === 'startDate' ? 0 : purchasedSlots.length - 1

    return moment(purchasedSlots[index][whichDate]).format(timeFormat)
  }

  render() {
    const { listing, offer, offerId } = this.props
    const { category, name, pictures, price, isMultiUnit } = listing
    const { status, totalPrice, unitsPurchased } = offer
    const voided = ['rejected', 'withdrawn'].includes(status)
    const maxStep = ['disputed', 'ruling'].includes(status) ? 4 : 3
    const step = offerStatusToStep(status)
    const photo = pictures && pictures.length > 0 && pictures[0]
    const priceToShow = listing.listingType === 'fractional' ? totalPrice.amount : price

    return (
      <div className={`purchase card${this.state.loading ? ' loading' : ''}`}>
        <div className="card-body d-flex flex-column flex-lg-row">
          <div className="aspect-ratio">
            <Link to={`/purchases/${offerId}`}>
              <div
                className={`${
                  photo ? '' : 'placeholder '
                }image-container d-flex justify-content-center`}
              >
                <img
                  src={photo || 'images/default-image.svg'}
                  role="presentation"
                />
              </div>
            </Link>
          </div>
          {!this.state.loading && (
            <div className="content-container d-flex flex-column">
              <p className="category">{category}</p>
              <h2 className="title text-truncate" title={name}>
                <Link to={`/purchases/${offerId}`}>{name}</Link>
              </h2>
              <p className="timestamp">
                <OfferStatusEvent offer={offer} />
              </p>
              {!voided && (
                <Fragment>
                  {listing.listingType === 'fractional' &&
                    <div className="d-flex">
                      <p className="booking-dates">
                        { `${this.getBookingDates('startDate')} - ${this.getBookingDates('endDate')}`}
                      </p>
                    </div>
                  }
                  {isMultiUnit && <div className="flex-grid d-flex flex-column">
                    <div className="d-flex col-12 pl-0 pr-0 mr-auto pt-3">
                      <div className="col-4 pl-0 pr-0">
                        <FormattedMessage
                          id={ 'my-purchase-card.quantity' }
                          defaultMessage={ 'Quantity:' }
                        />
                      </div>
                      <div className="col-8 pl-0 pr-0">
                        {unitsPurchased}
                      </div>
                    </div>
                    <div className="d-flex col-12 pl-0 pr-0 mr-auto pt-2">
                      <div className="col-4 pl-0 pr-0">
                        <FormattedMessage
                          id={ 'my-purchase-card.pricePerUnit' }
                          defaultMessage={ 'Price/Unit:' }
                        />
                      </div>
                      <div className="col-8 pl-0 pr-0">
                        {`${Number(price).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 5, maximumFractionDigits: 5 }
                        )} ${totalPrice.currency}`}
                      </div>
                    </div>
                  </div>}

                  <div className={'dflex-grid d-flex ' + (isMultiUnit ? 'pt-0' : 'pt-3')}>
                    <div className="d-flex col-12 pl-0 pr-0 pt-2">
                      <div className="emphasis col-4 pl-0 pr-0">
                        <FormattedMessage
                          id={ 'my-purchase-card.totalPrice' }
                          defaultMessage={ 'Total Price:' }
                        />
                      </div>
                      <div className="emphasis col-8 pl-0 pr-0">
                        {`${Number(priceToShow).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 5, maximumFractionDigits: 5 }
                        )} ${totalPrice.currency}`}
                      </div>
                    </div>
                  </div>
                  <PurchaseProgress
                    currentStep={step}
                    maxStep={maxStep}
                    perspective="buyer"
                    purchase={offer}
                    subdued={true}
                  />
                </Fragment>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default injectIntl(MyPurchaseCard)
