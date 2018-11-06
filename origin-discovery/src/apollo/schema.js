const { gql } = require('apollo-server-express')

const typeDefs = gql`
  scalar JSON

  ######################
  #
  # Query output schema.
  #
  ######################
  # When querying a set of items, the output is a page.
  interface OutputPage {
    offset: Int!
    numberOfItems: Int!
    totalNumberOfItems: Int!
  }
  type Price {
    currency: String!
    amount: String!
  }
  type User {
    walletAddress: ID!   # Ethereum wallet address
    identityAddress: ID  # ERC 725 identity address.
    firstName: String
    lastName: String
    description: String
    # listings(page: Page, order: ListingOrder, filter: ListingFilter): ListingPage
    offers: OfferConnection
    # reviews(page: Page, order: ReviewOrder, filter: ReviewFilter): ReviewPage
  }
  type Offer {
    id: ID!
    ipfsHash: ID!
    buyer: User!
    seller: User!
    status: String!
    affiliate: ID,
    price: Price! 
    listing: Listing!
  }
  enum DisplayType {
    normal
    featured
    hidden
  }
   type OfferConnection {
    nodes: [Offer]!
  }
  # type Review {
  #   ipfsHash: ID!
  #   reviewer: User!
  #   text: String!
  #   rating: Int!
  # }
  # type ReviewPage implements OutputPage {
  #  offset: Int!
  #  numberOfItems: Int!
  #  totalNumberOfItems: Int!
  # reviews: [Review]
  #}
  # TODO: Add a status indicating if Listing is sold out.
  type Listing {
    id: ID!
    ipfsHash: ID!
    data: JSON!
    seller: User!
    title: String!
    description: String
    category: String!
    subCategory: String!
    price: Price!
    offers: OfferConnection
    displayType: DisplayType!
    # reviews(page: Page, order: ReviewOrder, filter: ReviewFilter): ReviewPage
  }
  type Stats {
    maxPrice: Float
    minPrice: Float
  }
   type ListingPage implements OutputPage {
    offset: Int!
    numberOfItems: Int!
    totalNumberOfItems: Int!
    nodes: [Listing]
    stats: Stats
  }
  ######################
  #
  # Query input schema.
  #
  # Note: Some input types have a "in" prefix because GraphQL does not allow to
  # use thw same name for both an input and output type.
  #
  ######################
  enum OrderDirection {
    ASC   # Default if no direction specified.
    DESC
  }
   input Page {
    offset: Int!  # Page number.
    numberOfItems: Int! # Number of items per page.
  }
   input inPrice {
    currency: String!
    amount: String!
  }
  #
  # ORDER
  #
  enum OfferOrderField {
    CREATION_DATE
    STATUS
  }
   enum ReviewOrderField {
    CREATION_DATE
    RATING
  }
   enum ListingOrderField {
    RELEVANCE  # Default if no order field specified in the query.
    PRICE
    CREATION_DATE
    SELLER_RATING
  }
   input OfferOrder {
    field: OfferOrderField!
    order: OrderDirection
  }
   input ReviewOrder {
    field: ReviewOrderField!
    order: OrderDirection
  }
   input ListingOrder {
    field: ListingOrderField!
    order: OrderDirection
  }
  #
  # FILTERS
  #
  input OfferFilter {
    status: String
  }
   input ReviewFilter {
    rating: Int
  }
  enum ValueType {
    STRING
    FLOAT
    DATE
    ARRAY_STRING
  }
  enum FilterOperator {
    EQUALS
    CONTAINS #for array values where at least one must match E.g. list of categories 
    GREATER
    GREATER_OR_EQUAL
    LESSER
    LESSER_OR_EQUAL
  }
  # A generic listing filter
  input ListingFilter {
    name: String!
    value: String!
    valueType: ValueType!
    operator: FilterOperator!
  }
  # The "Query" type is the root of all GraphQL queries.
  type Query {
    listings(searchQuery: String, filters: [ListingFilter!], page: Page!): ListingPage,
    listing(id: ID!): Listing,
    offers(buyerAddress: ID, listingId: ID): OfferConnection,
    offer(id: ID!): Offer,
    
    user(walletAddress: ID!): User
  }
`

module.exports = typeDefs
