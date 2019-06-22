'use strict'

import React, { Component } from 'react'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  ScrollView,
  RefreshControl
} from 'react-native'
import PushNotification from 'react-native-push-notification'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import SafeAreaView from 'react-native-safe-area-view'
import get from 'lodash.get'

import NotificationCard from 'components/notification-card'
import SignatureCard from 'components/signature-card'
import TransactionCard from 'components/transaction-card'
import { CURRENCIES } from '../constants'
import { decodeTransaction } from 'utils/contractDecoder'
import { updateExchangeRate } from 'utils/price'
import { webViewToBrowserUserAgent } from 'utils'
import { findBestAvailableLanguage } from 'utils/language'
import { tokenBalanceFromGql } from 'utils/currencies'
import {
  setMarketplaceReady,
  setMarketplaceWebViewError
} from 'actions/Marketplace'
import { setAccountBalances, setIdentity } from 'actions/Wallet'
import withOriginGraphql from 'hoc/withOriginGraphql'
import { getCurrentRoute } from '../NavigationService'
import { PROMPT_MESSAGE, PROMPT_PUB_KEY } from '../constants'

class MarketplaceScreen extends Component {
  static navigationOptions = () => {
    return {
      header: null
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      enablePullToRefresh: true,
      modals: [],
      fiatCurrency: CURRENCIES.find(c => c[0] === 'fiat-USD')
    }
    if (Platform.OS === 'android') {
      // Configure swipe handler for back forward navigation on Android because
      // it does not support allowsBackForwardNavigationGestures
      this.setSwipeHandler()
    }
    DeviceEventEmitter.addListener('graphqlQuery', this.injectGraphqlQuery)
    DeviceEventEmitter.addListener(
      'graphqlMutation',
      this.injectGraphqlMutation
    )
    DeviceEventEmitter.addListener('reloadMarketplace', () =>
      this.dappWebView.reload()
    )
  }

  componentDidUpdate = prevProps => {
    if (prevProps.settings.language !== this.props.settings.language) {
      // Language has changed, need to reload the DApp
      if (this.dappWebView) {
        // Reinject the language
        this.injectLanguage()
      }
    }
    if (
      get(prevProps, 'wallet.activeAccount.address') !==
      get(this.props, 'wallet.activeAccount.address')
    ) {
      // Active account changed, update messaging keys
      this.injectMessagingKeys()
    }
  }

