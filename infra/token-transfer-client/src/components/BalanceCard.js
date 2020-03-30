import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import { Doughnut } from 'react-chartjs-2'
import Dropdown from 'react-bootstrap/Dropdown'
import moment from 'moment'

import BorderedCard from '@/components/BorderedCard'
import DropdownDotsToggle from '@/components/DropdownDotsToggle'

const BalanceCard = props => {
  const [redirectTo, setRedirectTo] = useState(false)

  const doughnutData = () => {
    return {
      labels: ['Available', 'Locked'],
      datasets: [
        {
          data: [Number(props.balance), Number(props.locked)],
          backgroundColor: ['#00db8d', '#007cff'],
          borderWidth: 0
        }
      ]
    }
  }

  if (redirectTo) {
    return <Redirect push to={redirectTo} />
  }

  if (props.isLocked) {
    const now = moment.utc()
    return (
      <BorderedCard>
        <div className="row">
          {moment.isMoment(props.unlockDate) ? (
            <>
              <div className="col-12 col-lg-6 my-4">
                <h1 className="mb-1">Your tokens are almost here!</h1>
                <span style={{ fontSize: '18px' }}>
                  Your first tokens will be available in...
                </span>
              </div>
              <div className="col-12 col-lg-6" style={{ alignSelf: 'center' }}>
                <div className="bluebox p-2 text-center">
                  {props.unlockDate.diff(now, 'days')}d{' '}
                  {props.unlockDate.diff(now, 'hours') % 24}h{' '}
                  {props.unlockDate.diff(now, 'minutes') % 60}m
                </div>
              </div>
            </>
          ) : (
            <div className="col">
              <div className="bluebox p-2 text-center">
                Tokens Unlocking Soon
              </div>
            </div>
          )}
        </div>
      </BorderedCard>
    )
  }

  return (
    <BorderedCard>
      <div className="row header mb-3">
        <div className="col">
          <h2>My Vested Tokens</h2>
        </div>
      </div>
      <div className="row">
        {props.lockupsEnabled && (props.balance > 0 || props.locked > 0) && (
          <div
            className="col-12 col-lg-4 mb-4 mb-lg-0 mx-auto"
            style={{ maxWidth: '200px' }}
          >
            <div style={{ position: 'relative' }}>
              <Doughnut
                height={100}
                width={100}
                data={doughnutData}
                options={{ cutoutPercentage: 70 }}
                legend={{ display: false }}
              />
            </div>
          </div>
        )}
        <div className="col">
          <div className="row">
            <div className="col-1 text-right">
              <div className="status-circle bg-green"></div>
            </div>
            <div className="col text-nowrap">
              <div>Available</div>
              <div
                className="mr-1 mb-3 d-inline-block font-weight-bold"
                style={{ fontSize: '32px' }}
              >
                {props.isLocked ? 0 : Number(props.balance).toLocaleString()}{' '}
              </div>
              <span className="ogn">OGN</span>
            </div>
            <div className="col-1 text-right">
              <Dropdown drop={'left'} style={{ display: 'inline' }}>
                <Dropdown.Toggle
                  as={DropdownDotsToggle}
                  id="available-dropdown"
                ></Dropdown.Toggle>

                <Dropdown.Menu>
                  {props.lockupsEnabled && (
                    <Dropdown.Item onClick={props.onDisplayBonusModal}>
                      Earn Bonus Tokens
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item onClick={props.onDisplayWithdrawModal}>
                    Withdraw
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setRedirectTo('/withdrawal')}>
                    Withdrawal History
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          {props.lockupsEnabled && (
            <div className="row mt-2">
              <div className="col-1 text-right">
                <div className="status-circle bg-blue"></div>
              </div>
              <div className="col text-nowrap">
                <div>Locked Bonus Tokens</div>
                <div
                  className="mr-1 mb-2 d-inline-block font-weight-bold"
                  style={{ fontSize: '32px' }}
                >
                  {props.locked.toLocaleString()}
                </div>
                <span className="ogn">OGN</span>
              </div>
              <div className="col-1 text-right">
                <Dropdown drop={'left'} style={{ display: 'inline' }}>
                  <Dropdown.Toggle
                    as={DropdownDotsToggle}
                    id="bonus-dropdown"
                  ></Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={props.onDisplayBonusModal}>
                      Earn Bonus Tokens
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setRedirectTo('/lockup')}>
                      View Details
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </BorderedCard>
  )
}

export default BalanceCard
