/*
Only supported target: Chrome

mp3 MediaSource only works in Chrome, not firefox
- play song at current time after song is fully downloaded in firefox?
- download song ahead of time?
- no seeking support

Future features:
-seed & play mp3 file (not permanent in queue?)
-drawing (maybe dj whiteboard, or draw and then drawing appears above head)
-let user pause, but keep timer so on play it jumps to current time

TODO: make lobby system function that requires response
- callback for on response
- use timeout, after which no response callback is called

TODO: use RSA keys to prove identities & make friend feature
-request friend
-friend sends public key
-next time peer with id appears, ask them to authenticate by decrypting string encrypted with their public key
-reciprocate (friendships must be two-way)

TODO: host sends start time, instad of time since start, for more accurate guest time calculation
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

TODO: use revokeObjectURL
https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
to free up memory
*/
var JSEncrypt = require('jsencrypt').JSEncrypt

var PeerTunes = require('./modules/peertunes')

var config =require('./config')

$(document).ready(function () {
  $('#btn-login').click(function (e) {
    init()
  })
})

function init () {
  config.username = $('#input-username').val()
  
  console.log('generating keypair...')
  
  var keypair = new JSEncrypt({default_key_size: 512})
  keypair.getKey(function () {

    config.keys = {
      private: keypair.getPrivateKey(),
      public: keypair.getPublicKey()
    }

    console.log(config.keys)

    var PT = new PeerTunes(config)

    $('#welcome').css('top', '100%') // slide down out of view
  })
  
}
