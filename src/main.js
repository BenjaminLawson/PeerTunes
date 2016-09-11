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

TODO: host sends start time, instad of time since start, for more accurate guest time calculation
TODO: fix bug if you try to join your own room

TODO: use bootstrap list groups

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

var PT = new PeerTunes({
  maxRoomSize: 50, // arbitrary until further testing
  trackerURL: 'wss://tracker.webtorrent.io'
})

$(document).ready(function () {
	PT.init()
})
