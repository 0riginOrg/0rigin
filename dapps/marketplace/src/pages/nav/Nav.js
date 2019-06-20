import React, { useState } from 'react'
import { fbt } from 'fbt-runtime'
import { withRouter } from 'react-router-dom'

import withWallet from 'hoc/withWallet'
import withCreatorConfig from 'hoc/withCreatorConfig'
import withIsMobile from 'hoc/withIsMobile'

import Link from 'components/Link'
import NavLink from 'components/NavLink'
import Profile from './Profile'
import Notifications from './Notifications'
import Messages from './Messages'
import Mobile from './Mobile'
import Search from '../listings/_Search'
import GetStarted from './GetStarted'

import withEnrolmentModal from 'pages/growth/WithEnrolmentModal'

const Brand = withCreatorConfig(({ creatorConfig }) => {
  return creatorConfig.logoUrl ? (
    <Link to="/" className="custom-brand">
      <img src={creatorConfig.logoUrl} alt={creatorConfig.title} />
    </Link>
  ) : (
    <Link to="/" className="navbar-brand">
      Origin
    </Link>
  )
})

const Nav = ({ location: { pathname }, isMobile, wallet, onGetStarted }) => {
  const [open, setOpen] = useState()
  const navProps = nav => ({
    onOpen: () => setOpen(nav),
    onClose: () => setOpen(false),
    open: open === nav
  })

  if (isMobile) {
    let title
    if (pathname.startsWith('/my-listings')) {
      title = <fbt desc="Listings.title">Listings</fbt>
    } else if (pathname.startsWith('/my-purchases')) {
      title = <fbt desc="Purchases.title">Purchases</fbt>
    } else if (pathname.startsWith('/my-sales')) {
      title = <fbt desc="Sales.title">Sales</fbt>
    } else if (pathname.startsWith('/create')) {
      title = <fbt desc="CreateListing.title">Create Listing</fbt>
    }

    // Make the hamburger menu absolute and hide branding and profile icon.
    const isProfilePage = pathname.startsWith('/profile')

    const titleAndWallet = (
      <>
        {title ? <h1>{title}</h1> : <Brand />}
        {wallet ? (
          <Profile {...navProps('profile')} />
        ) : (
          <GetStarted onClick={() => onGetStarted()} />
        )}
      </>
    )

    return (
      <nav className={`navbar no-border${isProfilePage ? ' fixed-nav' : ''}`}>
        <Mobile {...navProps('mobile')} />
        {isProfilePage ? null : titleAndWallet}
      </nav>
    )
  }

  if (!wallet) {
    return (
      <nav className="navbar navbar-expand-md">
        <div className="container">
          <Brand />
          <Search className="form-inline mr-auto" />
          <GetStarted onClick={() => onGetStarted()} />
        </div>
      </nav>
    )
  }

  /* react uses upper/lower case convention to distinguish between DOM tags
   * and user defined components. For that reason if the components starts with
   * lowercase 'this.Earn...' it will miss interpret its attributes as DOM attributes
   */
  const EarnTokens = withEnrolmentModal('a')

  return (
    <nav className="navbar navbar-expand-md">
      <div className="container">
        <Brand />
        <Search className="form-inline mr-auto" />
        <ul className="navbar-nav ml-3">
          <li className="nav-item">
            <NavLink to="/my-purchases" className="nav-link text">
              <span>
                <fbt desc="navbar.purchases">Purchases</fbt>
              </span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/my-listings" className="nav-link text">
              <span>
                <fbt desc="navbar.listings">Listings</fbt>
              </span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/my-sales" className="nav-link text">
              <span>
                <fbt desc="navbar.sales">Sales</fbt>
              </span>
            </NavLink>
          </li>
          <li className="nav-item d-none d-lg-flex">
            <NavLink to="/create" className="nav-link text">
              <span>
                <fbt desc="navbar.addListing">Add Listing</fbt>
              </span>
            </NavLink>
          </li>
          <li className="nav-item d-none d-lg-flex">
            <EarnTokens className="nav-link text" href="#">
              <span className="d-md-none d-xl-flex">
                <fbt desc="navbar.earnTokens">Earn Tokens</fbt>
              </span>
              <span className="d-xl-none">
                <fbt desc="navbar.tokens">Tokens</fbt>
              </span>
            </EarnTokens>
          </li>
          <Messages {...navProps('messages')} />
          <Notifications {...navProps('notifications')} />
          <Profile {...navProps('profile')} />
        </ul>
      </div>
    </nav>
  )
}

export default withRouter(withWallet(withIsMobile(Nav)))

require('react-styl')(`
  .navbar
    padding: 0 1rem
    &:not(.no-border)
      border-bottom: 1px solid rgba(0, 0, 0, 0.1)
    > .container
      align-items: stretch

    .nav-item
      display: flex
      align-items: center
      min-height: 3.75rem
      font-size: 14px
      font-weight: bold
      font-style: normal
      color: var(--pale-grey)
      &.show
        background-color: var(--white)
        .nav-link
          color: var(--dark)
      button
        border: 0px
      .nav-link
        padding: 0 0.75rem
        color: var(--dusk)
        height: 100%
        display: flex
        align-items: center
        &.text
          background-color: initial
          padding: 0 0.25rem
          span
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            &:hover,&.active
              background-color: rgba(0,0,0,0.1)
          &.active span
            background-color: rgba(0,0,0,0.1)
        &.icon-padding span
          padding-left: 2rem
        span
          display: inline-block

      .dropdown-menu
        padding: 0
        position: absolute !important
        margin-top: 0
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
        border-radius: 0 0 5px 5px
        border: 1px solid var(--light)
        font-weight: normal

  .navbar-brand
    background: url(images/origin-logo-black.svg) no-repeat center
    background-size: 100%
    width: 90px
    text-indent: -9999px

  .custom-brand
    display: flex
    align-items: center
    img
      max-height: 32px

  @media (pointer: fine)
    .navbar .nav-item
      &.show .nav-link:hover
        background-color: rgba(0,0,0,0.1)
        &.text
          background-color: var(--white)
          span
            background-color: rgba(0,0,0,0.1)
      .nav-link:hover
        background-color: rgba(0,0,0,0.1)
        &.text
          background-color: var(--white)
          span
            background-color: rgba(0,0,0,0.1)

  @media (max-width: 767.98px)
    .navbar-brand,.custom-brand
      position: absolute
      left: 50%
      transform: translateX(-50%)
      margin-right: 0
    .navbar
      padding: 0
      &.fixed-nav
        position: absolute
        z-index: 100
      h1
        font-size: 24px
        position: absolute
        left: 50%
        transform: translateX(-50%)
      .nav-item
        position: initial
        .dropdown-menu
          border: 0
          &::before
            content: ""
          overflow: auto
          position: fixed !important
          box-shadow: none
          margin-top: 0
          border-radius: 0
          left: 0
          right: auto
          bottom: 0
          top: 0
          &.dropdown-menu-right
            left: auto
            right: 0
        .dropdown-menu-bg
          position: fixed
          left: 0
          right: 0
          top: 0
          bottom: 0
          background: rgba(0,0,0,0.3)
          clip-path: none
          width: auto
          height: auto
          z-index: 1

`)
