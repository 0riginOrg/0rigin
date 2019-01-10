import React, { Component } from 'react'
import { Query } from 'react-apollo'
import { Button } from '@blueprintjs/core'

import query from 'queries/AllContracts'

import Address from 'components/Address'
import DeployToken from './_DeployToken'
import DeployMarketplace from './_DeployMarketplace'
import DeployContract from './_DeployContract'
import AddAffiliate from './_AddAffiliate'

function totalSupply(supply, decimals) {
  const supplyBN = web3.utils.toBN(supply)
  const decimalsBN = web3.utils.toBN(web3.utils.padRight('1', decimals + 1))
  return supplyBN.div(decimalsBN).toString()
}

class Contracts extends Component {
  state = {}
  render() {
    return (
      <Query query={query}>
        {({ loading, error, data }) => {
          if (loading) return <p className="mt-3">Loading...</p>
          if (error) {
            console.log(error)
            console.log(query.loc.source.body)
            return <p className="mt-3">Error :(</p>
          }
          const marketplaces = data.marketplaces || []
          const tokens = data.tokens || []
          return (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <h3 className="bp3-heading">Tokens</h3>
                <Button
                  small={true}
                  icon="plus"
                  className="ml-2"
                  onClick={() => this.setState({ deployToken: true })}
                />
              </div>

              <table className="bp3-html-table bp3-small">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Decimals</th>
                    <th>Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(m => (
                    <tr key={m.id}>
                      <td>{m.symbol}</td>
                      <td>{m.name}</td>
                      <td>
                        <Address address={m.address} />
                      </td>
                      <td>{m.decimals}</td>
                      <td>{totalSupply(m.totalSupply, m.decimals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginTop: '1.5rem'
                }}
              >
                <h3 className="bp3-heading">Marketplaces</h3>
                <Button
                  small={true}
                  icon="plus"
                  className="ml-2"
                  onClick={() => this.setState({ deployMarketplace: true })}
                />
              </div>
              <table className="bp3-html-table bp3-small">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Listings</th>
                    <th>Token</th>
                    <th>Address</th>
                    <th>Owner</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {marketplaces.map(m => (
                    <tr key={m.address}>
                      <td>{m.version}</td>
                      <td>{m.totalListings}</td>
                      <td>
                        <Address address={m.token} />
                      </td>
                      <td>
                        <Address address={m.address} />
                      </td>
                      <td>
                        <Address address={m.owner.id} />
                      </td>
                      <td>
                        <Button
                          text="Add Affiliate"
                          onClick={() =>
                            this.setState({ addAffiliate: m.owner.id })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginTop: '1.5rem'
                }}
              >
                <h3 className="bp3-heading">Identity</h3>
                <Button
                  small={true}
                  icon="plus"
                  text="User Registry"
                  className="ml-2"
                  onClick={() => this.setState({ deployUserRegistry: true })}
                />
                <Button
                  small={true}
                  icon="plus"
                  text="Key Holder Lib"
                  className="ml-2"
                  onClick={() => this.setState({ deployKeyHolderLib: true })}
                />
                <Button
                  small={true}
                  icon="plus"
                  text="Claim Holder Lib"
                  className="ml-2"
                  onClick={() => this.setState({ deployClaimHolderLib: true })}
                />
                <Button
                  small={true}
                  icon="plus"
                  text="Origin Identity"
                  className="ml-2"
                  onClick={() => this.setState({ deployOriginIdentity: true })}
                />
              </div>

              <DeployToken
                isOpen={this.state.deployToken}
                onCompleted={() => this.setState({ deployToken: false })}
              />
              <DeployMarketplace
                isOpen={this.state.deployMarketplace}
                tokens={tokens}
                onCompleted={() => this.setState({ deployMarketplace: false })}
              />
              <AddAffiliate
                isOpen={this.state.addAffiliate ? true : false}
                from={this.state.addAffiliate}
                onCompleted={() => this.setState({ addAffiliate: false })}
              />
              <DeployContract
                title="Deploy User Registry"
                contract="UserRegistry"
                isOpen={this.state.deployUserRegistry ? true : false}
                onCompleted={() => this.setState({ deployUserRegistry: false })}
              />
              <DeployContract
                title="Deploy Key Holder Lib"
                contract="KeyHolderLibrary"
                isOpen={this.state.deployKeyHolderLib ? true : false}
                onCompleted={() => this.setState({ deployKeyHolderLib: false })}
              />
              <DeployContract
                title="Deploy Claim Holder Lib"
                contract="ClaimHolderLibrary"
                isOpen={this.state.deployClaimHolderLib ? true : false}
                onCompleted={() =>
                  this.setState({ deployClaimHolderLib: false })
                }
              />
              <DeployContract
                title="Deploy Origin Identity"
                contract="OriginIdentity"
                isOpen={this.state.deployOriginIdentity ? true : false}
                onCompleted={() =>
                  this.setState({ deployOriginIdentity: false })
                }
              />
            </div>
          )
        }}
      </Query>
    )
  }
}

export default Contracts
