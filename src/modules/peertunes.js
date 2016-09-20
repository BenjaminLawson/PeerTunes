//native
//var EventEmitter = require('events').EventEmitter
//var inherits = require('inherits')

//3rd party libraries
var hat = require('hat')
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')
var Mustache = require('mustache')
var WebTorrent = require('webtorrent')
var localforage = require('localforage')
var dragDrop = require('drag-drop')
var mediaTags = require('jsmediatags')

//modules
var YT = require('./YT')
var chat = require('./chat')
var onPeer = require('./peer-handler')

// TODO: add element selectors to config
function PeerTunes (config) {
  var self = this

  this.chat = chat
  this.config = config // TODO: use defaults if not provided

  this.tracker = null
  this.torrentClient = null
  this.currentTorrentID = null

  this.isHost = false // true = this peer is a host, false = this peer is a client

  this.peers = [] // peers in swarm

  this.peerId = new Buffer(hat(160), 'hex') // peer ID of this peer: new Buffer(hat(160), 'hex')
  this.dummySelfPeer = null
  //this.username = hat(56)
  this.username = config.username

  this.hostPeer = null // per object of room host

  this.rooms = [] // [{peer, title}]

  this.vote = 0 // vote for current video
  this.rating = 0 // overall song rating

  this.inQueue = false // if this peer is in DJ queue
  this.isDJ = false // this peer is the dj

  this.player = {video: null, audio: null, preview: null} // videojs player objects

  this.host = { // room data used by host
    meta: {title: 'Untitled'},
    guests: [], // client connections
    djQueue: [], // array of DJ's in queue
    rating: 0, //total, updated on new vote or vote change
    votes: {} //{peer: value}, keep track of past votes so total rating can be adjusted if guest changes vote
  }

  this.song = {
    meta: {},
    timeout: null,
    player: null,
    currentlyPlaying: null, // {id, source, infoHash}
    startTime: null, // start time when song started playing, sent to guests instead of current time in song
    infoHash: null, //infohash of torrent if current song is MP3
    play: function (data, time, callback) { // time in milliseconds, callback on metadata available
    	callback = callback.bind(self)

      //call timeout if it wasn't called already
      if (this.timeout != null) {
        clearTimeout(this.timeout)
        this.timeout = null
        self.songTimeout()
      }

      this.currentlyPlaying = data
      var id = data.id
      var source = data.source
      console.log('play id: ' + id + ' time: ' + time + ' from source: ' + source)
      console.log('play data: ', data)

      if (data.title) {
        self.setPlayerTitle(data.title)
      }

      switch (source) {
        case 'YOUTUBE':
          this.player = self.player.video
          this.player.src({ type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + id })
          this.player.currentTime(time / 1000) // milliseconds -> seconds
          this.player.play()

          // show only video player
          $('#vid2').addClass('hide')
          $('#vid1').removeClass('hide')

          YT.getVideoMeta(id, function (meta) {
            console.log('Got YouTube video metadata: ', meta)
            self.song.meta = meta
            console.log(self.song)
            self.setPlayerTitle(meta.title)
            if (callback) callback()
          })
          break
        case 'MP3':
          this.player = self.player.audio
          this.meta.id = id

          // show only audio player
          $('#vid2').removeClass('hide')
          $('#vid1').addClass('hide')

          // if not this user's mp3, download from peers
          if (data.infoHash) {
            console.log('Song has infoHash, leeching')
            self.removeLastTorrent()
            //TODO: callback not being called for long time if MP3 is long
            //TODO: fix the long time it takes for the host to start downloading ('ready') from the guest
            //once it starts, it is fast
            //instant when guest downloads from host
            var tr = self.torrentClient.add(data.infoHash, function (torrent) {
            	self.currentTorrentID = torrent.infoHash
              var file = torrent.files[0]
              console.log('started downloading file: ', file)
              file.renderTo('#vid2_html5_api')
              this.player.currentTime(time / 1000) // milliseconds -> seconds
              this.player.play()
            // PT.song.startTime = new Date()
            }.bind(this)) //song object context
            /*
            tr.on('download', function (bytes) {
						  console.log('just downloaded: ' + bytes)
						  console.log('total downloaded: ' + tr.downloaded);
						  console.log('download speed: ' + tr.downloadSpeed)
						  console.log('progress: ' + tr.progress)
						})
            */
            //add cover to player as soon as download is done
            tr.on('done', function(){
              console.log('torrent finished downloading');
              var file = tr.files[0].getBlob(function (error, blob) {
                if (error) {
                  console.log(error)
                  return
                }
                console.log(blob)
                self.tagsFromFile(blob, function (tags) {
                  self.setPlayerCover(tags.cover)
                })
              })
            })
          } else { // mp3 should be in localStorage
            console.log('Song does not have infoHash, getting from localstorage')
            localforage.getItem(id).then(function (value) {
              // This code runs once the value has been loaded
              // from the offline store.
              // TODO: get id3 data from mp3 file
              var file = new File([value], id, {type: 'audio/mp3', lastModified: Date.now()})

              var url = window.URL.createObjectURL(file)
              console.log('file: ', file)
              console.log('file url: ', url)
              self.song.player.src({ type: 'audio/mp3', src: url })
              self.song.player.currentTime(time / 1000) // milliseconds -> seconds
              self.song.player.play()

              self.tagsFromFile(file, function (tags) {
                self.setPlayerTitle(tags.combinedTitle)
                self.setPlayerCover(tags.cover)
              })


              // TODO: only called first time- fix
              self.song.player.one('loadedmetadata', function () {
                self.song.meta = {
                  duration: self.song.player.duration()
                }
                if (callback) callback()
              })
            }).catch(function (err) {
              console.log('Error retrieving mp3: ', err)
            })
          }

          break
        default:
          console.log("Can't play unknown media type ", source)
      }
      self.rating = 0
      self.vote = 0
    },
    end: function () {
      if (this.player != null) {
        this.player.trigger('ended')
        this.player.pause()
      }
      self.stopAllHeadBobbing()
      self.setPlayerTitle('')
    }
  }

  //cache jQuery selectors
  this.$moshpit = $(config.selectors.moshpit)
  this.$likeButton = $(config.selectors.likeButton)
  this.$dislikeButton = $(config.selectors.dislikeButton)
  this.$joinQueueButton = $(config.selectors.joinQueueButton)
}

