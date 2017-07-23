var Lobby = require('../modules/lobby')
var LobbyView = require('../views/lobby-view')
var localforage = require('localforage')

module.exports = LobbyController

function LobbyController(opts) {
  var self = this
  
  this.identity = opts.identity

  this.router = opts.router

  this.view = new LobbyView({
    roomRowTemplate: '#roomRowTmpl',
    roomList: '#room-list'
  })

  this._initClickHandlers()

  this.lobby = this._joinLobby()
}

LobbyController.prototype._initClickHandlers = function () {
  var self = this
  // create room
  $('#btn-create-room').click(function (e) {
     $('#createRoomModal').modal('toggle')
  })

  // modal create room
  $('#modal-btn-create-room').click(function (e) {
    if ($('#roomNameInput').val().length < 1) {
      e.stopPropagation()
      $('#create-room-form-group').addClass('has-error')
      return
    }
    $('#create-room-form-group').removeClass('has-error')
    
    var roomName = $('#roomNameInput').val()
    
    //var room = self.lobby.createRoom(roomName)

    //window.location.hash = '#room/'+self.keypair.public.toString('hex')
    self.lobby.leave()
    self.router.route('#room/'+self.identity.keypair.public.toString('hex'), {room: {name: roomName}})
    console.log('created room ', roomName)
    
    $('#roomNameInput').val('')
  })
}

LobbyController.prototype._joinLobby = function () {
  var self = this

  console.log('joining lobby')
  
  var lobby = new Lobby({
    maxPeers: 6,
    public: self.identity.keypair.public,
    private: self.identity.keypair.private,
    nicename: self.identity.username
  })

  lobby.on('rooms:add', function (room) {
    console.log('new room added to lobby: ', room)
    self.view.addRoom(room)
  })

  return lobby
}
