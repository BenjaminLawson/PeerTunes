//3rd party
var Mustache = require('mustache')

module.exports = LobbyView

function LobbyView (opts) {
  this.roomRowTemplate = $(opts.roomRowTemplate).html()
  Mustache.parse(this.roomRowTemplate)

  this.DOM = {
    $roomList: $(opts.roomList),
  }

  // reset list
  this.DOM.$roomList.html('')
}

LobbyView.prototype.addRoom = function (room) {
  var params = {host: room.creator, title: room.name, id: room.pubkey}
  var $row = $(Mustache.render(this.roomRowTemplate, params))
  this.DOM.$roomList.append($row)
}

LobbyView.prototype.removeRoom = function (roomId) {
  console.log('Lobby view removeRoom not implemented yet!')
}
