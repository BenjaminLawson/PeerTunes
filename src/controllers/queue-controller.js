var dragDrop = require('drag-drop')
var localforage = require('localforage')
var createTorrent = require('create-torrent')
var parseTorrent = require('parse-torrent')

//modules
var TagReader = require('../modules/tag-reader')
var SongDuration = require('../modules/song-duration')

module.exports = QueueController

function QueueController (view, model, config) {
  var self = this

  this.view = view
  this.model = model

  this.model.restore(this.view.render.bind(this.view))

  this.queueItem = config.queueItem

  var DOM = this.view.getDOM()

  this.model.on('add-song', this.view.appendSong.bind(this.view))
  this.model.on('cycle', this.view.cycle.bind(this.view))
  this.model.on('remove-song', this.view.removeSong.bind(this.view))
  this.model.on('move-to-top', this.view.moveToTop.bind(this.view))

  this.tagReader = new TagReader()

  // TODO: use config selectors

  DOM.$songQueue.on('click', '.song-remove', function (e) {
    // remove item from model
    var index = $(this).closest(self.queueItem).index()
    self.model.removeSongAtPosition(index)
  })

  DOM.$songQueue.on('click', '.song-top-control', function (e) {
    // move item to top of model
    // remove item from model
    var index = $(this).closest(self.queueItem).index()
    self.model.moveToTop(index)
  })

  dragDrop(DOM.songQueue, function (files) {
    // TODO: accept multiple files
    var file = files[0]
    var key = file.name

    console.log('Reading tags')

    // TODO: use create-torrent and parse-torrent to get infohash & save
    // when user's turn to dj, seed file, infohash should be the same
    
    // TODO: clean up callbacks
    self.tagReader.tagsFromFile(file, function (tags) {
      SongDuration.get(file, function (duration) {
        self._calculateInfoHash(file, function (infoHash, err) {
          if (err) {
            console.log('Error calculating infoHash: ', err)
            return
          }
          var song = {title: tags.combinedTitle, source: 'MP3', id: key, infoHash: infoHash, duration: duration}
          self.model.addSong(song)
          console.log('Added song to queue model: ', song)
        })
      })
    })

    // store files in localstorage so they can be seeded in future
    // TODO: add loading indicator while song saved to localstorage
    self._saveFileWithKey(file, key)
  })

  DOM.$songQueue.sortable({
    scrollSpeed: 14,
    start: function (event, ui) {
      $(this).data('original-index', ui.item.index())
    },
    update: function (event, ui) {
      var newIndex = ui.item.index()
      var oldIndex = $(this).data('original-index')
      $(this).removeData('original-index')
      self.model.move(oldIndex, newIndex)
    }
  })
}

QueueController.prototype._calculateInfoHash = function (file, cb) {
  console.log('calc infiHash of file ', file)
  createTorrent(file, function (err, torrent) {
    var parsed = parseTorrent(torrent)
    cb(parsed.infoHash, err)
  })
}

QueueController.prototype._saveFileWithKey = function (file, key) {
  var blob = new Blob([file])
  localforage.setItem(key, blob).then(function () {
    console.log('Done saving file to localstorage')
  }).catch(function (err) {
    console.log('Error saving file:', err)
  })
}
