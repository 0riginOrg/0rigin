const get = require('lodash.get')
const jwt = require('jsonwebtoken')

const Token = require('@origin/token/src/token')

const { discordWebhookUrl } = require('../config')
const { sendEmail } = require('../lib/email')
const { postToWebhook } = require('./webhook')
const {
  TRANSFER_DONE,
  TRANSFER_FAILED,
  TRANSFER_REQUEST,
  TRANSFER_CONFIRMED
} = require('../constants/events')
const { Event, Transfer, sequelize } = require('../models')
const { hasBalance } = require('./balance')
const { transferConfirmationTimeout, transferHasExpired } = require('../shared')
const { clientUrl, encryptionSecret, networkId } = require('../config')
const enums = require('../enums')
const logger = require('../logger')

// Number of block confirmations required for a transfer to be consider completed.
const NumBlockConfirmation = 8

// Wait up to 20 min for a transaction to get confirmed
const ConfirmationTimeoutSec = 20 * 60 * 60

/**
 * Enqueues a request to transfer tokens.
 * @param userId
 * @param address
 * @param amount
 * @returns {Promise<Transfer>} Transfer object.
 */
async function addTransfer(userId, address, amount, data = {}) {
  const user = await hasBalance(userId, amount)

  // Enqueue the request by inserting a row in the transfer table.
  // It will get picked up asynchronously by the offline job that processes transfers.
  // Record new state in the database.
  let transfer
  const txn = await sequelize.transaction()
  try {
    transfer = await Transfer.create({
      userId: user.id,
      status: enums.TransferStatuses.WaitingEmailConfirm,
      toAddress: address.toLowerCase(),
      amount,
      currency: 'OGN', // For now we only support OGN.
      data
    })
    await Event.create({
      userId: user.id,
      action: TRANSFER_REQUEST,
      data: JSON.stringify({
        transferId: transfer.id
      })
    })
    await txn.commit()
  } catch (e) {
    await txn.rollback()
    logger.error(`Failed to add transfer for address ${address}: ${e}`)
    throw e
  }

  logger.info(
    `Added transfer. id: ${transfer.id} address: ${address} amount: ${amount}`
  )

  await sendTransferConfirmationEmail(transfer, user)

  return transfer
}

/**
 * Sends an email with a token that can be used for confirming a transfer.
 * @param transfer
 * @param user
 */
async function sendTransferConfirmationEmail(transfer, user) {
  const token = jwt.sign(
    {
      transferId: transfer.id
    },
    encryptionSecret,
    { expiresIn: `${transferConfirmationTimeout}m` }
  )

  const vars = { url: `${clientUrl}/withdrawal/${transfer.id}/${token}` }
  await sendEmail(user.email, 'transfer', vars)

  logger.info(
    `Sent email transfer confirmation token to ${user.email} for transfer ${transfer.id}`
  )
}

/* Moves a transfer from waiting for email confirmation to enqueued.
 * Throws an exception if the request is invalid.
 * @param transfer
 * @param user
 */
async function confirmTransfer(transfer, user) {
  if (transfer.status !== enums.TransferStatuses.WaitingEmailConfirm) {
    throw new Error('Transfer is not waiting for confirmation')
  }

  if (transferHasExpired(transfer)) {
    await transfer.update({
      status: enums.TransferStatuses.Expired
    })
    throw new Error('Transfer was not confirmed in the required time')
  }

  const txn = await sequelize.transaction()
  // Change state of transfer and add event
  try {
    await transfer.update({
      status: enums.TransferStatuses.Enqueued
    })
    const event = {
      userId: user.id,
      action: TRANSFER_CONFIRMED,
      data: JSON.stringify({
        transferId: transfer.id
      })
    }
    await Event.create(event)
    await txn.commit()
  } catch (e) {
    await txn.rollback()
    logger.error(
      `Failed writing confirmation data for transfer ${transfer.id}: ${e}`
    )
    throw e
  }

  try {
    if (discordWebhookUrl) {
      const countryDisplay = get(
        transfer.data.location,
        'countryName',
        'Unknown'
      )
      const webhookData = {
        embeds: [
          {
            title: `A transfer of \`${transfer.amount}\` OGN was queued by \`${user.email}\``,
            description: [
              `**ID:** \`${transfer.id}\``,
              `**Address:** \`${transfer.toAddress}\``,
              `**Country:** ${countryDisplay}`
            ].join('\n')
          }
        ]
      }
      await postToWebhook(discordWebhookUrl, JSON.stringify(webhookData))
    }
  } catch (e) {
    logger.error(
      `Failed sending Discord webhook for token transfer confirmation:`,
      e
    )
  }

  return true
}

/**
 * Sends a blockchain transaction to transfer tokens and waits for the transaction to get confirmed.
 * @param {Transfer} transfer: DB model Transfer object
 * @returns {Promise<{txHash: string, txStatus: string}>}
 */
async function executeTransfer(transfer) {
  const user = await hasBalance(transfer.userId, transfer.amount, transfer)

  await transfer.update({ status: enums.TransferStatuses.Processing })

  // Setup token library
  const token = new Token(networkId)
  // Send transaction to transfer the tokens and record txHash in the DB.
  const naturalAmount = token.toNaturalUnit(transfer.amount)
  const supplier = await token.defaultAccount()
  const txHash = await token.credit(transfer.toAddress, naturalAmount)

  await transfer.update({
    status: enums.TransferStatuses.WaitingConfirmation,
    fromAddress: supplier.toLowerCase(),
    txHash
  })

  // Wait for the transaction to get confirmed.
  const { status } = await token.waitForTxConfirmation(txHash, {
    numBlocks: NumBlockConfirmation,
    timeoutSec: ConfirmationTimeoutSec
  })
  let transferStatus, eventAction, failureReason
  switch (status) {
    case 'confirmed':
      transferStatus = enums.TransferStatuses.Success
      eventAction = TRANSFER_DONE
      break
    case 'failed':
      transferStatus = enums.TransferStatuses.Failed
      eventAction = TRANSFER_FAILED
      break
    case 'timeout':
      transferStatus = enums.TransferStatuses.Failed
      eventAction = TRANSFER_FAILED
      failureReason = 'Confirmation timeout'
      break
    default:
      throw new Error(`Unexpected status ${status} for txHash ${txHash}`)
  }
  logger.info(`Received status ${status} for txHash ${txHash}`)

  // Update the status in the transfer table.
  const txn = await sequelize.transaction()
  try {
    await transfer.update({
      status: transferStatus
    })
    const event = {
      userId: user.id,
      action: eventAction,
      data: {
        transferId: transfer.id,
        failureReason: failureReason
      }
    }
    if (failureReason) {
      event.data.failureReason = failureReason
    }
    await Event.create(event)
    await txn.commit()
  } catch (e) {
    await txn.rollback()
    logger.error(
      `Failed writing confirmation data for transfer ${transfer.id}: ${e}`
    )
    throw e
  }

  return { txHash, txStatus: status }
}

module.exports = {
  addTransfer,
  confirmTransfer,
  executeTransfer
}
