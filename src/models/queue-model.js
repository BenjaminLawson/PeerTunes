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

QueueModel.prototype.getSongs = function () {
  return this.songs
}

QueueModel.prototype.addSong = function (song) {
  this.songs.push(song)
  this._save()
  this.emit('add-song', song)
  this.emit('queue:change', this.songs)
}

QueueModel.prototype.cycle = function () {
    if (this.songs.length <= 1) return

    //console.log('songQueue cycling songs')

  var front = this.songs.shift()
  this.songs.push(front)
  this._save()
  this.emit('cycle')
  this.emit('queue:change', this.songs)

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
  this.emit('queue:change', this.songs)
}

QueueModel.prototype.moveToTop = function (index) {
  this.move(index, 0)
  this.emit('move-to-top', index)
  this.emit('queue:change', this.songs)
}

// triggered by drag/drop reordering on view
QueueModel.prototype.move = function (from, to) {
  var removedSongArray = this.songs.splice(from, 1)
  var removedSong = removedSongArray[0]
  this.songs.splice(to, 0, removedSong)
  this._save()

  this.emit('queue:change', this.songs)
}

QueueModel.prototype._save = function () {
  var queueJSON = {queue: this.songs}
  localforage.setItem(this.localstorageKey, queueJSON).then(function (value) {
    //console.log('Queue saved')
  }).catch(function (err) {
    console.log('Error saving queue: ', err)
  })
}

QueueModel.prototype.restore = function (callback) {
  var self = this
  localforage.getItem(this.localstorageKey).then(function (value) {
    self.songs = value.queue
    callback()
  }).catch(function (err) {
    console.log('Error retreiving queue from localstorage, maybe this is the first use')
    console.log(err)
  })
}










