import React, { Component } from 'react'
import { fbt } from 'fbt-runtime'

import withWallet from 'hoc/withWallet'
import withIsMobile from 'hoc/withIsMobile'
import withGrowthCampaign from 'hoc/withGrowthCampaign'
import withTokenBalance from 'hoc/withTokenBalance'
import withGrowthRewards from 'hoc/withGrowthRewards'

import Gallery from 'components/Gallery'
import GalleryScroll from 'components/GalleryScroll'
import Reviews from 'components/Reviews'
import AboutParty from 'components/AboutParty'
import DocumentTitle from 'components/DocumentTitle'
import Category from 'components/Category'
import LocationMap from 'components/LocationMap'
import UserListings from 'pages/user/_UserListings'
import {
  isHistoricalListing,
  historicalListingIsCurrent,
  currentListingIdFromHistoricalId
} from 'utils/listing'
import Redirect from 'components/Redirect'

import Sold from './_ListingSold'
import Pending from './_ListingPending'
import Withdrawn from './_ListingWithdrawn'
import EditOnly from './_ListingEditOnly'
import OfferMade from './_ListingOfferMade'

import GiftCardDetail from './listing-types/GiftCard'
import FractionalNightlyDetail from './listing-types/fractional/FractionalNightlyDetail'
import FractionalHourlyDetail from './listing-types/fractional-hourly/FractionalHourlyDetail'

import getAvailabilityCalculator from 'utils/getAvailabilityCalculator'

import HistoricalListingWarning from 'pages/listing/_HistoricalListingWarning'

import BuySingleUnitWidget from './listing-types/single-unit/BuySingleUnitWidget'
import BuyMultiUnitWidget from './listing-types/multi-unit/BuyMultiUnitWidget'
import BuyFractionalWidget from './listing-types/fractional/BuyFractionalWidget'
import BuyFractionalHourlyWidget from './listing-types/fractional-hourly/BuyFractionalHourlyWidget'

class ListingDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      availability: getAvailabilityCalculator(props.listing)
    }
  }

  render() {
    const { listing } = this.props

    if (isHistoricalListing(listing) && historicalListingIsCurrent(listing)) {
      return (
        <Redirect
          to={`/listing/${currentListingIdFromHistoricalId(listing)}`}
        />
      )
    }

    if (!listing || !listing.seller || !listing.seller.id) {
      console.error(
        'Error: ListingDetail: Unable to get seller ID due to missing data!'
      )
    }

    return (
      <div className="container listing-detail">
        <DocumentTitle pageTitle={listing.title} />
        {this.renderContent()}
      </div>
    )
  }

  renderContent() {
    const { listing, isMobile } = this.props

    let gallery
    if (listing.media && listing.media.length) {
      gallery = (
        <div className="listing-media">
          {this.props.isMobile ? (
            <GalleryScroll pics={listing.media} />
          ) : (
            <Gallery pics={listing.media} />
          )}
        </div>
      )
    }

    const reviews = <Reviews id={listing.seller.id} seller hideWhenZero />
    const userListings = (
      <UserListings
        user={listing.seller.id}
        hideLoadMore
        compact
        title={fbt(
          'Other listings by this seller',
          'ListingDetail.othersFromSeller'
        )}
        hideIfEmpty={true}
        excludeListing={listing.id}
      />
    )
    const hasLocation = !!listing.location

    if (isMobile) {
      return (
        <>
          <div className="listing-info">
            {this.renderHeading()}
            {this.renderAction()}
          </div>
          {gallery}
          <div className="listing-description">
            {this.renderListingDetail()}
            {hasLocation && this.renderMap()}
          </div>
          <div className="about-seller">{this.renderSellerInfo()}</div>
          <div className="seller-info">
            {userListings}
            {reviews}
          </div>
        </>
      )
    }

    return (
      <>
        <div className="row">
          <div className="col-md-7 col-xl-8">{gallery}</div>
          <div className="col-md-5 col-xl-4">
            <div className="listing-info">
              {this.renderHeading()}
              {this.renderAction()}
              {this.renderSellerInfo()}
            </div>
          </div>
        </div>
        <div className="listing-description">
          {this.renderListingDetail()}
          {hasLocation && this.renderMap()}
        </div>
        <div className="seller-info">
          {reviews}
          {userListings}
        </div>
      </>
    )
  }

  renderListingDetail() {
    const { listing, isMobile } = this.props
    const isFractional = listing.__typename === 'FractionalListing'
    const isFractionalHourly = listing.__typename === 'FractionalHourlyListing'
    const isOwnerViewing = listing.seller.id === this.props.walletProxy

    const description = !isMobile ? (
      <div className="description">
        <h3>
          <fbt desc="ListingDetail.productDescription">Product Description</fbt>
        </h3>
        {String(listing.description).replace(/^\s+/, '')}
      </div>
    ) : (
      <div className="description">
        {String(listing.description).replace(/^\s+/, '')}
      </div>
    )

    let detail = description

    if (listing.__typename === 'GiftCardListing') {
      detail = <GiftCardDetail listing={listing} description={description} />
    } else if (isFractional) {
      detail = (
        <FractionalNightlyDetail
          listing={listing}
          description={description}
          availability={this.state.availability}
          isOwnerViewing={isOwnerViewing}
          onChange={state => {
            this.setState(state)
            this.props.updateBookingRange(state.range)
          }}
          openCalendar={this.state.openCalendar}
          onClose={() => this.setState({ openCalendar: false })}
        />
      )
    } else if (isFractionalHourly) {
      detail = (
        <FractionalHourlyDetail
          listing={listing}
          description={description}
          availability={this.state.availability}
          isOwnerViewing={isOwnerViewing}
          onChange={state => {
            this.setState(state)
            this.props.updateBookingRange(state.range)
          }}
          openCalendar={this.state.openCalendar}
          onClose={() => this.setState({ openCalendar: false })}
        />
      )
    }

    return detail
  }

  renderHeading() {
    const { listing, isMobile } = this.props
    return (
      <div className="heading">
        {!isMobile && (
          <div className="category">
            <Category listing={listing} />
          </div>
        )}
        <h2>{listing.title}</h2>
      </div>
    )
  }

  renderMap() {
    const { listing } = this.props
    let containerStyle = {
      height: '400px'
    }
    if (this.props.isMobile) {
      containerStyle = {
        ...containerStyle,
        marginLeft: '-15px',
        marginRight: '-15px'
      }
    }

    return (
      <LocationMap
        googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyCIWC3x1Xn5lDGRDLvI1O9vAyIjoJRCsg0"
        loadingElement={<div style={{ height: '100%' }} />}
        containerElement={
          <div className="mt-2 mt-md-4" style={containerStyle} />
        }
        mapElement={<div style={{ height: '100%' }} />}
        defaultZoom={16}
        defaultCenter={{
          latitude: listing.location.latitude,
          longitude: listing.location.longitude
        }}
        circleOptions={{
          latitude: listing.location.latitude,
          longitude: listing.location.longitude,
          radius: listing.location.accuracyInMeters
        }}
        readonly={true}
      />
    )
  }

  renderAction() {
    const { listing, wallet, walletProxy, ognListingRewards } = this.props

    if (isHistoricalListing(listing)) {
      return <HistoricalListingWarning listing={listing} />
    }

    const isFractional = listing.__typename === 'FractionalListing'
    const isFractionalHourly = listing.__typename === 'FractionalHourlyListing'
    const isAnnouncement = listing.__typename === 'AnnouncementListing'
    const isSingleUnit =
      listing.__typename === 'UnitListing' && listing.unitsTotal === 1
    const isService = listing.__typename === 'ServiceListing'
    const isPendingBuyer = listing.pendingBuyers.some(
      b => b.id === walletProxy || b.id === wallet
    )
    const isListingCreator =
      listing.seller.id === walletProxy || listing.seller.id === wallet

    const props = { ...this.props }
    const growthReward = ognListingRewards[listing.id]
    if (growthReward) {
      props.growthReward = growthReward
    }

    const offers = !isPendingBuyer
      ? null
      : listing.events.filter(
          event =>
            event.event === 'OfferCreated' &&
            (event.returnValues.party === walletProxy ||
              event.returnValues.party === wallet)
        )

    if (isListingCreator) {
      return (
        <EditOnly
          {...this.props}
          isAnnouncement={isAnnouncement}
          isFractional={isFractional}
          isFractionalHourly={isFractionalHourly}
          isSingleUnit={isSingleUnit}
          isService={isService}
        />
      )
    } else if (isAnnouncement) {
      return null
    } else if (listing.status === 'sold') {
      return <Sold {...props} isSingleUnit={isSingleUnit} />
    } else if (isPendingBuyer && !listing.multiUnit && !isService) {
      return (
        <OfferMade {...props} isSingleUnit={isSingleUnit} offers={offers} />
      )
    } else if (isPendingBuyer && (listing.multiUnit || isService)) {
      return (
        <>
          <OfferMade {...props} isSingleUnit={isSingleUnit} offers={offers} />
          <BuyMultiUnitWidget {...props} isPendingBuyer={isPendingBuyer} />
        </>
      )
    } else if (listing.status === 'pending' && !isService) {
      return <Pending {...props} />
    } else if (listing.status === 'withdrawn') {
      return <Withdrawn />
    } else if (isFractional) {
      return (
        <BuyFractionalWidget
          {...props}
          range={this.state.range}
          availability={this.state.availability}
          onShowAvailability={() => {
            this.setState({
              openCalendar: true
            })
          }}
        />
      )
    } else if (isFractionalHourly) {
      return (
        <BuyFractionalHourlyWidget
          {...props}
          range={this.state.range}
          availability={this.state.availability}
          onShowAvailability={() => {
            this.setState({
              openCalendar: true
            })
          }}
        />
      )
    } else if (listing.multiUnit || isService) {
      return <BuyMultiUnitWidget {...props} isPendingBuyer={isPendingBuyer} />
    }
    return <BuySingleUnitWidget {...props} />
  }

  renderSellerInfo() {
    const { listing } = this.props
    return (
      <>
        <h5>
          <fbt desc="listingDetail.about-the-seller">About the Seller</fbt>
        </h5>
        <AboutParty
          id={listing.seller.id}
          role={fbt('Seller', 'listingDetail.seller')}
        />
      </>
    )
  }
}

