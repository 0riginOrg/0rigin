'use strict'

import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  onboardingDarkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  onboardingModal: {
    flex: 1,
    marginHorizontal: 5,
    paddingBottom: 5,
    borderRadius: 20,
    backgroundColor: 'white'
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%'
  },
  content: {
    flexGrow: 1,
    padding: 10,
  },
  legalContainer: {
    fontSize: 14,
    paddingTop: 10,
    paddingBottom: 10,
    width: '90%'
  },
  legal: {
    textAlign: 'center',
    color: '#98a7b4'
  },
  button: {
    marginBottom: 20,
    marginHorizontal: 30
  },
  title: {
    fontFamily: 'Lato',
    fontSize: 28,
    fontWeight: '600',
    paddingTop: 20,
    paddingBottom: 20,
    color: '#293f55'
  },
  subtitle: {
    fontFamily: 'Lato',
    fontSize: 18,
    paddingBottom: 10,
  },
  invalid: {
    borderColor: '#ff0000',
    color: '#ff0000'
  },
  input: {
    fontSize: 18,
    borderColor: '#c0cbd4',
    borderBottomWidth: 1,
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    width: '80%'
  },
  visibilityWarningContainer: {
    borderColor: '#98a7b4',
    backgroundColor: 'rgba(152, 167, 180, 0.1)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '95%',
    alignSelf: 'center'
  },
  visibilityWarningHeader: {
    fontWeight: '600',
    paddingBottom: 5,
    textAlign: 'center'
  },
  visibilityWarningText: {
    textAlign: 'center'
  },
  isVisible: {
    borderColor: '#f4c110',
    backgroundColor: 'rgba(244, 193, 16, 0.1)'
  }
})
