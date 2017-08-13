/*
  Host keeps track of songs seperate from the player
  Useful for headless host, host pausing, decoupling event code from player
*/

module.exports = SongManager

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

var SONG_END_TIME_BUFFER = 2

function SongManager () {
  this.meta = {}
  this.updater = null
  this.timeout = null
  this.playing = false

  EventEmitter.call(this)
}

inherits(SongManager, EventEmitter)

SongManager.prototype.destroy = function () {
  if (this.updater) clearInterval(this.updater)
  if (this.timeout) clearTimeout(this.timeout)
  this.meta = null
  this.playing = false
}

// end must be called before play
SongManager.prototype.play = function (meta) {
  var self = this

  this.emit('song-start')

  this.playing = true

  this.meta = meta
  this.meta.currentTime = 0

  if (this.updater) clearInterval(this.updater)
  if (this.timeout) clearTimeout(this.timeout)

  this.updater = setInterval(function () {
    self.meta.currentTime += 500
    self.emit('time:update', self.meta.currentTime)
  }, 500)

  this.timeout = setTimeout(function () {
    clearInterval(self.updater)
    self.end()
  }, (meta.duration + SONG_END_TIME_BUFFER) * 1000)
}

SongManager.prototype.end = function () {
  // if nothing playing, just return
  if (!this.playing) return

  clearTimeout(this.timeout)
  clearInterval(this.updater)
  this.meta = {}
  this.playing = false
  this.emit('song-end')
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
