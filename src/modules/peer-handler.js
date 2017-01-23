// Peer Handler 
//TODO: use event emitter to decouple peer specific code from PT code

var YT = require('./YT')

module.exports = onPeer

//always call with 'self' bound to PeerTunes
function onPeer (peer) {
  var self = this
  // don't add duplicate peers
  //TODO: won't work with multiple trackers
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
            // TODO: check if room already added
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
              self.broadcastToRoom({msg: 'new-user', value: {username: peer.username, like: false}})

              peer.like = false

              // send old users
              for (var i = self.host.guests.length - 1; i >= 0; i--) {
                // TODO: send current head bobbing states, maybe assign state to guest peers
                // send new client all users except themself
                var guest = self.host.guests[i]
                if (self.host.guests[i] !== peer) peer.send(JSON.stringify({msg: 'new-user', value: {username: guest.username, like: guest.like}}))
              }

              // send host (self), since host isn't in guests array
              peer.send(JSON.stringify({msg: 'new-user', value: {username: self.username, like: (self.vote === 1)}}))
	      
              // send current song info
              if (self.songManager.isPlaying()) {
                var song = self.songManager.getMeta()
                console.log('Sending new user song: ', song)
                var currentSong = {msg: 'song', value: song, dj: self.host.djQueue[0].username}
                peer.send(JSON.stringify(currentSong))
              }
            }
            break
          case 'new-user':
            // verify that message actually came from room host
            if (peer === self.hostPeer) {
              self.addAvatar(data.value.username, data.value.like)
            }
            break
          case 'rate': // note: object format different if sent from guest->host vs. host->guests (additional value.rating property)
	    // TODO: separate message name for guest, host

            console.log('Received rating update: ', data.value)

            if (self.isHost) { // update rating & relay to other guests
              // TODO: check if guest/host has already voted
              self.rating = (data.value === 1) ? self.rating + 1 : self.rating - 1
              console.log('Updated Rating: ' + self.rating)
              self.broadcast({msg: 'rate', value: {rating: self.rating, id: peer.username, action: data.value}}, peer)

              if (data.value == 1) { // like
                peer.like = true
                $('#user-' + peer.username + ' .audience-head').addClass('headbob-animation')
              }
              else { // dislike
                peer.like = false
                $('#user-' + peer.username + ' .audience-head').removeClass('headbob-animation')
              }
            } else {
              if (data.value.action === 1) { // like
                $('#user-' + data.value.id + ' .audience-head').addClass('headbob-animation')
              }
              else { // dislike
                $('#user-' + data.value.id + ' .audience-head').removeClass('headbob-animation')
              }
            }

            break
          case 'leave-queue':
            if (!self.isHost) return

            self.removeDJFromQueue(peer)
            break
          case 'end-song':
            // end song prematurely (eg. the host leaves dj queue while their song is playing)
            self.onSongEnd()
            break
          case 'chat':
            // verify that message actually came from room host
            if (!self.isHost && peer !== self.hostPeer) return
            // TODO: verify message came from guest
            var message = data.value
            // don't trust peer
            message.message = self.chatModel.filter(message.message)

            if (self.isHost) {
              // don't trust peer
              message.username = peer.username
              self.broadcastToRoom({msg: 'chat', value: message}, peer)

              self.chatModel.receiveMessage(message)

              self.avatarChatPopover(message.username, emojione.shortnameToImage(message.message))
            } else {
              self.chatModel.receiveMessage(message)
              self.avatarChatPopover(message.username, emojione.shortnameToImage(message.message))
            }
            break
          case 'leave':
            //TODO: check if peer was in dj queue & remove
            if (self.isHost) self.cleanupPeer(peer)
            else self.removeAvatar(data.value)
            break
          case 'join-queue':
          	if (!self.isHost) break
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
          case 'queue-front':
            // host asks for dj's song at front of queue
            // implies this dj is at the front of the dj queue for now

            // ignore if not from host
            if (peer !== self.hostPeer) return

            var queueFront = self.songQueue.front()
            if (queueFront.source === 'MP3') {
              //TODO: wait until metadata is loaded => send duration, since streaming doesn't support duration
              //TODO: get infohash more effeciently (parse-torrent ?)
              self.seedFileWithKey(queueFront.id, function (torrent) {
                self.currentTorrentID = torrent.infoHash
                queueFront.infoHash = torrent.infoHash
                
                self.hostPeer.send(JSON.stringify({msg: 'song', value: queueFront}))
              })
            
            } else {
              self.hostPeer.send(JSON.stringify({msg: 'song', value: queueFront}))
            }
            break
          case 'song':
            if (self.isHost) {
              // TODO: prevent front dj from repeatedly submitting songs
              // TODO: check data types
              // verify dj is at front of queue
              if (peer === self.host.djQueue[0]) {
                // don't start playing video until callback

                var songInfo = {id: data.value.id, source: data.value.source, duration: data.value.duration}
                if (data.value.infoHash) {
                  songInfo.infoHash = data.value.infoHash
                  self.songManager.setInfoHash = data.value.infoHash
                }

                if (data.value.source === 'YOUTUBE') {
                  /*
                  YT.getVideoMeta(data.value.id, function (meta) {
                    self.song.meta = meta
                  })
                  */
                }
                switch (data.value.source) {
                  case 'YOUTUBE':
		  /*
                    YT.getVideoMeta(data.value.id, function (meta) {
                      self.song.meta = meta
                    })
		    */
                    break
                  case 'MP3':
                    songInfo.title = data.value.title
                    break
                }

                self.player.play(songInfo, 0) // play in host's player
                self.broadcastToRoom({msg: 'song', value: songInfo, dj: peer.username, currentTime: 0}, null)
              }
              break
            }
            // is guest
            console.log('Received song data')

            self.vote = 0
            self.rating = 0

            var songInfo = {id: data.value.id, source: data.value.source, duration: data.value.duration}

            if (data.value.source === 'MP3') {
              songInfo.title = data.value.title
            }

            if (data.dj === self.username) {
              self.isDJ = true
              //causes announce message after other peers have connected
              /*
              self.seedFileWithKey(queueFront.id, function (torrent) {
                console.log('Seeding for real this time')
              })
              */
            } else {
              // only add infoHash if not the DJ, since DJ already has file
              if (data.value.infoHash) songInfo.infoHash = data.value.infoHash
            }

            console.log('current time = ', data.value.currentTime)
            self.player.play(songInfo, data.value.currentTime)
            break
          default:
            console.log('unknown message: ' + data.msg)
        }
      }
    }
  }
}
