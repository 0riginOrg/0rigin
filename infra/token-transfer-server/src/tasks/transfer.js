const fs = require('fs')
const moment = require('moment')

const {
  largeTransferThreshold,
  largeTransferDelayMinutes,
  watchdogPath
} = require('../config')
const { Transfer, Sequelize } = require('../models')
const { executeTransfer } = require('../lib/transfer')
const logger = require('../logger')
const enums = require('../enums')

const watchdogFile = `${watchdogPath}/execute.pid`.replace(/\/\/+/g, '/')

const initWatchdog = () => {
  // Check there is no existing watchdog.
  if (fs.existsSync(watchdogFile)) {
    throw new Error(`Watchdog detected at ${watchdogFile}. Processing aborted.`)
  }

  // Create a watchdog for this run.
  fs.writeFileSync(watchdogFile, `${process.pid}`)
}

const clearWatchdog = () => {
  // Clean watchdog.
  if (fs.existsSync(watchdogFile)) {
    fs.unlinkSync(watchdogFile)
  }
}

const executeTransfers = async () => {
  logger.info('Running execute transfers job...')

  initWatchdog()

  const waitingTransfers = await Transfer.findAll({
    where: {
      [Sequelize.Op.or]: [
        {
          status: enums.TransferStatuses.WaitingConfirmation
        },
        {
          status: enums.TransferStatuses.Processing
        }
      ]
    }
  })
  if (waitingTransfers.length > 0) {
    throw new Error(
      `Found unconfirmed transfer(s). Fix before running this script again.`
    )
  }

  const cutoffTime = moment.utc().subtract(largeTransferDelayMinutes, 'minutes')
  const transfers = await Transfer.findAll({
    where: {
      [Sequelize.Op.or]: [
        {
          status: enums.TransferStatuses.Enqueued,
          amount: { [Sequelize.Op.gte]: largeTransferThreshold },
          createdAt: { [Sequelize.Op.lte]: cutoffTime }
        },
        {
          status: enums.TransferStatuses.Enqueued,
          amount: { [Sequelize.Op.lt]: largeTransferThreshold }
        }
      ]
    }
  })

  logger.info(`Processing ${transfers.length} transfers`)

  for (const transfer of transfers) {
    logger.info(`Processing transfer ${transfer.id}`)
    const result = await executeTransfer(transfer)
    logger.info(
      `Processed transfer ${transfer.id}. Status: ${result.txStatus} TxHash: ${result.txHash}`
    )
  }

  clearWatchdog()
}

module.exports = {
  clearWatchdog,
  initWatchdog,
  executeTransfers
}
