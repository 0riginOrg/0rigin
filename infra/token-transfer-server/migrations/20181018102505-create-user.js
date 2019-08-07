'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('t3_user', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      // Key used for OTP authentication.
      otp_key: {
        type: Sequelize.STRING
      },
      otp_verified: {
        type: Sequelize.BOOLEAN
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: queryInterface => {
    return queryInterface.dropTable('t3_user')
  }
}