PeerTunes.prototype.init = function () {
  var self = this

  console.log('Initializing PeerTunes')

  if (!Peer.WEBRTC_SUPPORT) {
    window.alert('This browser is unsupported. Please use a browser with WebRTC support.')
    return
  }

  // PT.username = prompt('Please enter your username (no spaces):')
  console.log('Your username: ', this.username)

  this.dummySelfPeer = {username: this.username, id: this.peerId}

  //chat setup
  this.config.chat.name = this.username
  chat.init(this.config.chat)

  chat.on('submit', function (text) {
    if (self.isHost) {
      self.broadcastToRoom({msg: 'chat', value: {id: self.username, text: text}})
    } else {
      if (self.hostPeer != null) {
        self.hostPeer.send(JSON.stringify({msg: 'chat', text: text}))
      }
    }

    self.avatarChatPopover(self.username, text)
  })



  // set up tracker
  this.tracker = new Tracker({
    peerId: self.peerId,
    announce: self.config.trackerURL,
    infoHash: new Buffer(20).fill('01234567890123456787'), // temp, use url in future?
    rtcConfig: self.config.rtc
  })
  this.tracker.start()
  this.initTrackerListeners()

  // set up webtorrent
  global.WEBTORRENT_ANNOUNCE = [ this.config.trackerURL ]
  this.torrentClient = new WebTorrent({
    tracker: {
      rtcConfig: self.config.rtc,
      announce: ['wss://tracker.webtorrent.io','wss://tracker.openwebtorrent.com','wss://tracker.btorrent.xyz']
    }
  })

  // set up handlers
  this.initClickHandlers()

  this.player.video = videojs('vid1')
  this.player.audio = videojs('vid2')

  // video listeners
  var players = [this.player.video, this.player.audio]
  this.song.player = this.player.video //arbitrary, used so volume can be changed
  players.forEach(function (player) {
    player.ready(function () {
      // automatically hide/show player when song is playing
      player.on('ended', function () {
        $('#video-frame').hide()
        player.off('timeupdate')
        //self.updateProgress(0)
      })
      player.on('play', function () {
        $('#video-frame').show()

        player.on('timeupdate', function () {
          self.updateProgress(this.currentTime()/this.duration())
        })
      })
    })
  })
  // TODO: move to queue module
  dragDrop('#my-queue', function (files) {
    // console.log('Here are the dropped files', files)
    var file = files[0]
    var key = file.name


    console.log('Reading tags')
    self.tagsFromFile(file, function(tags) {
      self.addSongToQueue({title: tags.combinedTitle, source: 'MP3', id: key})
    })

    // store files in localstorage so they can be seeded in future
    //TODO: add loading indicator while song saved to localstorage
    var blob = new Blob([file])
    localforage.setItem(key, blob).then(function () {

      console.log('Done saving file to localstorage')
      return localforage.getItem(key)
    }).then(function (value) {
      //set successful

    }).catch(function (err) {
      console.log('Error retreiving file:', err)
    })
  })

  // init Dragula in queue
  var drake = dragula([document.querySelector('#my-queue-list')])
  //save queue when reordered
  drake.on('drop', function (el, target, source, sibling) {
    self.saveQueueToLocalStorage()
  })

  //restore queue from localstorage
  this.restoreQueue()

  //key listeners
  var ENTER_KEY = 13

  $('#song-search-input').keydown(function (e) {
    if (e.keyCode == ENTER_KEY) {
      self.doSongSearch()
    }
  })
}

