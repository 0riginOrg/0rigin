import assert from 'assert'
import helper, { contractPath, ZERO_ADDRESS, assertRevert } from './_helper'

describe('ProxyFactory', async function() {
  let accounts, deploy
  let ProxyFactory,
    IdentityProxyImp,
    Forwarder,
    Seller

  before(async function() {
    ({ deploy, accounts } = await helper(`${__dirname}/..`))

    // Address that pays for new user
    Forwarder = accounts[0]
    Seller = accounts[1]

    ProxyFactory = await deploy('ProxyFactory', {
      from: accounts[0],
      path: `${contractPath}/proxy`,
      file: 'ProxyFactory.s'
    })

    IdentityProxyImp = await deploy('IdentityProxy', {
      from: Forwarder,
      path: `${contractPath}/identity`,
      file: 'IdentityProxy.s',
      args: [Forwarder]
    })
  })

  describe('IdentityProxy.sol', async function() {
    it('should revert when create2 fails', async function() {

      const receipt = await ProxyFactory.methods
        .createProxyWithSenderNonce(
          IdentityProxyImp._address,
          '0x00',
          Seller,
          0
        )
        .send({ from: Forwarder, gas: 4000000 })

      assert(receipt.status > 0, 'first proxy creation failed')
      assert(receipt.contractAddress !== ZERO_ADDRESS, 'first proxy creation zero addr')

      const tx = ProxyFactory.methods
        .createProxyWithSenderNonce(
          IdentityProxyImp._address,
          '0x00',
          Seller,
          0
        )
      await assertRevert(tx.send({ from: Forwarder, gas: 4000000 }), 'proxy-deploy-failed')
    })
  })
})
