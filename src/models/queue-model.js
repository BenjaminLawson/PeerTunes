module.exports = QueueModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

//3rd party
var localforage = require('localforage')

function QueueModel (config) {
  this.songs = []
  this.localstorageKey = config.localstorageKey

  EventEmitter.call(this)
}

inherits(QueueModel, EventEmitter)

QueueModel.prototype.addSong = function (song) {
  this.songs.push(song)
  this._save()
  this.emit('add-song', song)
}

QueueModel.prototype.cycle = function () {
  if (this.songs.length > 0) {
    var front = this.songs.pop()
    this.songs.push(front)
    this._save()
    this.emit('cycle')
  }
}

QueueModel.prototype.length = function () {
  return this.songs.length
}

QueueModel.prototype.front = function () {
  if (this.songs.length > 0) {
    return this.songs[0]
  }
  return null
}

QueueModel.prototype.removeSongAtPosition = function (index) {
  this.songs.splice(index, 1)
  this._save()
  this.emit('remove-song', index)
}

QueueModel.prototype._save = function () {
  var queueJSON = {queue: this.songs}
  localforage.setItem(this.localstorageKey, queueJSON).then(function (value) {
    console.log('Queue saved')
  }).catch(function (err) {
    console.log('Error saving queue: ', err)
  })
}

QueueModel.prototype._restore = function () {
  localforage.getItem(this.localstorageKey).then(function (value) {
    console.log('Queue restored')
    this.songs = value.queue
  }).catch(function (err) {
    console.log('Error retreiving queue from localstorage, maybe this is the first use')
    console.log(err)
  })
}
