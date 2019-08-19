import agent from '@/utils/agent'
import { apiUrl } from '@/constants'

export const ADD_TRANSFER_PENDING = 'ADD_TRANSFER_PENDING'
export const ADD_TRANSFER_SUCCESS = 'ADD_TRANSFER_SUCCESS'
export const ADD_TRANSFER_ERROR = 'ADD_TRANSFER_ERROR'
export const FETCH_TRANSFERS_PENDING = 'FETCH_TRANSFERS_PENDING'
export const FETCH_TRANSFERS_SUCCESS = 'FETCH_TRANSFERS_SUCCESS'
export const FETCH_TRANSFERS_ERROR = 'FETCH_TRANSFERS_ERROR'

function addTransferPending() {
  return {
    type: ADD_TRANSFER_PENDING
  }
}

function addTransferSuccess(payload) {
  return {
    type: ADD_TRANSFER_SUCCESS,
    payload
  }
}

function addTransferError(error) {
  return {
    type: ADD_TRANSFER_ERROR,
    error
  }
}

function fetchTransfersPending() {
  return {
    type: FETCH_TRANSFERS_PENDING
  }
}

function fetchTransfersSuccess(payload) {
  return {
    type: FETCH_TRANSFERS_SUCCESS,
    payload
  }
}

function fetchTransfersError(error) {
  return {
    type: FETCH_TRANSFERS_ERROR,
    error
  }
}

export function addTransfer(transfer) {
  return dispatch => {
    dispatch(addTransferPending())

    agent
      .post(`${apiUrl}/api/transfers`)
      .send(transfer)
      .then(response => dispatch(addTransferSuccess(response.body)))
      .catch(error => {
        dispatch(addTransferError(error))
        throw error
      })
  }
}

export function fetchTransfers() {
  return dispatch => {
    dispatch(fetchTransfersPending())

    agent
      .get(`${apiUrl}/api/transfers`)
      .then(response => dispatch(fetchTransfersSuccess(response.body)))
      .catch(error => {
        dispatch(fetchTransfersError(error))
        throw error
      })
  }
}
