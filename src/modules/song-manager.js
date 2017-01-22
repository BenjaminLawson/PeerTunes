/*
  Host keeps track of songs seperate from the player
  Useful for headless host, host pausing, decoupling event code from player
*/

module.exports = SongManager

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function SongManager () {
  this.meta = {}
  this.updater = null
  this.timeout = null
  this.playing = false

  EventEmitter.call(this)
}

inherits(SongManager, EventEmitter)

// end must be called before play
SongManager.prototype.play = function (meta) {
  var self = this

  console.log('SongManager play')

  this.emit('song-start')
  this.playing = true

  this.meta = meta
  this.meta.currentTime = 0

  this.updater = setInterval(function () {
    self.meta.currentTime += 500
  }, 500)

  clearTimeout(this.timeout)
  this.timeout = setTimeout(function () {
    clearInterval(self.updater)
    self.end()
  }, meta.duration * 1000)
}

SongManager.prototype.end = function () {
  console.log('SongManager end')

  // if nothing playing, just return
  if (!this.playing) return

  clearTimeout(this.timeout)
  clearInterval(this.updater)
  this.meta = {}
  this.emit('song-end')
  this.playing = false
}

SongManager.prototype.isPlaying = function () {
  return this.playing
}

SongManager.prototype.getMeta = function () {
  return this.meta
}

SongManager.prototype.setInfoHash = function (infoHash) {
  this.meta.infoHash = infoHash
}

SongManager.prototype.getInfoHash = function () {
  return this.meta.infoHash
}
