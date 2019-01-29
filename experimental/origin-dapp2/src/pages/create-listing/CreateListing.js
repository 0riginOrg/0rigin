import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'

import withTokenBalance from 'hoc/withTokenBalance'
import withWallet from 'hoc/withWallet'

import Step1 from './Step1'
import Step2 from './Step2'
import Boost from './Boost'
import Availability from './Availability'
import Review from './Review'

import Store from 'utils/store'
const store = Store('sessionStorage')

class CreateListing extends Component {
  constructor() {
    super()
    this.state = {
      listing: {
        title: '',
        description: '',
        category: '',
        subCategory: '',
        location: '',
        boost: '50',
        boostLimit: '100',
        media: [],

        // Unit fields:
        quantity: '1',
        price: '',

        // HomeShare fields:
        weekdayPrice: '',
        weekendPrice: '',
        booked: [],
        customPricing: [],
        unavailable: [],

        ...store.get('create-listing', {})
      }
    }
  }

  setListing(listing) {
    store.set('create-listing', listing)
    this.setState({ listing })
  }

  render() {
    const { category, subCategory } = this.state.listing
    let listingType = 'unit'
    if (category === 'schema.forRent' && subCategory === 'schema.housing') {
      listingType = 'fractional'
    }
    return (
      <div className="container create-listing">
        <Switch>
          <Route
            path="/create/step-2"
            render={() => (
              <Step2
                listing={this.state.listing}
                listingType={listingType}
                onChange={listing => this.setListing(listing)}
              />
            )}
          />
          <Route
            path="/create/boost"
            render={() => (
              <Boost
                listing={this.state.listing}
                listingType={listingType}
                tokenBalance={this.props.tokenBalance}
                onChange={listing => this.setListing(listing)}
              />
            )}
          />
          <Route
            path="/create/review"
            render={() => (
              <Review
                tokenBalance={this.props.tokenBalance}
                listingType={listingType}
                listing={this.state.listing}
              />
            )}
          />
          <Route
            path="/create/availability"
            render={() => (
              <Availability
                tokenBalance={this.props.tokenBalance}
                listing={this.state.listing}
                onChange={listing => this.setListing(listing)}
              />
            )}
          />
          <Route
            render={() => (
              <Step1
                listing={this.state.listing}
                onChange={listing => this.setListing(listing)}
              />
            )}
          />
        </Switch>
      </div>
    )
  }
}

export default withWallet(withTokenBalance(CreateListing))

require('react-styl')(`
  .create-listing
    padding-top: 3rem
    .gray-box
      border-radius: 5px
      padding: 2rem
      background-color: var(--pale-grey-eight)

    .step
      font-family: Lato
      font-size: 14px
      color: var(--dusk)
      font-weight: normal
      text-transform: uppercase
      margin-top: 0.75rem
    .step-description
      font-family: Poppins
      font-size: 24px
      font-weight: 300
      line-height: normal

    .actions
      margin-top: 2.5rem
      display: flex
      justify-content: space-between
      .btn
        min-width: 10rem
        border-radius: 2rem
        padding: 0.625rem
        font-size: 18px
`)
