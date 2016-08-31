/*
Only supported target: Chrome

mp3 MediaSource only works in Chrome, not firefox
- play song at current time after song is fully downloaded in firefox?
- download song ahead of time?

Future features:
-seed & play mp3 file (not permanent in queue?)
-drawing (maybe dj whiteboard, or draw and then drawing appears above head)
-store playlist in localstorage
-let user pause, but keep timer so on play it jumps to current time

TODO: use bootstrap list group

TODO: hosts broadcast room population every 5 minutes
TODO: use Dragula for queue drag/drop
TODO: central message type/string object
TODO: change everything to ids, since user doesn't have peer object for themself
TODO: scuttlebutt: https://github.com/dominictarr/scuttlebutt#scuttlebuttevents
TODO: "server" version, bittorrent-tracker works on node.js (just remove player code)
--> put player code in module, don't use on server
--> don't make avatar for server
TODO: templating
TODO: HTML5 indexeddb to seed songs from
https://github.com/localForage/localForage
http://dexie.org/
TODO: uplaod images to imgur
TODO: add currently playing song to playlist
--- if mp3, download torrent and add to localstorage
TODO: download mp3 before song starts
TODO: firefox support
*/

var hat = require('hat')
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')
var Mustache = require('mustache')
var WebTorrent = require('webtorrent')
var localforage = require('localforage')
var dragDrop = require('drag-drop')

// YouTube
var YT = {
  config: {
    apiKey: 'AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY' // YouTube data api key
  },
  getVideoMeta: function (id, callback) {
    var meta = {
      id: id,
      title: '',
      description: '',
      duration: 0 // milliseconds
    }
    var apiQuery = 'https://www.googleapis.com/youtube/v3/videos?id=' + id + '&key=' + YT.config.apiKey + '&part=snippet,contentDetails'
    var firstResult, ISODuration

    console.log('YT API query: ', apiQuery)
    $.getJSON(apiQuery, function (result) {
      console.log('YT API Result: ', result)
      firstResult = result.items[0]
      meta.title = firstResult.snippet.title
      meta.description = firstResult.snippet.description
      // YouTube gives duration in ISO format, need to convert to milliseconds
      ISODuration = firstResult.contentDetails.duration
      meta.duration = moment.duration(ISODuration).asMilliseconds()
      callback(meta)
    })
  }
}

// Soundcloud
var SC = {

}

