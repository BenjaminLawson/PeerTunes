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

//modules
var YT = require('./YT')
var chat = require('./chat')
var onPeer = require('./peer-handler')
var SongQueue = require('./queue')
var TagReader = require('./tag-reader')
var Player = require('./player')

// TODO: add element selectors to config
function PeerTunes (config) {
  var self = this

  this.chat = chat
  this.config = config // TODO: use defaults if not provided

  this.tracker = null
  this.torrentClient = null
  this.currentTorrentID = null

  this.isHost = false  //this peer is hosting a room

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

  //this.player = {video: null, audio: null, preview: null} // videojs player objects
  //this.volume = 1.0

  this.songQueue = new SongQueue(config.songQueue)
  this.tagReader = new TagReader()

  this.host = { // room data used by host
    meta: {title: 'Untitled'}, //room title
    guests: [], // peers subscribed to room
    djQueue: [], //peers in dj wait list
    rating: 0, //total, updated on new vote or vote change
    votes: {} //{peer: value}, keep track of past votes so total rating can be adjusted if guest changes vote
  }

  this.song = {
    meta: {},
    timeout: null,
    player: null, //videojs player object of current player (video or audio)
    currentlyPlaying: null, // {id, source, infoHash}
    startTime: null, // start time when song started playing, sent to guests instead of current time in song
    infoHash: null, //infohash of torrent if current song is MP3
    play: function (data, time, callback) { // time in milliseconds, callback on metadata available
    	callback = callback.bind(self)

      console.log()

      //call song timeout if it wasn't called already
      //TODO: doesn't work if mp3 joined part way because timeout not set
      self.doSongTimeout()

      this.currentlyPlaying = data
      var id = data.id
      var source = data.source
      var duration = data.duration
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

          //restore volume if player changed
          self.setPlayerVolume(self.volume)

          // show only video player
          $('#vid2').addClass('hide')
          $('#vid1').removeClass('hide')

          //TODO: use data.duration/title instead
          YT.getVideoMeta(id, function (meta) {
            console.log('Got YouTube video metadata: ', meta)
            self.song.meta = meta
            self.setPlayerTitle(meta.title)
            if (callback) callback()
          })
          break
        case 'MP3':
          this.player = self.player.audio
          this.meta = {
            id: id,
            duration: duration
          }
          this.meta.id = id
          self.setPlayerCover(null)

          // show only audio player
          $('#vid2').removeClass('hide')
          $('#vid1').addClass('hide')

          if (data.infoHash) { // is not this user's mp3 => download from peers
            console.log('Song has infoHash, leeching')
            self.removeLastTorrent()
            self.currentTorrentID = data.infoHash
            var tr = self.torrentClient.add(data.infoHash, function (torrent) {
              var file = torrent.files[0]
              console.log('started downloading file: ', file)
              file.renderTo('#vid2_html5_api')

              //TODO: setting current time doesn't work- wait until metadata loaded?
              //this.player.currentTime(time / 1000)

              this.player.play()

              //restore volume if player changed
              self.setPlayerVolume(self.volume)

              if (callback) callback()

              //TODO: fix this hack
              //TODO: this hack doesn't work properly
              var hackDelay = 120
              setTimeout(function(){ self.song.player.currentTime((time+hackDelay) / 1000)}, hackDelay)
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
            tr.on('warning', function (err) {
              console.log('torrent warning: ', err)
            })
            tr.on('metadata', function () {
              console.log('torrent metadata loaded')
            }.bind(this))
            tr.on('noPeers', function (announceType) {
              console.log('torrent has no peers from source ',announceType)
            })
            tr.on('wire', function (wire) {
              console.log('torrent: connected to new peer')
            })
            tr.on('done', function(){
              console.log('torrent finished downloading');
              var file = tr.files[0].getBlob(function (error, blob) {
                if (error) {
                  console.log(error)
                  return
                }
                console.log(blob)
                self.tagReader.tagsFromFile(blob, function (tags) {
                  self.setPlayerCover(tags.cover)
                })
              })
            })
          } else { // mp3 should be in localStorage
            console.log('Song does not have infoHash, getting from localstorage')
            localforage.getItem(id).then(function (value) {
              // This code runs once the value has been loaded
              // from the offline store.
              var file = new File([value], id, {type: 'audio/mp3', lastModified: Date.now()})

              //TODO: revoke object url
              var url = window.URL.createObjectURL(file)

              //console.log('file: ', file)
              //console.log('file url: ', url)
              self.song.player.src({ type: 'audio/mp3', src: url })
              self.song.player.currentTime(time / 1000) // milliseconds -> seconds
              self.song.player.play()

              //restore volume if player changed
              self.setPlayerVolume(self.volume)

              self.tagReader.tagsFromFile(file, function (tags) {
                self.setPlayerTitle(tags.combinedTitle)
                self.setPlayerCover(tags.cover)
              })


              //TODO: get duration from queue-item instead
              self.song.player.one('loadedmetadata', function () {
                console.log('player mp3 metadata loaded')
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
      console.log('ending song')
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
  this.$volumeSlider = $(config.selectors.volumeSlider)
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

    self.avatarChatPopover(self.username, chat.emojify(text) )
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
      announce: ['wss://tracker.openwebtorrent.com','wss://tracker.btorrent.xyz','wss://tracker.webtorrent.io']
    }
  })

  this.torrentClient.on('torrent', function (torrent) {
    console.log('[Torrent client] torrent ready: ', torrent)
  })
  this.torrentClient.on('error', function (err) {
    console.log('[Torrent client] error: ', err)
  })

  // set up handlers
  this.initClickHandlers()


  // init Dragula in queue
  //TODO: prevent top song from being dragged if DJ
  var drake = dragula([document.querySelector('#my-queue-list')])
  //save queue when reordered
  drake.on('drop', function (el, target, source, sibling) {
    self.songQueue.saveToLocalStorage()
  })

  //restore queue from localstorage
  this.songQueue.restore()

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

  this.$volumeSlider.on('change mousemove', function() {
    var volume = $(this).val()/100
    self.setPlayerVolume($(this).val()/100)
  })

  $('#song-search-submit-button').click(function(e) {
    self.doSongSearch()
  })

  //TODO: breaks when switching between audio/video players
  //doesn't stay when switching from audio->video players
  $('#volume-button').click(function (e) {
    if (!self.song.player) return

    //not muted
    if (self.song.player.volume() > 0) {
      self.setPlayerVolume(0.0)
      self.$volumeSlider.val(0)
      return
    }
    //muted
    self.setPlayerVolume(1.0)
    self.$volumeSlider.val(100)
    
  })

  $('#add-song-button').click(function (e) {
    $('#song-search-results').html('')
    $('#song-search-input').val('')
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
    console.log('Clicked join/leave queue, inQueue: ', self.inQueue)
    if (!self.inQueue) {
      console.log('joined DJ queue')
      self.inQueue = true
      console.log('inQueue: ', self.inQueue)
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
    console.log('left DJ queue')

    self.inQueue = false
    console.log('inQueue: ', self.inQueue)
    $(this).removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
    if (self.isDJ) {
      //self.doSongTimeout()
      self.isDJ = false
    }
    if (self.isHost) {
      self.removeDJFromQueue(self.dummySelfPeer)
    } else {
      //is guest, so tell host that guest is leaving
      self.hostPeer.send(JSON.stringify({msg: 'leave-queue'}))
    }
    
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

  if (this.host.djQueue[0] === this.dummySelfPeer) this.isDJ = true

  console.log('play next DJ, isDJ: ', this.isDJ)
  console.log('Play next DJ from queue with length ', this.host.djQueue.length)
  if (this.host.djQueue.length > 0) {
    // host is first in dj queue
    if (this.isDJ) {
      console.log('Host (you) is the next DJ')

      var media = this.songQueue.front()

      //TODO: set currently playing
      //this.song.currentlyPlaying = media

      // callback setSongTimeout when video meta is available
      this.song.play({id: media.id, source: media.source}, 0, this.setSongTimeout) // play in host's player

      var now = Date.now()
      this.song.startTime = now

      if (media.source === 'MP3') {
        //TODO: wait until metadata is loaded => send duration
        // start seeding file to guests
        this.seedFileWithKey(media.id, function (torrent) {
          media.infoHash = torrent.infoHash
          self.song.infoHash = torrent.infoHash
          self.broadcastToRoom({msg: 'song', value: media, dj: self.username, startTime: now}, null)
        })
      }
      else this.broadcastToRoom({msg: 'song', value: media, dj: this.username, startTime: now}, null)
    }else { // host is not first in queue
      // ask front dj for song
      //TODO: set timeout for skipping this dj if he doesn't respond
      this.host.djQueue[0].send(JSON.stringify({msg: 'queue-front'}))
    }

    return
  }
  console.log('DJ queue empty')
}

PeerTunes.prototype.doSongTimeout = function () {
  //console.log('do song timeout called')
  if (this.song.timeout != null) {
    console.log('Doing song timeout prematurely & nullifying it')
    clearTimeout(this.song.timeout)
    this.song.timeout = null
    this.songTimeout()
  }
}

//note: 'this' needs to be bound to PeerTunes
PeerTunes.prototype.setSongTimeout = function () {
  var self = this

  console.log('setting song timeout with duration: ', self.song.meta.duration) // seconds

  //TODO: timeout is wrong if user joined partway through song
  //calculate: duration - current time

  var durationInMilliseconds = this.song.meta.duration * 1000 // seconds -> milliseconds
  this.song.timeout = setTimeout(function () {
      self.songTimeout()
  }, durationInMilliseconds)
}

//executes before next song, or after last song
//TODO: getting called immediately for mp3s?
/*
  types of song end reactions:
  - host needs to manage djs
  - users & host need to know when song ended for head bobbing, title, rating
    queue cycling
  - player 
*/
PeerTunes.prototype.songTimeout = function () {
  var self = this

  console.log('songTimeout')
  console.log('inQueue at timeOut:', self.inQueue)

  this.song.end()
  this.song.timeout = null
  this.stopAllHeadBobbing()
  this.setPlayerTitle('')
  //this.updateProgress(0) //gets overridden :(

  console.log('Songtimeout queue length: ', this.host.djQueue.length)

  console.log('songtimeout isDJ: ', this.isDJ)
  if (this.isDJ) {
    endDJ()
  }

  if (this.isHost) {
    //host is current DJ
    //if (this.host.djQueue[0] === this.dummySelfPeer) endDJ()
    if (this.host.djQueue.length > 0) {
      console.log('Shifting queue:', this.host.djQueue)
      var front = this.host.djQueue.shift()
      this.host.djQueue.push(front)
    }
    

    this.song.currentlyPlaying = {}
    this.song.meta = {}
    this.song.infoHash = null

    this.playNextDJSong()
  }



  function endDJ () {
    console.log('DJing ended')
    self.songQueue.cycle()
    self.isDJ = false
  }
}

/*
PeerTunes.prototype.updateProgress = function (decimal) {
  var percent = decimal*100 + '%'
  $('#song-progress-bar').css('width',percent)
}
*/

/*
PeerTunes.prototype.setPlayerTitle = function (title) {
  var maxLength = 65 
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...'
  }
  $('#song-title').text(title)
}
*/

/*
// cover must be URL, can be blob url
PeerTunes.prototype.setPlayerCover = function (cover) {
  if (this.song.player == null) {
    this.song.player.posterImage.hide()
    return
  }
  $('#vid2 .vjs-poster').css('background-image','url('+cover+')')
  this.song.player.posterImage.show()
}
*/

//setting uninitialized player volume doesn't work
/*
PeerTunes.prototype.setPlayerVolume = function (volume) {
  var players = [this.player.video, this.player.audio]
  this.volume = volume
  players.forEach( function (player) {
    player.volume(volume)
  })

  var $volumeButton = $('#volume-button')
  if (this.volume === 0) {
    $volumeButton.removeClass('glyphicon-volume-up').addClass('glyphicon-volume-off')
  } else {
    $volumeButton.removeClass('glyphicon-volume-off').addClass('glyphicon-volume-up')
  }
}
*/

// HOST function
PeerTunes.prototype.addDJToQueue = function (peer) {
  console.log('Adding ', peer.username, ' to DJ queue')

  console.log('DJ queue length before: ', this.host.djQueue.length)

  this.host.djQueue.push(peer)

  console.log('DJ queue length after: ', this.host.djQueue.length)

  // the queue was empty before, so play the new DJ's song
  if (this.host.djQueue.length === 1) {
    this.playNextDJSong()
  }
}

// HOST function
//TODO: fix next song playing when leaving queue
PeerTunes.prototype.removeDJFromQueue = function (peer) {
  console.log('Removing DJ from queue:', peer.username)
  console.log('DJ queue length: ', this.host.djQueue.length)
  console.log('Queue before:', this.host.djQueue)
  var index = this.host.djQueue.indexOf(peer)
  if (index > -1) {
    this.host.djQueue.splice(index, 1)
    if (index === 0) { //removed dj was currently playing dj
      // check if the dj that left was the only dj
      if (this.host.djQueue.length === 0) {
        console.log('removed dj was last dj => ending song')
        this.doSongTimeout()
        this.broadcastToRoom({msg: 'end-song'})
      }
    }
  }
  console.log('Queue after:', this.host.djQueue)
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

//callback when seeding finished setting up
PeerTunes.prototype.seedFileWithKey = function (key, callback) {
  var self = this
  //console.log('Seeding file with key ', key)
  localforage.getItem(key).then(function (value) {
    // This code runs once the value has been loaded
    // from the offline store.
    var file = new File([value], key, {type: 'audio/mp3', lastModified: Date.now()})
    //console.log('file: ', file)

    self.removeLastTorrent()
    self.torrentClient.seed(file, function (torrent) {
      console.log('Client is seeding ' + key)
      self.currentTorrentID = torrent.infoHash

      torrent.on('wire', function (wire) {
        console.log('torrent: connected to new peer')
      })

      //TODO: fix this hack - seed ready callback is too early?
      //or trackers take time to register peer
      //delay necessary to increase chance seeding has started
      //the larger the file, the longer timeout needs to be
      //possible fix: start seeding long before song is requested (eg. always seed top song)

      //BEST FIX: start leeching before seeding, then start seeding (triggers announce event)
      //another possible fix: use addPeer
      setTimeout(function(){ callback(torrent) }, 100)
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
      var params = {title: item.title, id: item.id, duration: item.duration}
      var rendered = Mustache.render(template, params)
      resultsHTML += rendered
    })
    $('#song-search-results').append(resultsHTML)

    $('.song-search-result').click(function (e){
      $(this).addClass('active')
      var source = 'YOUTUBE' //TODO: get source from current search type (only YT for now)
      var id = $(this).data('id')
      var title = $(this).data('title')
      var duration = $(this).data('duration')
      var meta = {title: title, id: id, source: source, duration: duration}
      self.songQueue.addSong(meta)
    })
  })
}






module.exports = PeerTunes
