

var ChatView = require('../views/chat-view')
var ChatModel = require('../models/chat-model')

module.exports = ChatController

function ChatController (config) {
  var self = this

  this.username = config.username

  this.view = new ChatView(config.chatView)
  this.model = new ChatModel(config.chatModel)

  this.model.on('new-chat-message', this.view.onMessage)
  this.model.on('delete-all-messages', this.view)

  var DOM = this.view.getDOM()

  // click handlers
  DOM.$chatEnterButton.click(function (e) {
    var text = self.view.DOM.$chatInput.val()
    self.model.addMessage({username: self.username, message: text})
  })

  // key listeners
  var ENTER_KEY = 13

  DOM.$chatInput.keydown(function (e) {
    if (e.keyCode === ENTER_KEY) {
      var text = self.view.DOM.$chatInput.val()
      self.model.addMessage({username: self.username, message: text})
    }
  })
}

ChatController.prototype.onMessage = function (msg) {
  this.model.addMessage(msg)
}
