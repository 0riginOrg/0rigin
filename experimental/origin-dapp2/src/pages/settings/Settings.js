import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import pick from 'lodash/pick'

import { formInput, formFeedback } from 'utils/formHelpers'
import withConfig from 'hoc/withConfig'
import SetNetwork from 'mutations/SetNetwork'

const configurableFields = [
  'bridge',
  'discovery',
  'ipfsGateway',
  'ipfsRPC',
  'provider',
  'providerWS'
]

class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ...Object.assign(
        ...configurableFields.map(key => ({ [key]: '' }))
      ),
      ...pick(this.props.config, configurableFields)
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.config !== this.props.config) {
      this.setState({
        ...pick(this.props.config, configurableFields)
      })
    }
  }

  render() {
    const input = formInput(this.state, state => this.setState(state))
    const Feedback = formFeedback(this.state)

    return (
      <div className="container settings">
        <h1>Settings</h1>
        <div className="row">
          <div className="col-lg-6 col-md-12">
            <div className="settings-box">
              <div className="form-group">
                <label htmlFor="language">Language</label>
                <div className="form-text form-text-muted">
                  <small>Please make a selection from the list below.</small>
                </div>
                <select className="form-control form-control-lg">
                  English
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notifications">Notifications</label>
                <div className="form-text form-text-muted">
                  <small>Set your notifications settings below.</small>
                </div>
                <div className="form-check">
                  <input className="form-check-input"
                      type="radio"
                      name="notifications"
                      id="notificationsOffRadio"
                      value="true"
                      checked />
                  <label className="form-check-label" htmlFor="notifiationsOffRadio">
                    Off
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input"
                      type="radio"
                      name="notifications"
                      id="notificationsOnRadio"
                      value="true" />
                  <label className="form-check-label" htmlFor="notificationsOnRadio">
                    All messages
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="Messaging">Messaging</label>
                <div className="form-text form-text-muted">
                  <small>Enable/disable messaging by clicking the button below.</small>
                </div>
                <button className="btn btn-outline-danger">
                  Disable
                </button>
              </div>
              <div className="form-group">
                <label htmlFor="language">Mobile Wallet</label>
                <div className="form-text form-text-muted">
                  <small>Disconnect from your mobile wallet by clicking the button below.</small>
                </div>
                <button className="btn btn-outline-danger">
                  Disconnect
                </button>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-12">
            <div className="settings-box">
              <div className="form-group">
                <label htmlFor="indexing">Discovery Server</label>
                <div className="form-text form-text-muted">
                  <small>Please enter the URL below. Leave blank to directly query the blockchain. Search functionality will disabled if no discovery server is used.</small>
                </div>
                <input className="form-control form-control-lg"
                    type="text"
                    name="discovery"
                    {...input('discovery')} />
              </div>
              <div className="form-group">
                <label htmlFor="indexing">IPFS Gateway</label>
                <div className="form-text form-text-muted">
                  <small>Please enter the URL below.</small>
                </div>
                <input className="form-control form-control-lg"
                    type="text"
                    name="ipfsGateway"
                    {...input('ipfsGateway')} />
              </div>
              <div className="form-group">
                <label htmlFor="indexing">Web3 Provider</label>
                <div className="form-text form-text-muted">
                  <small>Please enter the URL below.</small>
                </div>
                <input className="form-control form-control-lg"
                    type="text"
                    name="web3Providrer"
                    {...input('provider')} />
              </div>
              <div className="form-group">
                <label htmlFor="indexing">Bridge Server</label>
                <div className="form-text form-text-muted">
                  <small>Please enter the URL below.</small>
                </div>
                <input className="form-control form-control-lg"
                    type="text"
                    name="bridgeServer"
                    {...input('bridge')} />
              </div>
            </div>
          </div>
        </div>

        <Mutation mutation={SetNetwork}>
          {(setNetwork, { client }) => (
            <button
              className="btn btn-lg btn-primary"
              onClick={async () => {
                window.localStorage.customConfig = JSON.stringify(
                  pick(this.state, configurableFields)
                )
                setNetwork({
                  variables: { network: window.localStorage.ognNetwork || 'mainnet' }
                })
                this.props.configRefetch()
              }}
            >
              Save
            </button>
          )}
        </Mutation>
      </div>
    )
  }
}

export default withConfig(Settings)

require('react-styl')(`
  .settings
    padding-top: 3rem

  .settings-box
    margin-bottom: 1rem
    padding: 2rem
    border: 1px solid var(--light)
    border-radius: var(--default-radius)

  .settings
    .form-text
      margin-top: -0.75rem
      margin-bottom: 0.5rem
      small
        font-size: 70%
    .form-group
      margin-bottom: 1.5rem
`)
