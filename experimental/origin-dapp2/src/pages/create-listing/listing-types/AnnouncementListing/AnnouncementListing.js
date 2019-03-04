import React, { Component } from 'react'

import Redirect from 'components/Redirect'

import Details from './Details'
import Review from './Review'

class AnnouncementListing extends Component {

  constructor(props) {
    super(props)
    this.state = {
      step: this.props.step ? parseInt(this.props.step) : 1
    }
    if (this.props.onChange) {
      this.props.onChange({
        // No AnnouncementListing specific fields
        ...this.props.listing
      })
    }
  }

  render() {
    const steps=1
    switch (this.state.step) {
      case 0:
        return (
          <Redirect to={`/create`} />
        )
      case 1:
        return (
          <Details
            listing={ this.props.listing }
            steps = { steps }
            step = { 1 }
            onPrev={ () => this.setState({step: 0}) }
            onNext={ () => this.setState({step: 2}) }
            onChange={ listing => this.props.onChange(listing) }
          />
        )
      case 2:
        return (
          <Review
            listing={ this.props.listing }
            steps = { steps }
            step = { 2 }
            tokenBalance={ this.props.tokenBalance }
            onPrev={ () => this.setState({step: 1}) }
            onNext={ () => this.setState({step: 3}) }
            onChange={ listing => this.props.onChange(listing) }
          />
        )
      default:
        return (
          <div>Something went wrong</div>
        )
    }
  }
}

export default AnnouncementListing
