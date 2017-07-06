var Tracker = require('bittorrent-tracker')
var hat = require('hat')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var crypto = require('crypto-browserify')
var multiplex = require('multiplex')

module.exports = Room

var TRACKER_URLS = ['wss://tracker.btorrent.xyz']

/*
  opts:

  roomID: hex string or buffer (20 bytes)
  id: hex string or buffer
  maxPeers: number, 5 is lowest you should go
  trackers: array of strings to wss trackers
*/

function Room (opts) {
    // peerID and roomID must be SHA1 hash of public keys (20 bytes / 40 hex chars)
    //console.log('Room opts: ', opts)
    
    this.roomId = opts.roomID // SHA1 hash of room host
    
    this.peerId = opts.id // SHA1 hash of peer
    //console.log('peerId: ', this.peerId)
    
    this.peers = {} // id : {peer, stream}
    this.maxPeers = opts.maxPeers || 6

    this.tracker = null
    this._trackerInit(opts)

    EventEmitter.call(this)
}

inherits(Room, EventEmitter)

Room.prototype.leave = function () {
    var self = this
    console.log('leaving room')
    Object.keys(this.peers).forEach(function (key, index) {
        var peer = self.peers[key]
        peer.destroy()
        delete self.peers[key]
    })
    this.tracker.stop()
    this.tracker.destroy()
    this.tracker = null
}

Room.prototype._destroyFurthestPeer = function () {
    var self = this
    var keys = Object.keys(self.peers)
    if (keys.length === 0) return

    console.log('too many peers, destroying furthest')

    var furthestPeer = null
    var furthestDist = -1
    keys.forEach(function (key) {
        var p = self.peers[key]
        var dist = distance(p.id, self.peerId)
        if (dist > furthestDist) {
            furthestPeer = p
            furthestDist = dist
        }
    })
    // TODO: destory streams first?
    furthestPeer.destroy(function () {
        console.log('destroyed furthest peer', furthestPeer.id)
        delete self.peers[furthestPeer.id]
    })
}

Room.prototype._trackerInit = function (opts) {
    var self = this

    this.tracker = new Tracker({
        infoHash: opts.roomID || new Buffer(20).fill('p2p-room'), // hex string or Buffer
        peerId: self.peerId, // hex string or Buffer
        announce: opts.trackers || TRACKER_URLS // list of tracker server urls
    })

    this.tracker.on('error', function (err) {
        console.log(err.message)
    })
    this.tracker.on('warning', function (err) {
        console.log(err.message)
    })

    this.tracker.on('update', function (data) {
        //console.log('got an announce response from tracker: ' + data.announce)
        //console.log('number of seeders in the swarm: ' + data.complete)
        //console.log('number of leechers in the swarm: ' + data.incomplete)
    })

    this.tracker.on('peer', function (peer) {
        if (peer.id in self.peers) return
        console.log('found a peer: ', peer.id)
        //console.log('peer distance: ', distance(peer.id, self.peerId))

        if (peer.connected) onConnect()
        else peer.once('connect', onConnect)

        function onConnect () {

            peer.once('close', function () {
                console.log('peer closed: ', peer.id)
                delete self.peers[peer.id]
            })

            peer.on('error', function () {
                console.log('peer error')
            })

            console.log('connected to peer ' + peer.id)

            self.peers[peer.id] = peer

            // temporary fix until simple-peer supports multiplexing
            var mux = multiplex()

            mux.on('error', function (err) {
                console.log('multiplex error: ', err)
            })

            // TODO: don't emit if peer will be destroyed because it is furthest
            peer.pipe(mux).pipe(peer)
            //console.log('emitting peer:connect')
            self.emit('peer:connect', peer, mux)
            
            if (Object.keys(self.peers).length > self.maxPeers) {
                self._destroyFurthestPeer()
            }
        }
    })

    this.tracker.start()
}

function distance (a, b) {
    if (!Buffer.isBuffer(a)) a = new Buffer(a)
    if (!Buffer.isBuffer(b)) b = new Buffer(b)
    var res = []
    var i
    if (a.length > b.length) {
        for (i = 0; i < b.length; i++) {
            res.push(a[i] ^ b[i])
        }
    } else {
        for (i = 0; i < a.length; i++) {
            res.push(a[i] ^ b[i])
        }
    }
    var dist = 0
    for (i = 0; i < res.length; i++) {
        dist += res[i]
    }
    return dist
}
