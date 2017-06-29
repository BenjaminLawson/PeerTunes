// native
// var EventEmitter = require('events').EventEmitter
// var inherits = require('inherits')

// Globals
//var $, emojione

// 3rd party libraries
var hat = require('hat')
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')
var Mustache = require('mustache')
var WebTorrent = require('webtorrent')
var localforage = require('localforage')
var Doc = require('crdt').Doc

// modules
var YT = require('./YT')
var Player = require('./player')
var SongManager = require('./song-manager')
var Lobby = require('./lobby')
var HostedRoom = require('./hosted-room')

// chat
var ChatController = require('../controllers/chat-controller')
var ChatView = require('../views/chat-view')
var ChatModel = require('../models/chat-model')

// queue
var QueueController = require('../controllers/queue-controller')
var QueueView = require('../views/queue-view')
var QueueModel = require('../models/queue-model')

// TODO: add element selectors to config
function PeerTunes (config) {
  var self = this

  if (!Peer.WEBRTC_SUPPORT) {
    window.alert('This browser is unsupported. Please use a browser with WebRTC support.')
    return
  }

  this.config = config // TODO: use defaults if not provided

  // Chat
  this.chatModel = new ChatModel({
    username: config.username,
    maxMessageLength: 400
  })
  this.chatView = new ChatView(this.chatModel, config.chat)
  this.chatController = new ChatController(this.chatView, this.chatModel)

  // Song Queue
  this.queueModel = new QueueModel({
    localstorageKey: config.songQueue.localstorageKey
  })
  this.queueView = new QueueView(this.queueModel, {
    itemTemplate: config.songQueue.itemTemplate,
    songQueue: config.songQueue.queue
  })
  this.queueController = new QueueController(this.queueView, this.queueModel, {
    queueItem: config.songQueue.queueItem
  })

  this.tracker = null
  this.currentTorrentID = null


  // set up webtorrent
  global.WEBTORRENT_ANNOUNCE = [ this.config.trackerURL ]
  this.torrentClient = new WebTorrent({
    tracker: {
      rtcConfig: self.config.rtc,
      announce: ['wss://tracker.openwebtorrent.com', 'wss://tracker.btorrent.xyz']
    }
  })

  this.torrentClient.on('torrent', function (torrent) {
    console.log('[Torrent client] torrent ready: ', torrent)
  })
  this.torrentClient.on('error', function (err) {
    console.log('[Torrent client] error: ', err)
  })

  this.isHost = false  // this peer is hosting a room

  this.username = config.username

  config.player.torrentClient = this.torrentClient
  this.player = new Player(config.player)

  this.host = { // room data used by host
    meta: {title: 'Untitled'}, // room title
  }

  this.songManager = new SongManager()
  this.songManager.on('song-end', this.onSongEnd.bind(this))


  // replace ascii with emoji
  emojione.ascii = true

  // lobby set up
  this.room = null
  this._doc = null
  this._chatSet = null
  this.lobby = this._joinLobby()


  // cache jQuery selectors
  this.$moshpit = $(config.selectors.moshpit)
  this.$likeButton = $(config.selectors.likeButton)
  this.$dislikeButton = $(config.selectors.dislikeButton)
  this.$joinQueueButton = $(config.selectors.joinQueueButton)
  this.$volumeSlider = $(config.selectors.volumeSlider)

  // set up handlers
  this.initClickHandlers()
}

