import get from 'lodash/get'
import AvailabilityCalculator from '@origin/graphql/src/utils/AvailabilityCalculator'
import AvailabilityCalculatorHourly from '@origin/graphql/src/utils/AvailabilityCalculatorHourly'

import useListingType from 'pages/listing/listing-types/useListingType'

export default function getAvailabilityCalculator(listing) {
  if (!listing) {
    console.error(`[getAvailabilityCalculator] listing param is required`)
    return null
  }

  const { isFractional, isFractionalHourly } = useListingType(listing)

  if (isFractional) {
    return new AvailabilityCalculator({
      weekdayPrice: get(listing, 'price.amount'),
      weekendPrice: get(listing, 'weekendPrice.amount'),
      booked: get(listing, 'booked'),
      unavailable: get(listing, 'unavailable'),
      customPricing: get(listing, 'customPricing')
    })
  } else if (isFractionalHourly) {
    return new AvailabilityCalculatorHourly({
      booked: get(listing, 'booked'),
      unavailable: get(listing, 'unavailable'),
      customPricing: get(listing, 'customPricing'),
      timeZone: get(listing, 'timeZone'),
      workingHours: get(listing, 'workingHours'),
      price: get(listing, 'price.amount')
    })
  }

  return null
}
