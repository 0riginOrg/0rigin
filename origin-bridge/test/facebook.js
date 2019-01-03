const chai = require('chai')
const expect = chai.expect
const request = require('supertest')

const Logger = require('logplease')
Logger.setLogLevel('NONE')

describe('facebook attestations', () => {
  it('should generate a correct auth url', () => {
  })

  it('should generate attestation on valid verification code', () => {
  })

  it('should error on incorrect verification code', () => {
  })

  it('should error on missing verification code', () => {
  })
})