PeerTunes.prototype.initTrackerListeners = function () {
  console.log('Initializing tracker event listeners')
  this.tracker.on('peer', onPeer.bind(this))
  this.tracker.on('update', function (data) {
    // console.log('got an announce response from tracker: ' + data.announce)
    // console.log('number of seeders in the swarm: ' + data.complete)
    // console.log('number of leechers in the swarm: ' + data.incomplete)
  })

  this.tracker.on('error', function (err) {
    // fatal client error!
    console.log('Tracker Error:')
    console.log(err)
  })

  this.tracker.on('warning', function (err) {
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it
    console.log('Tracker Warning:')
    console.log(err)
  })
}

PeerTunes.prototype.initClickHandlers = function () {
  var self = this // cache since 'this' is bound in click callbacks

  console.log('initializing click handlers')

  $('#song-search-submit-button').click(function(e) {
    self.doSongSearch()
  })

  $('#bottom-bar-volume').click(function (e) {
    if (!self.song.player) return

    //not muted
    if (self.song.player.volume() > 0) {
      $(this).removeClass('glyphicon-volume-up').addClass('glyphicon-volume-off')
      self.song.player.volume(0.0)
      return
    }
    //muted
    $(this).removeClass('glyphicon-volume-off').addClass('glyphicon-volume-up')
    //TODO: restore last volume
    self.song.player.volume(1.0)
    
  })

  $('#song-submit-button').click(function (e) {
    $('#song-search-results').html('')
  })

  // create room
  $('#btn-create-room').click(function (e) {
    console.log('create/destroy room clicked')

    $('.audience-member').tooltip('destroy')
    self.$moshpit.html('')
    chat.clear()

    if (self.isHost) { // button = Destroy Room
      $(this).text('Create Room')
      self.stopHosting()
    }else {
      $('#createRoomModal').modal('toggle')
    }
  })

  // modal create room
  $('#modal-btn-create-room').click(function (e) {
  	if ($('#roomNameInput').val().length < 1) {
  		e.stopPropagation()
  		$('#create-room-form-group').addClass('has-error')
  		return
  	}
  	$('#create-room-form-group').removeClass('has-error')
    $('#btn-create-room').text('Destroy Room')
    self.leaveRoom()
    self.startHosting($('#roomNameInput').val())
    $('#roomNameInput').val('')
  })

  $('#btn-leave-room').click(function (e) {
  	$(this).hide()
    self.leaveRoom()
    self.song.end()
  })

  // join DJ queue
  this.$joinQueueButton.click(function (e) {
    console.log('Clicked join/leave queue')
    if (!self.inQueue) {
      self.inQueue = true
      $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue')
      if (self.isHost) {
        self.addDJToQueue(self.dummySelfPeer)
        return
      }
      //is guest, so tell host guest joined
      self.hostPeer.send(JSON.stringify({msg: 'join-queue'}))
      return
    }
    // was already in queue => wants to leave queue
    self.inQueue = false
    $(this).removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
    if (self.isHost) {
      self.removeDJFromQueue(self.dummySelfPeer)
      return
    }
    //is guest, so tell host that guest is leaving
    self.hostPeer.send(JSON.stringify({msg: 'leave-queue'}))
  })

  // rating buttons
  // TODO: keep button active after click
  // TODO: host keeps track of votes changing (eg. changing vote from -1 to +1 should add 2, but the guest can't be trusted for this)
  this.$likeButton.click(function (e) {
    console.log('Rate +1')
    if (self.vote == 0 || self.vote == -1) {
      $('#user-' + self.username + ' .audience-head').addClass('headbob-animation')
      if (self.isHost) {
        self.rating++
        //console.log('Rating: ' + self.rating)
        self.broadcast({msg: 'rate', value: {rating: self.rating, id: self.username, action: 1}}, null)
      } else {
        self.hostPeer.send(JSON.stringify({msg: 'rate', value: 1}))
      }
      self.vote = 1
    }
  })

  this.$dislikeButton.click(function (e) {
    console.log('Rate -1')
    if (self.vote == 1 || self.vote == 0) {
      $('#user-' + self.username + ' .audience-head').removeClass('headbob-animation')
      if (self.isHost) {
        self.rating--
        console.log('Rating: ' + self.rating)
        self.broadcast({msg: 'rate', value: {rating: self.rating, id: self.username, action: -1}}, null)
      } else {
        self.hostPeer.send(JSON.stringify({msg: 'rate', value: -1}))
      }
      self.vote = -1
    }
  })
  // room modal
  $('button[data-target="#roomModal"]').click(function (event) {
    console.log('clicked rooms button')
    self.refreshRoomListing()
  })

  $('#room-refresh').click(function (event) {
    self.refreshRoomListing()
  })
}

