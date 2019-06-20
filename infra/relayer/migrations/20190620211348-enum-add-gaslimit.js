'use strict';

const ENUM_NAME = 'enum_relayer_txn_status'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`ALTER TYPE ${ENUM_NAME} ADD VALUE 'GasLimit';`)
  },

  down: () => {
    // There's no reverse of this
  }
}
