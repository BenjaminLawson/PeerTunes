module.exports = PeerManager

var Tracker = require('bittorrent-tracker/client')

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function PeerManager (config) {
  this.peers = []
  
  this.tracker = new Tracker({
    peerId: config.peerId,
    announce: config.trackerURL,
    infoHash: new Buffer(20).fill('01234567890123456787'), // temp, use url in future?
    rtcConfig: config.rtc
  })
  this.tracker.start()
  this.tracker.on('peer', this._onPeer.bind(this))
  this.tracker.on('error')
}

inherits(PeerManager, EventEmitter)

PeerManager.prototype.removePeer = function (peer) {
  var index = this.peers.indexOf(peer)
  if (index > -1) {
    this.peers.splice(index, 1)
  }
}

// Tracker Handlers

PeerManager.prototype._onPeer = function (peer) {
  // don't add duplicate peers
  // TODO: won't work with multiple trackers
  if (this.peers.map(function (p) { return p.id }).indexOf(peer.id) > -1) return

  console.log('Tracker sent new peer: ' + peer.id)

  this.peers.push(peer)

  if (peer.connected) {
    this._onPeerConnect(peer)
  } else {
    peer.once('connect', this._onPeerConnect.bind(this, peer))
  }
}

PeerManager.prototype._onUpdate = function (data) {
   // console.log('got an announce response from tracker: ' + data.announce)
   // console.log('number of seeders in the swarm: ' + data.complete)
   // console.log('number of leechers in the swarm: ' + data.incomplete)
}

PeerManager.prototype._onError = function (err) {
  console.log('Tracker Error:')
  console.log(err)
}

PeerManager.prototype._onWarning = function (err) {
  console.log('Tracker Warning:')
  console.log(err)
}

// Peer Handlers

PeerManager.prototype._onPeerConnect = function (peer) {
  console.log('Peer connected: ' + peer.id)
  console.log('Number of peers: ' + this.peers.length)

  peer.on('data', this._onPeerData.bind(this, peer))
  peer.on('close', this._onPeerClose.bind(this, peer))
  peer.on('error', this._onPeerError.bind(this, peer))
  peer.on('end', this._onPeerEnd.bind(this, peer))

  this.emit('peer:connect')
}

PeerManager.prototype._onPeerData = function (peer, data) {
  try {
    data = JSON.parse(data)
    console.log('Received message: ', data)
  } catch (err) {
    console.error(err.message)
  }
  // only happens when user makes a room, or guest joins your room
  if (data.username) {
    peer.username = data.username
  }

  if (data.msg) {
    this.emit('peer:msg', peer, data)
  }
}

PeerManager.prototype._onPeerClose = function (peer) {
  peer.removeListener('data', this._onPeerData.bind(this, peer))
  peer.removeListener('close', this._onPeerClose.bind(this, peer))
  peer.removeListener('error', this._onPeerError.bind(this, peer))
  peer.removeListener('end', this._onPeerEnd.bind(this, peer))

  this.removePeer(peer)

  this.emit('peer:close', peer)
}

PeerManager.prototype._onPeerError = function (peer) {
  this._onPeerClose(peer)
}

PeerManager.prototype._onPeerEnd = function (peer) {
  this._onPeerClose(peer)
}
