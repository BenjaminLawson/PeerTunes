// Globals
//var $, emojione

// 3rd party libraries
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')
var Mustache = require('mustache')
var WebTorrent = require('webtorrent')
var localforage = require('localforage')
var Doc = require('crdt').Doc
var crypto = require('crypto-browserify')
var pump = require('pump')
var Value = require('r-value')

var config = require('../config')

// modules
var YT = require('../lib/YT')
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

// moshpit
var MoshpitController = require('../controllers/moshpit-controller')
var MoshpitView = require('../views/moshpit-view')
var MoshpitModel = require('../models/moshpit-model')

function PeerTunes (opts) {
  var self = this

  var isHost = (opts.identity.keypair.public.toString('hex') === opts.roomPubkey)

  if (isHost && !opts.room) {
    console.error('user is host, but is missing room parameters')
    return
  } 

  if (!Peer.WEBRTC_SUPPORT) {
    window.alert('This browser is unsupported. Please use a browser with WebRTC support.')
    return
  }

  this.config = config // TODO: use defaults if not provided
  this.router = opts.router

  this.identity = opts.identity
  this.keys = this.identity.keypair

  // Chat
  this.chatModel = new ChatModel({
    username: opts.username,
    maxMessageLength: 400
  })
  this.chatView = new ChatView(this.chatModel, config.chat)
  this.chatController = new ChatController(this.chatView, this.chatModel)

  this.chatModel.on('new-chat', function (msg) {
    self.moshpitView.chatPopover(msg.userId, msg.message)
  })

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

  this._onQueueModelChange = function (q) {
    if (!self.isInDJQueue()) {
      return
    }
    var row = self._djSeq.get('dj-'+self.id).toJSON()

    // TODO: leave dj queue if queue becomes empty?
    // only set new value if top song actually changed
    var front = q[0]
    // NOTE: crdt bug? set(key, value) reassigns row to object containing only the key specified! (other keys removed)
    // https://github.com/dominictarr/crdt/blob/master/row.js#L24
    if (front && (front.id !== row.song.id || front.source !== row.song.source)) {
      row.song = front
      var r = self._djSeq.get('dj-'+self.id)
      if (front.source === 'MP3') {
        self.seedFileWithKey(front.id, function (torrent) {
          r.set(row)
        })
      }
      else {
        r.set(row)
      }
    }
  }

  this.queueModel.on('queue:change', this._onQueueModelChange)

  this.moshpitModel = new MoshpitModel()
  this.moshpitView = new MoshpitView({selector: config.moshpit.selector})
  this.moshpitController = new MoshpitController(this.moshpitView, this.moshpitModel)

  this.tracker = null
  this.activeTorrents = []
  


  // set up webtorrent
  global.WEBTORRENT_ANNOUNCE = [ this.config.trackerURL ]
  this.torrentClient = new WebTorrent({
    tracker: {
      rtcConfig: self.config.rtc,
      announce: ['wss://tracker.openwebtorrent.com', 'wss://tracker.btorrent.xyz']
    }
  })

  this._onTorrent = function (torrent) {
    console.log('[Torrent client] torrent ready: ', torrent)
  }
  this._onTorrentError = function (err) {
    console.log('[Torrent client] error: ', err)
  }
  this.torrentClient.on('torrent', this._onTorrent)
  this.torrentClient.on('error', this._onTorrentError)

  this.username = opts.identity.username
  this.id = crypto.createHash('sha1').update(this.identity.keypair.public).digest('hex')

  config.player.torrentClient = this.torrentClient
  this.player = new Player(config.player)

  this._onHostTimeUpdate = function (time) {
    var old = self._currentSong.get()
    self._currentSong.set({
      currentTime: time,
      song: old.song,
      userId: old.userId,
      username: old.username
    })
  }
  
  this.songManager = new SongManager()
  this.songManager.on('song-end', this.onSongEnd.bind(this))


  // replace ascii with emoji
  emojione.ascii = true

  // room set up
  this._doc = null
  this._chatSet = null
  this._djSeq = null
  this._moodSet = null
  this._currentSong = null

  // map peer ids to crdt streams
  this.docStreams = {}

   // lobby set up
  this.room = null
  this.lobby = null

  this._onHostLeave = function () {
    // automatically destroys this room
    self.router.route('#lobby')
  }
 
  if (isHost) {
    this.lobby = self._joinLobby()
    this.room = this.lobby.createRoom(opts.room.name)
    this._onJoinRoom(this.room)
  }
  else {
    this.room = self.joinRoom(opts.roomPubkey)
    this.room.on('host:leave', this._onHostLeave)
  }
  

  // cache jQuery selectors
  // TODO: add all element selectors to config
  this.$songSearchInput = $('#song-search-input')
  this.$songSearchSubmitButton = $('#song-search-submit-button')
  this.$likeButton = $(config.selectors.likeButton)
  this.$dislikeButton = $(config.selectors.dislikeButton)
  this.$joinQueueButton = $(config.selectors.joinQueueButton)
  this.$volumeSlider = $(config.selectors.volumeSlider)
  this.$volumeButton = $('#volume-button')
  this.$leaveButton = $(config.navBar.leaveButton)
  this.$addSongButton = $('#add-song-button')
  this.$DJQueueList = $('#dj-queue-list')

  // set up handlers
  this.initClickHandlers()
}