PeerTunes.prototype.startHosting = function (title) {
  console.log('Starting hosting')

  this.addAvatar(this.username)
  chat.appendMsg('Notice', 'Room Created')

  this.broadcast({username: this.username})
  this.broadcast({msg: 'new-room', value: title})

  this.addRoom(this.dummySelfPeer, title)
  this.isHost = true
  this.host.meta.title = title
}

PeerTunes.prototype.stopHosting = function () {
  // broadcast to swarm so list is updated
  this.broadcast({msg: 'host-end'})
  this.host.djQueue.length = 0
  this.vote = 0
  this.isHost = false
  this.removeRoom(this.dummySelfPeer)
}

// TODO: use this everywhere
PeerTunes.prototype.sendTo = function (data, peer) {
  console.log('Sending data ', data, ' to peer ', peer.username)
  peer.send(JSON.stringify(data))
}

// TODO: array of peers parameter to replace broadcastToRoom
PeerTunes.prototype.broadcast = function (data, exception) {
  // TODO: only send message to subscribing peers
  console.log('Broadcasting to Swarm: ', data)
  data = JSON.stringify(data) // only need to stringify once
  this.peers.forEach(function (peer) {
    if (peer.connected && peer !== exception) peer.send(data)
  })
}

PeerTunes.prototype.broadcastToRoom = function (data, exception) {
  // TODO: only send message to subscribing peers
  console.log('Broadcasting To Room: ', data)
  data = JSON.stringify(data) // only need to stringify once
  this.host.guests.forEach(function (peer) {
    if (peer.connected && peer !== exception) peer.send(data)
  })
}

PeerTunes.prototype.addRoom = function (peer, title) {
  console.log('Adding room: ' + title)
  this.rooms.push({peer: peer, title: title})
}

PeerTunes.prototype.removeRoom = function (peer) {
  console.log('Removing ' + peer.username + "'s room")
  var index = this.rooms.map(function (r) { return r.peer}).indexOf(peer)
  if (index > -1) this.rooms.splice(index, 1)
}

PeerTunes.prototype.leaveRoom = function () {
  if (this.hostPeer != null) {
    console.log('Leaving room')
    this.hostPeer.send(JSON.stringify({msg: 'leave'}))
    this.hostPeer = null
    this.resetRoom()
  }
}

PeerTunes.prototype.resetRoom = function () {
  $('.audience-member').tooltip('destroy')
  this.$moshpit.html('')
  chat.clear()
  this.song.end()
  $('#btn-leave-room').hide()
}

PeerTunes.prototype.refreshRoomListing = function () {
  console.log('refreshing room listing')

  // make element of all rooms at once, then append
  var template = $('#roomRowTmpl').html()
  Mustache.parse(template)

  var $ul = $('<ul>').addClass('list-unstyled')
  var self = this
  $.each(this.rooms, function (i, room) {
    var id = room.peer.username
    var params = {id: id, title: room.title}
    console.log('Rendering template for: ')
    console.log(params)
    $row = $(Mustache.render(template, params))
    $row.click(function () {
      $('#roomModal').modal('toggle')
      console.log('Joining room: ' + id)
      self.connectToHost(room.peer)
    })
    $ul.append($row)
  })
  $('#roomModal .modal-body').html($ul)
}

