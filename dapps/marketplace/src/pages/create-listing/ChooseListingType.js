import React, { useState } from 'react'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import Redirect from 'components/Redirect'
import withCreatorConfig from 'hoc/withCreatorConfig'

import ChooseCategory from './_ChooseCategory'

const ChooseListingType = props => {
  const isForceType = get(props, 'creatorConfig.forceType', false)
  const [valid] = useState(false)

  if (valid || isForceType) {
    return <Redirect to={props.next} push />
  }

  const isEdit = props.listing.id ? true : false
  return (
    <>
      <h1 className="d-none d-md-block">
        {isEdit ? (
          <fbt desc="chooselistingtype.letsupdate">
            Let’s update your listing
          </fbt>
        ) : (
          <fbt desc="chooseListingType.createListing">Create a Listing</fbt>
        )}
      </h1>
      <div className="step-description">
        {isEdit
          ? fbt(`Update listing type`, `CreateListing.updateListingType`)
          : fbt(
              `What type of listing do you want to create?`,
              `CreateListing.typeOfListing`
            )}
      </div>

      <div className="row">
        <div className="col-md-8">
          <ChooseCategory />
        </div>
        <div className="col-md-4">
          <div className="gray-box" />
        </div>
      </div>
    </>
  )
}

export default withCreatorConfig(ChooseListingType)

require('react-styl')(`
  .create-listing
    h1
      font-size: 40px
      margin-bottom: 0.5rem
    .choose-category
      border: 1px solid var(--light)
      padding: 1.5rem
      align-items: center
      display: flex
      flex-direction: column
      border-radius: 5px
      max-width: 600px
      .category
        display: flex
        width: 100%
        color: #000000
        &:not(:last-of-type)
          border-bottom: 1px solid var(--light)
        &:hover
          opacity: 0.75
        font-size: 24px
        font-weight: bold
        align-items: center
        line-height: 1
        padding: 1.5rem 0
        max-width: 25rem
        &::before
          content: ""
          width: 3.5rem
          height: 3.5rem
          margin-right: 1rem
          border-radius: 50%
          background-color: var(--light)
          background-repeat: no-repeat
          background-size: 60%
          background-position: center
        &.forSale::before
          background-color: #7a26f3
          background-image: url(images/listing-types/sale-icon.svg)
          background-position: 62% 60%
        &.forRent::before
          background-color: #00d693
          background-image: url(images/listing-types/rent-icon.svg)
        &.services::before
          background-color: #fec100
          background-image: url(images/listing-types/services-icon.svg)
          background-size: 66%
          background-position: 50% 40%
        &.announcements::before
          background-color: #007fff

  @media (max-width: 767.98px)
    .create-listing
      .step-description
        font-size: 16px
      .choose-category
        border: unset
        padding: unset
        .category
          font-size: 18px
          padding: 1.25rem 0
          &::before
            width: 2.25rem
            height: 2.25rem
            margin-right: 0.75rem

`)
