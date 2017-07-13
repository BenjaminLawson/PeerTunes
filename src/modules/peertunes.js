// TODO: refactor host-only code to its own init function

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
var crypto = require('crypto-browserify')
var pump = require('pump')
var Value = require('r-value')

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

    this.keys = config.keys

    // Chat
    this.chatModel = new ChatModel({
        username: config.username,
        maxMessageLength: 400
    })
    this.chatView = new ChatView(this.chatModel, config.chat)
    this.chatController = new ChatController(this.chatView, this.chatModel)

    this.chatModel.on('new-chat', function (msg) {
        self.avatarChatPopover(msg.userId, msg.message)
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

    this.queueModel.on('queue:change', function (q) {
        console.log('peertunes queue:change')
        if (!self.isInDJQueue()) {
            //console.log('user not in dj queue, skipping song update')
            return
        }
        var row = self._djSeq.get('dj-'+self.id).toJSON()

        // TODO: leave dj queue if queue becomes empty?
        // only set new value if top song actually changed
        var front = q[0]
        if (front && (front.id !== row.song.id || front.source !== row.song.source)) {
            //console.log('top changed, syncing dj queue')
            self._djSeq.get('dj-'+self.id).set('song', front)
        }
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

    this.username = config.username
    this.id = crypto.createHash('sha1').update(config.keys.public).digest('hex')

    config.player.torrentClient = this.torrentClient
    this.player = new Player(config.player)

    this.songManager = new SongManager()
    this.songManager.on('song-end', this.onSongEnd.bind(this))


    // replace ascii with emoji
    emojione.ascii = true

    // lobby set up
    this.room = null
    this.lobby = this._joinLobby()

    // room set up
    this._doc = null
    this._chatSet = null
    this._djSeq = null
    this._currentSong = null

    // map peer ids to crdt streams
    this.docStreams = {}

    // cache jQuery selectors
    this.$moshpit = $(config.selectors.moshpit)
    this.$likeButton = $(config.selectors.likeButton)
    this.$dislikeButton = $(config.selectors.dislikeButton)
    this.$joinQueueButton = $(config.selectors.joinQueueButton)
    this.$volumeSlider = $(config.selectors.volumeSlider)
    this.$leaveButton = $(config.navBar.leaveButton)

    // set up handlers
    this.initClickHandlers()
}

PeerTunes.prototype.initClickHandlers = function () {
    var self = this // cache since 'this' is bound in click callbacks

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
        self._onJoinRoom()
        
        $('#roomNameInput').val('')
    })

    this.$leaveButton.click(function (e) {
        $(this).hide()
        self.leaveRoom()
    })

    // join DJ queue
    this.$joinQueueButton.click(function (e) {
        console.log('Clicked join/leave queue')
        
        if (!self._djSeq) {
            console.log('dj queue not defined, probably not in a room')
            return
        }

        var inQueue = self._djSeq.has('dj-'+self.id)
        
        if (!inQueue) {
            // join dj queue
            
            if (self.joinDJQueue()) {
                console.log('joined DJ queue')
                $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue')
            }

            return
        }
        
        // if in dj queue, leave dj queue
        self.leaveDJQueue()

    })

    // rating buttons
    // TODO: keep button active after click

    this.$likeButton.click(function (e) {
        console.log('Rate +1')
    })

    this.$dislikeButton.click(function (e) {
        console.log('Rate -1')
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

    console.log('joining room with key ', pubkey)

    // leave lobby
    this.lobby.leave()
    this.lobby = null

    this.room = new HostedRoom({
        hostKey: pubkey,
        isHost: false,
        public: self.config.keys.public,
        private: self.config.keys.private,
        nicename: self.username
    })

    $('#btn-leave-room').show()

    this._onJoinRoom()
}

PeerTunes.prototype._onJoinRoom = function () {
    var self = this
    
    this.joinDocForRoom(this.room)

    // create avatars for self
    self.addAvatar(this.id, this.username, false)
    
    // create avatars for future users
    this.room.on('user:join', function (user) {
        self.addAvatar(user.id, user.nicename, false)
    })

    // remove avatars when users leave
    this.room.on('user:leave', function (user) {
        self.removeAvatar(user.id)
        
        if (self.room.isHost) self._djSeq.rm('dj-'+self.id)
    })
}

// TODO: destroy multiplex for peer
PeerTunes.prototype.closeStreams = function () {
    var self = this

     Object.keys(this.docStreams).forEach(function (key) {
        self.docStreams[key].destroy()
    })
}

// joins p2p replicated data structures for room
PeerTunes.prototype.joinDocForRoom = function (room) {
    var self = this
    
    this._doc = new Doc()

    this._currentSong = new Value()

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
            console.log('current song stream closed')
            
        })
        
    })

    room.on('peer:disconnect', function (peer) {
        if (self.docStreams[peer.id]) {
            self.docStreams[peer.id].destroy()
            delete self.docStreams[peer.id]
        }

        if (self.hyperStreams[peer.id]) {
            self.hyperStreams[peer.id].destroy()
            delete self.hyperStreams[peer.id]
        }
    })

    // chat
    this._chatSeq = this._doc.createSeq('type', 'chat')

    this._chatSeq.on('add', function (row) {
        row = row.toJSON()
        self.chatModel.addMessage({userId: row.userId, username: row.username, message: row.message})
    })

    this.chatController.on('chat:submit', function (msg) {
        self._doc.add({type: 'chat', userId: self.id, username: self.username, message: msg})
        console.log(self._doc.toJSON())
    })

    // DJ queue sequence
    // {id, username, song}
    this._djSeq = this._doc.createSeq('type', 'djQueue')

    this._currentSong.on('update', function (data) {
        var currentTime = Date.now() - data.startTime

        if (currentTime/1000 >= data.song.duration) {
            console.log('skipping song that already ended')
            return
        }
        
        self.player.play(data.song, currentTime)
        self.songManager.play(data.song)

        // if this user is the new DJ, cycle song queue
        if (data.userId === self.id) {
            console.log('user is now DJ, cycling song queue')
            self.queueModel.cycle()
        }
    })

    if (this.room.isHost) {
        console.log('ISHOST, CHECKING DJ SEQ')
        self._djSeq.on('add', function (row) {
            row = row.toJSON()
            if (self._djSeq.length() === 1) {
                // queue was empty, this is first dj
                self.playNextDJSong()
            }
        })
    }
}