var PT = {
  config: {
    maxRoomSize: 50, // arbitrary until further testing
    maxChatLength: 300,
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
  // TODO: if peer hash in url, try to connect to that peer
  init: function () {
    console.log('Initializing PeerTunes v0.0.2')
    // PT.username = prompt('Please enter your username (no spaces):')
    console.log('Your username: ', PT.username)
    PT.dummySelfPeer = {username: PT.username, id: PT.peerId}
    // assign common jQuery selectors
    PT.chat.chatBody = $('#chat .panel-body')

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
    PT.initKeyHandlers()

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
                PT.song.end()
                break
              case 'chat':
                var wasAtBottom = PT.chat.isScrolledToBottom()
                if (PT.isHost) {
                  data.text = PT.chat.filter(data.text)
                  PT.broadcastToRoom({msg: 'chat', value: {id: peer.username, text: data.text}}, peer)
                  PT.chat.appendMsg(peer.username, data.text)
                }else {
                  PT.chat.appendMsg(data.value.id, data.value.text)
                }
                if (wasAtBottom) PT.chat.scrollToBottom()
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

                  PT.song.play(songInfo, data.time)
                  // TODO: leave queue if no more dj's in queue
                  $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
                  // was dj for last song => cycle song queue
                  if (PT.isDJ) PT.cycleMyQueue()
                  else if (PT.isDJ) {
                    PT.isDJ = false
                    PT.inQueue = false
                    $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
                  }
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
  initKeyHandlers: function () {
    var key = {
      ENTER: 13
    }

    $('#chat-text').keydown(function (e) {
      if (e.keyCode == key.ENTER) {
        PT.chat.submitMessage()
      }
    })
  },
  initClickHandlers: function () {
    console.log('initializing click handlers')
    // queue
    $('#song-submit-button').click(function (e) {
      PT.addSongToQueue({title: $('#song-submit-text').val(), source: 'YOUTUBE', id: $('#song-submit-text').val()})
      $('#song-submit-text').val('')
    })
    // create room
    $('#btn-create-room').click(function (e) {
      console.log('create/destroy room clicked')

      $('.audience-member').tooltip('destroy')
      $('#moshpit').html('')
      PT.chat.clear()

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
      if (!PT.inQueue) {
        PT.inQueue = true
        if (PT.isHost) {
          PT.addDJToQueue(PT.dummySelfPeer)
        }else {
          PT.hostPeer.send(JSON.stringify({type: 'join-queue'}))
        }
        $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue')
      }else {
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
    // chat
    // TODO max length
    $('#chat-enter').click(function (event) {
      PT.chat.submitMessage()
    })
  },
  startHosting: function (title) {
    console.log('Starting hosting')

    PT.addAvatar(PT.username)
    PT.chat.appendMsg('Notice', 'Room Created')

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
    PT.chat.clear()
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
  chat: {
    chatBody: null,
    appendMsg: function (id, msg) {
      // order important
      msg = PT.chat.filter(msg)
      console.log('chat: [' + id + ' : ' + msg + ']')
      msg = PT.chat.emojify(msg)
      // TODO: use template
      PT.chat.chatBody.append(
        '<div class="message">'
        + '<div class="message-user"><h6>' + id + ':</h6></div>'
        + '<div class="message-text">' + msg + '</div>'
        + '</div>'
      )
    },
    isScrolledToBottom: function () {
      return (PT.chat.chatBody[0].scrollHeight - PT.chat.chatBody[0].offsetHeight - PT.chat.chatBody[0].scrollTop < 1)
    },
    scrollToBottom: function () {
      var height = PT.chat.chatBody[0].scrollHeight
      PT.chat.chatBody.scrollTop(height)
    },
    submitMessage: function () {
      var text = $('#chat-text').val()

      text = PT.chat.filter(text)

      if (text.trim().length > 0) {
        if (PT.isHost) {
          PT.broadcastToRoom({msg: 'chat', value: {id: PT.username + ' [Host]', text: text}})
        }else {
          if (PT.hostPeer != null) {
            PT.hostPeer.send(JSON.stringify({msg: 'chat', text: text}))
          }
        }

        PT.chat.appendMsg(PT.username, text)
        $('#chat-text').val('')
        PT.chat.scrollToBottom()
      }
    },
    clear: function () {
      $('#chat .panel-body').html('')
    },
    filter: function (msg) {
      // truncate
      if (msg.length > PT.config.maxChatLength) {
        msg = msg.substring(0, PT.config.maxChatLength)
      }
      // strip html
      msg = $('<p>').html(msg).text()

      return msg
    },
    emojify: function (msg) {
      // replace common ascii emoticons with shortnames
      msg = msg.replace(/:\)/g, ':smile:')
      msg = msg.replace(/:D/g, ':grin:')
      msg = msg.replace(/<3/g, ':heart:')

      // convert emoji shortnames to image tags
      msg = emojione.shortnameToImage(msg)

      return msg
    }
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
      PT.chat.clear()
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

          // show only vide player
          $('#vid2').addClass('hide')
          $('#vid1').removeClass('hide')

          PT.song.player.play()
          PT.song.player.one('loadedmetadata', callback)
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
              PT.song.player.one('loadedmetadata', callback)
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
        // don't start playing video until callback
        var media = PT.frontOfSongQueue()
        if (media.source === 'YOUTUBE') {
          YT.getVideoMeta(media.id, function (meta) {
            PT.song.meta = meta
          })
        }

        // callback setSongTimeout when video meta is available
        // TODO: seed song
        PT.song.play({id: media.id, source: media.source}, 0, PT.setSongTimeout) // play in host's player
        if (media.source === 'MP3') {
          PT.seedFileWithKey(media.id, function (torrent) {
            media.infoHash = torrent.infoHash
            PT.broadcastToRoom({type: 'song', value: media, dj: PT.username, time: 0}, null)
          })
        }
        else PT.broadcastToRoom({type: 'song', value: media, dj: PT.username, time: 0}, null)

        PT.cycleMyQueue()
      }else { // host is not first in queue
        // ask front dj for song
        PT.host.djQueue[0].send(JSON.stringify({type: 'queue-front'}))
      }

      return
    }
    console.log('DJ queue empty')
    PT.song.meta = {}
  },
  setSongTimeout: function () {
    console.log('Player meta loaded, duration: ', PT.song.player.duration())
    if (PT.isHost) {
      PT.song.timeout = setTimeout(function () {
        console.log('song ended')
        PT.host.djQueue.shift()
        PT.inQueue = false
        PT.playNextDJSong()
      }, PT.song.player.duration() * 1000) // seconds -> milliseconds
    }
    // TODO
    PT.song.currentlyPlaying = {}
    PT.song.meta = {}
  },
  // HOST function
  addDJToQueue: function (djId) {
    PT.host.djQueue.push(djId)
    if (PT.host.djQueue.length == 1) {
      PT.playNextDJSong()
    }
  },
  // HOST function
  removeDJFromQueue: function (peer) {
    var index = PT.host.djQueue.indexOf(peer)
    if (index > -1) {
      PT.host.djQueue.splice(index, 1)
      if (index == 0) { // currently playing dj
        clearTimeout(PT.song.timeout)
        // check if the dj that left was the only dj
        if (PT.host.djQueue.length == 0) {
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
    $('.sortable').sortable()
  },
  cycleMyQueue: function () {
    $('#my-queue-list li').first().remove().appendTo('#my-queue-list')
    $('.sortable').sortable() // moving element breaks sortable, need to initialize again :P
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

$(document).ready(PT.init)
