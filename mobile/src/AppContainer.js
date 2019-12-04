'use strict'

import React from 'react'
import { connect } from 'react-redux'
import { StatusBar, Clipboard } from 'react-native'
import { createAppContainer } from 'react-navigation'
import get from 'lodash.get'

import { NETWORKS, REFERRAL_PREFIXES } from './constants'
import { Navigation } from './Navigation'
import { setEnabled as setSamsungBKSEnabled } from 'actions/SamsungBKS'
import { setNetwork, setReferralCode } from 'actions/Settings'
import { setAccounts, setAccountActive } from 'actions/Wallet'
import { canUseSamsungBKS } from 'utils'
import { updateExchangeRate } from 'utils/exchangeRate'
import { findBestAvailableCurrency } from 'utils/currencies'
import PushNotifications from './PushNotifications'
import AuthenticationGuard from 'components/authentication-guard'
import SamsungBKS from 'components/samsung-bks'

class MarketplaceApp extends React.Component {
  static router = Navigation.router

  componentDidMount = async () => {
    this.checkReferral()
    this.initSamsungBKS()
    this.validateAccounts()
    this.updateExchangeRates()
  }

  componentDidUpdate = prevProps => {
    // Update exchange rates on currency change
    if (get(prevProps, 'settings.currency') !== this.props.settings.currency) {
      this.updateExchangeRates()
    }

    if (
      get(prevProps, 'wallet.accounts', []).length > 0 &&
      this.props.wallet.accounts.length === 0
    ) {
      // No accounts left, navigate to onboarding
      this.props.navigation.navigate('Onboarding')
    }

    if (
      get(prevProps, 'samsungBKS.seedHash', '') !==
      this.props.samsungBKS.seedHash
    ) {
      this.validateAccounts()
    }
  }

  /* Check the clipboard for a referral code
   */
  checkReferral = async () => {
    const clipData = await Clipboard.getString()
    for (const prefix of REFERRAL_PREFIXES) {
      if (clipData && clipData.startsWith(prefix)) {
        console.debug(`referral code found: ${clipData}`)
        this.props.setReferralCode(clipData)
        break
      }
    }
  }

  /* Initializes Samsung BKS. Checks if it should be enabled for the current
   * phone/state. If it is enabled the <SamsungBKS /> component will be
   * rendered to retrieve the seed hash.
   */
  initSamsungBKS = async () => {
    // Check if Samsung BKS should be enabled
    if (this.props.samsungBKS.enabled === null) {
      // Null value means this check hasn't been done before
      const enableSamsungBKS = await canUseSamsungBKS(this.props.wallet)
      this.props.setSamsungBKSEnabled(enableSamsungBKS)
    }
  }

  /* Validate the accounts in the local cache. If the Samsung BKS seed hash
   * has changed it will ensure that all the accounts have the matching seed
   * hash.
   *
   * Also ensures there is an active account if at least one account exists.
   */
  validateAccounts = () => {
    const filteredAccounts = this.props.wallet.accounts.filter(account => {
      // No seed hash or account seed hash matches
      return (
        !account.seedHash || account.seedHash === this.props.samsungBKS.seedHash
      )
    })
    if (filteredAccounts !== this.props.wallet.accounts) {
      this.props.setAccounts(filteredAccounts)
    }

    let validActiveAccount
    if (this.props.wallet.activeAccount) {
      validActiveAccount = this.props.wallet.accounts.find(
        a => a.address === this.props.wallet.activeAccount.address
      )
    }
    // Setup the active account
    if (!validActiveAccount && this.props.wallet.accounts.length > 0) {
      this.props.setAccountActive(this.props.wallet.accounts[0])
    }
  }

  /* Makes sure the network is valid. If an invalid network is found defaults
   * the setting to mainnet.
   */
  validateNetwork = () => {
    // Validate the network setting
    let network = NETWORKS.find(
      n => n.name === this.props.settings.network.name
    )
    if (!network) {
      network = NETWORKS.find(n => n.id === 1)
      this.props.setNetwork(network)
    }
  }

  /* Update the exchange rate in the local cache.
   */
  updateExchangeRates = () => {
    const fiatCurrency =
      this.props.settings.currency || findBestAvailableCurrency()
    updateExchangeRate(fiatCurrency.code, 'ETH')
    updateExchangeRate(fiatCurrency.code, 'DAI')
  }

  render() {
    const samsungBKSInitializing =
      this.props.samsungBKS.enabled === null ||
      (this.props.samsungBKS.enabled && this.props.samsungBKS.seedHash === null)

    return (
      <>
        {this.props.samsungBKS.enabled && <SamsungBKS />}
        {!this.props.samsungBKS.error &&
          (samsungBKSInitializing ? null : (
            <>
              <StatusBar />
              <AuthenticationGuard />
              <PushNotifications />
              <Navigation navigation={this.props.navigation} />
            </>
          ))}
      </>
    )
  }
}

const mapStateToProps = ({ samsungBKS, settings, wallet }) => {
  return { samsungBKS, settings, wallet }
}

const mapDispatchToProps = dispatch => ({
  setAccounts: accounts => dispatch(setAccounts(accounts)),
  setAccountActive: account => dispatch(setAccountActive(account)),
  setNetwork: network => dispatch(setNetwork(network)),
  setSamsungBKSEnabled: payload => dispatch(setSamsungBKSEnabled(payload)),
  setReferralCode: payload => dispatch(setReferralCode(payload))
})

const App = connect(mapStateToProps, mapDispatchToProps)(MarketplaceApp)

export default createAppContainer(App)
