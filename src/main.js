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
https://github.com/localForage/localForage
http://dexie.org/
TODO: uplaod images to imgur
TODO: add currently playing song to playlist
--- if mp3, download torrent and add to localstorage
TODO: download mp3 before song starts
TODO: firefox support
TODO: hash ip address and display with username as reinforcement of identity
*/

var PT = require('./modules/peertunes')

$(document).ready(PT.init)
