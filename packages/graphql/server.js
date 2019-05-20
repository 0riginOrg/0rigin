import dotenv from 'dotenv'
dotenv.config()

// No conditional imports available yet
try {
  require('envkey')
} catch (error) {
  console.warn('EnvKey not configured')
}

import server from './src/server'

server
  .listen({
    port: (() => {
      const v = parseInt(process.env.GRAPHQL_SERVER_PORT)
      if (v && Number.isInteger(v)) {
        return v
      }
      if (Number.isNaN(v)) {
        console.warn('GRAPHQL_SERVER_PORT is NaN.  Using default')
      }
      return 4002
    })()
  })
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
  })
