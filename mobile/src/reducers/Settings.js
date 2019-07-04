'use strict'

import { SettingsConstants } from 'actions/Settings'
import { NETWORKS } from '../constants'

defaultNetwork = NETWORKS.find(n => n.name === 'Mainnet')
// defaultNetwork = NETWORKS.find(n => n.name === 'Rinkeby')

const initialState = {
  network: defaultNetwork,
  deviceToken: null,
  language: null,
  pin: null,
  biometryType: null
}

export default function Settings(state = initialState, action = {}) {
  switch (action.type) {
    case SettingsConstants.SET_NETWORK:
      return {
        ...state,
        network: action.network
      }

    case SettingsConstants.SET_DEVICE_TOKEN:
      return { ...state, deviceToken: action.deviceToken }

    case SettingsConstants.SET_PIN:
      return { ...state, pin: action.pin }

    case SettingsConstants.SET_BIOMETRY_TYPE:
      return { ...state, biometryType: action.biometryType }

    case SettingsConstants.SET_LANGUAGE:
      return { ...state, language: action.language }
  }

  return state
}
