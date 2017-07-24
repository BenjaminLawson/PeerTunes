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

  this._onLobbyAddRoom = function (room) {
    console.log('new room added to lobby: ', room)
    self.view.addRoom(room)
  }
  
  this.lobby = this._joinLobby()
  this.lobby.on('rooms:add', this._onLobbyAddRoom)

  this.$createRoomButton = $('#btn-create-room')
  this.$modalCreateRoomButton = $('#modal-btn-create-room')
  this.$roomList = $('#room-list')

  this._initClickHandlers()
}

LobbyController.prototype.destroy = function () {
  this.$createRoomButton.off()
  this.$modalCreateRoomButton.off()
  
  this.$roomList.empty()

  this.lobby.removeListener('rooms:add', this._onLobbyAddRoom)
  this.lobby.destroy()
  this.lobby = null
  
}

LobbyController.prototype._initClickHandlers = function () {
  var self = this
  // create room
  this.$createRoomButton.click(function (e) {
     $('#createRoomModal').modal('show')
  })

  // modal create room
  this.$modalCreateRoomButton.click(function (e) {
    console.log('room name val: ', $('#roomNameInput').val())
    if ($('#roomNameInput').val().length < 1) {
      e.stopPropagation()
      $('#create-room-form-group').addClass('has-error')
      return
    }
    $('#create-room-form-group').removeClass('has-error')
    
    var roomName = $('#roomNameInput').val()
    
    $('#roomNameInput').val('')
    self.router.route('#room/'+self.identity.keypair.public.toString('hex'), {room: {name: roomName}})
  })

  // click on a room listing
  this.$roomList.on('click', '.room-list-item', function (e) {
    // room guests cna leave lobby since they don't need to keep room listing alive
    self.lobby.leave()
    self.lobby = null
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

  return lobby
}
