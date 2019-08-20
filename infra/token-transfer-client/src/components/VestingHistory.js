import React from 'react'
import moment from 'moment'

import { vestingSchedule } from '@origin/token-transfer-server/src/lib/vesting'

const VestingHistory = props => (
  <>
    <div className="row">
      <div className="col">
        <h2 className="mb-4">Vesting History</h2>
      </div>
    </div>
    <div className="row">
      <div className="table-card col">
        <table className="table mb-4">
          <tbody>
            {props.isLocked ? (
              <tr>
                <td className="table-empty-cell" colSpan="100%">
                  Vesting has not yet started.
                  <br />
                  Please check back after Lockup Period ends.
                </td>
              </tr>
            ) : (
              vestingSchedule(props.grants[0]).map(currentVest => (
                <tr key={currentVest.date}>
                  <td>
                    <div
                      className={`status-circle ${
                        currentVest.date < moment.now()
                          ? `status-circle-success`
                          : ''
                      }`}
                    ></div>
                  </td>
                  <td>{currentVest.amount.toLocaleString()} OGN</td>
                  <td>
                    <small>
                      {currentVest.date < moment.now() ? 'vested' : 'unvested'}
                    </small>
                  </td>
                  <td>{currentVest.date.format('L')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
)

export default VestingHistory
