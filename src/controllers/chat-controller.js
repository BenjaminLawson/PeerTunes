var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

module.exports = ChatController

function ChatController (view, model) {
  var self = this

  this.view = view
  this.model = model
  
  this.model.on('new-chat', this.view.onMessage.bind(this.view))
  this.model.on('delete-all-messages', this.view.clear.bind(this.view))

  this.DOM = this.view.getDOM()

  // click handlers
  this.DOM.$chatEnterButton.click(function (e) {
    self._submitMessage()
  })

  // key listeners
  var ENTER_KEY = 13

  this.DOM.$chatInput.keydown(function (e) {
    if (e.keyCode === ENTER_KEY) {
      self._submitMessage()
    }
  })
}

inherits(ChatController, EventEmitter)

ChatController.prototype._submitMessage = function () {
  var text = this.DOM.$chatInput.val()
  var username = this.model.getUsername()
  var msg = {username: username, message: text}
  this.emit('chat:submit', msg)
}
