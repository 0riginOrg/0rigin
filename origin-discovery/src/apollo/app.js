/*
 * Implementation of the Origin GraphQL server.
 * Uses the Apollo framework: https://www.apollographql.com/server
 */

require('dotenv').config()
try {
  require('envkey')
} catch (error) {
  console.log('EnvKey not configured')
}

const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const promBundle = require('express-prom-bundle')

const resolvers = require('./resolvers.js')
const typeDefs = require('./schema.js')

const app = express()
const bundle = promBundle({
  promClient: {
    collectDefaultMetrics: {
      timeout: 1000
    }
  }
})
app.use(bundle)

// Start ApolloServer by passing type definitions and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers })

server.applyMiddleware({ app })

const port = process.env.PORT || 4000

app.listen({ port: port }, () =>
  console.log(`Apollo server ready at http://localhost:${port}${server.graphqlPath}`)
)
