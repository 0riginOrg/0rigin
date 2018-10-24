const topicMapping = {
  3: 'facebook',
  4: 'twitter',
  5: 'airbnb',
  10: 'phone',
  11: 'email'
}

export default class Attestation {
  constructor({ topic, data, signature, ipfsHash, isLegacyAttestation }) {
    topic = Number(topic)
    this.topic = topic
    this.service = topicMapping[topic]
    this.data = data
    this.signature = signature
    this.isLegacyAttestation = isLegacyAttestation
    if (ipfsHash !== undefined)
      this.ipfsHash = ipfsHash
  }
}