PeerTunes.prototype.initClickHandlers = function () {
  var self = this // cache since 'this' is bound in click callbacks

  console.log('initializing click handlers')

  // key listeners
  var ENTER_KEY = 13

  $('#song-search-input').keydown(function (e) {
    if (e.keyCode === ENTER_KEY) {
      self.doSongSearch()
    }
  })

  this.$volumeSlider.on('change mousemove', function () {
    var volume = $(this).val() / 100
    self.player.setVolume(volume)
  })

  $('#song-search-submit-button').click(function (e) {
    self.doSongSearch()
  })

  // TODO: breaks when switching between audio/video players
  // doesn't stay when switching from audio->video players
  $('#volume-button').click(function (e) {
    // if (!self.player) return

    // not muted
    if (self.player.getVolume() > 0) {
      self.player.setVolume(0.0)
      self.$volumeSlider.val(0)
      return
    }
    // muted
    self.player.setVolume(1.0)
    self.$volumeSlider.val(100)
  })

  $('#add-song-button').click(function (e) {
    $('#song-search-results').html('')
    $('#song-search-input').val('')
  })

  // create room
  $('#btn-create-room').click(function (e) {
    console.log('create/destroy room clicked')

    if (self.room) {
      self.resetRoom()
    }

    if (self.isHost) { // button = Destroy Room
      self.songManager.end()
      self.lobby.closeRoom()

      $(this).text('Create Room')
    } else {
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
    if (self.room) {
      self.leaveRoom()
    }
    var roomName = $('#roomNameInput').val()
    self.room = self.lobby.createRoom(roomName)
    self.joinDocForRoom(self.room)
    $('#roomNameInput').val('')
  })

  $('#btn-leave-room').click(function (e) {
    $(this).hide()
    self.leaveRoom()
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
      // is guest, so tell host guest joined
      self.hostPeer.send(JSON.stringify({msg: 'join-queue'}))
      return
    }
    // was already in queue => wants to leave queue
    console.log('left DJ queue')

    self.inQueue = false
    console.log('inQueue: ', self.inQueue)
    $(this).removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')

    if (self.isHost) {
      self.removeDJFromQueue(self.dummySelfPeer)
    } else {
      // is guest, so tell host that guest is leaving
      self.hostPeer.send(JSON.stringify({msg: 'leave-queue'}))
    }

    if (self.isDJ) {
      self.isDJ = false
    }
  })

  // rating buttons
  // TODO: keep button active after click
  // TODO: host keeps track of votes changing (eg. changing vote from -1 to +1 should add 2, but the guest can't be trusted for this)
  this.$likeButton.click(function (e) {
    console.log('Rate +1')
    if (self.vote === 0 || self.vote === -1) {
      $('#user-' + self.username + ' .audience-head').addClass('headbob-animation')
      if (self.isHost) {
        self.rating++
        // console.log('Rating: ' + self.rating)
        self.broadcast({msg: 'rate', value: {rating: self.rating, id: self.username, action: 1}}, null)
      } else {
        self.hostPeer.send(JSON.stringify({msg: 'rate', value: 1}))
      }
      self.vote = 1
    }
  })

  this.$dislikeButton.click(function (e) {
    console.log('Rate -1')
    if (self.vote === 1 || self.vote === 0) {
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

PeerTunes.prototype._joinLobby = function () {
  var self = this
  
  var lobby = new Lobby({
    maxPeers: 6,
    public: self.config.keys.public,
    private: self.config.keys.private,
    nicename: self.username
  })

  lobby.on('rooms:add', function (room) {
    console.log('new room added to lobby: ', room)
  })

  return lobby
}

// pubkey is base64 encoded public key of room host
PeerTunes.prototype.joinRoom = function (pubkey) {
  var self = this
  console.log('joining room')

  pubkey = atob(pubkey)

  this.room = new HostedRoom({
    hostKey: pubkey,
    isHost: false,
    public: self.config.keys.public,
    private: self.config.keys.private,
    nicename: self.username
  })

  this.joinDocForRoom(this.room)

  $('#btn-leave-room').show()
}

PeerTunes.prototype.joinDocForRoom = function (room) {
  var self = this
  
  this._doc = new Doc()
  this._chatSeq = this._doc.createSeq('type', 'chat')

  this._chatSeq.on('add', function (row) {
    row = row.toJSON()
    self.chatModel.addMessage({username: row.username, message: row.message})
  })

  this.chatController.on('chat:submit', function (msg) {
    self._doc.add({type: 'chat', username: msg.username, message: msg.message})
  })

  // set up crdt docs
  room.on('peer:connect', function (peer, mux) {
    var docStream = mux.createSharedStream('peertunes-doc')
    docStream.pipe(self._doc.createStream()).pipe(docStream)
    docStream.on('end', function () {
      console.log('peertunes-docStream ended')
    })
  })
}

PeerTunes.prototype.startHosting = function (title) {
  console.log('Starting hosting')

  this.addAvatar(this.username)
  
  //chat.appendMsg('Notice', 'Room Created')
  console.log("[Room Created]")

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
  // TODO: stop player
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
  this.chatModel.deleteAllMessages()
  this.player.end()
  $('#btn-leave-room').hide()
}

PeerTunes.prototype.refreshRoomListing = function () {
  console.log('refreshing room listing')

  // make element of all rooms at once, then append
  var template = $('#roomRowTmpl').html()
  Mustache.parse(template)

  var $ul = $('<ul>').addClass('list-unstyled')
  var self = this
  $.each(this.lobby.getRooms(), function (i, room) {
    var id = room.creator
    var params = {id: id, title: room.name}
    //console.log('Rendering template for: ')
    //console.log(params)
    var $row = $(Mustache.render(template, params))
    $row.click(function () {
      $('#roomModal').modal('toggle')
      console.log('Joining room: ' + id)
      self.joinRoom(room.pubkey)
      
    })
    $ul.append($row)
  })
  $('#roomModal .modal-body').html($ul)
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

  // popover init
  template = $('#popoverTmpl').html()
  Mustache.parse(template)
  var showMenu = (id !== this.username) // don't show menu for self
  console.log('Show menu for ', id, ': ', showMenu)
  params = {id: id, menu: showMenu}
  rendered = Mustache.render(template, params)
  $avatar.webuiPopover({title: '', content: rendered, placement: 'top', trigger: 'hover', padding: false})

  this.$moshpit.append($avatar)
}

PeerTunes.prototype.removeAvatar = function (id) {
  console.log('Removing avatar for ', id)
  var $avatar = $('#user-' + id)
  $avatar.remove()
  $avatar.webuiPopover('destroy')
}

PeerTunes.prototype.stopAllHeadBobbing = function () {
  console.log('Stopping all head bobbing')
  $('.audience-head').removeClass('headbob-animation')
}

// HOST function
PeerTunes.prototype.playNextDJSong = function () {
  var self = this

  // reset all likes
  // TODO: map doesn't modify original?
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

      var meta = this.queueModel.front()

      this.songManager.play(meta)
      this.player.play(meta, 0) // play in host's player

      if (meta.source === 'MP3') {
        // TODO: wait until metadata is loaded => send duration
        // start seeding file to guests
        this.seedFileWithKey(meta.id, function (torrent) {
          meta.infoHash = torrent.infoHash
          self.songManager.setInfoHash(torrent.infoHash)
          self.broadcastToRoom({msg: 'song', value: meta, dj: self.username, currentTime: 0}, null)
        })
      } else {
        this.broadcastToRoom({msg: 'song', value: meta, dj: this.username, currentTime: 0}, null)
      }
    } else { // host is not first in queue
      // ask front dj for song
      // TODO: set timeout for skipping this dj if he doesn't respond
      this.host.djQueue[0].send(JSON.stringify({msg: 'queue-front'}))
    }

    return
  }
  console.log('DJ queue empty => ending song')
  this.player.end()
  this.broadcastToRoom({msg: 'end-song'})
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
PeerTunes.prototype.onSongEnd = function () {
  var self = this

  console.log('onSongEnd')

  this.stopAllHeadBobbing()
  this.player.end()
  this.player.setTitle('')
  this.vote = 0
  // this.updateProgress(0) //gets overridden :(

  console.log('Songtimeout queue length: ', this.host.djQueue.length)

  console.log('songtimeout isDJ: ', this.isDJ)
  if (this.isDJ) {
    endDJ()
  }

  if (this.isHost) {
    this.host.rating = 0
    this.host.votes = []
    if (this.host.djQueue.length > 0) {
      console.log('Shifting queue:', this.host.djQueue)
      var front = this.host.djQueue.shift()
      this.host.djQueue.push(front)
    }

    this.playNextDJSong()
  }

  function endDJ () {
    console.log('DJing ended')
    self.songQueue.cycle()
    self.isDJ = false
  }
}

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
      console.log('removed dj was current dj => ending song')
      this.songManager.end()
      // this.broadcastToRoom({msg: 'end-song'})
    }
  }
  console.log('Queue after:', this.host.djQueue)
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
    cache: false, // doesn't work?
    autoHide: 2600,
    onHide: function ($el) { // hack so content will update
      $user.webuiPopover('destroy')
    }
  }

  $user.webuiPopover(options)

  $user.webuiPopover('show')
}

PeerTunes.prototype.doSongSearch = function () {
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
      self.queueModel.addSong(meta)
    })
  })
}

module.exports = PeerTunes
