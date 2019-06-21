import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import { fbt } from 'fbt-runtime'

import withIsMobile from 'hoc/withIsMobile'

import Modal from 'components/Modal'
import MobileModal from 'components/MobileModal'

import EmailAttestation from './EmailAttestation'

class EmailAttestationModal extends Component {
  state = {
    shouldClose: false
  }

  render() {
    if (!this.props.open) {
      return null
    }

    const ModalComponent = this.props.isMobile ? MobileModal : Modal

    return (
      <ModalComponent
        title={fbt(
          'Verify Email Address',
          'EmailAttestation.verifyEmailAddress'
        )}
        className="attestation-modal email"
        shouldClose={this.state.shouldClose}
        onClose={() => {
          if (this.props.onComplete && this.state.data) {
            this.props.onComplete(this.state.data)
          } else if (this.props.onClose) {
            this.props.onClose()
          }
        }}
        lightMode={true}
      >
        <EmailAttestation
          wallet={this.props.wallet}
          onCompleted={(data) => {
            this.setState({
              shouldClose: true,
              data: data
            })
          }}
        />
      </ModalComponent>
    )
  }

}

export default withIsMobile(EmailAttestationModal)

require('react-styl')(`
`)
