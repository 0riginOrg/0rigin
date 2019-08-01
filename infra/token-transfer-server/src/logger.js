'use strict'

const Logger = require('logplease')

Logger.setLogLevel(process.env.LOG_LEVEL || 'DEBUG')

module.exports = Logger.create('t3', { showTimestamp: false })
