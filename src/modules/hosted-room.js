/*
  TODO:
  - expire heartbeats that aren't updated for a while (fork crdt? inherit?)
  - security: sign updates to rows, only owner of key can update that row
*/
module.exports = HostedRoom

var Doc = require('crdt').Doc
var inherits = require('util').inherits
var Room = require('./room')
var crypto = require('crypto-browserify')
var pump = require('pump')

var HEARTBEAT_INTERVAL = 30000
var REAPER_INTERVAL = 40000
var EXPIRATION_TIME =  40000

function HostedRoom (opts) {
  var self = this

  this.isHost = (opts.public.toString('hex') === opts.hostKey)
  this.id = crypto.createHash('sha1').update(opts.public).digest('hex')

  //console.log('HostedRoom given hostKey ', opts.hostKey)
  this.hostKey = opts.hostKey || null
  if (typeof this.hostKey === 'string') this.hostKey = new Buffer(this.hostKey, 'hex')
  //console.log('converted to hostKey ', this.hostKey)
  
  this.nicename = opts.nicename
  
  Room.call(this, {
    id: self.id,
    roomID: crypto.createHash('sha1').update(self.hostKey).digest('hex') || new Buffer(20).fill('p2p-lobby'),
    maxPeers: opts.maxPeers || 6
  })

  this._doc = new Doc()
  this._heartbeats = this._doc.createSet('type', 'heartbeat')

  this._onHeartbeatAdd = function (row) {
    console.log('heartbeat add: ', row.toJSON())
    self.emit('user:join', row.toJSON())
  }

  this._onHeartbeatRemove = function (row) {
    console.log('heartbeat remove: ', row.toJSON())
    self.emit('user:leave', row.toJSON())
  }

  this._onPeerConnect = function (peer) {
    var mux = peer.mux
    
    var crdtStream = mux.createSharedStream('_crdt') // name unlikely to be used downstream
    pump(crdtStream, self._doc.createStream(), crdtStream, function (err) {
      //console.log('hosted-room crdt pipe closed', err)
    })
  }

  this._heartbeats.on('add', this._onHeartbeatAdd)
  this._heartbeats.on('remove', this._onHeartbeatRemove)

  this._myHeartbeat = this._doc.add({id: self.id, type: 'heartbeat', time: Date.now(), nicename: self.nicename})

  // update heartbeat every 30 seconds
  this._heartbeatInterval = setInterval(function () {
    self._myHeartbeat.set('time', Date.now())
  }, HEARTBEAT_INTERVAL)
  
  this.on('peer:connect', this._onPeerConnect)

  if (this.isHost) {
    this._initReaper()
  }
}

inherits(HostedRoom, Room)

HostedRoom.prototype.destroy = function () {
  // remove event listeners
  this.removeListener('peer:connect', this._onPeerConnect)
  this._heartbeats.removeListener('add', this._onHeartbeatAdd)
  this._heartbeats.removeListener('remove', this._onHeartbeatRemove)
  
  // remove heartbeat
  clearInterval(this._heartbeatInterval)

  // TODO: not triggering _heartbeats remove?
  this._doc.rm(this.id)

  if (this._reaperInterval) clearInterval(this._reaperInterval)

  this.isHost = false

   // destroy base room last
  Room.prototype.destroy.call(this)
}

// return array of ids of heartbeats
HostedRoom.prototype.users = function () {
  return this._heartbeats.asArray()
}

HostedRoom.prototype.leave = function () {
  console.log('leaving hosted room')
  this.destroy()
}

// scans heartbeats for expired peers periodically
HostedRoom.prototype._initReaper = function () {
  var self = this
  this._reaperInterval = setInterval(reap, REAPER_INTERVAL)

  function reap () {
    var expired = []
    var heartbeats = self._heartbeats.asArray()
    for (var i = heartbeats.length - 1; i >= 0; i--) {
      var row = heartbeats[i]
      var time = row.get('time')
      if (Date.now() - time > EXPIRATION_TIME) {
        console.log('reaping: ', row.id)
        self._doc.rm(row.id)
      }
    }
  }
}
