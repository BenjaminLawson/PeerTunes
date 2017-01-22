module.exports = ChatController

function ChatController (view, model) {
  var self = this

  this.view = view
  this.model = model
  
  this.model.on('new-chat', this.view.onMessage.bind(this.view))
  this.model.on('delete-all-messages', this.view.clear.bind(this.view))

  var DOM = this.view.getDOM()

  // click handlers
  DOM.$chatEnterButton.click(function (e) {
    var text = DOM.$chatInput.val()
    var username = self.model.getUsername()
    self.model.selfMessage({username: username, message: text})
  })

  // key listeners
  var ENTER_KEY = 13

  DOM.$chatInput.keydown(function (e) {
    if (e.keyCode === ENTER_KEY) {
      var text = DOM.$chatInput.val()
      var username = self.model.getUsername()
      self.model.selfMessage({username: username, message: text})
    }
  })
}
