import React, { Component } from 'react'
import { Switch, Route, withRouter } from 'react-router-dom'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import withWeb3 from 'hoc/withWeb3'
import withWallet from 'hoc/withWallet'
import withCreatorConfig from 'hoc/withCreatorConfig'
import withIsMobile from 'hoc/withIsMobile'

import Nav from './nav/Nav'
import TranslationModal from './_TranslationModal'
import Footer from './_Footer'

import LoadingSpinner from 'components/LoadingSpinner'

import Onboard from './onboard/Onboard'
import Listings from './listings/Listings'
import Listing from './listing/Listing'
import PromoteListing from './promote-listing/PromoteListing'
import Transaction from './transaction/Transaction'
import MyPurchases from './transactions/Purchases'
import MySales from './transactions/Sales'
import MyListings from './transactions/Listings'
import User from './user/User'
import Profile from './user/Profile'
import CreateListing from './create-listing/CreateListing'
import Messages from './messaging/Messages'
import Notifications from './notifications/Notifications'
import Settings from './settings/Settings'
import DappInfo from './about/DappInfo'
import GrowthCampaigns from './growth/Campaigns'
import GrowthBanned from 'pages/growth/Banned'
import GrowthWelcome from './growth/Welcome'
import AboutToken from './about/AboutTokens'
import AboutPayments from './about/AboutPayments'
import AboutCrypto from './about/AboutCrypto'

import ReferralRedirect from './ReferralRedirect'

import { applyConfiguration } from 'utils/marketplaceCreator'
import Sentry from 'utils/sentry'
import CurrencyContext from 'constants/CurrencyContext'
import { setReferralCode } from 'utils/growthTools'

class App extends Component {
  state = {
    hasError: false,
    footer: false,
    isTestBuild: window.location.pathname.startsWith('/test-builds')
  }

  componentDidUpdate(prevProps) {
    if (get(this.props, 'location.state.scrollToTop')) {
      window.scrollTo(0, 0)
    }

    const accountID = get(this.props, 'wallet')
    const prevAccountID = get(prevProps, 'wallet')

    if (accountID !== prevAccountID) {
      // set the user for sentry
      Sentry.configureScope(scope => {
        scope.setUser({ id: accountID })
      })
    }

    // Update referral code
    const params = new URLSearchParams(this.props.location.search)
    if (params.has('referralCode')) {
      setReferralCode(params.get('referralCode'))
    }
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, err }
  }

  componentDidCatch(err) {
    Sentry.captureException(err)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-spinner">
          <h5 onClick={() => alert(this.state.err)}>Error!</h5>
          <div>
            <fbt desc="App.refreshPage">Please refresh the page</fbt>
          </div>
        </div>
      )
    } else if (this.props.creatorConfigLoading) {
      return <LoadingSpinner />
    }

    const { isTestBuild } = this.state
    const { creatorConfig } = this.props
    applyConfiguration(creatorConfig)

    const isMobile = this.props.isMobile

    const isOnWelcomeAndNotOboard = this.props.location.pathname.match(
      /^\/welcome\/?(?!(onboard\/)).*/gi
    )

    // TODO: Too many regex here, probably it's better to optimize this sooner or later
    const hideNavbar =
      (isOnWelcomeAndNotOboard && !isMobile) ||
      (isMobile &&
        (this.props.location.pathname.match(/^\/purchases\/.*$/gi) ||
          this.props.location.pathname.match(
            /^\/campaigns\/(verifications|purchases|invitations|follows|promotions)(\/|$)/gi
          ) ||
          this.props.location.pathname.match(/\/onboard\/finished/gi) ||
          this.props.location.pathname.match(
            /^\/(promote\/.+|create\/.+|listing\/[-0-9]+\/(edit\/.+|payment|shipping|confirm)\/?)/gi
          )))

    return (
      <CurrencyContext.Provider value={this.props.currency}>
        {isTestBuild ? (
          <div className="test-build-badge">TEST BUILD</div>
        ) : null}
        {!hideNavbar && (
          <Nav
            onShowHelp={() => window.openZendeskChat()}
            onShowFooter={() => this.setState({ footer: true })}
            navbarBlueMode={isOnWelcomeAndNotOboard}
          />
        )}
        <main>
          <Switch>
            <Route path="/onboard" component={() => <Onboard />} />
            <Route path="/listing/:listingID" component={Listing} />
            <Route path="/promote/:listingID" component={PromoteListing} />
            <Route path="/purchases/:offerId" component={Transaction} />
            <Route path="/my-purchases/:filter?" component={MyPurchases} />
            <Route path="/my-sales/:filter?" component={MySales} />
            <Route path="/my-listings/:filter?" component={MyListings} />
            <Route path="/create" component={CreateListing} />
            <Route path="/user/:id/:content?" component={User} />
            <Route path="/profile/:attestation?" component={Profile} />
            <Route path="/messages/:room?" component={Messages} />
            <Route path="/notifications" component={Notifications} />
            <Route
              path="/settings"
              render={props => (
                <Settings
                  {...props}
                  locale={this.props.locale}
                  onLocale={this.props.onLocale}
                  currency={this.props.currency}
                  onCurrency={this.props.onCurrency}
                />
              )}
            />
            <Route path="/about/dapp-info" component={DappInfo} />
            <Route path="/about/crypto" component={AboutCrypto} />
            <Route path="/about/payments" component={AboutPayments} />
            <Route path="/about/tokens" component={AboutToken} />
            <Route
              exact
              path="/campaigns/:navigation?/:contentId?"
              component={props => (
                <GrowthCampaigns {...props} locale={this.props.locale} />
              )}
            />
            <Route exact path="/rewards/banned" component={GrowthBanned} />
            <Route path="/welcome/:inviteCode?" component={GrowthWelcome} />

            <Route path="/referral/:inviteCode" component={ReferralRedirect} />

            <Route path="/search" component={Listings} />
            <Route component={Listings} />
          </Switch>
        </main>
        {!this.props.isMobileApp && (
          <TranslationModal locale={this.props.locale} />
        )}
        <Footer
          open={this.state.footer}
          onClose={() => this.setState({ footer: false })}
          onShowHelp={() => window.openZendeskChat()}
          locale={this.props.locale}
          onLocale={this.props.onLocale}
          creatorConfig={creatorConfig}
          currency={this.props.currency}
          onCurrency={this.props.onCurrency}
        />
      </CurrencyContext.Provider>
    )
  }
}

export default withWallet(
  withIsMobile(withWeb3(withCreatorConfig(withRouter(App))))
)

require('react-styl')(`
  .app-spinner
    position: fixed
    top: 50%
    left: 50%
    text-align: center
    transform: translate(-50%, -50%)
  main
    display: flex
    flex-direction: column
  #app
    display: flex
    flex-direction: column
  .test-build-badge
    position: fixed
    top: 0
    display: inline-block
    opacity: 0.8
    background-color: #007bff
    color: #fff
    left: 50%
    transform: translateX(-50%)
    z-index: 1000
    padding: 0.2rem 0.4rem
    font-size: 0.5rem
`)
