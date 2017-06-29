var Doc = require('crdt').Doc
var multiplex = require('multiplex')
var inherits = require('util').inherits
var Room = require('./room')
var HostedRoom = require('./hosted-room')
// TODO: switch to sodium-universal
var crypto = require('crypto-browserify')

// TODO: room updates need to be signed so other peers can't change
// room metadata not owned by them

module.exports = P2PLobby

var MS_IN_MINUTE = 60000 // ms

function P2PLobby (opts) {
  var self = this

  this.private = opts.private
  this.public = opts.public
  this.id = crypto.createHash('sha1').update(this.public).digest('hex')
  console.log('my id: ', this.id)

  this.nicename = opts.nicename

  Room.call(this, {
    id: self.id,
    roomID: opts.lobbyID || new Buffer(20).fill('p2p-lobby'),
    maxPeers: opts.maxPeers || 6
  })

  this._doc = new Doc()
  this._rooms = this._doc.createSet('type', 'room')

  this._rooms.on('add', function (row) {
    self.emit('rooms:add', row.toJSON())
  })

  this._rooms.on('remove', function (row) {
    self.emit('rooms:remove', row.toJSON())
  })

  this.myRoomId = null

  this.on('peer:connect', function (peer, mux) {
    var docStream = mux.createSharedStream('_doc')
    docStream.pipe(self._doc.createStream()).pipe(docStream)
    docStream.on('end', function () {
      console.log('docStream ended')
    })
  })

  
}

inherits(P2PLobby, Room)

P2PLobby.prototype.createRoom = function (name) {
  console.log('createRoom')
  var self = this

  if (this.roomInterval != null) {
    clearInterval(this.roomInterval)
  }

  var roomRow = this._doc.add({type: 'room', pubkey: btoa(self.public), name: name, creator: self.nicename})
  this.myRoomId = roomRow.toJSON().id


  // TODO: get keys
  
  var room = new HostedRoom({
    hostKey: self.public,
    isHost: true,
    private: self.private,
    public: self.public,
    nicename: self.nicename
  })

  return room
}

// stop pinging room status
P2PLobby.prototype.closeRoom = function () {
  if (this.myRoomId != null) {
    this._doc.rm(this.myRoomId)
    this.myRoomId = null
  }
}

P2PLobby.prototype.getRooms = function () {
  return this._rooms.toJSON()
}
