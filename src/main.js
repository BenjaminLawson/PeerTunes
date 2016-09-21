/*
Only supported target: Chrome

mp3 MediaSource only works in Chrome, not firefox
- play song at current time after song is fully downloaded in firefox?
- download song ahead of time?
- no seeking support

Future features:
-seed & play mp3 file (not permanent in queue?)
-drawing (maybe dj whiteboard, or draw and then drawing appears above head)
-store playlist in localstorage
-let user pause, but keep timer so on play it jumps to current time

TODO: switch to jQuery UI instead of dragula

TODO: use RSA keys to prove identities & make friend feature
-request friend
-friend sends public key
-next time peer with id appears, ask them to authenticate by decrypting string encrypted with their public key
-reciprocate (friendships must be two-way)

TODO: host sends start time, instad of time since start, for more accurate guest time calculation
TODO: fix bug if you try to join your own room

TODO: hosts broadcast room population every 5 minutes
TODO: scuttlebutt: https://github.com/dominictarr/scuttlebutt#scuttlebuttevents
TODO: "server" version, bittorrent-tracker works on node.js (just remove player code)
--> put player code in module, don't use on server
--> don't make avatar for server
http://dexie.org/
TODO: upload images to imgur
TODO: add currently playing song to playlist
--- if mp3, download torrent and add to localstorage
TODO: download mp3 before song starts
TODO: firefox support
TODO: hash ip address and display with username as reinforcement of identity
TODO: friend people based on ip address and username
TODO: export/import data (playlist, mp3s, friends)
TODO: store export/state into dropbox, etc. with api?
TODO: dj queue view
*/

var PeerTunes = require('./modules/peertunes')

var config = {
	maxRoomSize: 50, // arbitrary until further testing, NOT USED YET
  trackerURL: 'wss://tracker.webtorrent.io',
  username: null, //set by welcome view's username input
  chat: {
    chatBody: '#chat .panel-body',
    chatList: '#chat-list',
    chatInput: '#chat-text',
    chatEnterButton: '#chat-enter',
  },
  rtc: {
    iceServers: [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun3.l.google.com:19302'},
      {'urls': 'stun:stun4.l.google.com:19302'},
      {'urls': 'turn:numb.viagenie.ca','username': 'peertunes.turn@gmail.com','credential': 'peertunes-turn'}
    ]
  },
  selectors: {
  	moshpit: '#moshpit',

  	likeButton: '#like-button',
  	dislikeButton: '#dislike-button',

  	joinQueueButton: '#btn-join-queue'
  },
  moshpit: {
  	width: 234,
  	height: 234
  },
  songQueue: {
    queue: '#my-queue-list',
    localstorageKey: 'queue'
  }
}

$(document).ready(function () {
	//TODO: username must not contain spaces or special characters
	//OR use separate ID system
	//TODO max length
	$('#btn-login').click(function (e) {
		config.username = $('#input-username').val()
    	var PT = new PeerTunes(config)
		PT.init()

    	$('#welcome').css('top', '100%') //slide down out of view
  	})
})
