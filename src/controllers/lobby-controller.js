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
  this.$roomList = $('#room-list')
  // modal
  this.$createRoomModal = $('#createRoomModal')
  this.$modalCreateRoomButton = $('#modal-btn-create-room')
  this.$modalRoomNameInput = $('#roomNameInput')
  this.$createRoomForm = $('#create-room-form')

  this._initClickHandlers()

  this.$createRoomForm.submit(function (e) {
    console.log('form submitted')
    e.preventDefault() // prevent form from actually submitting
    self._onSubmitCreateRoomForm()
  })

}

LobbyController.prototype.destroy = function () {
  this.$createRoomButton.off()
  this.$modalCreateRoomButton.off()
  this.$createRoomForm.off()
  
  this.$roomList.empty()

  console.log('lobby controller destroy, lobby: ', this.lobby)
  this.lobby.removeListener('rooms:add', this._onLobbyAddRoom)
  this.lobby.destroy()
  this.lobby = null
  
}

LobbyController.prototype._initClickHandlers = function () {
  var self = this
  // create room
  this.$createRoomButton.click(function (e) {
     self.$createRoomModal.modal('show')
  })
}

LobbyController.prototype._onSubmitCreateRoomForm = function () {
  var self = this
  console.log('room name val: ', self.$modalRoomNameInput.val())
  if (self.$modalRoomNameInput.val().length < 1) {
    console.log('invalid room name length')
    $('#create-room-form-group').addClass('has-error')
    return
  }
  $('#create-room-form-group').removeClass('has-error')
  
  var roomName = self.$modalRoomNameInput.val()
  
  self.$modalRoomNameInput.val('')
  self.router.route('#room/'+self.identity.keypair.public.toString('hex'), {room: {name: roomName}})
  
  self.$createRoomModal.modal('hide')
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
