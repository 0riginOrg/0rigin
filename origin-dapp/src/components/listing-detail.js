import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import {
  FormattedMessage,
  // FormattedNumber,
  defineMessages,
  injectIntl
} from 'react-intl'

import { showAlert } from 'actions/Alert'
import {
  handleNotificationsSubscription,
  storeWeb3Intent
} from 'actions/App'
import {
  update as updateTransaction,
  upsert as upsertTransaction
} from 'actions/Transaction'

import { PendingBadge, SoldBadge, FeaturedBadge } from 'components/badges'
import Reviews from 'components/reviews'
import UserCard from 'components/user-card'
import { ProcessingModal, ProviderModal } from 'components/modals/wait-modals'
import { Pictures } from 'components/pictures'
import { PurchasedModal, ErrorModal, OnboardingModal } from 'components/modals/listing-detail-modals'

import getCurrentProvider from 'utils/getCurrentProvider'
import { getListing } from 'utils/listing'
import { offerStatusToListingAvailability } from 'utils/offer'

import origin from '../services/origin'

/* linking to contract Etherscan requires knowledge of which network we're on */
const etherscanDomains = {
  1: 'etherscan.io',
  3: 'ropsten.etherscan.io',
  4: 'rinkeby.etherscan.io',
  42: 'kovan.etherscan.io'
}

class ListingsDetail extends Component {
  constructor(props) {
    super(props)

    this.STEP = {
      VIEW: 1,
      ONBOARDING: 2,
      METAMASK: 3,
      PROCESSING: 4,
      PURCHASED: 5,
      ERROR: 6
    }

    this.state = {
      etherscanDomain: null,
      loading: true,
      offers: [],
      pictures: [],
      purchases: [],
      step: this.STEP.VIEW,
      boostLevel: null,
      boostValue: 0,
      onboardingCompleted: false
    }

    this.intlMessages = defineMessages({
      loadingError: {
        id: 'listing-detail.loadingError',
        defaultMessage: 'There was an error loading this listing.'
      }
    })

    this.handleMakeOffer = this.handleMakeOffer.bind(this)
    this.handleSkipOnboarding = this.handleSkipOnboarding.bind(this)
  }

  async componentWillMount() {
    if (this.props.listingId) {
      // Load from IPFS
      await this.loadListing()
      await this.loadOffers()
    } else if (this.props.listingJson) {
      const obj = Object.assign({}, this.props.listingJson, { loading: false })
      // Listing json passed in directly
      this.setState(obj)
    }
    const networkId = await web3.eth.net.getId()
    this.setState({
      etherscanDomain: etherscanDomains[networkId]
    })
  }

  componentDidUpdate(prevProps) {
    // on account found
    if (this.props.web3Account && !prevProps.web3Account) {
      this.loadBuyerPurchases()
    }
  }

  async handleMakeOffer(skip) {
    // onboard if no identity, purchases, and not already completed
    const shouldOnboard =
      !this.props.profile.strength &&
      !this.state.purchases.length &&
      !this.state.onboardingCompleted

    this.props.storeWeb3Intent('offer to buy this listing')

    if (web3.givenProvider && this.props.web3Account) {
      if (!skip && shouldOnboard) {
        return this.setState({
          onboardingCompleted: true,
          step: this.STEP.ONBOARDING
        })
      }

      this.setState({ step: this.STEP.METAMASK })

      try {
        const offerData = {
          listingId: this.props.listingId,
          listingType: 'unit',
          unitsPurchased: 1,
          totalPrice: {
            amount: this.state.price,
            currency: 'ETH'
          },
          commission: {
            amount: this.state.boostValue.toString(),
            currency: 'OGN'
          },
          // Set the finalization time to ~1 year after the offer is accepted.
          // This is the window during which the buyer may file a dispute.
          finalizes: 365 * 24 * 60 * 60
        }
        const transactionReceipt = await origin.marketplace.makeOffer(
          this.props.listingId,
          offerData,
          (confirmationCount, transactionReceipt) => {
            this.props.updateTransaction(confirmationCount, transactionReceipt)
          }
        )
        this.props.upsertTransaction({
          ...transactionReceipt,
          transactionTypeKey: 'makeOffer'
        })
        this.setState({ step: this.STEP.PURCHASED })
        this.props.handleNotificationsSubscription('buyer', this.props)
      } catch (error) {
        console.error(error)
        this.setState({ step: this.STEP.ERROR })
      }
    }
  }

