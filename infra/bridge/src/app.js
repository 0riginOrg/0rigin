'use strict'

const express = require('express')
const app = express()
const cors = require('cors')
const session = require('express-session')
const bodyParser = require('body-parser')

const { pollExchangeRate } = require('./utils/exchange-rate')
const { populateValidContents } = require('./utils/webhook-helpers')

const { startPollingFallback } = require('./hooks/telegram')

const db = require('./models')
// Initalize sequelize with session store
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const sessionStore = new SequelizeStore({
  db: db.sequelize
})

const sess = {
  store: sessionStore,
  name: process.env.COOKIE_NAME || 'origin-bridge',
  secret: process.env.SESSION_SECRET || 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000
  }
}

// Ensures that the session table is created/synced so no separate migration is
// needed
sessionStore.sync()

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.path === '/hooks/twitter' && req.method === 'POST') {
        // We need the raw payload to verify the signature
        req.rawBody = buf.toString()
      }
    }
  })
)
app.use(cors({ origin: true, credentials: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(require('./controllers'))

// Catch all
app.all('*', function(req, res) {
  res.status(404)
    .send({
      errors: ['The page you are looking for does not exist']
    })
})

app.listen(5000, () => {
  console.log('Origin-bridge listening on port 5000...')

  pollExchangeRate()

  populateValidContents()

  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.TELEGRAM_DISABLE_WEBHOOKS === 'true'
  ) {
    // Start polling on restart, if telegram webhooks are disabled
    startPollingFallback()
  }
})

module.exports = app
