
module.exports = ChatModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function ChatModel (config) {
  this.maxMessageLength = config.maxMessageLength
  this.messages = []
  this.username = config.username

  EventEmitter.call(this)
}

inherits(ChatModel, EventEmitter)

ChatModel.prototype.selfMessage = function (message) {
  // process message
  message.message = this.filter(message.message)
  
  this.addMessage(message)
  this.emit('new-chat-self', message)
}

ChatModel.prototype.receiveMessage = function (message) {
  // process message
  message.message = this.filter(message.message)
  
  this.addMessage(message)
  this.emit('new-chat-peer', message)
}

ChatModel.prototype.addMessage = function (message) {

  this.messages.push(message)

  this.emit('new-chat', message)
}

ChatModel.prototype.deleteAllMessages = function () {
  this.messages.length = 0
  this.emit('delete-all-messages')
}

ChatModel.prototype.filter = function (text) {
  // truncate
  if (text.length > this.maxMessageLength) {
    text = text.substring(0, this.maxMessageLength)
  }
  // strip html
  text = $('<p>').html(text).text()

  return text
}

ChatModel.prototype.getUsername = function () {
  return this.username
}