  handleSkipOnboarding(e) {
    e.preventDefault()

    this.handleMakeOffer(true)
  }

  async loadBuyerPurchases() {
    try {
      const { web3Account } = this.props
      const listingIds = await origin.marketplace.getListings({
        idsOnly: true,
        purchasesFor: web3Account
      })
      const listingPromises = listingIds.map(listingId => {
        return new Promise(async resolve => {
          const listing = await getListing(listingId, true)
          resolve({ listingId, listing })
        })
      })
      const withListings = await Promise.all(listingPromises)
      const offerPromises = await withListings.map(obj => {
        return new Promise(async resolve => {
          const offers = await origin.marketplace.getOffers(obj.listingId, {
            for: web3Account
          })
          resolve(Object.assign(obj, { offers }))
        })
      })
      const withOffers = await Promise.all(offerPromises)
      const offersByListing = withOffers.map(obj => {
        return obj.offers.map(offer => Object.assign({}, obj, { offer }))
      })
      const offersFlattened = [].concat(...offersByListing)

      this.setState({ purchases: offersFlattened })
    } catch (error) {
      console.error(error)
    }
  }

  async loadListing() {
    try {
      const listing = await getListing(this.props.listingId, true)
      this.setState({
        ...listing,
        loading: false
      })
    } catch (error) {
      this.props.showAlert(
        this.props.intl.formatMessage(this.intlMessages.loadingError)
      )
      console.error(
        `Error fetching contract or IPFS info for listing: ${
          this.props.listingId
        }`
      )
      console.error(error)
    }
  }

  async loadOffers() {
    try {
      const offers = await origin.marketplace.getOffers(this.props.listingId)
      this.setState({ offers })
    } catch (error) {
      console.error(
        `Error fetching offers for listing: ${this.props.listingId}`
      )
      console.error(error)
    }
  }

  resetToStepOne() {
    this.setState({ step: this.STEP.VIEW })
  }