PeerTunes.prototype.connectToHost = function (hostPeer) {
  if (this.isHost) {
    // host tries to connect to self
    if (this.peerId == hostPeer.id) return

    // TODO: make nonblocking HUD
    var doDestroy = confirm('Joining a room will destroy your room!')
    if (!doDestroy) return

    this.stopHosting()
    this.resetRoom()
    $('#create-room').text('Create Room')
  }

  console.log('connecting to peer: ' + hostPeer.id)

  this.hostPeer = hostPeer

  //TODO: fix race condition?
  hostPeer.send(JSON.stringify({username: this.username}))
  hostPeer.send(JSON.stringify({msg: 'join-room'}))

  $('#btn-leave-room').show()
}

PeerTunes.prototype.addAvatar = function (id, headbob) {
  console.log('Adding avatar for ', id, ' with headbob ', (headbob === true))
  var x = Math.random() * 80 + 10
  var y = Math.random() * 100 + 5
  var userId = 'user-' + id


  var template = $('#avatarTmpl').html()
  Mustache.parse(template)
  var params = {userId: userId, label: id, avatar: 1, x: x, y: y, z: Math.floor(y)}
  var rendered = Mustache.render(template, params)

  var $avatar = $(rendered)
  if (headbob === true) $avatar.find('.audience-head').addClass('headbob-animation')

  //popover init
  template = $('#popoverTmpl').html()
  Mustache.parse(template)
  var showMenu = (id !== this.username) //don't show menu for self
  console.log("Show menu for ",id,": ",showMenu)
  params = {id: id, menu: showMenu}
  rendered = Mustache.render(template, params)
  $avatar.webuiPopover({title: '', content: rendered, placement:'top', trigger:'hover', padding: false})

  this.$moshpit.append($avatar)
}

PeerTunes.prototype.removeAvatar = function (id) {
  console.log('Removing avatar for ', id)
  var $avatar = $('#user-' + id)
  $avatar.remove()
  $avatar.webuiPopover('destroy')
}

PeerTunes.prototype.stopAllHeadBobbing = function () {
  //console.log('Stopping all head bobbing')
  $('.audience-head').removeClass('headbob-animation')
}

// HOST function
PeerTunes.prototype.playNextDJSong = function () {
  var self = this

  this.song.meta = {}
  this.song.currentlyPlaying = null
  this.song.infoHash = null
  this.host.rating = 0
  this.host.votes = []
  this.vote = 0
  //reset all likes
  this.host.guests.map(function (guest) {
    guest.like = false
    return guest
  })

  if (this.host.djQueue.length > 0) {
    // host is first in dj queue
    if (this.host.djQueue[0] === this.dummySelfPeer) {
      console.log('Host (you) is the next DJ')
      this.isDJ = true

      var media = this.frontOfSongQueue()

      // callback setSongTimeout when video meta is available
      this.song.play({id: media.id, source: media.source}, 0, this.setSongTimeout) // play in host's player

      var now = Date.now()
      this.song.startTime = now

      if (media.source === 'MP3') {
        // start seeding file to guests
        this.seedFileWithKey(media.id, function (torrent) {
          media.infoHash = torrent.infoHash
          self.song.infoHash = torrent.infoHash
          //self.song.currentlyPlaying.
          self.broadcastToRoom({msg: 'song', value: media, dj: self.username, startTime: now}, null)
        })
      }
      else this.broadcastToRoom({msg: 'song', value: media, dj: this.username, startTime: now}, null)
    }else { // host is not first in queue
      // ask front dj for song
      this.host.djQueue[0].send(JSON.stringify({msg: 'queue-front'}))
    }

    return
  }
  console.log('DJ queue empty')
}

//note: 'this' needs to be bound to PeerTunes
PeerTunes.prototype.setSongTimeout = function () {
  var self = this

  console.log('Player meta loaded, duration: ', self.song.meta.duration) // seconds

  //TODO: timeout is wrong if user joined partway through song
  //calculate: duration - current time

  var durationInMilliseconds = this.song.meta.duration * 1000 // seconds -> milliseconds
  this.song.timeout = setTimeout(function () {
      self.songTimeout()
  }, durationInMilliseconds) 
}

