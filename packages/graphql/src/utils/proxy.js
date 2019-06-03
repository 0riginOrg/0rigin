import memoize from 'lodash/memoize'
import contracts from '../contracts'

// Get the creation code for the deployed Proxy implementation
const proxyCreationCode = memoize(async () => {
  const { web3, ProxyImp, ProxyFactory } = contracts
  let code = await ProxyFactory.methods.proxyCreationCode().call()
  code += web3.eth.abi.encodeParameter('uint256', ProxyImp._address).slice(2)
  return code
})

async function predictedProxyRaw(address) {
  const web3 = contracts.web3Exec
  const salt = web3.utils.soliditySha3(address, 0)
  const creationCode = await proxyCreationCode()
  const creationHash = web3.utils.sha3(creationCode)

  // Expected proxy address can be worked out thus:
  const create2hash = web3.utils
    .soliditySha3('0xff', contracts.ProxyFactory._address, salt, creationHash)
    .slice(-40)

  return web3.utils.toChecksumAddress(`0x${create2hash}`)
}

/**
 * Works out if a proxy exists for a given account or not.
 *
 * This function will calculate the address of the Proxy deployed for a given
 * account. It will return that address if code exists there or false otherwise.
 *
 * Since Proxy contracts are created using the CREATE2 call, we can calculate
 * the address the contract will be deployed to for a given account.
 */
async function hasProxyRaw(address) {
  if (!contracts.config.proxyAccountsEnabled || !contracts.ProxyImp._address) {
    return false
  }
  try {
    const predicted = await predictedProxyRaw(address)

    // Return the predicted address if code exists there, or false otherwise
    const code = await contracts.web3Exec.eth.getCode(predicted)
    return code.slice(2).length > 0 ? predicted : false
  } catch (e) {
    return false
  }
}

/**
 * Returns proxy owner, or null
 */
async function proxyOwnerRaw(address) {
  if (!contracts.config.proxyAccountsEnabled || !contracts.ProxyImp._address) {
    return null
  }
  try {
    const Proxy = contracts.ProxyImp.clone()
    Proxy.options.address = address
    const id = await Proxy.methods.owner().call()
    return id || null
  } catch (e) {
    return null
  }
}

export const proxyOwner = memoize(proxyOwnerRaw, address => address)
export const hasProxy = memoize(hasProxyRaw, address => address)
export const predictedProxy = memoize(predictedProxyRaw, address => address)
export const resetProxyCache = () => {
  hasProxy.cache.clear()
  proxyOwner.cache.clear()
}
