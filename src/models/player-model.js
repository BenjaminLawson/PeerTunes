module.exports = PlayerModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function PlayerModel (config) {
  this.volume = 1 // in range 0 - 1

  this.currentSong = {}

  this.cover = null

  this.progress = 0

  this.audioPlayer = {type: 'audio', vjs: videojs(config.audioPlayer)}
  this.videoPlayer = {type: 'video', vjs: videojs(config.videoPlayer)}

  this.currentPlayer = this.videoPlayer
}

inherits(PlayerModel, EventEmitter)

PlayerModel.prototype.getPlayer = function () {
  return this.currentPlayer
}

PlayerModel.prototype.setSong = function (song) {
  this.currentSong = song
  this.emit('new-song', song)
}

PlayerModel.prototype.getSong = function () {
  return this.currentSong
}

PlayerModel.prototype.setVolume = function (volume) {
  this.volume = volume
  this.currentPlayer.vjs.volume(volume)
}

PlayerModel.prototype.getVolume = function () {
  return this.volume
}

// cover must be URL, can be blob url
// used for audio player only
PlayerModel.prototype.setCover = function (cover) {
  this.cover = cover
}

// decimal 0-1 because that's what videojs uses
PlayerModel.prototype.setProgress = function (progress) {
  this.progress = progress
  this.emit('progress-change', progress)
}


