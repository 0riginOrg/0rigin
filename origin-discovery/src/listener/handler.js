const logger = require('./logger')
const db = require('../models')
const { withRetrys } = require('./utils')
const MarketplaceEventHandler = require('./handler_marketplace')
const IdentityEventHandler = require('./handler_identity')

const { postToDiscordWebhook, postToWebhook } = require('./webhooks')


const marketplaceHandler = new MarketplaceEventHandler()
const identityHandler = new IdentityEventHandler()

// Adding a mapping here makes the listener listen for the event
// and call the associated handler when the event is received.
const EVENT_TO_HANDLER_MAP = {
  V00_Marketplace: {
    ListingCreated: marketplaceHandler,
    ListingUpdated: marketplaceHandler,
    ListingWithdrawn: marketplaceHandler,
    ListingData: marketplaceHandler,
    ListingArbitrated: marketplaceHandler,
    OfferCreated: marketplaceHandler,
    OfferWithdrawn: marketplaceHandler,
    OfferAccepted: marketplaceHandler,
    OfferDisputed: marketplaceHandler,
    OfferRuling: marketplaceHandler,
    OfferFinalized: marketplaceHandler,
    OfferData: marketplaceHandler
  },
  IdentityEvents: {
    IdentityUpdated: identityHandler,
    // TODO(franck): handle IdentityDeleted
  }
}


/**
 *  Main entry point for processing events.
 *   - Logs the event in the DB.
 *   - Calls the event's handler.
 *   - Optionally calls webhooks.
 */
async function handleLog (log, rule, contractVersion, context) {
  log.decoded = context.web3.eth.abi.decodeLog(
    rule.eventAbi.inputs,
    log.data,
    log.topics.slice(1)
  )
  log.contractName = contractVersion.contractName
  log.eventName = rule.eventName
  log.contractVersionKey = contractVersion.versionKey
  log.networkId = context.networkId

  // Fetch block to retrieve timestamp.
  let block
  await withRetrys(async () => {
    block = await context.web3.eth.getBlock(log.blockNumber)
  })
  log.timestamp = block.timestamp
  log.date = new Date(log.timestamp * 1000)

  const logDetails = `blockNumber=${log.blockNumber} \
    transactionIndex=${log.transactionIndex} \
    eventName=${log.eventName} \
    contractName=${log.contractName}`
  logger.info(`Processing log: ${logDetails}`)

  // Record the event in the DB.
  if (context.config.db) {
    await withRetrys(async () => {
      return db.Event.upsert({
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        contractAddress: log.address,
        transactionHash: log.transactionHash,
        topic0: log.topics[0],
        topic1: log.topics[1],
        topic2: log.topics[2],
        topic3: log.topics[3],
        data: log,
        createdAt: log.date
      })
    })
  }

  // Call the event handler.
  //
  // Note: we run the handler with a retry since we've seen in production cases where we fail loading
  // from smart contracts the data pointed to by the event. This may occur due to load balancing
  // across ethereum nodes and if some nodes are lagging. For example the node we end up
  // connecting to for reading the data may lag compared to the node we received the event from.
  let result = null
  try {
    await withRetrys(async () => {
      result = await rule.handler.process(log, context)
    }, false)
  } catch (e) {
    logger.error(`Skipping indexing for ${logDetails} - ${e}`)
    return
  }

  const output = {
    log: log,
    related: result
  }

  // Call webhooks.
  const json = JSON.stringify(output, null, 2)
  logger.debug(`Handler result: ${json}`)

  if (rule.handler.webhookEnabled() && context.config.webhook) {
    logger.info(`Webhook to ${context.config.webhook}`)
    try {
      await withRetrys(async () => {
        return postToWebhook(context.config.webhook, json)
      }, false)
    } catch (e) {
      logger.error(`Skipping webhook for ${logDetails}`)
    }
  }

  if (rule.handler.discordWebhookEnabled() && context.config.discordWebhook) {
    logger.info(`Discord webhook to ${context.config.discordWebhook}`)
    try {
      await withRetrys(async () => {
        return postToDiscordWebhook(context.config.discordWebhook, output)
      }, false)
    } catch (e) {
      logger.error(`Skipping discord webhook for ${logDetails}`)
    }
  }
}

module.exports = { handleLog, EVENT_TO_HANDLER_MAP }
