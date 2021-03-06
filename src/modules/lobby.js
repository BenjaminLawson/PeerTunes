var Doc = require('crdt').Doc
var multiplex = require('multiplex')
var inherits = require('util').inherits
var Room = require('./room')
var HostedRoom = require('./hosted-room')
// TODO: switch to sodium-universal
var crypto = require('crypto-browserify')
var pump = require('pump')

// TODO: room updates need to be signed so other peers can't change
// room metadata not owned by them

module.exports = P2PLobby

var MS_IN_MINUTE = 60000 // ms

function P2PLobby (opts) {
  var self = this

  this.private = opts.private
  this.public = opts.public
  this.id = crypto.createHash('sha1').update(this.public).digest('hex')
  console.log('my lobby id: ', this.id)

  this.nicename = opts.nicename

  Room.call(this, {
    id: self.id,
    roomID: opts.lobbyID || new Buffer(20).fill('p2p-lobby'),
    maxPeers: opts.maxPeers || 6
  })

  this._doc = new Doc()
  this._rooms = this._doc.createSet('type', 'room')

  this._onRoomAdd = function (row) {
    self.emit('rooms:add', row.toJSON())
  }
  this._onRoomRemove = function (row) {
    self.emit('rooms:remove', row.toJSON())
  }
  
  this._rooms.on('add', this._onRoomAdd)
  this._rooms.on('remove', this._onRoomRemove)

  this.myRoomId = null

  this._onPeerConnect = function (peer) {
    var mux = peer.mux
    
    var docStream = mux.createSharedStream('_doc')
    pump(docStream, self._doc.createStream(), docStream, function (err) {
      //console.log('lobby doc pipe closed', err)
    })
    //docStream.pipe(self._doc.createStream()).pipe(docStream)
    docStream.on('end', function () {
      console.log('docStream ended')
    })
  }
  this.on('peer:connect', this._onPeerConnect)
}

inherits(P2PLobby, Room)

P2PLobby.prototype.destroy = function () {
  
  // remove listeners
  this._rooms.removeListener('add', this._onRoomAdd)
  this._rooms.removeListener('remove', this._onRoomRemove)
  this.removeListener('peer:connect', this._onPeerConnect)


  // destroy base room last
  Room.prototype.destroy.call(this)
}

P2PLobby.prototype.createRoom = function (name) {
  var self = this

  if (this.roomInterval != null) {
    clearInterval(this.roomInterval)
  }

  var roomRow = this._doc.add({type: 'room', pubkey: self.public.toString('hex') , name: name, creator: self.nicename})
  this.myRoomId = roomRow.toJSON().id


  // TODO: get keys
  
  var room = new HostedRoom({
    hostKey: self.public.toString('hex'),
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
