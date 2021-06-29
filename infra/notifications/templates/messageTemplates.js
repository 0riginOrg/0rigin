const template = require('lodash/template')
const fs = require('fs')
const templateDir = `${__dirname}/../templates`

// We use lodash templates.
// Docs: https://lodash.com/docs/4.17.11#template
// Codepen: https://codepen.io/matthewbeta/pen/ZGaYXW

const messageTemplates = {
  message: {
    mobile: {
      messageReceived: {
        title: template(
          'New message\
          <% if (senderName) { %> \
            from <%- senderName %>\
          <% } else { %>\
            on Origin\
          <% } %>'
        ),
        body: template(
          'You have received a message on Origin\
          <% if (senderName) { %> \
            from <%- senderName %>\
          <% } %>.'
        )
      }
    },
    email: {
      messageReceived: {
        subject: template(
          'New message\
          <% if (senderName) { %> \
            from <%- senderName %>\
          <% } else { %>\
            on Origin\
          <% } %>'
        ),
        mjml: template(
          fs.readFileSync(`${templateDir}/MessageReceived.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/MessageReceived.txt`).toString()
        )
      }
    }
  },
  seller: {
    mobile: {
      OfferCreated: {
        title: template('New Offer for <%= listing.title %>'),
        body: template(
          'A buyer has made an offer on your listing <%= listing.title %>'
        )
      },
      OfferWithdrawn: {
        title: template('Offer Withdrawn for <%= listing.title %>'),
        body: template(
          'An offer on your listing <%= listing.title %> has been withdrawn.'
        )
      },
      OfferDisputed: {
        title: template('Dispute Initiated for <%= listing.title %>'),
        body: template(
          'A problem has been reported with your transaction for <%= listing.title %>.'
        )
      },
      OfferRuling: {
        title: template('Dispute Resolved for <%= listing.title %>'),
        body: template(
          'A ruling has been issued on your disputed transaction for <%= listing.title %>.'
        )
      },
      OfferFinalized: {
        title: template('Sale Completed for <%= listing.title %>'),
        body: template(
          'Your transaction for <%= listing.title %> has been completed.'
        )
      },
      OfferData: {
        title: template('New Review for <%= listing.title %>'),
        body: template(
          'A review has been left on your transaction for <%= listing.title %>.'
        )
      }
    },
    email: {
      OfferCreated: {
        subject: template('New Offer for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/seller-OfferCreated.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/seller-OfferCreated.txt`).toString()
        )
      },
      OfferWithdrawn: {
        subject: template('Offer Withdrawn for <%= listing.title %>'),
        mjml: template(
          fs
            .readFileSync(`${templateDir}/seller-OfferWithdrawn.mjml`)
            .toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/seller-OfferWithdrawn.txt`).toString()
        )
      },
      OfferDisputed: {
        subject: template('Dispute Initiated for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/seller-OfferDisputed.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/seller-OfferDisputed.txt`).toString()
        )
      },
      OfferRuling: {
        subject: template('Dispute Resolved for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/seller-OfferRuling.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/seller-OfferRuling.txt`).toString()
        )
      },
      OfferFinalized: {
        subject: template('Sale Completed for <%= listing.title %>'),
        mjml: template(
          fs
            .readFileSync(`${templateDir}/seller-OfferFinalized.mjml`)
            .toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/seller-OfferFinalized.txt`).toString()
        )
      },
      OfferData: {
        subject: template('New Review for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/buyer-OfferReview.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/buyer-OfferReview.txt`).toString()
        )
      }
    }
  },
  buyer: {
    mobile: {
      OfferWithdrawn: {
        title: template('Offer Rejected for <%= listing.title %>'),
        body: template(
          'An offer you made for <%= listing.title %> has been rejected.'
        )
      },
      OfferAccepted: {
        title: template('Offer Accepted for <%= listing.title %>'),
        body: template(
          'An offer you made for <%= listing.title %> has been accepted.'
        )
      },
      OfferDisputed: {
        title: template('Dispute Initiated for <%= listing.title %>'),
        body: template(
          'A problem has been reported with your transaction for <%= listing.title %>.'
        )
      },
      OfferRuling: {
        title: template('Dispute Resolved for <%= listing.title %>'),
        body: template(
          'A ruling has been issued on your disputed transaction for <%= listing.title %>.'
        )
      }
    },
    email: {
      OfferWithdrawn: {
        subject: template('Offer Rejected for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/buyer-OfferWithdrawn.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/buyer-OfferWithdrawn.txt`).toString()
        )
      },
      OfferAccepted: {
        subject: template('Offer Accepted for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/buyer-OfferAccepted.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/buyer-OfferAccepted.txt`).toString()
        )
      },
      OfferDisputed: {
        subject: template('Dispute Initiated for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/buyer-OfferDisputed.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/buyer-OfferDisputed.txt`).toString()
        )
      },
      OfferRuling: {
        subject: template('Dispute Resolved for <%= listing.title %>'),
        mjml: template(
          fs.readFileSync(`${templateDir}/buyer-OfferRuling.mjml`).toString()
        ),
        text: template(
          fs.readFileSync(`${templateDir}/buyer-OfferRuling.txt`).toString()
        )
      }
    }
  }
}

module.exports = { messageTemplates }
