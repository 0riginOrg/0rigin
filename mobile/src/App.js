'use strict'

import React, { Component } from 'react'
import { Dimensions, YellowBox } from 'react-native'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import OriginWallet from './OriginWallet'
import OriginWrapper from './Wrapper'
import PushNotifications from './PushNotifications'
import Store, { persistor } from './Store'
import Loading from 'components/loading'

YellowBox.ignoreWarnings([
  // https://github.com/facebook/react-native/issues/18868
  'Warning: isMounted(...) is deprecated',
  // https://github.com/facebook/react-native/issues/17504
  'Module RCTImageLoader requires main queue setup'
])

class OriginApp extends Component {
  render() {
    const { height } = Dimensions.get('window')
    const smallScreen = height < 812

    return (
      <ReduxProvider store={Store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <OriginWallet />
          <PushNotifications />
          <OriginWrapper smallScreen={smallScreen} />
        </PersistGate>
      </ReduxProvider>
    )
  }
}

export default OriginApp
