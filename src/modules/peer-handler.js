// Peer Handler 

var YT = require('./YT')

module.exports = onPeer

//always call with 'self' bound to PeerTunes
function onPeer (peer) {
		var self = this
        // don't add duplicate peers
        // won't work with multiple trackers
        if (this.peers.map(function (p) { return p.id }).indexOf(peer.id) > -1) return

        console.log('Tracker sent new peer: ' + peer.id)

        this.peers.push(peer)

        if (peer.connected) onConnect()
        else peer.once('connect', onConnect)

        function onConnect () {
          console.log('Peer connected: ' + peer.id)
          console.log('Number of peers: ' + self.peers.length)

          peer.on('data', onMessage)
          peer.on('close', onClose)
          peer.on('error', onClose)
          peer.on('end', onClose)

          if (self.isHost) {
            peer.send(JSON.stringify({username: self.username}))
            peer.send(JSON.stringify({msg: 'new-room', value: self.host.meta.title}))
          }

          function onClose () {
            console.log('Peer disconnected: ' + peer.id)

            peer.removeListener('data', onMessage)
            peer.removeListener('close', onClose)
            peer.removeListener('error', onClose)
            peer.removeListener('end', onClose)

            // no check since peer must be in array
            self.peers.splice(self.peers.indexOf(peer), 1)
            self.removeRoom(peer)

            // removes guest & tell other guests
            if (self.isHost) self.cleanupPeer(peer)

            // the host of the current room disconnected
            if (peer === self.hostPeer) {
              self.hostPeer = null
              self.resetRoom()
              $('#btn-leave-room').hide()
            }

            console.log('Number of peers: ' + self.peers.length)
          }

          function onMessage (data) {
            //console.log('Received message: ' + data)
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
              switch (data.msg) {
                case 'new-room':
                  // TODO: send username with new-room
                  console.log('Adding room ' + data.value)
                  self.addRoom(peer, data.value)
                  break
                case 'host-end':
                  console.log('Host closed room: ' + peer.username)
                  self.removeRoom(peer)
                  self.resetRoom()
                  break
                case 'join-room':
                  if (self.isHost) {
                    self.host.guests.push(peer)

                    // user should have sent username first
                    self.addAvatar(peer.username)
                    self.broadcastToRoom({msg: 'new-user', value: peer.username})

                    // send old users
                    for (var i = self.host.guests.length - 1; i >= 0; i--) {
                      // TODO: send current head bobbing states, maybe assign state to guest peers
                      // send new client all users except themself
                      if (self.host.guests[i] != peer) peer.send(JSON.stringify({msg: 'new-user', value: self.host.guests[i].username}))
                    }

                    // send host (self), since host isn't in guests array
                    peer.send(JSON.stringify({msg: 'new-user', value: self.username}))

                    // send current song info
                    if (self.song.currentlyPlaying != null) {
                      var song = self.song.currentlyPlaying
                      if (self.song.infoHash != null) song.infoHash = self.song.infoHash
                      console.log('Sending new user song: ', song)
                      var data = {type: 'song', value: song, dj: self.host.djQueue[0].username, startTime: self.song.startTime}
                      peer.send(JSON.stringify(data))
                    }
                  }
                  break
                case 'new-user':
                  // verify that message actually came from room host
                  if (peer === self.hostPeer) self.addAvatar(data.value)
                  break
                case 'rate': // note: object format different if sent from guest->host vs. host->guests (additional value.rating property)
                  console.log('Received rating update: ', data.value)

                  // TODO fix self
                  if (self.isHost) { // update rating & relay to other guests
                    self.rating = (data.value == 1) ? self.rating + 1 : self.rating - 1
                    console.log('Updated Rating: ' + self.rating)
                    self.broadcast({type: 'rate', value: {rating: self.rating, id: peer.username, action: data.value}}, peer)

                    if (data.value == 1) { // like
                      $('#user-' + peer.username + ' .audience-head').addClass('headbob-animation')
                    }
                    else if (data.value == -1) { // dislike
                      $('#user-' + peer.username + ' .audience-head').removeClass('headbob-animation')
                    }
                  }else {
                    if (data.value.action == 1) { // like
                      $('#user-' + data.value.id + ' .audience-head').addClass('headbob-animation')
                    }
                    else if (data.value.action == -1) { // dislike
                      $('#user-' + data.value.id + ' .audience-head').removeClass('headbob-animation')
                    }
                  }
                  break
                case 'leave-queue':
                  if (self.isHost) self.removeDJFromQueue(peer)
                  break
                case 'end-song':
                  // end song prematurely (eg. the host leaves dj queue while their song is playing)
                  //TODO: remove timeout, but still execute timeout code
                  //if (PT.isDJ) PT.song.timeout
                  self.song.end()
                  break
                case 'chat':
                  var wasAtBottom = self.chat.isScrolledToBottom()
                  if (self.isHost) {
                    data.text = self.chat.filter(data.text)
                    self.broadcastToRoom({msg: 'chat', value: {id: peer.username, text: data.text}}, peer)
                    self.chat.appendMsg(peer.username, data.text)
                  }else {
                    self.chat.appendMsg(data.value.id, data.value.text)
                  }
                  if (wasAtBottom) self.chat.scrollToBottom()
                  break
                case 'leave':
                  if (self.isHost) self.cleanupPeer(peer)
                  else self.removeAvatar(data.value)
                  break
                default:
                  console.log('unknown message: ' + data.msg)
              }
            }
            // deprecated
            if (data.type) {
              if (self.isHost) {
                switch (data.type) {
                  case 'join-queue':
                    var isAlreadyInQueue = false
                    for (var i = self.host.djQueue.length - 1; i >= 0; i--) {
                      if (self.host.djQueue[i] == peer) {
                        isAlreadyInQueue = true
                        break // breaks from for loop only
                      }
                    }
                    if (!isAlreadyInQueue) {
                      self.addDJToQueue(peer)
                    }
                    break
                  case 'song':
                    // request song answer from guest
                    // verify dj is at front of queue
                    // TODO: prevent front dj from repeatedly submitting songs
                    if (peer === self.host.djQueue[0]) {
                      // don't start playing video until callback

                      if (data.value.source === 'YOUTUBE') {
                        YT.getVideoMeta(data.value.id, function (meta) {
                          self.song.meta = meta
                        })
                      }

                      var songInfo = {id: data.value.id, source: data.value.source}
                      if (data.value.infoHash) {
                      	songInfo.infoHash = data.value.infoHash
                      	self.song.infoHash = data.value.infoHash
                      }

                      self.song.play(songInfo, 0, self.setSongTimeout); // play in host's player
                      var now = Date.now()
      	  						self.song.startTime = now
                      self.broadcastToRoom({type: 'song', value: songInfo, dj: peer.username, startTime: now}, null)
                    }
                    break
                  default:
                    console.log('Received data of unkown type: ', data.type)
                }
              }else { // guest
                switch (data.type) {
                  case 'song':
                    //TODO: fix dj queue button states
                    //move queue code to song end event
                    //since there might not be a next song

                    console.log('Received song data')
                    self.vote = 0
                    self.stopAllHeadBobbing()
                    self.rating = 0

                    var songInfo = {id: data.value.id, source: data.value.source}

                    if (data.dj === self.username) {
                      self.isDJ = true
                    }else {
                      // only add infoHash if not the DJ, since DJ already has file
                      if (data.value.infoHash) songInfo.infoHash = data.value.infoHash
                    }
                  	var currentTime = Date.now() - data.startTime
                  	console.log('Calculated current time = ', currentTime)
                    self.song.play(songInfo, currentTime, self.setSongTimeout)
                    break
                  case 'queue-front':
                  // host asks for dj's song at front of queue
                  // implies self dj is at the front of the dj queue

                    // ignore if not from host
                    if (peer !== self.hostPeer) return

                    var queueFront = self.frontOfSongQueue()
                    if (queueFront.source === 'MP3') {
                      // TODO: destroy last downloaded/seeded torrent
                      self.removeLastTorrent()
                      self.seedFileWithKey(queueFront.id, function (torrent) {
                      	self.currentTorrentID = torrent.infoHash
                        queueFront.infoHash = torrent.infoHash
                        self.hostPeer.send(JSON.stringify({type: 'song', value: queueFront}))
                      })
                    }else {
                    	//TODO: send song duration, since streaming doesn't support duration
                      self.hostPeer.send(JSON.stringify({type: 'song', value: queueFront}))
                    }
                    break
                  default:
                    console.log('received unknown data type: ', data.type)

                }
              }
            }
          }
        }
      }