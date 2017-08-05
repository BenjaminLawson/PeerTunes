/*
Future features:
-let user pause, but keep timer so on play it jumps to current time

TODO: "server" version, bittorrent-tracker works on node.js (just remove player code)
--> put player code in module, don't use on server
--> don't make avatar for server

TODO: add currently playing song to playlist
--- if mp3, download torrent and add to localstorage
TODO: export/import data (playlist, mp3s, friends)
TODO: store export/state into dropbox, etc. with api?

TODO: host should be master clock if peers disagree
TODO: test date.now variance on different computers, maybe use current time of song instead of start time

TODO: private rooms (host doesn't post to lobby & just leaves lobby when creating room)
- need to implement public key url hash first
*/

var Router = require('./modules/router')

var config =require('./config')

$(document).ready(function () {
  // initialize routing
  var router = new Router()
})
