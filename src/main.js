/*
Only supported target: Chrome

mp3 MediaSource only works in Chrome, not firefox
- play song at current time after song is fully downloaded in firefox?
- download song ahead of time?
- no seeking support

Future features:
-seed & play mp3 file (not permanent in queue?)
-let user pause, but keep timer so on play it jumps to current time

TODO: use RSA keys to prove identities & make friend feature
-request friend
-friend sends public key
-next time peer with id appears, ask them to authenticate by decrypting string encrypted with their public key
-reciprocate (friendships must be two-way)

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

TODO: convert all times to same timezone

TODO: private rooms (host doesn't post to lobby & just leaves lobby when creating room)
- need to implement public key url hash first

TODO: check localforage for keypair/username, skip login screen if found
TODO: router
*/

var sodium = require('sodium-universal')
var localforage = require('localforage')

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

  var private = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
  var public = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)

  // create elliptic curve key pair
  sodium.crypto_sign_keypair(public, private)

  config.keys = {
    private: private,
    public: public
  }

  var PT = new PeerTunes(config)
  window.PT = PT

  $('#welcome').css('top', '100%') // slide down out of view
}
