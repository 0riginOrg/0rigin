const regex = /^(\d+)-(\d+)-(\d+)-(\d+)$/

/* Matches when we are not looking at current listing state, rather a snapshot in the past.
 * This can happen when for example user clicks on a listing from a Purchase detail view
 */
export function isHistoricalListing(listing) {
  return regex.test(listing.id)
}

export function currentListingIdFromHistoricalId(listing) {
  const historicalListingMatch = listing.id.match(regex)

  if (historicalListingMatch) {
    return `${historicalListingMatch[1]}-${historicalListingMatch[2]}-${historicalListingMatch[3]}`
  }
  return null
}
export function historicalListingIsCurrent(listing) {
  if (!isHistoricalListing(listing)) {
    return true
  }

  const historicalListingMatch = listing.id.match(regex)
  const blockNumber = parseInt(historicalListingMatch[4])
  const maxBlockNumber = Math.max(
    ...listing.events.map(event => event.blockNumber)
  )

  return blockNumber === maxBlockNumber
}
