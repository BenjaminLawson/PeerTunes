/*
Future features:
-let user pause, but keep timer so on play it jumps to current time

TODO: fix bug if you try to join your own room

TODO: "server" version, bittorrent-tracker works on node.js (just remove player code)
--> put player code in module, don't use on server
--> don't make avatar for server
http://dexie.org/
TODO: upload images to imgur
TODO: add currently playing song to playlist
--- if mp3, download torrent and add to localstorage
TODO: export/import data (playlist, mp3s, friends)
TODO: store export/state into dropbox, etc. with api?
TODO: dj queue view

TODO: use revokeObjectURL to free up memory
https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL

TODO: convert all times to same timezone

TODO: private rooms (host doesn't post to lobby & just leaves lobby when creating room)
- need to implement public key url hash first

TODO: check localforage for keypair/username, skip login screen if found
TODO: router
*/

var Router = require('./modules/router')

var config =require('./config')

$(document).ready(function () {
  // initialize routing
  var router = new Router()
})
