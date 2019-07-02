'use strict'

import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  onboardingModal: {
    flex: 1,
    marginHorizontal: 2,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'white'
  },
  invalid: {
    borderColor: '#ff0000',
    color: '#ff0000'
  },
  input: {
    fontSize: 18,
    borderColor: '#c0cbd4',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    width: '80%'
  },
  backArrow: {
    position: 'absolute',
    left: -10,
    top: 18
  }
})
