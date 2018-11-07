'use strict'
import db from './../models/'
import uuidv4 from 'uuid/v4'
import { Op } from 'sequelize'
import { MessageTypes } from 'origin/common/enums'
import MessageQueue from './../utils/message-queue'
import origin from './../services/origin'
import {sha3_224} from 'js-sha3'

const CODE_EXPIRATION_TIME_MINUTES = 60
const CODE_SIZE = 16

class Linker {
  constructor({}={}) {
    this.messages = new MessageQueue()
  }

  _generateNewCode(size) {
    return uuidv4().replace('-', '').substring(0, size)
  }

  async findUnexpiredCode(code) {
    return db.LinkedToken.findAll({where:{code:code, codeExpires:{[Op.gte]:new Date()}}})
  }

  async findLink(clientToken) {
    return db.LinkedToken.findOne({where:{clientToken}})
  }

  async findSession(sessionToken, linkedObj) {
    if (linkedObj)
    {
      return db.LinkedSession.findOne({where:{sessionToken, linkedId:linkedObj.id}})
    } else {
      return db.LinkedSession.findOne({where:{sessionToken}})
    }
  }

  getLinkId(rawId, key) {
    return sha3_224(`${rawId}:${key}`).slice(0, 16)
  }

  getWalletToken(linkedObj) {
    if (linkedObj.linked) {
      return `${linkedObj.deviceType}:${linkedObj.deviceToken}`
    }
  }

  parseWalletToken(walletToken) {
    const parts = walletToken.split(':')
    return {deviceType:parts[0], deviceToken:parts.slice(1).join(':')}
  }

  async _generateNonConflictingCode() {
    for(const i of Array(10)) {
      const code = this._generateNewCode(CODE_SIZE)
      const existing = await this.findUnexpiredCode(code)
      if (existing.length == 0)
      {
        return code
      }
    }
    throw("We hit max retries without finding a none repreated code!")
  }

  async initClientSession(clientToken, sessionToken, lastMessageId) {
    const linkObj = await this.findLink(clientToken)
    let init = false
    if (!linkObj) {
      throw("Cannot find link for client token", clientToken)
    }
    // if this is a brand new session ignore all current messages
    if (!lastMessageId) {
      const message = await this.messages.getLastMessage(clientToken)
      if (message)
      {
        lastMessageId = message.msgId
      }
      init = true
    }
    else
    {
      const message = await this.messages.getFirstMessage(clientToken)
      if (message && message.msgId > lastMessageId)
      {
        init = true
      }
    }
    if (!sessionToken) {
      sessionToken = this.generateInitSession(linkObj)
      init = true
    }

    //set the lastest device context just in case we missed out on some messages
    const initMsg = init && this._getContextMsg(linkObj, sessionToken)
    return {initMsg, sessionToken, lastMessageId}
  }



  //
  // returns a function to call for clean up: cleanUp()
  //    messageFn(message, messageId)
  //
  handleMessages(token, lastMessageId, messageFn) {
    let lastReadId = lastMessageId

    const msgFetch = async () => {
      const messages = await this.messages.getMessages(token, lastReadId)
      for (const {msg, msgId} of messages) {
        if (msgId > lastReadId)
        {
          messageFn(msg, msgId)
          lastReadId = msgId
        }
      }
    }
    // initial fetch for messages
    msgFetch()
    return this.messages.subscribeMessage(token, msgFetch)
  }

  async handleSessionMessages(clientToken, _sessionToken, _lastMessageId, messageFn) {
    const {initMsg, sessionToken, lastMessageId} = await this.initClientSession(clientToken, _sessionToken, _lastMessageId)
    if (initMsg) {
      messageFn(msg, msgId)
    }

    return this.handleMessages(clientToken, lastMessageId, (msg, msgId) => {
      const {session_token} = msg
      if (!session_token || session_token == sessionToken)
      {
        messageFn(msg, msgId)
      }
    })
  }

  sendWalletMessage(linkedObj, type, data) {
    const walletToken = this.getWalletToken(linkedObj)
    if (walletToken)
    {
      return this.messages.addMessage(walletToken, {type, data})
    }
  }

  sendSessionMessage(linkedObj, sessionToken, type, data) {
    return this.messages.addMessage(linkedObj.clientToken, {type, session_token:sessionToken, data})
  }

  generateInitSession(linkedObj) {
    const sessionToken = uuidv4()
    return sessionToken
  }

