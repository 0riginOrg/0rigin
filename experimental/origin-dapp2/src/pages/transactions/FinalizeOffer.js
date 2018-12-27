import React, { Component } from 'react'
import { Mutation, Query } from 'react-apollo'
import { Redirect } from 'react-router'
import get from 'lodash/get'

import Modal from 'components/Modal'
import FinalizeOfferMutation from 'mutations/FinalizeOffer'
import CanBuyQuery from 'queries/CanBuy'
import TransactionReceiptQuery from 'queries/TransactionReceipt'

const ErrorModal = ({ onClose }) => (
  <div className="make-offer-modal">
    <div className="error-icon" />
    <div>There was a problem purchasing this listing.</div>
    <div>See the console for more details.</div>
    <button
      href="#"
      className="btn btn-outline-light"
      onClick={() => onClose()}
      children="OK"
    />
  </div>
)

const WrongNetwork = ({ onClose, networkName }) => (
  <div className="make-offer-modal">
    <div className="error-icon" />
    <div>{`Please switch MetaMask to ${networkName}`}</div>
    <button
      href="#"
      className="btn btn-outline-light"
      onClick={() => onClose()}
      children="OK"
    />
  </div>
)

const NoBalance = ({ onClose }) => (
  <div className="make-offer-modal">
    <div className="error-icon" />
    <div>Insufficient Funds</div>
    <button
      href="#"
      className="btn btn-outline-light"
      onClick={() => onClose()}
      children="OK"
    />
  </div>
)

const MetaMaskError = ({ onClose }) => (
  <div className="make-offer-modal">
    <div className="error-icon" />
    <div>MetaMask Error</div>
    <div>Wrong network?</div>
    <button
      href="#"
      className="btn btn-outline-light"
      onClick={() => onClose()}
      children="OK"
    />
  </div>
)

const CompleteModal = ({ onClick }) => (
  <div className="make-offer-modal">
    <div className="success-icon" />
    <div>Success!</div>
    <button onClick={() => onClick()} className="btn btn-outline-light">
      OK
    </button>
  </div>
)

const ConfirmModal = () => (
  <div className="make-offer-modal">
    <div className="spinner light" />
    <div>
      <b>Confirm Transaction</b>
    </div>
    <div>Please accept or confirm this transaction in MetaMask</div>
  </div>
)

class WaitFor extends Component {
  render() {
    return (
      <Query
        query={TransactionReceiptQuery}
        variables={{ id: this.props.transaction }}
        pollInterval={3000}
      >
        {({ data, client }) => {
          const event = get(data, 'web3.transactionReceipt.events', []).find(
            e => e.event === 'OfferFinalized'
          )
          if (!event) {
            return (
              <div className="make-offer-modal">
                <div className="spinner light" />
                <div>
                  <b>Mining...</b>
                </div>
              </div>
            )
          }
          return (
            <CompleteModal
              onClick={() => {
                client.resetStore()
                this.props.onClose()
              }}
            />
          )
        }}
      </Query>
    )
  }
}

class FinalizeOffer extends Component {
  state = {}
  render() {
    const redirect = this.state.redirect
    if (redirect) {
      return (
        <Redirect
          push
          to={{ pathname: redirect, state: { scrollToTop: true } }}
        />
      )
    }

    const modalProps = {
      shouldClose: this.state.shouldClose,
      submitted: this.state.success,
      onClose: () => this.closeModal()
    }
    return (
      <>
        <Query query={CanBuyQuery}>
          {canBuy => {
            return (
              <Mutation
                mutation={FinalizeOfferMutation}
                onCompleted={({ finalizeOffer }) => {
                  this.setState({ waitFor: finalizeOffer.id })
                }}
                onError={error => {
                  console.log(error)
                  this.setState({ modal: 'error' })
                }}
              >
                {finalizeOffer => (
                  <>
                    <button
                      className={this.props.className}
                      onClick={() => this.onClick(finalizeOffer, canBuy)}
                      children={
                        canBuy.loading && this.state.loading
                          ? 'Loading'
                          : this.props.children
                      }
                    />
                    {canBuy.error && this.state.showError && (
                      <Modal {...modalProps}>
                        <MetaMaskError onClose={() => this.shouldClose()} />
                      </Modal>
                    )}
                  </>
                )}
              </Mutation>
            )
          }}
        </Query>
        {this.state.modal && (
          <Modal {...modalProps}>
            {this.state.modal === 'error' ? (
              <ErrorModal onClose={() => this.shouldClose()} />
            ) : this.state.waitFor ? (
              <WaitFor
                transaction={this.state.waitFor}
                onClose={() => this.shouldClose()}
              />
            ) : (
              <ConfirmModal />
            )}
          </Modal>
        )}
        {this.state.wrongNetwork && (
          <Modal {...modalProps}>
            <WrongNetwork
              onClose={() => this.shouldClose()}
              networkName={this.state.wrongNetwork.web3.networkName}
            />
          </Modal>
        )}
        {this.state.noBalance && (
          <Modal {...modalProps}>
            <NoBalance onClose={() => this.shouldClose()} />
          </Modal>
        )}
      </>
    )
  }

  shouldClose({ success = false } = {}) {
    this.setState({ shouldClose: true, success })
  }

  closeModal() {
    this.setState({
      modal: false,
      wrongNetwork: false,
      noBalance: false,
      shouldClose: false,
      showError: false
    })
  }

  onClick(finalizeOffer, { data, loading, error }) {
    if (loading) {
      this.setState({ loading: true, showError: true })
      return
    }
    if (error) {
      this.setState({ showError: true })
      return
    }
    if (!data || !data.web3) return

    const { offer, rating, review } = this.props
    const variables = {
      offerID: offer.id,
      from: offer.buyer.id,
      rating,
      review
    }

    const eth = Number(get(data, 'web3.metaMaskAccount.balance.eth', 0))
    if (!data.web3.metaMaskAccount) {
      this.setState({ redirect: `/listings/${this.props.listing.id}/onboard` })
    } else if (data.web3.networkId !== data.web3.metaMaskNetworkId) {
      this.setState({ wrongNetwork: data })
    } else if (!eth) {
      this.setState({ noBalance: true })
    } else {
      this.setState({ modal: true })
      finalizeOffer({ variables })
    }
  }
}

export default FinalizeOffer

require('react-styl')(`
`)
