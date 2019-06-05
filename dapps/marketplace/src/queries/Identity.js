import gql from 'graphql-tag'

export default gql`
  query Identity($id: ID!) {
    web3 {
      account(id: $id) {
        id
        owner {
          id
        }
        identity {
          id
          firstName
          lastName
          fullName
          description
          avatarUrl
          avatarUrlExpanded
          strength
          attestations

          facebookVerified
          googleVerified
          twitterVerified
          airbnbVerified
          phoneVerified
          emailVerified
          websiteVerified
          kakaoVerified
          githubVerified
          linkedinVerified
        }
      }
    }
  }
`
