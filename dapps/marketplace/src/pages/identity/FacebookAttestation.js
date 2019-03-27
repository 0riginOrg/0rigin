import React, { Component } from 'react'
import { Query, Mutation } from 'react-apollo'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import Modal from 'components/Modal'

import VerifyFacebookMutation from 'mutations/VerifyFacebook'
import query from 'queries/FacebookAuthUrl'

class FacebookAttestation extends Component {
  state = {
    stage: 'GenerateCode'
  }

  componentDidUpdate(prevProps, prevState) {
    const didOpen = !prevProps.open && this.props.open,
      didChangeStage = prevState.stage !== this.state.stage
    if (this.inputRef && (didOpen || didChangeStage)) {
      this.inputRef.focus()
    }
  }

  render() {
    if (!this.props.open) {
      return null
    }

    return (
      <Modal
        className={`attestation-modal facebook${
          this.state.stage === 'VerifiedOK' ? ' success' : ''
        }`}
        shouldClose={this.state.shouldClose}
        onClose={() => {
          this.setState({
            shouldClose: false,
            error: false,
            stage: 'GenerateCode'
          })
          this.props.onClose()
        }}
      >
        <Query query={query}>
          {({ data }) => {
            const authUrl = get(data, 'identityEvents.facebookAuthUrl')
            return <div>{this[`render${this.state.stage}`]({ authUrl })}</div>
          }}
        </Query>
      </Modal>
    )
  }

  renderGenerateCode({ authUrl }) {
    return (
      <>
        <h2>
          <fbt desc="FacebookAttestation.verfify">
            Verify your Facebook Account
          </fbt>
        </h2>
        {this.state.error && (
          <div className="alert alert-danger mt-3">{this.state.error}</div>
        )}
        <div className="alert alert-danger mt-3 d-block d-sm-none">
          <fbt desc="Attestation.verfify.warning">
            <b>Warning:</b> Currently unavailable on mobile devices
          </fbt>
        </div>
        <div className="help">
          <fbt desc="FacebookAttestation.verfify.explanation">
            Other users will know that you have a verified Facebook account, but
            your account details will not be published on the blockchain. We
            will never post on your behalf.
          </fbt>
        </div>
        <div className="actions">
          {this.renderVerifyButton({ authUrl })}
          <button
            className="btn btn-link"
            onClick={() => this.setState({ shouldClose: true })}
            children={fbt('Cancel', 'Cancel')}
          />
        </div>
      </>
    )
  }

  renderVerifyButton({ authUrl }) {
    return (
      <Mutation
        mutation={VerifyFacebookMutation}
        onCompleted={res => {
          const result = res.verifyFacebook
          if (result.success) {
            this.setState({
              stage: 'VerifiedOK',
              data: result.data,
              loading: false
            })
          } else {
            this.setState({ error: result.reason, loading: false })
          }
        }}
        onError={errorData => {
          console.error('Error', errorData)
          this.setState({ error: 'Check console', loading: false })
        }}
      >
        {verifyCode => (
          <button
            className="btn btn-outline-light d-none d-sm-block"
            onClick={() => {
              if (this.state.loading) return
              this.setState({ error: false, loading: true })
              verifyCode({
                variables: {
                  identity: this.props.wallet,
                  authUrl
                }
              })
            }}
            children={this.state.loading ? 'Loading...' : 'Continue'}
          />
        )}
      </Mutation>
    )
  }

  renderVerifiedOK() {
    return (
      <>
        <h2>
          <fbt desc="FacebookAttestation.verified">
            Facebook account verified!
          </fbt>
        </h2>
        <div className="instructions">
          <fbt desc="Attestation.DontForget">
            Don&apos;t forget to publish your changes.
          </fbt>
        </div>
        <div className="help">
          <fbt desc="Attestation.publishingBlockchain">
            Publishing to the blockchain lets other users know that you have a
            verified profile.
          </fbt>
        </div>
        <div className="actions">
          <button
            className="btn btn-outline-light"
            onClick={() => {
              this.props.onComplete(this.state.data)
              this.setState({ shouldClose: true })
            }}
            children={fbt('Continue', 'Continue')}
          />
        </div>
      </>
    )
  }
}

export default FacebookAttestation

require('react-styl')(`
`)