PeerTunes.prototype.leaveRoom = function () {
    var self = this

    console.log('leaving room')
    
    if (!this.room) return

    if (this.isInDJQueue()) {
        this.leaveDJQueue()
    } 


    // cleans up peers and trackers
    self.room.leave()
    self.room = null

    this._doc = null
    this._chatSet = null
    this._djSeq - null

    this.songManager.end()

    this.closeStreams()


    // resets room elements (chat, moshpit, etc)
    this.resetRoom()
}

PeerTunes.prototype.resetRoom = function () {
    $('.audience-member').tooltip('destroy')
    this.$moshpit.html('')
    this.chatModel.deleteAllMessages()
    this.$leaveButton.hide()
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

    this._djSeq.push({type: 'djQueue', id: 'dj-'+self.id, userId: self.id, username: self.username, song: self.queueModel.front()})
    console.log('djSeq: ', this._djSeq.toJSON())
    return true
}


// HOST function
PeerTunes.prototype.cycleDJQueue = function () {
    if (!this._djSeq || this._djSeq.length() <= 1) return

    // moves first dj after last dj
    this._djSeq.after(this._djSeq.first(), this._djSeq.last())
}

PeerTunes.prototype.refreshRoomListing = function () {
    //console.log('refreshing room listing')

    // make element of all rooms at once, then append
    var template = $('#roomRowTmpl').html()
    Mustache.parse(template)

    var $ul = $('<ul>').addClass('list-unstyled')
    var self = this
    $.each(this.lobby.getRooms(), function (i, room) {
        //console.log('lobby room ', room)
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

PeerTunes.prototype.onSongEnd = function () {
    var self = this

    console.log('onSongEnd')

    //this.stopAllHeadBobbing()
    this.player.end()
    this.player.setTitle('')

    if (this.room.isHost) {
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

    if (this._djSeq.length() === 0) {
        console.log('no DJs in queue, nothing to play')
        return
    }

    console.log('playing next dj song')

    var row = this._djSeq.first().toJSON()
    var song = row.song

    this._currentSong.set({
        startTime: Date.now(),
        song: song,
        userId: row.userId,
        username: row.username
    })
    
    /*
    this._songHistoryFeed.append({
        startTime: Date.now(),
        song: song,
        userId: row.userId,
        username: row.username
    })
*/
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


PeerTunes.prototype.addAvatar = function (id, nicename, headbob) {
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
    params = {nicename: nicename}
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
    $('.audience-head').removeClass('headbob-animation')
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


// TODO: move to own model/controller
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

        // append all at once for effeciency
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
