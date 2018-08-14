import moment from 'moment'
import uuid from 'uuid/v1'

export function generateCalendarSlots(events) {

  const eventsClone = JSON.parse(JSON.stringify(events))

  for (let i = 0, eventsLen = eventsClone.length; i < eventsLen; i++) {
    const event = eventsClone[i]
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    let eventDate = moment(event.startDate)
    const slots = []

    // convert start and end date strings in to date objects
    event.startDate = startDate
    event.endDate = endDate

    while (eventDate.toDate() >= startDate && eventDate.toDate() <= endDate) {
        slots.push(eventDate.toDate())
        eventDate = eventDate.add(1, 'days')
    }

    event.slots = slots
  }

  return eventsClone
}

export function checkSlotsForExistingEvent(slotInfo, events) {
  return events.filter((event) => {
    let isEventInSlot = false

    // loop over event's slots and check to see if any of them
    // match any of the selected slot's time periods
    for (let i = 0, existSlotsLen = event.slots.length; i < existSlotsLen; i++) {
      const existSlot = event.slots[i]

      // loop over the time periods included in selected slot
      for (let j = 0, newSlotsLen = slotInfo.slots.length; j < newSlotsLen; j++) {
        const newSlot = slotInfo.slots[j]

        if (existSlot.toString() === newSlot.toString()) {
          isEventInSlot = true
        }
      }
    }

    return isEventInSlot
  })
}

// Returns true if all passed-in events are recurring events and false if not
export function doAllEventsRecur(events) {
  const recurringEvents = events.filter((event) => event.isRecurringEvent )
  return recurringEvents.length === events.length
}

// This is a hackky way of showing the price in hourly time slots
// since React Big Calendar doesn't give us full control over the content of those slots
// Possible future optimization would be to create a PR to React Big Calendar to support custom slot content.
export function renderHourlyPrices(viewType, userType) {
  if (viewType &&
      viewType === 'hourly' &&
      userType &&
      userType === 'buyer') {
    const slots = document.querySelectorAll('.rbc-time-slot')

    for (let i = 0, slotsLen = slots.length; i < slotsLen; i++) {
      const slot = slots[i]
      const classes = slot.className
      const isAvailable = classes.indexOf('unavailable') === -1
      const priceIdx = classes.indexOf('priceEth-')

      slot.innerHTML = ''

      if (priceIdx > -1 && isAvailable) {
        const price = classes.substring(priceIdx + 9, classes.length)
        const priceNode = document.createTextNode(`${price} ETH`)
        slot.appendChild(priceNode)
      }
    }
  }
}

// Moves user's event edits from a cloned recurring event to the original event
// in preparation to save the original event
export function updateOriginalEvent(selectedEvent, events) {
  return events.map((eventObj) => {
    if (eventObj.id === selectedEvent.originalEventId) {
      const { start, end, isAvailable, price, isRecurringEvent } = selectedEvent
      Object.assign(eventObj, {
        start,
        end,
        isAvailable,
        price,
        isRecurringEvent
      })
    }
    return eventObj
  })
}

// Re-calculates slots after the date is changed via the dropdown menus
export function getSlotsForDateChange(selectedEvent, whichDropdown, value, viewType) {
  const startDate = whichDropdown === 'start' ? new Date(value) : new Date(selectedEvent.start)
  const endDate = whichDropdown === 'end' ? new Date(value) : new Date(selectedEvent.end)
  const slots = []
  let slotDate = moment(value)

  while (slotDate.toDate() >= startDate && slotDate.toDate() <= endDate) {
    const timePeriod = viewType === 'daily' ? 'day' : 'hour'
    const slotDateObj = timePeriod ? slotDate.startOf(timePeriod).toDate() : slotDate.toDate()

    if (whichDropdown === 'start') {
      slots.push(slotDateObj)
      slotDate = slotDate.add(1, timePeriod)
    } else {
      slots.unshift(slotDateObj)
      slotDate = slotDate.subtract(1, timePeriod)
    }
  }

  return slots
}

export function getDateDropdownOptions(date, viewType) {
  const timeToAdd = viewType === 'daily' ? 'days' : 'hours'

  return [
    ...[...Array(10)].map((_, i) => moment(date).subtract(i + 1, timeToAdd).toDate()).reverse(),
    moment(date).toDate(),
    ...[...Array(10)].map((_, i) => moment(date).add(i + 1, timeToAdd).toDate())
  ]
}

