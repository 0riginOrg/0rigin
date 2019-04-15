const Identity = require('./models').Identity
const { getNotificationMessage } = require('./notification')
const fs = require('fs')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')

const sendgridMail = require('@sendgrid/mail')
sendgridMail.setApiKey(process.env.SENDGRID_API_KEY)
if (!process.env.SENDGRID_API_KEY) {
  console.warn('Warning: SENDGRID_API_KEY env var is not set')
}
if (!process.env.SENDGRID_FROM_EMAIL) {
  console.warn('Warning: SENDGRID_FROM_EMAIL env var is not set')
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
      console.log('Checking messages for:')
      console.log(s.ethAddress)

      const recipient = s.ethAddress
      const recipientRole = recipient === sellerAddress ? 'seller' : 'buyer'

      const message = getNotificationMessage(
        eventName,
        party,
        recipient,
        recipientRole,
        'email'
      )

      if (!message) {
        console.warn('No message found.')
      } else {
        const email = {
          to: config.overrideEmail || s.email,
          from: config.fromEmail,
          subject: message.subject,
          text: emailTemplateTxt({
            message: message.text({ listing: listing, offer: offer })
          }),
          html: emailTemplateHtml({
            message: message.html({ listing: listing, offer: offer })
          }),
          asm: {
            groupId: config.asmGroupId
          }
        }

        if (config.emailFileOut) {
          // Optional writing of email contents to files
          const now = new Date()
          fs.writeFile(
            `${config.emailFileOut}_${now.getTime()}_${email.to}.html`,
            email.html,
            error => {
              console.error(error)
            }
          )
          fs.writeFile(
            `${config.emailFileOut}_${now.getTime()}_${email.to}.txt`,
            email.text,
            error => {
              console.error(error)
            }
          )
        }

        try {
          await sendgridMail.send(email)
          console.log(`Email sent to ${buyerAddress} at ${email.to}`)
        } catch (error) {
          console.error(`Could not email via Sendgrid: ${error}`)
        }
      }
    } catch (error) {
      console.error(`Could not email via Sendgrid: ${error}`)
    }
  })
}

module.exports = { emailSend }
