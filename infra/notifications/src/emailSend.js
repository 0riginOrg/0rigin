// TODO: We need better way to refer to models in other packages.
const Identity = require('../../identity/src/models').Identity
const { getNotificationMessage } = require('./notification')
const fs = require('fs')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const logger = require('./logger')

if (!Identity) {
  throw 'Identity model not found.'
}
const sendgridMail = require('@sendgrid/mail')
sendgridMail.setApiKey(process.env.SENDGRID_API_KEY)
if (!process.env.SENDGRID_API_KEY) {
  logger.warn('Warning: SENDGRID_API_KEY env var is not set')
}
if (!process.env.SENDGRID_FROM_EMAIL) {
  logger.warn('Warning: SENDGRID_FROM_EMAIL env var is not set')
}

//
// Email notifications
//
async function emailSend(
  eventName,
  party,
  buyerAddress,
  sellerAddress,
  offer,
  listing,
  config
) {
  if (!eventName) throw 'eventName not defined'
  if (!party) throw 'party not defined'
  if (!buyerAddress) throw 'buyerAddress not defined'
  if (!sellerAddress) throw 'sellerAddress not defined'
  if (!offer) throw 'offer not defined'
  if (!listing) throw 'listing not defined'

  // Load email template
  const templateDir = `${__dirname}/../templates`

  // Standard template for HTML emails
  const emailTemplateHtml = _.template(
    fs.readFileSync(`${templateDir}/emailTemplate.html`).toString()
  )
  // Standard template for text emails
  const emailTemplateTxt = _.template(
    fs.readFileSync(`${templateDir}/emailTemplate.txt`).toString()
  )

  const emails = await Identity.findAll({
    where: {
      ethAddress: {
        [Op.or]: [buyerAddress, sellerAddress, party]
      }
    }
  })

  // Filter out redundants before iterating.
  await emails.forEach(async s => {
    try {
      const recipient = s.ethAddress
      const recipientRole = recipient === sellerAddress ? 'seller' : 'buyer'

      if (config.verbose) {
        logger.info(`Checking messages for ${s.ethAddress} as ${recipientRole}`)
      }

      const message = getNotificationMessage(
        eventName,
        party,
        recipient,
        recipientRole,
        'email'
      )

      if (!s.email && !config.overrideEmail) {
        if (config.verbose) {
          logger.info(`${s.ethAddress} has no email address. Skipping.`)
        }
      } else if (!message) {
        if (config.verbose) {
          logger.info(`No message found`)
        }
      } else {
        const vars = {
          dappUrl:
            listing.id[0] === '4'
              ? 'https://dapp.staging.originprotocol.com'
              : 'https://dapp.originprotocol.com',
          ipfsGatewayUrl:
            listing.id[0] === '4'
              ? 'https://gateway.staging.originprotocol.com'
              : 'https://gateway.originprotocol.com'
        }
        const email = {
          to: config.overrideEmail || s.email,
          from: config.fromEmail,
          subject: message.subject,
          text: emailTemplateTxt({
            message: message.text({
              listing: listing,
              offer: offer,
              config: config,
              ...vars
            })
          }),
          html: emailTemplateHtml({
            message: message.html({
              listing: listing,
              offer: offer,
              config: config,
              ...vars
            })
          }),
          asm: {
            groupId: config.asmGroupId
          }
        }

        if (config.verbose) {
          logger.log('email:')
          logger.log(email)
        }

        if (config.emailFileOut) {
          // Optional writing of email contents to files
          const now = new Date()
          fs.writeFile(
            `${config.emailFileOut}_${now.getTime()}_${email.to}.html`,
            email.html,
            error => {
              logger.error(error)
            }
          )
          fs.writeFile(
            `${config.emailFileOut}_${now.getTime()}_${email.to}.txt`,
            email.text,
            error => {
              logger.error(error)
            }
          )
        }

        try {
          await sendgridMail.send(email)
          logger.log(
            `Email sent to ${buyerAddress} at ${email.to} ${
              config.overrideEmail ? ' instead of ' + s.email : ''
            }`
          )
        } catch (error) {
          logger.error(`Could not email via Sendgrid: ${error}`)
        }
      }
    } catch (error) {
      logger.error(`Could not email via Sendgrid: ${error}`)
    }
  })
}

module.exports = { emailSend }