export function getRecurringEvents(date, existingEvents, viewType) {

  const dateMoment = moment(date)
  const isDaily = viewType === 'daily'
  const firstVisibleDate = isDaily ?
                            moment(dateMoment.startOf('month')).subtract(1, 'week') :
                            moment(dateMoment.startOf('week'))
  const lastVisibleDate = isDaily ?
                            moment(dateMoment.endOf('month')).add(1, 'week') :
                            moment(dateMoment.endOf('week'))
  const events = []

  const getSlots = (startDate, endDate) => {
    const slots = []
    let slotDate = moment(startDate)

    while (slotDate.toDate() >= startDate && slotDate.toDate() <= endDate) {
      const timePeriod = viewType === 'daily' ? 'day' : 'hour'
      const slotDateObj = timePeriod ? slotDate.startOf(timePeriod).toDate() : slotDate.toDate()

      slots.push(slotDateObj)
      slotDate = slotDate.add(1, timePeriod)
    }

    // remove the last slot to prevent blocking the slot after the event
    if (!isDaily) {
      slots.pop()
    }

    return slots
  }

  // render recurring events on the currently visible day they recur on
  existingEvents && existingEvents.map((event) => {
    if (event.isRecurringEvent) {
      if (!event.isClonedRecurringEvent) {
        const slotToTest = moment(firstVisibleDate)

        // put the original event in the output "events" array
        const originalEventStartDate = event.start
        events.push(event)

        while (slotToTest.isBefore(lastVisibleDate)) {
          const slotDayOfWeekIdx = slotToTest.day()
          const eventDayOfWeekIdx = moment(event.start).day()

          if (slotDayOfWeekIdx === eventDayOfWeekIdx) {
            const clonedEvent = JSON.parse(JSON.stringify(event))
            const diffBtwStartAndEnd = moment(clonedEvent.end).diff(moment(clonedEvent.start), 'days')
            const clonedEndMoment = moment(clonedEvent.end)
            const setterConfig = {
              date: slotToTest.date(),
              month: slotToTest.month(),
              year: slotToTest.year()
            }
            clonedEvent.originalEventId = event.id
            clonedEvent.id = uuid()
            clonedEvent.isClonedRecurringEvent = true
            clonedEvent.start = moment(clonedEvent.start).set(setterConfig).toDate()
            clonedEvent.end = moment(clonedEvent.start)
                                .add(diffBtwStartAndEnd, 'days')
                                .set({
                                  hour: clonedEndMoment.hour(),
                                  minute: clonedEndMoment.minute(),
                                  second: clonedEndMoment.second()
                                })
                                .toDate()
            clonedEvent.slots = getSlots(clonedEvent.start, clonedEvent.end)

            // put the cloned "recurring" instances of the event in the output "events" array
            if (clonedEvent.start.toString() !== originalEventStartDate.toString())
              events.push(clonedEvent)
          }

          slotToTest.add(1, 'day')
        }
      }
    } else if (!event.isClonedRecurringEvent) {
      // put the non-recurring events in the output "events" array
      events.push(event)
    }
  })

  return events
}

// When buyer is ready to reserve slots, prepares data to be saved to IPFS
export function getSlotsToReserve(buyerSelectedSlotData) {
  return buyerSelectedSlotData &&
         buyerSelectedSlotData.map((slot) => {
    const toReturn = {
      startDate: slot.start,
      endDate: slot.end,
      priceWei: slot.price,
    }

    if (slot.isRecurringEvent) {
      toReturn.recurs = 'weekly'
    }

    return toReturn
  })
}

// Removes cloned events and prepares data for saving to IPFS
export function getCleanEvents(events) {
  return events.length && events
          .filter((event) => 
            !event.isClonedRecurringEvent
          )
          .map((event) => {

            const toReturn = {
              startDate: event.start.toISOString(),
              endDate: event.end.toISOString(),
              isAvailable: event.isAvailable,
              priceWei: event.price
            }

            if (event.isRecurringEvent) {
              toReturn.recurs = 'weekly'
            }
            return toReturn
          })
}

export function getDateAvailabilityAndPrice(date, events, purchases) {
  const isDateBooked = function(date) {
    let bookingsMatchingDate = []
    purchases && purchases.map((purchase) => {
      const bookingsForThisPurchase = purchase.ipfsData.filter(slot => 
        moment(date).isBetween(moment(slot.startDate).subtract(1, 'second'), moment(slot.endDate).add(1, 'second'))
      )
      bookingsMatchingDate = [...bookingsMatchingDate, ...bookingsForThisPurchase]
    })

    return !!bookingsMatchingDate.length
  }

  const eventsInSlot = []
  let toReturn = {
    isAvailable: false,
    price: 0
  }

  if (events && events.length) {
    for (let i = 0, len = events.length; i < len; i++) {
      const event = events[i]
      if (  
            moment(date).isBetween(moment(event.start).subtract(1, 'second'), moment(event.end).add(1, 'second')) &&
            !moment(date).isBefore(moment())
          ) {

        event.isAvailable = event.isAvailable ? !isDateBooked(date) : false
        eventsInSlot.push(event)
      }
    }
  }

  if (eventsInSlot.length) {
    const nonRecurringEvents = eventsInSlot.filter((event) => !event.isRecurringEvent)

    if (nonRecurringEvents.length) {
      toReturn = nonRecurringEvents[0]
    } else {
      toReturn = eventsInSlot[0]
    }
  }

  return toReturn
}