  /* Enables left and right swiping to go forward/back in the WebView.
   */
  setSwipeHandler = () => {
    const swipeDistance = 200
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > swipeDistance &&
          Math.abs(gestureState.dy) < 50
        )
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.moveX > swipeDistance) {
          this.dappWebView.goBack()
        } else if (gestureState.moveX < swipeDistance) {
          this.dappWebView.goForward()
        }
      }
    })
  }

  /* Handles messages received from the WebView via window.postMessage.
   */
  onWebViewMessage = event => {
    let msgData
    try {
      msgData = JSON.parse(event.nativeEvent.data)
    } catch (err) {
      console.warn(err)
      return
    }

    const currentRoute = getCurrentRoute()
    const { wallet } = this.props

    if (msgData.targetFunc === 'getAccounts') {
      // Calculated state of accounts by placing activeAccount at the front
      // of the accounts array
      // TODO: handle this with something like reselect so the logic
      // can be moved into a selector as this is just computed from redux state
      let accounts
      if (wallet.activeAccount) {
        const filteredAccounts = wallet.accounts.filter(
          a => a.address !== wallet.activeAccount.address
        )
        accounts = [
          wallet.activeAccount.address,
          ...filteredAccounts.map(a => a.address)
        ]
      } else {
        accounts = wallet.accounts.map(a => a.address)
      }
      this.handleBridgeResponse(msgData, accounts)
    } else if (this[msgData.targetFunc]) {
      // Function handler exists, use that
      const response = this[msgData.targetFunc].apply(this, [msgData.data])
      this.handleBridgeResponse(msgData, response)
    } else if (msgData.targetFunc === 'signPersonalMessage') {
      // Personal sign is for handling meta transaction requests
      const decodedData = JSON.parse(
        global.web3.utils.hexToUtf8(msgData.data.data)
      )
      // Sanity check on addresses
      if (
        decodedData.from.toLowerCase() !==
        wallet.activeAccount.address.toLowerCase()
      ) {
        console.error('Account mismatch')
        return null
      }
      const decodedTransaction = decodeTransaction(decodedData.txData)
      // If the transaction validate the sha3 hash and sign that for the relayer
      if (this.isValidMetaTransaction(decodedTransaction)) {
        const dataToSign = global.web3.utils.soliditySha3(
          { t: 'address', v: decodedData.from },
          { t: 'address', v: decodedData.to },
          { t: 'uint256', v: global.web3.utils.toWei('0', 'ether') },
          { t: 'bytes', v: decodedData.txData },
          { t: 'uint256', v: decodedData.nonce }
        )
        // Sign it
        const { signature } = global.web3.eth.accounts.sign(
          dataToSign,
          wallet.activeAccount.privateKey
        )
        // Send the response back to the webview
        this.handleBridgeResponse(msgData, signature)
      } else {
        console.debug('Invalid meta transaction: ', decodedTransaction)
      }
    } else if (currentRoute === 'Ready') {
      // Relayer failure fallback, if we are on the onboarding step where identity
      // gets published reject the transaction because we don't want to display a
      // modal, the user most likely can't proceed because the account is new and
      // has no balance
      this.handleBridgeResponse(msgData, {
        message: 'User denied transaction signature'
      })
    } else {
      // Not handled yet, display a modal that deals with the target function
      PushNotification.checkPermissions(permissions => {
        const newModals = []
        // Check if we lack notification permissions, and we are processing a
        // web3 transaction that isn't updating our identity. If so display a
        // modal requesting notifications be enabled
        if (
          !__DEV__ &&
          !permissions.alert &&
          msgData.targetFunc === 'processTransaction' &&
          decodeTransaction(msgData.data.data).functionName !==
            'emitIdentityUpdated'
        ) {
          newModals.push({ type: 'enableNotifications' })
        }
        // Transaction/signature modal
        const web3Modal = { type: msgData.targetFunc, msgData: msgData }
        // Modals render in different ordering on Android/iOS so use a different
        // method of adding the modal to the array to get the notifications modal
        // to display on top of the web3 modal
        if (Platform.OS === 'ios') {
          newModals.push(web3Modal)
        } else {
          newModals.unshift(web3Modal)
        }
        // Update the state with the new modals
        this.setState(prevState => ({
          modals: [...prevState.modals, ...newModals]
        }))
      })
    }
  }

  isValidMetaTransaction = data => {
    const validFunctions = [
      'createProxyWithSenderNonce',
      'swapAndMakeOffer',
      'createListing',
      'updateListing',
      'emitIdentityUpdated'
    ]
    return validFunctions.includes(data.functionName)
  }

  /* Remove a modal and return the given result to the DApp
   */
  toggleModal = (modal, result) => {
    if (!modal) {
      return
    }
    if (modal.msgData) {
      // Send the response to the webview
      this.handleBridgeResponse(modal.msgData, result)
    }
    this.setState(prevState => {
      return {
        ...prevState,
        modals: [...prevState.modals.filter(m => m !== modal)]
      }
    })
  }

  /* Inject the cookies required for messaging to allow preenabling of messaging
   * for accounts
   */
  injectMessagingKeys = () => {
    const { wallet } = this.props

    if (!wallet.activeAccount) {
      return
    }

    let privateKey = wallet.activeAccount.privateKey
    if (!privateKey.startsWith('0x') && /^[0-9a-fA-F]+$/.test(privateKey)) {
      privateKey = '0x' + privateKey
    }

    // Sign the first message
    const signatureKey = global.web3.eth.accounts
      .sign(PROMPT_MESSAGE, privateKey)
      .signature.substring(0, 66)
    const msgAccount = global.web3.eth.accounts.privateKeyToAccount(
      signatureKey
    )

    // Sign the second message
    const pubMessage = PROMPT_PUB_KEY + msgAccount.address
    const pubSignature = global.web3.eth.accounts.sign(pubMessage, privateKey)
      .signature

    const keyInjection = `
      (function() {
        if (window && window.context && window.context.messaging) {
          window.context.messaging.onPreGenKeys({
            address: '${wallet.activeAccount.address}',
            signatureKey: '${signatureKey}',
            pubMessage: '${pubMessage}',
            pubSignature: '${pubSignature}'
          });
        }
      })()
    `
    if (this.dappWebView) {
      console.debug('Injecting messaging keys')
      this.dappWebView.injectJavaScript(keyInjection)
    }
  }

  /* Inject the language setting in from redux into the DApp
   */
  injectLanguage = () => {
    const language = this.props.settings.language
      ? this.props.settings.language
      : findBestAvailableLanguage()
    const injectedJavaScript = `
      (function() {
        if (window && window.appComponent) {
          window.appComponent.onLocale('${language}');
        }
      })()
    `
    if (this.dappWebView) {
      console.debug('Injecting language')
      this.dappWebView.injectJavaScript(injectedJavaScript)
    }
  }

  /* Inject Javascript that causes the page to refresh when it hits the top
   */
  injectScrollHandler = () => {
    const injectedJavaScript = `
      (function() {
        window.onscroll = function() {
          window.webViewBridge.send('handleScrollHandlerResponse', {
            scrollTop: document.documentElement.scrollTop || document.body.scrollTop
          });
        }
      })();
    `
    if (this.dappWebView) {
      console.debug('Injecting scroll handler')
      this.dappWebView.injectJavaScript(injectedJavaScript)
    }
  }

  /* Handle the response from window.onScroll
   */
  handleScrollHandlerResponse = ({ scrollTop }) => {
    this.setState({ enablePullToRefresh: scrollTop === 0 })
  }

  injectGraphqlQuery = (id, query, variables = {}) => {
    const injectedJavaScript = `
      (function() {
        window.gql.query({
          query: ${JSON.stringify(query)},
          variables: ${JSON.stringify(variables)}
        }).then((response) => {
          window.webViewBridge.send('handleGraphqlResult', {
            id: '${id}',
            response: response
          });
        }).catch((error) => {
          window.webViewBridge.send('handleGraphqlError', {
            id: '${id}',
            error: error
          });
        });
      })();
    `
    if (this.dappWebView) {
      // console.debug('Injecting GraphQL query: ', query.definitions[0].name.value)
      this.dappWebView.injectJavaScript(injectedJavaScript)
    }
  }

  injectGraphqlMutation = (id, mutation, variables = {}) => {
    const injectedJavaScript = `
      (function() {
        window.gql.mutate({
          mutation: ${JSON.stringify(mutation)},
          variables: ${JSON.stringify(variables)}
        }).then((response) => {
          window.webViewBridge.send('handleGraphqlResult', {
            id: '${id}',
            response: response
          });
        }).catch((error) => {
          window.webViewBridge.send('handleGraphqlError', {
            id: '${id}',
            error: error
          });
        });
      })();
    `
    if (this.dappWebView) {
      console.debug('Injecting GraphQL mutation')
      this.dappWebView.injectJavaScript(injectedJavaScript)
    }
  }

  handleGraphqlResult = result => {
    DeviceEventEmitter.emit('graphqlResult', result)
  }

  handleGraphqlError = result => {
    DeviceEventEmitter.emit('graphqlError', result)
  }

  /* Get the uiState from DApp localStorage via a webview bridge request.
   */
  injectUiStateRequest = () => {
    const injectedJavaScript = `
      (function() {
        if (window && window.localStorage && window.webViewBridge) {
          const uiState = window.localStorage['uiState'];
          window.webViewBridge.send('handleUiStateMessage', uiState);
        }
      })();
    `
    if (this.dappWebView) {
      console.debug('Injecting uiState request')
      this.dappWebView.injectJavaScript(injectedJavaScript)
    }
  }

  /* Handle the postMessagefrom the uiState request. The uiState localStorage object
   * can include information about the currency the DApp is set to.
   */
  handleUiStateMessage = async uiStateJson => {
    if (
      uiStateJson.constructor === Object &&
      Object.keys(uiStateJson).length === 0
    ) {
      // Empty uiState key, nothiing to do here
    } else {
      let uiState
      // Parse the uiState value
      try {
        uiState = JSON.parse(uiStateJson)
        if (uiState['currency']) {
          const fiatCurrency = CURRENCIES.find(
            c => c[0] === uiState['currency']
          )
          await this.setState({ fiatCurrency })
          this.updateExchangeRates()
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /* Send a response back to the DApp using postMessage in the webview
   */
  handleBridgeResponse = (msgData, result) => {
    msgData.isSuccessful = Boolean(result)
    msgData.args = [result]
    this.dappWebView.postMessage(JSON.stringify(msgData))
  }

  updateExchangeRates = () => {
    // TODO: this will need to be adjusted if multiple non stablecoin support
    // is added to the DApp (or when OGN has a market price)
    updateExchangeRate(this.state.fiatCurrency[1], 'ETH')
    updateExchangeRate(this.state.fiatCurrency[1], 'DAI')
  }

  onWebViewLoad = async () => {
    // Set the language in the DApp to the same as the mobile app
    this.injectLanguage()
    // Inject scroll handler for pull to refresh function
    if (Platform.OS === 'android') {
      this.injectScrollHandler()
    }
    // Preload messaging keys so user doesn't have to enable messaging
    this.injectMessagingKeys()
    // Fetch exchange rates for the default currency
    this.updateExchangeRates()
    const periodicUpdates = () => {
      // Periodically grab the uiState from local storage to detect currency
      // changes
      this.injectUiStateRequest()
      // Update account identity
      if (this.props.wallet.activeAccount) {
        this.updateIdentity()
        // Update balance
        this.updateBalance()
      }
    }
    // Clear existing updater if exists
    if (this.periodicUpdater) {
      clearInterval(this.periodicUpdater)
    }
    periodicUpdates()
    this.periodicUpdater = setInterval(periodicUpdates, 10000)
    // Set state to ready in redux
    await this.props.setMarketplaceReady(true)
    // Make sure any error state is cleared
    await this.props.setMarketplaceWebViewError(false)
  }

  updateIdentity = async () => {
    const graphqlResponse = await this.props.getIdentity()
    const identity = get(graphqlResponse, 'data.web3.account.identity')
    this.props.setIdentity({
      address: this.props.wallet.activeAccount.address,
      identity
    })
  }

  updateBalance = async () => {
    const activeAddress = this.props.wallet.activeAccount.address
    try {
      const balances = {}
      // Get ETH balance, decimals don't need modifying
      const ethBalanceResponse = await this.props.getBalance(activeAddress)
      balances['eth'] = Number(
        get(ethBalanceResponse.data, 'web3.account.balance.eth', 0)
      )
      balances['dai'] = tokenBalanceFromGql(
        await this.props.getTokenBalance(activeAddress, 'DAI')
      )
      balances['ogn'] = tokenBalanceFromGql(
        await this.props.getTokenBalance(activeAddress, 'OGN')
      )
      this.props.setAccountBalances(balances)
    } catch (error) {
      console.warn('Could not retrieve balances using GraphQL: ', error)
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              enabled={this.state.enablePullToRefresh}
              refreshing={this.state.refreshing}
              onRefresh={() => {
                this.dappWebView.injectJavaScript(`document.location.reload()`)
                setTimeout(() => this.setState({ refreshing: false }), 1000)
              }}
            />
          }
          {...this._panResponder.panHandlers}
        >
          <WebView
            ref={webview => {
              this.dappWebView = webview
            }}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            useWebKit={Platform.OS === 'ios'}
            source={{ uri: this.props.settings.network.dappUrl }}
            onMessage={this.onWebViewMessage}
            onLoad={this.onWebViewLoad}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent
              this.props.setMarketplaceWebViewError(nativeEvent.description)
            }}
            renderLoading={() => {
              return (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="black" />
                </View>
              )
            }}
            decelerationRate="normal"
            userAgent={webViewToBrowserUserAgent()}
            startInLoadingState={true}
          />
          {this.state.modals.map((modal, index) => {
            let card
            if (modal.type === 'enableNotifications') {
              card = (
                <NotificationCard
                  onRequestClose={() => this.toggleModal(modal)}
                />
              )
            } else if (modal.type === 'processTransaction') {
              card = (
                <TransactionCard
                  msgData={modal.msgData}
                  fiatCurrency={this.state.fiatCurrency}
                  onConfirm={() => {
                    global.web3.eth
                      .sendTransaction(modal.msgData.data)
                      .on('transactionHash', hash => {
                        this.toggleModal(modal, hash)
                      })
                  }}
                  onRequestClose={() =>
                    this.toggleModal(modal, {
                      message: 'User denied transaction signature'
                    })
                  }
                />
              )
            } else if (modal.type === 'signMessage') {
              card = (
                <SignatureCard
                  msgData={modal.msgData}
                  onConfirm={() => {
                    if (
                      modal.msgData.data.from.toLowerCase() !==
                      this.props.wallet.activeAccount.address.toLowerCase()
                    ) {
                      console.error('Account mismatch')
                      return
                    }
                    const { signature } = global.web3.eth.accounts.sign(
                      modal.msgData.data,
                      this.props.wallet.activeAccount.privateKey
                    )
                    this.toggleModal(modal, signature)
                  }}
                  onRequestClose={() =>
                    this.toggleModal(modal, {
                      message: 'User denied transaction signature'
                    })
                  }
                />
              )
            }

            return (
              <Modal
                key={index}
                animationType="fade"
                transparent={true}
                visible={true}
                onRequestClose={() => {
                  this.toggleModal(modal)
                }}
              >
                <SafeAreaView style={styles.modalSafeAreaView}>
                  {card}
                </SafeAreaView>
              </Modal>
            )
          })}
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const mapStateToProps = ({
  activation,
  marketplace,
  onboarding,
  wallet,
  settings
}) => {
  return { activation, marketplace, onboarding, wallet, settings }
}

const mapDispatchToProps = dispatch => ({
  setMarketplaceReady: ready => dispatch(setMarketplaceReady(ready)),
  setMarketplaceWebViewError: error =>
    dispatch(setMarketplaceWebViewError(error)),
  setIdentity: payload => dispatch(setIdentity(payload)),
  setAccountBalances: balance => dispatch(setAccountBalances(balance))
})

export default withOriginGraphql(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MarketplaceScreen)
)

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1
  },
  modalSafeAreaView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  loading: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: 'white'
  }
})