PeerTunes.prototype.destroy = function () {
  console.log('destroying room')
  
  if (this.isInDJQueue()) {
    this.leaveDJQueue()
  } 
  
  this.songManager.end()
  this.closeStreams()

  if (this.room) {
    this.room.destroy()
    this.room = null
  }
  
  // remove all jquery element event listeners
  this.$songSearchInput.off()
  this.$songSearchSubmitButton.off()
  this.$likeButton.off()
  this.$dislikeButton.off()
  this.$joinQueueButton.off()
  this.$volumeSlider.off()
  this.$volumeButton.off()
  this.$leaveButton.off()
  this.$addSongButton.off()

  // remove all event listeners
  this.queueModel.removeListener('queue:change', this._onQueueModelChange)
  this.songManager.removeListener('song-end', this.onSongEnd)
  this.songManager.removeListener('time:update', this._onHostTimeUpdate)
  this.torrentClient.removeListener('torrent', this._onTorrent)
  this.torrentClient.removeListener('error', this._onTorrentError)

  this.torrentClient.destroy()
  this.player.destroy()
  this.songManager.destroy()

  this.chatController.destroy()
  this.moshpitController.destroy()
  this.queueController.destroy()

  // clean up torrents
  // destroying webtorrent client already calls destroy on each torrent
  this.activeTorrents = []

  this._doc = null
  this._chatSet = null
  this._djSeq - null

  this.router = null

  // resets room elements (chat, moshpit, etc)
  // TODO: remove and let specialized destroy methods do it
  this.resetRoom()
}

