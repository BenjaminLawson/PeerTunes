
module.exports = ChatModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function ChatModel (config) {
  this.maxMessageLength = config.maxMessageLength
  this.messages = []
}

inherits(ChatModel, EventEmitter)

ChatModel.prototype.addMessage = function (message) {
  message.text = this.filter(message.text)
  message.text = this.emojify(message.text)

  this.messages.push(message)
  this.emit('new-chat-message', message)
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

ChatModel.prototype.emojify = function (text) {
  // replace common ascii emoticons with shortnames
  text = text.replace(/:\)/g, ':smile:')
  text = text.replace(/:D/g, ':grin:')
  text = text.replace(/<3/g, ':heart:')

    // convert emoji shortnames to image tags
  text = emojione.shortnameToImage(text)

  return text
}