export default withGrowthCampaign(
  withWallet(withTokenBalance(withGrowthRewards(withIsMobile(ListingDetail)))),
  {
    fetchPolicy: 'cache-first',
    queryEvenIfNotEnrolled: true,
    suppressErrors: true // still show listing detail in case growth can not be reached
  }
)

require('react-styl')(`
  .listing-detail
    margin-top: 2.5rem

    .seller-info
      display: grid
      grid-column-gap: 2rem
      grid-template-columns: 50% 50%

      border-top: 1px solid #dde6ea
      padding-top: 2rem
      margin-top: 2rem
      .reviews
        padding-right: 2.2rem

    h2
      font-family: var(--heading-font)
      font-size: 36px
      font-weight: normal
      font-style: normal
      color: var(--dark)
      line-height: 1.25

    h5
      font-family: var(--heading-font)
      font-size: 18px
      margin-bottom: 1.25rem

    .header
      display: flex
      align-items: center
      justify-content: space-between

    .category
      font-family: var(--default-font)
      font-size: 14px
      color: var(--dusk)
      font-weight: normal
      text-transform: uppercase
      margin-top: 0.75rem

    .gallery
      margin-bottom: 1rem
      .main-pic
        padding-top: 75%
        background-size: contain
        background-repeat: no-repeat
        background-position: center
        border: 1px solid var(--pale-grey-two)
        border-radius: 10px
      .thumbnails
        margin-top: 1rem

    .description
      border-top: 1px solid #dde6ea
      white-space: pre-wrap
      font-weight: normal
      margin-top: 4rem
      padding-top: 2rem
      h3
        font-family: Poppins
        font-size: 24px
        font-weight: 500

    .availability-help
      font-size: 14px
      margin-bottom: 1rem

    .field-row
      display: flex
      justify-content: space-between
      font-weight: normal
      margin-bottom: 1rem
      > span:nth-child(2)
        font-weight: bold
        text-align: right
    .country-flag-img
      width: 2rem
      height: 2rem
      margin-right: .5rem;

    .listing-buy
      padding-bottom: 1rem
      border-bottom: 1px solid #dde6ea
      margin-bottom: 1.5rem
      .btn-primary
        border-radius: 2rem
        padding: 0.5rem 1rem
        width: 100%
        font-size: 20px
      .quantity
        margin-top: 1rem
        padding-top: 1rem
        border-top: 1px solid #dde6ea
        &:first-child
          border: 0
          margin-top: 0
      .quantity,.total
        font-family: var(--default-font)
        font-size: 18px
        color: #000
        font-weight: normal
        display: flex
        justify-content: space-between
        margin-bottom: 1.5rem
        span:last-child
          font-weight: bold
      .total
        padding-top: 0
        padding-bottom: 1rem
        border-bottom: 1px solid #dde6ea
        margin-bottom: 1rem

      .price
        font-family: var(--default-font)
        font-size: 36px
        color: var(--dark)
        font-weight: bold
        line-height: 1
        padding-bottom: 1.5rem
        span.desc
          font-weight: normal
          margin-left: 0.25rem
          font-size: 18px
          color: var(--steel)
        .orig
          color: var(--steel)
          font-weight: normal
          margin-left: 1rem
          font-size: 16px
          display: none
      &.multi,&.fractional
        .price
          padding-bottom: 1.5rem
      &.pending
        text-align: center
        font-weight: normal
        > div:nth-child(2)
          font-size: 24px;
          margin: 1rem 0;
        > div:nth-child(3)
          margin-bottom: 1rem

  @media (max-width: 767.98px)
    .listing-detail
      margin-top: 0.5rem
      h2
        font-size: 32px
      .description
        margin-top: 0
        margin-bottom: 1.5rem
      .about-party
        margin-bottom: 1.5rem

      .listing-media
        padding: 15px 0
        max-width: 100%
        width: 100%
        .gallery-scroll-wrap
          border-radius: 10px
          box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.3)
      .listing-info
        width: 100%
        max-width: 100%
        padding: 0
        .heading h2
          font-size: 28px
          margin-bottom: 1rem
      .about-seller
        border-top: 1px solid #dde6ea
        padding: 1.5rem 0 0 0

      .seller-info
        border: 0
        margin-top: 0
        padding-top: 0
        grid-template-columns: 100%
        .reviews
          border-top: 1px solid #dde6ea
          padding: 1.5rem 0 0 0
          margin-top: 2rem
          min-width: 100%
          h3
            font-family: var(--heading-font)
            font-size: 18px
            margin-bottom: 1.25rem
        .user-listings
          border-top: 1px solid #dde6ea
          padding: 1.5rem 0 0 0
          .listings-header
            font-family: var(--heading-font)
            font-size: 18px
            margin-bottom: 1.25rem

      .description
        border: 0
        padding-top: 0.5rem
        font-size: 14px
        margin-bottom: 1.5rem
      .listing-buy
        border: 0
        margin: 0 0 0.5rem 0
        padding: 0
        .price
          margin-bottom: 0
          font-size: 22px
        .quantity
          margin-bottom: 0.5rem
        &.multi
          .price
            padding-bottom: 0.5rem

  @media (min-width: 1200px)
    .listing-detail.container
      .listing-description
        max-width: 960px
`)
