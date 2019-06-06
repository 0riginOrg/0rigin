'use strict'

import { ActivationConstants } from 'actions/Activation'

const initialState = {
  // Address to date of backup/dismissal
  backupWarningDismissed: {}
}

export default function Activation(state = initialState, action = {}) {
  switch (action.type) {
    case ActivationConstants.SET_BACKUP_WARNING_STATUS:
      return {
        ...state,
        backupWarningDismissed: {
          ...state.backupWarningDismissed,
          [action.address]: action.date
        }
      }
  }

  return state
}
