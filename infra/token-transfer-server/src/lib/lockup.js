const moment = require('moment')
const get = require('lodash.get')
const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize')

const { discordWebhookUrl } = require('../config')
const { sendEmail } = require('../lib/email')
const { postToWebhook } = require('./webhook')
const { LOCKUP_CONFIRMED, LOCKUP_REQUEST } = require('../constants/events')
const { Event, Lockup, sequelize } = require('../models')
const { lockupBonusRate, lockupDuration } = require('../config')
const { hasBalance } = require('./balance')
const { lockupConfirmationTimeout, lockupHasExpired } = require('../shared')
const logger = require('../logger')

const { encryptionSecret, clientUrl } = require('../config')

/**
 * Adds a lockup
 * @param userId - user id of the user adding the lockup
 * @param amount - the amount to be locked
 * @returns {Promise<Lockup>} Lockup object.
 */
async function addLockup(userId, amount, data = {}) {
  const user = await hasBalance(userId, amount)

  const unconfirmedLockups = await Lockup.findAll({
    where: {
      userId: user.id,
      confirmed: null, // Unconfirmed
      created_at: {
        [Sequelize.Op.gte]: moment
          .utc()
          .subtract(lockupConfirmationTimeout, 'minutes')
      }
    }
  })

  if (unconfirmedLockups.length > 0) {
    throw new ReferenceError(
      'Unconfirmed lockups exist, please confirm or wait until expiry'
    )
  }

  let lockup
  const txn = await sequelize.transaction()
  try {
    lockup = await Lockup.create({
      userId: user.id,
      start: moment.utc(),
      end: moment.utc().add(lockupDuration, 'months'),
      bonusRate: lockupBonusRate,
      amount,
      data
    })
    await Event.create({
      userId: user.id,
      action: LOCKUP_REQUEST,
      data: JSON.stringify({
        lockupId: lockup.id
      })
    })
    await txn.commit()
  } catch (e) {
    await txn.rollback()
    logger.error(`Failed to add lockup for user ${userId}: ${e}`)
    throw e
  }

  await sendLockupConfirmationEmail(lockup, user)

  return lockup
}

/**
 * Sends an email with a token that can be used for confirming a lockup.
 * @param lockup
 * @param user
 */
async function sendLockupConfirmationEmail(lockup, user) {
  const token = jwt.sign(
    {
      lockupId: lockup.id
    },
    encryptionSecret,
    { expiresIn: `${lockupConfirmationTimeout}m` }
  )

  const vars = {
    url: `${clientUrl}/lockup/${lockup.id}/${token}`,
    employee: user.employee
  }

  await sendEmail(user.email, 'lockup', vars)

  logger.info(
    `Sent email lockup confirmation token to ${user.email} for lockup ${lockup.id}`
  )
}

/* Moves a lockup from waiting for email confirmation to confirmed.
 * Throws an exception if the request is invalid.
 * @param lockup
 * @param user
 */
async function confirmLockup(lockup, user) {
  if (lockup.confirmed) {
    throw new Error('Lockup is already confirmed')
  }

  if (lockupHasExpired(lockup)) {
    throw new Error('Lockup was not confirmed in the required time')
  }

  const txn = await sequelize.transaction()
  try {
    await lockup.update({
      confirmed: true
    })
    const event = {
      userId: user.id,
      action: LOCKUP_CONFIRMED,
      data: JSON.stringify({
        lockupId: lockup.id
      })
    }
    await Event.create(event)
    await txn.commit()
  } catch (e) {
    await txn.rollback()
    logger.error(
      `Failed writing confirmation data for lockup ${lockup.id}: ${e}`
    )
    throw e
  }

  try {
    if (discordWebhookUrl) {
      const countryDisplay = get(lockup.data.location, 'countryName', 'Unknown')
      const webhookData = {
        embeds: [
          {
            title: `A lockup of \`${lockup.amount}\` OGN was created by \`${user.email}\``,
            description: [
              `**ID:** \`${lockup.id}\``,
              `**Country:** ${countryDisplay}`
            ].join('\n')
          }
        ]
      }
      await postToWebhook(discordWebhookUrl, JSON.stringify(webhookData))
    }
  } catch (e) {
    logger.error(
      `Failed sending Discord webhook for token lockup confirmation:`,
      e
    )
  }

  return true
}

module.exports = {
  addLockup,
  confirmLockup
}