  render() {
    const { featuredListingIds, listingId, web3Account } = this.props
    const {
      category,
      description,
      loading,
      name,
      offers,
      pictures,
      price,
      seller,
      status,
      step
    } = this.state
    const currentOffer = offers.find(o => {
      const availability = offerStatusToListingAvailability(o.status)

      return ['pending', 'sold'].includes(availability)
    })
    const currentOfferAvailability =
      currentOffer && offerStatusToListingAvailability(currentOffer.status)
    const isWithdrawn = status === 'inactive'
    const isPending = currentOfferAvailability === 'pending'
    const isSold = currentOfferAvailability === 'sold'
    const isAvailable = !isPending && !isSold && !isWithdrawn
    const showPendingBadge = isPending && !isWithdrawn
    const showSoldBadge = isSold || isWithdrawn
    const showFeaturedBadge = featuredListingIds.includes(listingId) && isAvailable
    const userIsBuyer = currentOffer && web3Account === currentOffer.buyer
    const userIsSeller = web3Account === seller

    return (
      <div className="listing-detail">
        <OnboardingModal 
          isOpen={step === this.STEP.ONBOARDING}
          onVerify={() => this.setState({ step: this.STEP.VIEW })}
          handleSkipOnboarding={this.handleSkipOnboarding}
        />
        <ProviderModal
          isOpen={step === this.STEP.METAMASK}
          message={
            <FormattedMessage
              id={'listing-detail.providerInstruction'}
              defaultMessage={
                'To make an offer on this listing, please confirm the transaction in {provider}.'
              }
              values={{
                provider: getCurrentProvider(
                  origin &&
                    origin.contractService &&
                    origin.contractService.web3
                )
              }}
            />
          }
        />
        <ProcessingModal 
          isOpen={step === this.STEP.PROCESSING}
        />
        <PurchasedModal 
          isOpen={step === this.STEP.PURCHASED}
        />
        <ErrorModal 
          isOpen={step === this.STEP.ERROR}
          onClick={e => {
            e.preventDefault()
            this.resetToStepOne()
          }}
        />

        {(loading || (pictures && !!pictures.length)) && (
          <Pictures 
            pictures={pictures}
            className="carousel"
          />
        )}

        <div
          className={`container listing-container${loading ? ' loading' : ''}`}
        >
          <div className="row">
            <ListingDetailContainer
              category={category}
              loading={loading}
              showPendingBadge={showPendingBadge}
              showSoldBadge={showSoldBadge}
              showFeaturedBadge={showFeaturedBadge}
              name={name}
              description={description}
            />
            <OperatingArea 
              isWithdrawn={isWithdrawn}
              isPending={isPending}
              isSold={isSold}
              isAvailable={isAvailable}
              currentOffer={currentOffer}
              userIsBuyer={userIsBuyer}
              userIsSeller={userIsSeller}
              price={price}
              loading={loading}
              handleMakeOffer={() => this.handleMakeOffer()}
              seller={seller}
              listingId={this.props.listingId}
            />
          </div>
          {this.props.withReviews && (
            <div className="row">
              <div className="col-12 col-md-8">
                <hr />
                {this.state.seller && (
                  <Reviews userAddress={this.state.seller} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

const ListingDetailContainer = ({ 
  category, 
  loading, 
  showPendingBadge, 
  showSoldBadge, 
  showFeaturedBadge,
  name,
  description }) => {
  return(
    <div className="col-12 col-md-8 detail-info-box">
      <Category 
        category={category}
        loading={loading}
        showPendingBadge={showPendingBadge}
        showSoldBadge={showSoldBadge}
        showFeaturedBadge={showFeaturedBadge}
      />
      <h1 className="title placehold">{name}</h1>
      <p className="ws-aware description placehold">{description}</p>
    </div>
  )
}

const OperatingArea = ({
  isWithdrawn,
  isPending,
  isSold,
  isAvailable,
  currentOffer,
  userIsBuyer,
  userIsSeller,
  price,
  loading,
  handleMakeOffer,
  seller,
  listingId
}) =>{
  return(
    <div className="col-12 col-md-4">
      <BuyBox 
        isWithdrawn={isWithdrawn}
        isPending={isPending}
        isSold={isSold}
        isAvailable={isAvailable}
        currentOffer={currentOffer}
        userIsBuyer={userIsBuyer}
        userIsSeller={userIsSeller}
        price={price}
        loading={loading}
        onClick={handleMakeOffer}
      />
      {seller && (
        <UserCard
          title="seller"
          listingId={listingId}
          userAddress={seller}
        />
      )}
    </div>
  )
}

const Category = ({ 
  category, 
  loading, 
  showPendingBadge, 
  showSoldBadge, 
  showFeaturedBadge }) => {
  return(
    <div className="category placehold d-flex">
      <div>{category}</div>
      {!loading && (
        <div className="badges">
          {showPendingBadge && <PendingBadge />}
          {showSoldBadge && <SoldBadge />}
          {showFeaturedBadge && <FeaturedBadge />}
        </div>
      )}
    </div>
  )
}

const BuyBox = ({ 
  isAvailable, 
  price, 
  loading, 
  userIsSeller, 
  userIsBuyer, 
  isWithdrawn, 
  isPending, 
  isSold, 
  currentOffer, 
  onClick }) => {
  if(isAvailable &&
    !!price &&
    !!parseFloat(price)){
    return(
      <div className="buy-box placehold">
        <ETHPrice 
          price={price}
        />
        {!loading && (
          <BuyBoxButton
            userIsSeller={userIsSeller}
            onClick={onClick}
          />
        )}
      </div>
    )
  }else{
    return(
      <div className="buy-box placehold unavailable text-center">
        {!loading && (
          <div className="reason">
            {!isWithdrawn &&
              isPending && (
              <FormattedMessage
                id={'listing-detail.reasonPending'}
                defaultMessage={'This listing is {pending}'}
                values={{
                  pending: <strong>Pending</strong>
                }}
              />
            )}
            {isSold && (
              <FormattedMessage
                id={'listing-detail.reasonSold'}
                defaultMessage={'This listing is {sold}'}
                values={{
                  sold: <strong>Sold</strong>
                }}
              />
            )}
          </div>
        )}
        {!loading &&
          !userIsBuyer &&
          !userIsSeller && (
          <Fragment>
            <div className="suggestion">
              {!isWithdrawn &&
                  isPending && (
                <FormattedMessage
                  id={'listing-detail.suggestionPublicPending'}
                  defaultMessage={
                    'Another buyer has already made an offer on this listing. Try visiting the listings page and searching for something similar.'
                  }
                />
              )}
              {isSold && (
                <FormattedMessage
                  id={'listing-detail.suggestionPublicSold'}
                  defaultMessage={
                    'Another buyer has already purchased this listing. Try visiting the listings page and searching for something similar.'
                  }
                />
              )}
              {/* consider the possibility of a withdrawn listing despite a valid offer */}
              {!isSold &&
                  isWithdrawn && (
                <FormattedMessage
                  id={'listing-detail.suggestionPublicWithdrawn'}
                  defaultMessage={
                    'This listing is no longer available. Try visiting the listings page and searching for something similar.'
                  }
                />
              )}
            </div>
            <Link
              to="/"
              ga-category="listing"
              ga-label="view_listings"
            >
              <FormattedMessage
                id={'listing-detail.viewListings'}
                defaultMessage={'View Listings'}
              />
            </Link>
          </Fragment>
        )}
        {!loading &&
          userIsBuyer && (
          <div className="suggestion">
            {isPending &&
                currentOffer.status === 'created' && (
              <FormattedMessage
                id={'listing-detail.suggestionBuyerCreated'}
                defaultMessage={`You've made an offer on this listing. Please wait for the seller to accept or reject your offer.`}
              />
            )}
            {isPending &&
                currentOffer.status === 'accepted' && (
              <FormattedMessage
                id={'listing-detail.suggestionBuyerAccepted'}
                defaultMessage={`You've made an offer on this listing. View the offer to complete the sale.`}
              />
            )}
            {isPending &&
                currentOffer.status === 'disputed' && (
              <FormattedMessage
                id={'listing-detail.suggestionBuyerDisputed'}
                defaultMessage={`You've made an offer on this listing. View the offer to check the status.`}
              />
            )}
            {isSold && (
              <FormattedMessage
                id={'listing-detail.buyerPurchased'}
                defaultMessage={`You've purchased this listing.`}
              />
            )}
          </div>
        )}
        {!loading &&
          userIsSeller && (
          <div className="suggestion">
            {isPending &&
                currentOffer.status === 'created' && (
              <FormattedMessage
                id={'listing-detail.suggestionSellerCreated'}
                defaultMessage={`A buyer is waiting for you to accept or reject their offer.`}
              />
            )}
            {isPending &&
                currentOffer.status === 'accepted' && (
              <FormattedMessage
                id={'listing-detail.suggestionSellerAccepted'}
                defaultMessage={`You've accepted an offer for this listing. Please wait for the buyer to complete the sale.`}
              />
            )}
            {isPending &&
                currentOffer.status === 'disputed' && (
              <FormattedMessage
                id={'listing-detail.suggestionSellerDisputed'}
                defaultMessage={`You've accepted an offer on this listing. View the offer to check the status.`}
              />
            )}
            {isSold && (
              <FormattedMessage
                id={'listing-detail.sellerSold'}
                defaultMessage={`You've sold this listing.`}
              />
            )}
            {/* consider the possibility of a withdrawn listing despite a valid offer */}
            {!isPending &&
                !isSold &&
                isWithdrawn && (
              <FormattedMessage
                id={'listing-detail.sellerWithdrawn'}
                defaultMessage={`You've withdrawn this listing.`}
              />
            )}
          </div>
        )}
        {!loading &&
          (userIsBuyer || userIsSeller) &&
          currentOffer && (
          <Link
            to={`/purchases/${currentOffer.id}`}
            ga-category="listing"
            ga-label={ `view_${isPending ? 'offer' : 'sale'}` }
          >
            {isPending && (
              <FormattedMessage
                id={'listing-detail.viewOffer'}
                defaultMessage={'View Offer'}
              />
            )}
            {isSold && (
              <FormattedMessage
                id={'listing-detail.viewSale'}
                defaultMessage={'View Sale'}
              />
            )}
          </Link>
        )}
        {!loading &&
          userIsSeller &&
          !currentOffer &&
          isWithdrawn && (
          <Link
            to={`/listings/create`}
            ga-category="listing"
            ga-label="create_listing_from_withdrawn"
          >
            <FormattedMessage
              id={'listing-detail.createListing'}
              defaultMessage={'Create A Listing'}
            />
          </Link>
        )}
      </div>
    )
  }
}

const ETHPrice = ({ price }) => {
  return(
    <div className="price text-nowrap">
      <img src="images/eth-icon.svg" role="presentation" />
      {Number(price).toLocaleString(undefined, {
        maximumFractionDigits: 5,
        minimumFractionDigits: 5
      })}
        &nbsp;
      <FormattedMessage
        id={'listing-detail.ethereumCurrencyAbbrev'}
        defaultMessage={'ETH'}
      />
    </div>
  )
}

const BuyBoxButton = ({ userIsSeller, onClick }) => {
  return(
    <div className="btn-container">
      {!userIsSeller && (
        <button
          className="btn btn-primary"
          onClick={onClick}
          onMouseDown={e => e.preventDefault()}
          ga-category="listing"
          ga-label="purchase"
        >
          <FormattedMessage
            id={'listing-detail.purchase'}
            defaultMessage={'Purchase'}
          />
        </button>
      )}
      {userIsSeller && (
        <Link
          to="/my-listings"
          className="btn"
          ga-category="listing"
          ga-label="sellers_own_listing_my_listings_cta"
        >
            My Listings
        </Link>
      )}
    </div>
  )
}

const mapStateToProps = ({ app, profile, listings }) => {
  return {
    featuredListingIds: listings.featured,
    notificationsHardPermission: app.notificationsHardPermission,
    notificationsSoftPermission: app.notificationsSoftPermission,
    profile,
    pushNotificationsSupported: app.pushNotificationsSupported,
    onMobile: app.onMobile,
    serviceWorkerRegistration: app.serviceWorkerRegistration,
    web3Account: app.web3.account,
    web3Intent: app.web3.intent
  }
}

const mapDispatchToProps = dispatch => ({
  handleNotificationsSubscription: (role, props) => dispatch(handleNotificationsSubscription(role, props)),
  showAlert: msg => dispatch(showAlert(msg)),
  storeWeb3Intent: intent => dispatch(storeWeb3Intent(intent)),
  updateTransaction: (confirmationCount, transactionReceipt) =>
    dispatch(updateTransaction(confirmationCount, transactionReceipt)),
  upsertTransaction: transaction => dispatch(upsertTransaction(transaction))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(ListingsDetail))
