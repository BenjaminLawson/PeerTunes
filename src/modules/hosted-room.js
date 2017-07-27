/*
  TODO:
  - security: sign updates to rows, only owner of key can update that row
  - if NOT host, detect when host removes heartbeat or heartbeat times out
*/
module.exports = HostedRoom

var Doc = require('crdt').Doc
var inherits = require('util').inherits
var Room = require('./room')
var crypto = require('crypto-browserify')
var pump = require('pump')

var HEARTBEAT_INTERVAL = 30000 // time between updating heartbeat, must be less than expiration time by decent margin
var REAPER_INTERVAL = 40000 // time between reapings by host
var EXPIRATION_TIME =  40000 // heartbeat age before user considered dead
var HOST_CHECK_INTERVAL = 20000 // time between guests checking that host is alive

function HostedRoom (opts) {
  var self = this

  this.isHost = (opts.public.toString('hex') === opts.hostKey)
  this.id = crypto.createHash('sha1').update(opts.public).digest('hex')

  //console.log('HostedRoom given hostKey ', opts.hostKey)
  this.hostKey = opts.hostKey || null
  if (typeof this.hostKey === 'string') this.hostKey = new Buffer(this.hostKey, 'hex')
  //console.log('converted to hostKey ', this.hostKey)
  this.hostId = crypto.createHash('sha1').update(this.hostKey).digest('hex')
  console.log('hosted room hostId: ', this.hostId)
  
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
    row = row.toJSON()
    console.log('heartbeat remove: ', row)
    self.emit('user:leave', row)
    if (!self.isHost && row.id === self.hostId) {
      console.log('host left room')
      self.emit('host:leave')
    }
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

  this._reaperInterval = null
  this._hostHeartbeatCheckInterval = null
  if (this.isHost) {
    this._initReaper()
  }
  else {
    this._initHostHeartbeatChecker()
  }
}

inherits(HostedRoom, Room)

HostedRoom.prototype.destroy = function () {
  // remove self from room doc
  this._doc.rm(this.id)
  
  // remove event listeners
  this.removeListener('peer:connect', this._onPeerConnect)
  this._heartbeats.removeListener('add', this._onHeartbeatAdd)
  this._heartbeats.removeListener('remove', this._onHeartbeatRemove)
  
  // remove heartbeat
  clearInterval(this._heartbeatInterval)

  if (this._reaperInterval) clearInterval(this._reaperInterval)
  if (this._hostHeartbeatCheckInterval) clearInterval(this._hostHeartbeatCheckInterval)

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

// in case the host disconnects sloppily (e.g. closes browser window)
// check for heartbeat periodically
HostedRoom.prototype._initHostHeartbeatChecker = function () {
  var self = this

  this._hostHeartbeatCheckInterval = setInterval(check, HOST_CHECK_INTERVAL)

  function check () {
    var row = self._heartbeats.get(self.hostId)
    if (!row || Date.now() - row.get('time') > EXPIRATION_TIME) {
      console.log('host heartbeat expired')
      self.emit('host:leave')
    }
  }
}
