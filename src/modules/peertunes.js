var hat = require('hat')
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')
var Mustache = require('mustache')
var WebTorrent = require('webtorrent')
var localforage = require('localforage')
var dragDrop = require('drag-drop')

var YT = require('./YT')
var chat = require('./chat')

var PT = (function (PT) {
  //private
  PT = {
    config: {
      maxRoomSize: 50, // arbitrary until further testing
      trackerURL: 'wss://tracker.webtorrent.io'
    },
    tracker: null,
    torrentClient: null,
    isHost: false, // true = this peer is a host, false = this peer is a client
    peers: [], // peers in swarm
    peerId: new Buffer(hat(160), 'hex'), // peer ID of this peer: new Buffer(hat(160), 'hex')
    dummySelfPeer: null,
    username: hat(56),
    hostPeer: null, // per object of room host
    rooms: [], // {peer, title}
    vote: 0, // vote for current video
    rating: 0, // overall song rating
    inQueue: false, // if this peer is in DJ queue
    isDJ: false, // this peer is the dj
    player: {video: null, audio: null, preview: null}, // videojs player objects
    host: { // room data
      // TODO: make object literal instead of array?
      meta: {title: ''},
      guests: [], // client connections
      djQueue: [] // array of DJ's in queue
    },
    initTrackerListeners: function () {
      console.log('Initializing tracker event listeners')
      PT.tracker.on('peer', function (peer) {
        // don't add duplicate peers
        // won't work with multiple trackers
        if (PT.peers.map(function (p) { return p.id }).indexOf(peer.id) > -1) return

        console.log('Tracker sent new peer: ' + peer.id)

        PT.peers.push(peer)

        if (peer.connected) onConnect()
        else peer.once('connect', onConnect)

        function onConnect () {
          console.log('Peer connected: ' + peer.id)
          console.log('Number of peers: ' + PT.peers.length)

          peer.on('data', onMessage)
          peer.on('close', onClose)
          peer.on('error', onClose)
          peer.on('end', onClose)

          if (PT.isHost) {
            peer.send(JSON.stringify({username: PT.username}))
            peer.send(JSON.stringify({msg: 'new-room', value: PT.host.meta.title}))
          }

          function onClose () {
            console.log('Peer disconnected: ' + peer.id)

            peer.removeListener('data', onMessage)
            peer.removeListener('close', onClose)
            peer.removeListener('error', onClose)
            peer.removeListener('end', onClose)

            // no check since peer must be in array
            PT.peers.splice(PT.peers.indexOf(peer), 1)
            PT.removeRoom(peer)

            // removes guest & tell other guests
            if (PT.isHost) PT.cleanupPeer(peer)

            // the host of the current room disconnected
            if (peer === PT.hostPeer) {
              PT.hostPeer = null
              PT.resetRoom()
              $('#btn-leave-room').hide()
            }

            console.log('Number of peers: ' + PT.peers.length)
          }

          function onMessage (data) {
            console.log('Received message: ' + data)
            try {
              data = JSON.parse(data)
              console.log(data)
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
                  PT.addRoom(peer, data.value)
                  break
                case 'host-end':
                  console.log('Host closed room: ' + peer.username)
                  PT.removeRoom(peer)
                  // TODO: end song, clear chat
                  break
                case 'join-room':
                  if (PT.isHost) {
                    PT.host.guests.push(peer)

                    // user should have sent username first
                    PT.addAvatar(peer.username)
                    PT.broadcastToRoom({msg: 'new-user', value: peer.username})

                    // send old users
                    for (var i = PT.host.guests.length - 1; i >= 0; i--) {
                      // TODO: send current head bobbing states, maybe assign state to guest peers
                      // send new client all users except themself
                      if (PT.host.guests[i] != peer) peer.send(JSON.stringify({msg: 'new-user', value: PT.host.guests[i].username}))
                    }

                    // send host (self), since host isn't in guests array
                    peer.send(JSON.stringify({msg: 'new-user', value: PT.username}))

                    // send current song info
                    // TODO
                    if (PT.song.currentlyPlaying != null) {
                      var timeSinceStart = PT.song.player.currentTime()
                      var song = PT.song.currentlyPlaying
                      console.log('Sending new user song: ', song)
                      var data = {type: 'song', value: song, dj: PT.host.djQueue[0].username, time: timeSinceStart}
                      peer.send(JSON.stringify(data))
                    }
                  }
                  break
                case 'new-user':
                  // verify that message actually came from room host
                  if (peer === PT.hostPeer) PT.addAvatar(data.value)
                  break
                case 'rate': // note: object format different if sent from guest->host vs. host->guests (additional value.rating property)
                  console.log('Received rating update: ', data.value)

                  // TODO fix this
                  if (PT.isHost) { // update rating & relay to other guests
                    PT.rating = (data.value == 1) ? PT.rating + 1 : PT.rating - 1
                    console.log('Updated Rating: ' + PT.rating)
                    PT.broadcast({type: 'rate', value: {rating: PT.rating, id: peer.username, action: data.value}}, peer)

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
                  if (PT.isHost) PT.removeDJFromQueue(peer)
                  break
                case 'end-song':
                  // end song prematurely (eg. the host leaves dj queue while their song is playing)
                  //TODO: remove timeout, but still execute timeout code
                  //if (PT.isDJ) PT.song.timeout
                  PT.song.end()
                  break
                case 'chat':
                  var wasAtBottom = chat.isScrolledToBottom()
                  if (PT.isHost) {
                    data.text = chat.filter(data.text)
                    PT.broadcastToRoom({msg: 'chat', value: {id: peer.username, text: data.text}}, peer)
                    chat.appendMsg(peer.username, data.text)
                  }else {
                    chat.appendMsg(data.value.id, data.value.text)
                  }
                  if (wasAtBottom) chat.scrollToBottom()
                  break
                case 'leave':
                  if (PT.isHost) PT.cleanupPeer(peer)
                  else PT.removeAvatar(data.value)
                  break
                default:
                  console.log('unknown message: ' + data.msg)
              }
            }
            // deprecated
            if (data.type) {
              if (PT.isHost) {
                switch (data.type) {
                  case 'join-queue':
                    var isAlreadyInQueue = false
                    for (var i = PT.host.djQueue.length - 1; i >= 0; i--) {
                      if (PT.host.djQueue[i] == peer) {
                        isAlreadyInQueue = true
                        break // breaks from for loop only
                      }
                    }
                    if (!isAlreadyInQueue) {
                      PT.addDJToQueue(peer)
                    }
                    break
                  case 'song':
                    // request song answer from guest
                    // verify dj is at front of queue
                    // TODO: prevent front dj from repeatedly submitting songs
                    if (peer === PT.host.djQueue[0]) {
                      // don't start playing video until callback

                      if (data.value.source === 'YOUTUBE') {
                        YT.getVideoMeta(data.value.id, function (meta) {
                          PT.song.meta = meta
                        })
                      }

                      var songInfo = {id: data.value.id, source: data.value.source}
                      if (data.value.infoHash) songInfo.infoHash = data.value.infoHash

                      PT.song.play(songInfo, 0, PT.setSongTimeout); // play in host's player
                      PT.song.startTime = Date.now()
                      PT.broadcastToRoom({type: 'song', value: songInfo, dj: peer.username, time: 0}, null)
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
                    PT.vote = 0
                    PT.stopAllHeadBobbing()
                    PT.rating = 0

                    var songInfo = {id: data.value.id, source: data.value.source}

                    if (data.dj === PT.username) {
                      PT.isDJ = true
                    }else {
                      // only add infoHash if not the DJ
                      if (data.value.infoHash) songInfo.infoHash = data.value.infoHash
                    }

                    PT.song.play(songInfo, data.time, PT.setSongTimeout)
                    break
                  case 'queue-front':
                  // host asks for dj's song at front of queue
                  // implies this dj is at the front of the dj queue

                    // ignore if not from host
                    if (peer !== PT.hostPeer) return

                    var queueFront = PT.frontOfSongQueue()
                    if (queueFront.source === 'MP3') {
                      // TODO: destroy last downloaded/seeded torrent
                      PT.seedFileWithKey(queueFront.id, function (torrent) {
                        queueFront.infoHash = torrent.infoHash
                        PT.hostPeer.send(JSON.stringify({type: 'song', value: queueFront}))
                      })
                    }else {
                      PT.hostPeer.send(JSON.stringify({type: 'song', value: queueFront}))
                    }
                    break
                  default:
                    console.log('received unknown data type: ', data.type)

                }
              }
            }
          }
        }
      })
      PT.tracker.on('update', function (data) {
        // console.log('got an announce response from tracker: ' + data.announce)
        // console.log('number of seeders in the swarm: ' + data.complete)
        // console.log('number of leechers in the swarm: ' + data.incomplete)
      })

      PT.tracker.on('error', function (err) {
        // fatal client error!
        console.log('Tracker Error:')
        console.log(err)
      })

      PT.tracker.on('warning', function (err) {
        // a tracker was unavailable or sent bad data to the client. you can probably ignore it
        console.log('Tracker Warning:')
        console.log(err)
      })
    },
    initClickHandlers: function () {
      console.log('initializing click handlers')
      // queue
      $('#song-submit-button').click(function (e) {
        console.log('clicked submit song')
        var id = $('#song-submit-text').val()
        YT.getVideoMeta(id, function (meta) {
          console.log('Adding ', meta.title)
          PT.addSongToQueue({title: meta.title, source: 'YOUTUBE', id: id})
        })
        $('#song-submit-text').val('')
      })
      // create room
      $('#btn-create-room').click(function (e) {
        console.log('create/destroy room clicked')

        $('.audience-member').tooltip('destroy')
        $('#moshpit').html('')
        chat.clear()

        if (PT.isHost) { // button = Destroy Room
          $(this).text('Create Room')
          PT.stopHosting()
        }else {
          $('#createRoomModal').modal('toggle')
        }
      })

      // modal create room
      $('#modal-btn-create-room').click(function (e) {
        $('#btn-create-room').text('Destroy Room')
        PT.leaveRoom()
        PT.startHosting($('#roomNameInput').val())
        $('#roomNameInput').val('')
      })

      $('#btn-leave-room').click(function (e) {
        PT.leaveRoom()
        $(this).hide()
      })

      // join DJ queue
      $('#btn-join-queue').click(function (e) {
        console.log('Clicked join/leave queue')
        if (!PT.inQueue) {
          PT.inQueue = true
          if (PT.isHost) {
            PT.addDJToQueue(PT.dummySelfPeer)
          }else {
            PT.hostPeer.send(JSON.stringify({type: 'join-queue'}))
          }
          $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue')
        } else { //is already in queue
          PT.inQueue = false
          $(this).removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
          if (PT.isHost) {
            PT.removeDJFromQueue(PT.dummySelfPeer)
          }else {
            PT.hostPeer.send(JSON.stringify({msg: 'leave-queue'}))
          }
        }
      })

      // rating buttons
      // TODO: keep button active after click
      // TODO: host keeps track of votes changing (eg. changing vote from -1 to +1 should add 2, but the guest can't be trusted for this)
      $('#like-button').click(function (e) {
        console.log('Rate +1')
        if (PT.vote == 0 || PT.vote == -1) {
          $('#user-' + PT.username + ' .audience-head').addClass('headbob-animation')
          if (PT.isHost) {
            PT.rating++
            console.log('Rating: ' + PT.rating)
            PT.broadcast({msg: 'rate', value: {rating: PT.rating, action: 1}}, null)
          }else {
            PT.hostPeer.send(JSON.stringify({msg: 'rate', value: 1}))
          }
          PT.vote = 1
        }
      })
      $('#dislike-button').click(function (e) {
        console.log('Rate -1')
        if (PT.vote == 1 || PT.vote == 0) {
          $('#user-' + PT.username + ' .audience-head').removeClass('headbob-animation')
          if (PT.isHost) {
            PT.rating--
            console.log('Rating: ' + PT.rating)
            PT.broadcast({msg: 'rate', value: {rating: PT.rating, action: -1}}, null)
          }else {
            PT.hostPeer.send(JSON.stringify({msg: 'rate', value: -1}))
          }
          PT.vote = -1
        }
      })
      // room modal
      $('button[data-target="#roomModal"]').click(function (event) {
        console.log('clicked rooms button')
        PT.refreshRoomListing()
      })

      $('#room-refresh').click(function (event) {
        PT.refreshRoomListing()
      })
    },
    startHosting: function (title) {
      console.log('Starting hosting')

      PT.addAvatar(PT.username)
      chat.appendMsg('Notice', 'Room Created')

      PT.broadcast({username: PT.username})
      PT.broadcast({msg: 'new-room', value: title})

      PT.addRoom(PT.dummySelfPeer, title)
      PT.isHost = true
      PT.host.meta.title = title
    },
    stopHosting: function () {
      // broadcast to swarm so list is updated
      PT.broadcast({msg: 'host-end'})
      PT.host.djQueue.length = 0
      PT.vote = 0
      PT.isHost = false
      PT.removeRoom(PT.dummySelfPeer)
    },
    // TODO: use this everywhere
    sendTo: function (data, peer) {
      console.log('Sending data ', data, ' to peer ', peer.username)
      peer.send(JSON.stringify(data))
    },
    // TODO: array of peers parameter to replace broadcastToRoom
    broadcast: function (data, exception) {
      // TODO: only send message to subscribing peers
      console.log('Broadcasting to Swarm: ', data)
      data = JSON.stringify(data) // only need to stringify once
      PT.peers.forEach(function (peer) {
        if (peer.connected && peer !== exception) peer.send(data)
      })
    },
    broadcastToRoom: function (data, exception) {
      // TODO: only send message to subscribing peers
      console.log('Broadcasting To Room: ', data)
      data = JSON.stringify(data) // only need to stringify once
      PT.host.guests.forEach(function (peer) {
        if (peer.connected && peer !== exception) peer.send(data)
      })
    },
    // TODO: change to rooms{all[], add(),remove(),}
    addRoom: function (peer, title) {
      console.log('Adding room: ' + title)
      PT.rooms.push({peer: peer, title: title})
    },
    removeRoom: function (peer) {
      console.log('Removing ' + peer.username + "'s room")
      var index = PT.rooms.map(function (r) { return r.peer}).indexOf(peer)
      if (index > -1) PT.rooms.splice(index, 1)
    },
    leaveRoom: function () {
      if (PT.hostPeer != null) {
        console.log('Leaving room')
        PT.hostPeer.send(JSON.stringify({msg: 'leave'}))
        PT.hostPeer = null
        PT.resetRoom()
      }
    },
    resetRoom: function () {
      $('.audience-member').tooltip('destroy')
      $('#moshpit').html('')
      chat.clear()
    },
    refreshRoomListing: function () {
      console.log('refreshing room listing')

      // make element of all rooms at once, then append
      var template = $('#roomRowTmpl').html()
      Mustache.parse(template)

      var $ul = $('<ul>').addClass('list-unstyled')
      $.each(PT.rooms, function (i, room) {
        var id = room.peer.username
        var params = {id: id, title: room.title}
        console.log('Rendering template for: ')
        console.log(params)
        $row = $(Mustache.render(template, params))
        $row.click(function () {
          $('#roomModal').modal('toggle')
          console.log('Joining room: ' + id)
          PT.connectToHost(room.peer)
          $('#btn-leave-room').show()
        })
        $ul.append($row)
      })
      $('#roomModal .modal-body').html($ul)
    },
    connectToHost: function (hostPeer) {
      if (PT.isHost) {
        // host tries to connect to self
        if (PT.peerId == hostPeer.id) return

        // TODO: make nonblocking HUD
        var doDestroy = confirm('Joining a room will destroy your room!')
        if (!doDestroy) return

        PT.stopHosting()
        $('.audience-member').tooltip('destroy')
        $('#moshpit').html('')
        chat.clear()
        $('#create-room').text('Create Room')
      }

      console.log('connecting to peer: ' + hostPeer.id)

      PT.hostPeer = hostPeer
      hostPeer.send(JSON.stringify({username: PT.username}))
      hostPeer.send(JSON.stringify({msg: 'join-room'}))
    },
    addAvatar: function (id) {
      var x = Math.random() * 80 + 10
      var y = Math.random() * 100 + 5
      var userId = 'user-' + id
      $('#moshpit').append('\
              <div id="' + userId + '"class="audience-member" style="left: ' + x + '%; top: ' + y + '%; z-index: ' + Math.floor(y) + '"\
                  data-toggle="tooltip" title="' + id + '">\
                  <img src="./img/avatars/1_HeadBack.png" class="audience-head" />\
                  <img src="./img/avatars/1_BodyBack.png" class="audience-body" />\
              </div>\
              ')
      $('#' + userId).tooltip()
    },
    removeAvatar: function (id) {
      console.log('Removing avatar for ', id)
      $('#user-' + id).remove()
      $('#user-' + id).tooltip('destroy')
    },
    stopAllHeadBobbing: function () {
      $('.audience-head').removeClass('headbob-animation')
    },
    song: {
      meta: {},
      timeout: null,
      player: null,
      currentlyPlaying: null, // {id, source, infoHash}
      play: function (data, time, callback) { // callback on metadata available
        PT.song.currentlyPlaying = data
        var id = data.id
        var source = data.source
        console.log('play id: ' + id + ' time: ' + time + ' from source: ' + source)
        console.log('play data: ', data)

        switch (source) {
          case 'YOUTUBE':
            PT.song.player = PT.player.video
            PT.song.player.src({ type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + id })
            PT.song.player.currentTime(time / 1000)

            // show only video player
            $('#vid2').addClass('hide')
            $('#vid1').removeClass('hide')

            YT.getVideoMeta(id, function (meta) {
              console.log('Got YouTube video metadata: ', meta)
              PT.song.meta = meta
              PT.song.player.play()
              if (callback) callback()
            })
            break
          case 'MP3':
            PT.song.player = PT.player.audio
            PT.song.meta.id = id

            // show only audio player
            $('#vid2').removeClass('hide')
            $('#vid1').addClass('hide')

            // if not this user's mp3, download from peers
            if (data.infoHash) {
              console.log('Song has infoHash, leeching')
              PT.torrentClient.add(data.infoHash, function (torrent) {
                var file = torrent.files[0]
                console.log('started downloading file: ', file)
                file.renderTo('#vid2_html5_api')
                PT.song.player.currentTime(time / 1000)
                PT.song.player.play()
              })
            }else { // mp3 should be in localStorage
              console.log('Song does not have infoHash, getting from localstorage')
              localforage.getItem(id).then(function (value) {
                // This code runs once the value has been loaded
                // from the offline store.
                // TODO: get id3 data from mp3 file
                var file = new File([value], id, {type: 'audio/mp3', lastModified: Date.now()})
                var url = window.URL.createObjectURL(file)
                console.log('file: ', file)
                console.log('file url: ', url)
                PT.song.player.src({ type: 'audio/mp3', src: url })
                PT.song.player.currentTime(time / 1000)
                PT.song.player.play()
                //TODO: only called first time- fix
                PT.song.player.one('loadedmetadata', function(){
                  PT.song.meta = {
                    duration: PT.song.player.duration()
                  }
                  if (callback) callback()
                })
              }).catch(function (err) {
                // This code runs if there were any errors
                console.log('Error retrieving mp3: ', err)
              })
            }

            break
          default:
            console.log("Can't play unknown media type ", source)
        }
        PT.rating = 0
        PT.vote = 0
        PT.stopAllHeadBobbing()
      },
      end: function () {
        PT.song.player.trigger('ended')
        PT.song.player.pause()
      }
    },
    // HOST function
    playNextDJSong: function () {
      if (PT.host.djQueue.length > 0) {
        // host is first in dj queue
        if (PT.host.djQueue[0] === PT.dummySelfPeer) {
          console.log('Host (you) is the next DJ')
          PT.isDJ = true

          var media = PT.frontOfSongQueue()

          // callback setSongTimeout when video meta is available
          PT.song.play({id: media.id, source: media.source}, 0, PT.setSongTimeout) // play in host's player

          if (media.source === 'MP3') {
            //start seeding file to guests
            PT.seedFileWithKey(media.id, function (torrent) {
              media.infoHash = torrent.infoHash
              PT.broadcastToRoom({type: 'song', value: media, dj: PT.username, time: 0}, null)
            })
          }
          else PT.broadcastToRoom({type: 'song', value: media, dj: PT.username, time: 0}, null)

        }else { // host is not first in queue
          // ask front dj for song
          PT.host.djQueue[0].send(JSON.stringify({type: 'queue-front'}))
        }

        return
      }
      console.log('DJ queue empty')
      PT.song.meta = {}
    },
    //TODO: move functionality otu of timeout so it can be called if song ends prematurely
    //since videojs meta is only loaded once
    setSongTimeout: function () {
      console.log('Player meta loaded, duration: ', PT.song.meta.duration) //seconds
      if (PT.isHost) {
        PT.song.timeout = setTimeout(function () {
          console.log('song ended')

          if (PT.host.djQueue[0] === PT.dummySelfPeer) {
            PT.cycleMyQueue()
            PT.isDJ = false
            PT.inQueue = false
            $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
          }

          PT.host.djQueue.shift()
          PT.song.currentlyPlaying = {}
          PT.song.meta = {}
          PT.playNextDJSong()
        }, PT.song.meta.duration * 1000) //seconds -> milliseconds
      } else if (PT.isDJ){
        //TODO: use videojs end event for guests
        PT.song.timeout = setTimeout(function () {
          console.log('song ended')
          PT.isDJ = false
          PT.inQueue = false
          $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')

          PT.host.djQueue.shift()
        }, PT.song.meta.duration * 1000) //seconds -> milliseconds
      }
    },
    // HOST function
    addDJToQueue: function ( peer ) {
      console.log('Adding ', peer.username, ' to DJ queue')

      PT.host.djQueue.push( peer )

      console.log('DJ queue length: ', PT.host.djQueue.length)

      //the queue was empty before, so play the new DJ's song
      if (PT.host.djQueue.length === 1) {
        PT.playNextDJSong()
      }
    },
    // HOST function
    removeDJFromQueue: function ( peer ) {
      var index = PT.host.djQueue.indexOf( peer )
      if (index > -1) {
        PT.host.djQueue.splice(index, 1)
        if (index == 0) { // currently playing dj
          clearTimeout(PT.song.timeout)
          // check if the dj that left was the only dj
          if (PT.host.djQueue.length === 0) {
            PT.song.end()
            PT.broadcastToRoom({msg: 'end-song'})
          }else {
            PT.playNextDJSong()
          }
        }
      }
    },
    addSongToQueue: function (meta) {
      var template = $('#queueItemTmpl').html()
      Mustache.parse(template)
      var params = {title: meta.title,source: meta.source, id: meta.id}
      $('#my-queue-list').append(Mustache.render(template, params))
    },
    cycleMyQueue: function () {
      $('#my-queue-list li').first().remove().appendTo('#my-queue-list')
    },
    frontOfSongQueue: function () {
      var queueSize = $('#my-queue-list li').length
      if (queueSize > 0) {
        var $top = $('#my-queue-list li').first()
        var song = {id: $top.data('id'), source: $top.data('source')}
        console.log('frontOfSongQueue: ', song)
        return song
      }
      return null
    },
    // HOST function
    cleanupPeer: function (peer) {
      if (PT.isHost) {
        // remove peer if it is in array
        var removedGuest = false
        var removedGuestUsername = ''
        PT.host.guests = PT.host.guests.filter(function (guest) {
          if (guest !== peer) {
            return true
          }
          PT.removeAvatar(guest.username)
          removedGuestUsername = guest.username
          removedGuest = true
          return false
        })
        // only check djQueue if removed peer was a guest
        if (removedGuest) {
          PT.broadcastToRoom({msg: 'leave', value: removedGuestUsername})
          PT.host.djQueue = PT.host.djQueue.filter(function (dj) { return dj !== peer })
        }
        return
      }
    },
    seedFileWithKey: function (key, callback) {
      console.log('Seeding file with key ', key)
      localforage.getItem(key).then(function (value) {
        // This code runs once the value has been loaded
        // from the offline store.
        var file = new File([value], key, {type: 'audio/mp3', lastModified: Date.now()})
        console.log('file: ', file)
        PT.torrentClient.seed(file, function (torrent) {
          console.log('Client is seeding ' + torrent.magnetURI)
          console.log('infoHash: ', torrent.infoHash)
          callback(torrent)
        })
      }).catch(function (err) {
        // This code runs if there were any errors
        console.log('Error retrieving mp3: ', err)
      })
    }
  }
  //public
  return {
    init: function () {
      console.log('Initializing PeerTunes v0.0.2')
      // PT.username = prompt('Please enter your username (no spaces):')
      console.log('Your username: ', PT.username)

      PT.dummySelfPeer = {username: PT.username, id: PT.peerId}

      // assign chat selectors
      chat.setBody('#chat .panel-body')
      chat.setInput('#chat-text')
      chat.setEnterButton('#chat-enter')
      chat.init()

      chat.setNickname(PT.username)

      chat.onSubmitSuccess(function (text) {
        if (PT.isHost) {
          PT.broadcastToRoom({msg: 'chat', value: {id: PT.username + ' [Host]', text: text}})
        } else {
          if (PT.hostPeer != null) {
            PT.hostPeer.send(JSON.stringify({msg: 'chat', text: text}))
          }
        }
      })

      if (!Peer.WEBRTC_SUPPORT) {
        window.alert('This browser is unsupported. Please use a browser with WebRTC support.')
      }

      console.log('Connecting to ws tracker: ' + PT.config.trackerURL)
      // set up tracker
      PT.tracker = new Tracker({
        peerId: PT.peerId,
        announce: PT.config.trackerURL,
        infoHash: new Buffer(20).fill('01234567890123456789') // temp
      })
      PT.tracker.start()
      PT.initTrackerListeners()

      // set up webtorrent
      // TODO: rtcConfig
      global.WEBTORRENT_ANNOUNCE = [ PT.config.trackerURL ]
      PT.torrentClient = new WebTorrent()

      // set up handlers
      PT.initClickHandlers()

      PT.player.video = videojs('vid1')
      PT.player.audio = videojs('vid2')

      // video listeners
      var players = [PT.player.video, PT.player.audio]
      players.forEach(function (player) {
        player.ready(function () {
          // automatically hide/show player when song is playing
          this.on('ended', function () {
            $('#video-frame').hide()
          })
          this.on('play', function () {
            $('#video-frame').show()
          })
        })
      })
      //TODO: move to queue module
      dragDrop('#my-queue', function (files) {
        // console.log('Here are the dropped files', files)
        var file = files[0]
        var key = file.name
        // var fileURL = window.URL.createObjectURL(file)
        // console.log('url before: ', fileURL)
        var blob = new Blob([file])
        // TODO: get title of mp3?
        // store files in localstorage so they can be seeded in future
        localforage.setItem(key, blob).then(function () {
          PT.addSongToQueue({title: key, source: 'MP3', id: key})
          return localforage.getItem(key)
        }).then(function (value) {
          // get and set successful

        }).catch(function (err) {
          console.log('Error retreiving file:', err)
        })
      })

      //init Dragula in queue
      dragula([document.querySelector('#my-queue-list')]);
    }
  }
}(PT || {}))

module.exports = PT