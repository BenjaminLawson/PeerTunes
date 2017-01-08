//3rd party
var Mustache = require('mustache')

module.exports = ChatView

function ChatView (config) {
  this.messageTemplate = $(config.messageTemplate).html()

  this.DOM = {
    $chatInput: $(config.chatInput),
    $chatBody: $(config.chatBody),
    $chatEnterButton: $(config.chatEnterButton),
    $chatList: $(config.chatList)
  }

  // speeds up future renders
  Mustache.parse(this.messageTemplate)
}

ChatView.prototype.getDOM = function () {
  return this.DOM
}

ChatView.prototype.onMessage = function (msg) {
  this._appendMessage(msg)
  this.clearInput()
}

ChatView.prototype.clearInput = function () {
  this.DOM.$chatInput.val('')
}

ChatView.prototype._appendMessage = function (msg) {
  var renderedMessage = Mustache.render(this.messageTemplate, msg)
  this.DOM.$chatList.append(renderedMessage)
}

ChatView.prototype.clear = function () {
  this.DOM.$chatList.html('')
}

ChatView.prototype._scrollToBottom = function () {
  var height = this.DOM.$chatBody[0].scrollHeight
  this.DOM.$chatBody.scrollTop(height)
}

ChatView.prototype._isScrolledToBottom = function () {
  var chatBody = this.DOM.$chatBody[0]
  return (chatBody.scrollHeight - chatBody.offsetHeight - chatBody.scrollTop < 1)
}