PeerTunes.prototype.songTimeout = function () {
  var self = this

  console.log('song ended timeout')

  if (this.isHost) {
    //host is current DJ
    if (this.host.djQueue[0] === this.dummySelfPeer) endDJ()

    this.host.djQueue.shift()
    this.song.currentlyPlaying = {}
    this.song.meta = {}
    this.song.infoHash = null
    this.playNextDJSong()
  } else if (this.isDJ) {
    endDJ()
  }

  this.song.timeout = null
  this.stopAllHeadBobbing()

  function endDJ () {
    self.cycleMyQueue()
    self.isDJ = false
    self.inQueue = false
    $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
  }
}

PeerTunes.prototype.updateProgress = function (decimal) {
  var percent = decimal*100 + '%'
  $('#song-progress-bar').css('width',percent)
}

PeerTunes.prototype.setPlayerTitle = function (title) {
  var maxLength = 65 
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...'
  }
  $('#song-title').text(title)
}

// cover must be URL, can be blob url
PeerTunes.prototype.setPlayerCover = function (cover) {
  if (this.song.player != null) {
    $('#vid2 .vjs-poster').css('background-image','url('+cover+')')
    this.song.player.posterImage.show()
  }


}

// HOST function
PeerTunes.prototype.addDJToQueue = function (peer) {
  console.log('Adding ', peer.username, ' to DJ queue')

  this.host.djQueue.push(peer)

  console.log('DJ queue length: ', this.host.djQueue.length)

  // the queue was empty before, so play the new DJ's song
  if (this.host.djQueue.length === 1) {
    this.playNextDJSong()
  }
}

// HOST function
PeerTunes.prototype.removeDJFromQueue = function (peer) {
  var index = this.host.djQueue.indexOf(peer)
  if (index > -1) {
    this.host.djQueue.splice(index, 1)
    if (index == 0) { // currently playing dj
      clearTimeout(this.song.timeout)
      // check if the dj that left was the only dj
      if (this.host.djQueue.length === 0) {
        this.song.end()
        this.broadcastToRoom({msg: 'end-song'})
      } else {
        this.playNextDJSong()
      }
    }
  }
}

PeerTunes.prototype.addSongToQueue = function (meta) {
  var template = $('#queueItemTmpl').html()
  Mustache.parse(template)
  var params = {title: meta.title,source: meta.source, id: meta.id}
  $('#my-queue-list').append(Mustache.render(template, params))

  this.saveQueueToLocalStorage()
}

PeerTunes.prototype.cycleMyQueue = function () {
  $('#my-queue-list li').first().remove().appendTo('#my-queue-list')
}

PeerTunes.prototype.frontOfSongQueue = function () {
  var queueSize = $('#my-queue-list li').length
  if (queueSize > 0) {
    var $top = $('#my-queue-list li').first()
    var song = {id: $top.data('id'), source: $top.data('source'), title: $top.data('title')}
    console.log('frontOfSongQueue: ', song)
    return song
  }
  return null
}

// HOST function
PeerTunes.prototype.cleanupPeer = function (peer) {
  var self = this

  if (this.isHost) {
    // remove peer if it is in array
    var removedGuest = false
    var removedGuestUsername = ''
    this.host.guests = this.host.guests.filter(function (guest) {
      if (guest !== peer) {
        return true
      }
      self.removeAvatar(guest.username)
      removedGuestUsername = guest.username
      removedGuest = true
      return false
    })
    // only check djQueue if removed peer was a guest
    if (removedGuest) {
      this.broadcastToRoom({msg: 'leave', value: removedGuestUsername})
      this.host.djQueue = this.host.djQueue.filter(function (dj) { return dj !== peer })
    }
    return
  }
}

PeerTunes.prototype.seedFileWithKey = function (key, callback) {
  var self = this

  console.log('Seeding file with key ', key)
  localforage.getItem(key).then(function (value) {
    // This code runs once the value has been loaded
    // from the offline store.
    var file = new File([value], key, {type: 'audio/mp3', lastModified: Date.now()})
    console.log('file: ', file)

    self.removeLastTorrent()
    self.torrentClient.seed(file, function (torrent) {
      console.log('Client is seeding ' + torrent.magnetURI)
      console.log('infoHash: ', torrent.infoHash)
      self.currentTorrentID = torrent.infoHash
      callback(torrent)
    })
  }).catch(function (err) {
    // This code runs if there were any errors
    console.log('Error retrieving mp3: ', err)
  })
}

