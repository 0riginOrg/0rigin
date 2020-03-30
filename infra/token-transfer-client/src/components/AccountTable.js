import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'

import { addAccount, deleteAccount } from '@/actions/account'
import {
  getAccounts,
  getError,
  getIsAdding,
  getIsLoading
} from '@/reducers/account'
import { formInput, formFeedback } from '@/utils/formHelpers'
import Modal from '@/components/Modal'
import DeleteIcon from '@material-ui/icons/Delete'
import EthAddress from '@/components/EthAddress'

class AccountTable extends Component {
  constructor(props) {
    super(props)
    this.state = this.getInitialState()
  }

  componentDidUpdate(prevProps) {
    // Parse server errors
    if (prevProps.error !== this.props.error) {
      if (this.props.error && this.props.error.status === 422) {
        // Parse validation errors from API
        this.props.error.response.body.errors.forEach(e => {
          this.setState({ [`${e.param}Error`]: e.msg })
        })
      }
    }
  }

  getInitialState = () => {
    const initialState = {
      nickname: '',
      nicknameError: '',
      address: '',
      addressError: '',
      displayModal: false
    }
    return initialState
  }

  handleSubmit = async event => {
    event.preventDefault()

    const result = await this.props.addAccount({
      nickname: this.state.nickname,
      address: this.state.address
    })

    if (result.type === 'ADD_ACCOUNT_SUCCESS') {
      this.reset()
    }
  }

  handleDeleteAccount = id => {
    const result = window.confirm(
      'Are you sure you want to delete that account?'
    )
    if (result) {
      this.props.deleteAccount(id)
    }
  }

  reset = () => {
    this.setState(this.getInitialState())
  }

  render() {
    if (this.props.isLoading) {
      return (
        <div className="spinner-grow" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )
    }

    return (
      <>
        {this.state.displayModal && this.renderModal()}
        <div className="row">
          <div className="col-7">
            <h2>Ethereum Accounts</h2>
          </div>
          <div className="col-5 text-right">
            <a
              href="#"
              onClick={e => {
                e.preventDefault()
                this.setState({ displayModal: true })
              }}
            >
              + Add Account
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <div className="table-responsive">
              <table className="table mb-4">
                <thead>
                  <tr>
                    <th>Nickname</th>
                    <th>Address</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {this.props.accounts.length === 0 ? (
                    <tr>
                      <td className="table-empty-cell" colSpan="100%">
                        You haven&apos;t added any Ethereum accounts.
                      </td>
                    </tr>
                  ) : (
                    this.props.accounts.map(account => (
                      <tr key={account.address}>
                        <td>{account.nickname}</td>
                        <td>
                          <EthAddress address={account.address} />
                        </td>
                        <td>{moment(account.createdAt).format('L')}</td>
                        <td>
                          <DeleteIcon
                            style={{ fill: '#8fa7b7', cursor: 'pointer' }}
                            onClick={() => this.handleDeleteAccount(account.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    )
  }

  renderModal() {
    const input = formInput(this.state, state => this.setState(state))
    const Feedback = formFeedback(this.state)

    return (
      <Modal appendToId="main" onClose={this.reset} closeBtn={true}>
        <h1 className="mb-2">Add an Account</h1>
        <p>Enter a nickname and an Ethereum account address.</p>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Nickname</label>
            <input {...input('nickname')} />
            {Feedback('nickname')}
          </div>
          <div className="form-group">
            <label htmlFor="email">Ethereum Address</label>
            <input {...input('address')} />
            {Feedback('address')}
          </div>
          <div className="actions mt-3">
            <div className="row">
              <div className="col text-right">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={
                    !this.state.nickname ||
                    !this.state.address ||
                    this.props.isAdding
                  }
                >
                  {this.props.isAdding ? <>Loading...</> : <span>Add</span>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    )
  }
}

const mapStateToProps = ({ account }) => {
  return {
    accounts: getAccounts(account),
    isAdding: getIsAdding(account),
    isLoading: getIsLoading(account),
    error: getError(account)
  }
}

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      addAccount: addAccount,
      deleteAccount: deleteAccount
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(AccountTable)