PeerTunes.prototype.initClickHandlers = function () {
  var self = this

  // key listeners
  var ENTER_KEY = 13

  this.$songSearchInput.keydown(function (e) {
    if (e.keyCode === ENTER_KEY) {
      self.doSongSearch()
    }
  })

  this.$volumeSlider.on('change mousemove', function () {
    var volume = $(this).val() / 100
    self.player.setVolume(volume)
  })

  this.$songSearchSubmitButton.click(function (e) {
    self.doSongSearch()
  })

  // TODO: breaks when switching between audio/video players
  // doesn't stay when switching from audio->video players
  this.$volumeButton.click(function (e) {
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

  this.$addSongButton.click(function (e) {
    $('#song-search-results').html('')
    $('#song-search-input').val('')
  })


  // join DJ queue
  this.$joinQueueButton.click(function (e) {
    console.log('join dj queue button clicked')
    if (!self._djSeq) {
      console.log('dj queue not defined, probably not in a room')
      return
    }

    var inQueue = self._djSeq.has('dj-'+self.id)
    
    if (!inQueue) {
      // join dj queue
      if (self.joinDJQueue()) {
        $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue')
      }

      return
    }
    console.log('already in dj queue')
    // if in dj queue, leave dj queue
    self.leaveDJQueue()

  })

  // rating buttons
  // TODO: keep button active after click

  this.$likeButton.click(function (e) {
    if (self._moodSet) {
      self._doc.set('mood-'+self.id, {type: 'mood', userId: self.id, like: true})
    }
  })

  this.$dislikeButton.click(function (e) {
    if (self._moodSet) {
      self._doc.set('mood-'+self.id, {type: 'mood', userId: self.id, like: false})
    }
  })
}

PeerTunes.prototype._joinLobby = function () {
  var self = this

  console.log('joining lobby')
  
  var lobby = new Lobby({
    maxPeers: 6,
    public: self.keys.public,
    private: self.keys.private,
    nicename: self.username
  })

  lobby.on('rooms:add', function (room) {
    console.log('new room added to lobby: ', room)
  })

  return lobby
}

// pubkey is hex encoded public key of room host
PeerTunes.prototype.joinRoom = function (pubkey) {
  var self = this

  console.log('joining room with key ', pubkey)

  var room = new HostedRoom({
    hostKey: pubkey,
    public: self.keys.public,
    private: self.keys.private,
    nicename: self.username
  })

  this._onJoinRoom(room)

  return room
}

PeerTunes.prototype._onJoinRoom = function (room) {
  var self = this

  console.log('onJoinRoom')
  
  this.joinDocForRoom(room)

  // create avatars for self
  this.moshpitModel.addAvatar({id: self.id, nicename: self.username, avatar: 1, headbob: false})
  
  // create avatars for future users
  room.on('user:join', function (user) {
    self.moshpitModel.addAvatar({id: user.id, nicename: user.nicename, avatar: 1, headbob: false})
  })

  // remove avatars when users leave
  room.on('user:leave', function (user) {
    self.moshpitModel.removeAvatar(user.id)
    
    if (self.room.isHost)  {
      self._doc.rm('dj-'+user.id)
      self._doc.rm('mood-'+user.id)
    }
  })
}

// TODO: destroy multiplex for peer?
PeerTunes.prototype.closeStreams = function () {
  var self = this

  Object.keys(this.docStreams).forEach(function (key) {
    self.docStreams[key].destroy()
  })
}

// joins p2p replicated data structures for room
PeerTunes.prototype.joinDocForRoom = function (room) {
  var self = this
  
  this.initReplicationModels(room)

  // create replication streams
  room.on('peer:connect', function (peer) {
    var mux = peer.mux

    var docStream = self._doc.createStream()
    self.docStreams[peer.id] = docStream
    var docSharedStream = mux.createSharedStream('peertunes-doc')
    pump(docSharedStream, docStream, docSharedStream, function (err) {
      //console.log('doc pipe closed ', err)
    })

    var valueStream = self._currentSong.createStream()
    var valueSharedStream = mux.createSharedStream('current-song')
    pump(valueSharedStream, valueStream, valueSharedStream, function (err) {
      //console.log('current song stream closed')
    })
  })

  room.on('peer:disconnect', function (peer) {
    if (self.docStreams[peer.id]) {
      self.docStreams[peer.id].destroy()
      delete self.docStreams[peer.id]
    }
  })
}

PeerTunes.prototype.initReplicationModels = function (room) {
  var self = this
  
  this._doc = new Doc()
  console.log('_doc: ', this._doc)
  this._currentSong = new Value()
  this._chatSeq = this._doc.createSeq('type', 'chat') // TODO: make set?
  this._moodSet = this._doc.createSet('type', 'mood')
  this._djSeq = this._doc.createSeq('type', 'djQueue') // dj queue, {id, username, song}

  this._chatSeq.on('add', function (row) {
    row = row.toJSON()
    self.chatModel.addMessage({userId: row.userId, username: row.username, message: row.message})
  })

  this.chatController.on('chat:submit', function (msg) {
    // TODO: use seq correctly and push to seq, or keep abusing the fact that sets happen to stay in order anyway...
    // crdt chat example uses sets
    self._doc.add({type: 'chat', userId: self.id, username: self.username, message: msg})
  })

  this._currentSong.on('update', function (data) {
    //console.log('current song update', data)
    
    if (data == null || !data.song) {
      console.log('current song set to null, ending')
      self.songManager.end()
      return
    }

    var currentTime = data.currentTime

    // TODO: handle case where same song is played multiple times in a row, either by same or diff dj
    if (data.song.source === self.songManager.meta.source && data.song.id === self.songManager.meta.id) {
      //console.log('song didn\'t change, skipping update')
      // timestamp update
      // TODO: check if player's time difference is large and adjust player time if so
      return // song has ot changed, so don't restart song
    }

    console.log('new song update', data)

    if (currentTime/1000 >= data.song.duration) {
      console.log('skipping song that already ended')
      return
    }
    
    var isDJ = (data.userId === self.id)

    // ensure previous song has stopped playing
    self.player.end()
    
    self.player.play(data.song, currentTime, isDJ)
    self.songManager.play(data.song)

    // if this user is the new DJ, cycle song queue
    if (isDJ) {
      console.log('user is now DJ, cycling song queue')
      self.queueModel.cycle()
    }
  })

  // TODO: if host is first DJ, guest doesn't detect new row
  self._djSeq.on('remove', function () {
    console.log('djseq remove', self._djSeq)
    self.renderDJQueue()
  })
  self._djSeq.on('add', function () {
    console.log('djseq add', self._djSeq)
  })
  self._djSeq.on('changes', function () {
    console.log('djseq changes', self._djSeq)
    self.renderDJQueue()
  })
  
  if (room.isHost) {
    
    self._djSeq.on('add', function (row) {
      console.log('djSeq add')
      row = row.toJSON()
      if (self._djSeq.length() === 1) {
        // queue was empty, this is first dj
        self.playNextDJSong()
      }
    })

    self._djSeq.on('remove', function (row) {
      console.log('djSeq remove')
      row = row.toJSON()
      var song = self._currentSong.get()
      // check if DJ that left was current DJ
      if (song && song.userId === row.userId) {
        self.songManager.end()
      }
    })
  }

  this._moodSet.on('add', function (row) {
    row = row.toJSON()
    self.moshpitModel.setHeadbobbing(row.userId, row.like)
  })
  this._moodSet.on('changes', function (row, changed) {
    row = row.toJSON()
    self.moshpitModel.setHeadbobbing(row.userId, row.like)
  })
}

PeerTunes.prototype.renderDJQueue = function () {
  console.log('render dj queue')
  var $list = $('#dj-queue-list')
  $list.empty()

  this._djSeq.asArray().forEach(function (row) {
    $list.append('<li class="list-group-item">' + row.get('username') + '</li>')
  })
  $list.find('li').first().addClass('active')
}

PeerTunes.prototype.resetRoom = function () {
  this.moshpitModel.removeAllAvatars()
  this.chatModel.deleteAllMessages()
  this.$leaveButton.hide()
  this.$DJQueueList.empty()
}

PeerTunes.prototype.removeDJFromQueue = function (id) {
  if (!this._djSeq) {
    console.log("djSeq doesn't exist, can't remove dj")
  }
  
  this._djSeq.rm('dj-'+id)
}

PeerTunes.prototype.leaveDJQueue = function () {
  this.removeDJFromQueue(this.id)
  console.log('left DJ queue')

  // TODO: fix selector
  this.$joinQueueButton.removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue')
}

PeerTunes.prototype.isInDJQueue = function (djId) {
  if (!djId) djId = this.id
  
  if (!this._djSeq) return false
  return this._djSeq.has('dj-'+djId)
}

// returns true if successfully joined queue
PeerTunes.prototype.joinDJQueue = function () {
  var self = this
  
  // must have at least 1 song in queue to become DJ
  // must not already be in queue
  if (this.queueModel.length() === 0
      || !this._djSeq
      || this._djSeq.has('dj-'+this.id)) {
    console.log('unable to join DJ queue')
    return false
  }
  var front = self.queueModel.front()
  
  if (front.source === 'MP3') {
    console.log('on queue join, front is mp3 => seeding')
    self.seedFileWithKey(front.id, function (torrent) {
      //self._djSeq.push({type: 'djQueue', id: 'dj-'+self.id, userId: self.id, username: self.username, song: front})
      self._djSeq.push({id: 'dj-'+self.id, userId: self.id, username: self.username, song: front})
    })
  }
  else {
    this._djSeq.push({id: 'dj-'+self.id, userId: self.id, username: self.username, song: self.queueModel.front()})
  }
  
  return true
}

// HOST function
PeerTunes.prototype.cycleDJQueue = function () {
  if (!this._djSeq || this._djSeq.length() <= 1) return

  // moves first dj after last dj
  this._djSeq.after(this._djSeq.first(), this._djSeq.last())
}

PeerTunes.prototype.onSongEnd = function () {
  var self = this

  this.player.end()
  this.player.setTitle('')

  if (this.room && this.room.isHost) {
    if (this._djSeq.length() > 1) {
      // move front dj to back of queue
      console.log('cycling DJs')
      this.cycleDJQueue()
    }

    this.playNextDJSong()
  }
}

// only called if host
PeerTunes.prototype.playNextDJSong = function () {
  var self = this

  if (!this.room || !this.room.isHost) return

  this.songManager.removeListener('time:update', this._onHostTimeUpdate)

  if (this._djSeq.length() === 0) {
    console.log('no DJs in queue, nothing to play')
    self._currentSong.set(null)
    return
  }

  console.log('playing next dj song')

  var row = this._djSeq.first().toJSON()
  var song = row.song

  var currentSong = {
    currentTime: 0,
    song: song,
    userId: row.userId,
    username: row.username
  }
  
  this._currentSong.set(currentSong)
  this.songManager.on('time:update', this._onHostTimeUpdate)
}

//callback when seeding finished setting up
PeerTunes.prototype.seedFileWithKey = function (key, callback) {
  var self = this

  // check if torrent already seeding
  for(var i = 0; i < this.activeTorrents.length; i++) {
    if (this.activeTorrents[i].key === key) {
      console.log('torrent already exists, skipping')
      callback(this.activeTorrents[i])
      return
    }
  }

  // limit number of active torrents by removing oldest
  // max length 2: 1 for currently playing, 1 for next up (in case this peer is the only DJ)
  if (this.activeTorrents.length >= 2) {
    console.log('too many active torrents, removing oldest')
    var currentSong = this._currentSong.get()
    if (currentSong.song && currentSong.song.source === 'MP3') {
      for (var i = 0; i < this.activeTorrents.length; i++) {
        // prevent torrent for currently playing song from being removed
        if (this.activeTorrents[i].key !== currentSong.song.id) {
          var oldest = this.activeTorrents[i]
          this.activeTorrents.splice(i, 1)
          this.torrentClient.remove(oldest.torrent.infoHash)
          break
        }
      }
    }
    else {
      // just remove a torrent, it can't be the current song
      var oldest = this.activeTorrents.shift()
      this.torrentClient.remove(oldest.torrent.infoHash)
    }
  }
  
  console.log('Seeding file with key ', key)
  localforage.getItem(key).then(function (value) {
    var file = new File([value], key, {type: 'audio/mp3', lastModified: Date.now()})

    //self.removeLastTorrent()
    self.torrentClient.seed(file, function (torrent) {
      console.log('Client is seeding file ' + key, ', infoHash: ', torrent.infoHash)
      //self.currentTorrentInfoHash = torrent.infoHash
      self.activeTorrents.push({key: key, torrent: torrent})

      torrent.on('wire', function (wire) {
        console.log('torrent: connected to new peer')
      })

      callback(torrent)
    })
  }).catch(function (err) {
    console.log('Error retrieving mp3: ', err)
  })
}


// TODO: move to own model/controller
PeerTunes.prototype.doSongSearch = function () {
  var self = this

  var search = $('#song-search-input').val()
  if (search.length < 1) return
  YT.getSearchResults(search, function (results) {
    var template = $('#songSearchResultTmpl').html()
    Mustache.parse(template)
    
    $('#song-search-results').html('')
    var resultsHTML = ''
    results.forEach(function (item) {
      var formatString = (item.duration >= 3600) ? 'HH:mm:ss' : 'mm:ss'
      var formattedDuration = moment.utc(item.duration * 1000).format(formatString)
      var params = {title: item.title, id: item.id, duration: item.duration, formattedDuration: formattedDuration, thumbnail: item.thumbnail}
      var rendered = Mustache.render(template, params)
      resultsHTML += rendered
    })

    // append all at once for effeciency
    $('#song-search-results').append(resultsHTML)

    $('.song-search-result').click(function (e){
      e.preventDefault()
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