PeerTunes.prototype.removeLastTorrent = function () {
	if (this.currentTorrentID != null) {
		console.log('Removing torrent: ', this.currentTorrentID)
		this.torrentClient.remove(this.currentTorrentID)
		this.currentTorrentID = null
	}
}

PeerTunes.prototype.tagsFromFile = function (file, callback) {
  mediaTags.read(file, {
      onSuccess: function(tag) {
        tag = tag.tags
        console.log(tag)

        //https://github.com/aadsm/jsmediatags/issues/13
        if (tag.picture) {
            var base64String = ''
            for (var i = 0; i < tag.picture.data.length; i++) {
                base64String += String.fromCharCode(tag.picture.data[i])
            }
            var base64 = 'data:image/jpeg;base64,' + window.btoa(base64String)
            tag.picture = base64
          } else {
            //TODO: use placeholder image
            tag.picture = null
          }


        var meta = {
          artist: tag.artist,
          title: tag.title,
          cover: tag.picture,

          combinedTitle: tag.title + ' - ' + tag.artist //Here Comes the Sun - The Beatles
        }

        callback(meta)
      },
      onError: function(error) {
        console.log('Error reading MP3 tags: ', error)
      }
    })
}

//TODO: fix autoHide hiding other popovers
PeerTunes.prototype.avatarChatPopover = function (id, content) {
  content = '<div class="text-center">'+content+'</div>'

  var selector = '#user-'+id+' .audience-head'
  $user = $(selector)
  var options = {
    title: '', 
    placement: 'top', 
    content: content, 
    trigger:'manual', 
    width: 190, 
    animation: 'pop', 
    multi: true,
    cache: false, //doesn't work?
    autoHide:2600,
    onHide: function ($el) { //hack so content will update
      $user.webuiPopover('destroy')
    }
  }

  $user.webuiPopover(options)

  $user.webuiPopover('show')
}

PeerTunes.prototype.doSongSearch = function() {
  var self = this 

  var search = $('#song-search-input').val()
  if (search.length < 1) return
  YT.getSearchResults(search, function (results) {
    console.log('Search results: ', results)

    var template = $('#songSearchResultTmpl').html()
    Mustache.parse(template)
    
    $('#song-search-results').html('')
    var resultsHTML = ''
    results.forEach(function (item) {
      var params = {title: item.title, id: item.id}
      var rendered = Mustache.render(template, params)
      resultsHTML += rendered
    })
    $('#song-search-results').append(resultsHTML)

    $('.song-search-result').click(function (e){
      $(this).addClass('active')
      var source = 'YOUTUBE' //TODO: get source from current search type
      var id = $(this).data('id')
      var title = $(this).data('title')
      var meta = {title: title, id: id, source: source}
      self.addSongToQueue(meta)
    })
  })
}

PeerTunes.prototype.saveQueueToLocalStorage = function () {
  var queue = []
  //{source, id, title}
  $('#my-queue-list .queue-item').each(function (index) {
    var title = $(this).data('title')
    var source = $(this).data('source')
    var id = $(this).data('id')
    queue.push({title: title, source: source, id: id})
  })
  var queueJSON = {queue: queue}
  console.log('saving queue to localstorage:', queueJSON)
  localforage.setItem('queue', queueJSON).then(function () {
    return localforage.getItem('queue')
  }).then(function (value) {
    console.log('Queue saved to localstorage')
  }).catch(function (err) {
    console.log('Error saving queue: ', err)
  })
}

PeerTunes.prototype.getQueueFromLocalStorage = function (callback) {
  localforage.getItem('queue').then(function(value) {
    console.log('Got queue from localstorage: ', value)
    callback(value.queue)
  }).catch(function(err) {
      console.log('Error retreiving queue from localstorage, maybe this is the first use')
      console.log(err)
  })
}

PeerTunes.prototype.setQueueFromArray = function (queueArray) {
  var self = this
  queueArray.forEach(function (item) {
    self.addSongToQueue(item)
  })
}

PeerTunes.prototype.restoreQueue = function () {
  var self = this

  this.getQueueFromLocalStorage(function (queue) {
    self.setQueueFromArray(queue)
  })
}

module.exports = PeerTunes
