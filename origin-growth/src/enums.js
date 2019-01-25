class Enum extends Array {
  constructor(...args) {
    super(...args)

    for(const k of args) {
      this[k] = k
    }
  }

}

const GrowthEventTypes = new Enum(
  'ProfilePublished',
  'EmailAttestation',
  'FacebookAttestation',
  'AirbnbAttestation',
  'TwitterAttestation',
  'PhoneAttestation',
  'ListingCreated',
  'ListingPurchased'
)

const GrowthRewardStatuses = new Enum(
  'Pending',
  'Fraud,',
  'Blocked',
  'Paid'
)

const GrowthInviteContactTypes = new Enum(
  'Email',
  'Phone'
)

const GrowthInviteStatuses = new Enum(
  'Pending',
  'Accepted'
)

module.exports = {
  GrowthEventTypes,
  GrowthRewardStatuses,
  GrowthInviteContactTypes,
  GrowthInviteStatuses
}