  async generateCode(clientToken, sessionToken, userAgent, returnUrl, pendingCall) {
    let linkedObj
    if (clientToken)
    {
      linkedObj = await db.LinkedToken.findOne({where:{clientToken}})
    }

    if (!linkedObj){
      clientToken = uuidv4()
      linkedObj = await db.LinkedToken.build({clientToken, linked:false})
    }

    if (!linkedObj.linked) {
      const code = await this._generateNonConflictingCode()
      linkedObj.code = code
      linkedObj.codeExpires = new Date(new Date() + CODE_EXPIRATION_TIME_MINUTES * 60 * 1000)
      linkedObj.app_info = {user_agent:userAgent, return_url:returnUrl}
    }
    await linkedObj.save()

    if (!sessionToken)
    {
      sessionToken = this.generateInitSession(linkedObj)
    }

    if (pendingCall)
    {
      linkedObj.pendingCallContext = {call:pendingCall, session_token:sessionToken}
      linkedObj.save()
    }

    return {clientToken, sessionToken, code:linkedObj.code, linked:linkedObj.linked}
  }
  
  async getLinkInfo(code) {
    const linkedObj = await this.findUnexpiredCode(code)
    if (linkedObj)
    {
      return {appInfo:linkedObj.appInfo, linkId:this.getLinkId(linkedObj.id, linkedObj.clientToken)}
    }
    return {}
  }

  getMetaFromCall({net_id, txn_object}){
    if (txn_object) {
      return origin.decodeContractCall(net_id || txn_object.chainId, txn_object.to, txn_object.data)
    }
  }

  async callWallet(clientToken, sessionToken, account, call_id, call, return_url) {
    if (!clientToken || !sessionToken){
      return false
    }
    const linkedObj = await this.findLink(clientToken)
    if (!linkedObj || !linkedObj.linked) {
      return false
    }
    const call_data = {call_id, call, link_id:this.getLinkId(linkedObj.id, linkedObj.clientToken), session_token:sessionToken, return_url, account}

    const meta = this.getMetaFromCall(call)

    this.sendWalletMessage(linkedObj, MessageTypes.CALL, call_data)

    // send push notification via APN or fcm
  }

  async walletCalled(walletToken, callId, linkId, sessionToken, result) {
    const {deviceType, deviceToken} = this.parseWalletToken(walletToken)
    const links = await db.LinkedToken.findAll({where:{deviceType, deviceToken, linked:true}})

    let linkedObj = null
    for (const link of links) {
      if (linkId == this.getLinkId(link.id, link.clientToken))
      {
        linkedObj = link
      }
    }
    if (!linkedObj) {
      throw("Session not linked")
    }

    const response = {call_id:callId, result}
    this.sendSessionMessage(linkedObj, sessionToken, MessageTypes.CALL_RESPONSE, response)
    return true
  }

  _getContexMsg(linkedObj, sessionToken) {
    const linked = linkedObj.linked
    return { type:MessageTypes.CONTEXT, 
      msg:{session_token:sessionToken, linked:linkedObj.linked, device:linked && linkedObj.currentDeviceContext}}
  }

  async sendGlobalContextChange(linkedObj) {
    const {type, msg} = this._getContextMsg(linkedObj)
    return this.sendSessionMessage(linkedObj, undefined, type, msg)
  }

  async linkWallet(walletToken, code, currentDeviceContext) {
    const linkedObj = await this.findUnexpiredCode(code)
    if (!linkedObj)
    {
      throw("Cannot find code to link to.")
    }

    const pendingCallContext = linkedObj.pendingCallContext
    const appInfo = linkedObj.appInfo

    const {deviceType, deviceToken} = this.parseWalletToken(walletToken)

    linkedObj.deviceToken = deviceToken
    linkedObj.deviceType = deviceType
    linkedObj.linked = true
    linkedObj.code = null
    linkedObj.currentDeviceContext = currentDeviceContext
    linkedObj.linkedAt = new Date()
    linkedObj.pendingCallContext = null

    //send a global session message
    this.sendGlobalContextChange(linkedObj)
    linkedObj.save()

    return {pendingCallContext, appInfo, linked:true, linkId:this.getLinkId(linkedObj.id, linkedObj.clientToken), linkedAt:linkedObj.linkedAt}
  }

  async getWalletLinks(walletToken) {
    const {deviceType, deviceToken} = this.parseWalletToken(walletToken)

    const links = await db.LinkedToken.findAll({where:{deviceType, deviceToken, linked:true}})
    return links.map(link => ({linked:link.linked, app_info:link.appInfo,  link_id:this.getLinkId(link.id, link.clientToken)}))
  }

  async unlink(clientToken) {
    const linkedObj = await this.findLink(clientToken)
    if (!linkedObj || !linkedObj.linked)
    {
      return true
    }

    linkedObj.linked = false
    linkedObj.save()

    this.sendGlobalContextChange(linkedObj)
    return true
  }

  async unlinkWallet(walletToken, linkId) {
    const {deviceType, deviceToken} = this.parseWalletToken(walletToken)
    const links = await db.LinkedToken.findAll({where:{deviceType, deviceToken, linked:true}})

    for (const link of links) {
      if (linkId == this.getLinkId(link.id, link.clientToken))
      {
        link.linked = false
        link.deviceType = null
        link.deviceToken = null
        link.save()
        this.sendGlobalContextChange(link)
        return true
      }
    }
    return false
  }
}

export default Linker
