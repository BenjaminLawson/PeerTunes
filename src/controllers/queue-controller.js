var dragDrop = require('drag-drop')
var localforage = require('localforage')
var createTorrent = require('create-torrent')
var parseTorrent = require('parse-torrent')

//modules
var TagReader = require('../lib/tag-reader')
var SongDuration = require('../lib/song-duration')

module.exports = QueueController

function QueueController (view, model, config) {
  var self = this

  this.view = view
  this.model = model

  this.model.restore(this.view.render.bind(this.view))

  this.queueItem = config.queueItem

  var DOM = this.view.DOM

  this._onAddSong = this.view.appendSong.bind(this.view)
  this._onCycle = this.view.cycle.bind(this.view)
  this._onRemoveSong = this.view.removeSong.bind(this.view)
  this._onMoveToTop = this.view.moveToTop.bind(this.view)

  this.model.on('add-song', this._onAddSong)
  this.model.on('cycle', this._onCycle)
  this.model.on('remove-song', this._onRemoveSong)
  this.model.on('move-to-top', this._onMoveToTop)

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

  // dragdrop returns its own remove function
  this._dragDropRemove = dragDrop('#my-queue', function (files) {
    files.forEach(processFile)  
  })

  function processFile (file) {
    var key = file.name

    console.log('Reading tags')
    
    // TODO: clean up callbacks
    self.tagReader.tagsFromFile(file, onTags)

    function onTags (tags) {
      SongDuration.get(file, function (duration) {
        self._calculateInfoHash(file, function (infoHash, err) {
          if (err) {
            console.log('Error calculating infoHash: ', err)
            return
          }
          var title = tags.title ? tags.combinedTitle : file.name
          var song = {title: tags.combinedTitle, source: 'MP3', id: key, infoHash: infoHash, duration: duration}
          self.model.addSong(song)
          console.log('Added song to queue model: ', song)
        })
      })
    }

    // store files in localstorage so they can be seeded in future
    // TODO: add loading indicator while song saved to localstorage
    self._saveFileWithKey(file, key)
  }

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

QueueController.prototype.destroy = function () {
  this._dragDropRemove()

  this.model.removeListener('add-song', this._onAddSong)
  this.model.removeListener('cycle', this._onCycle)
  this.model.removeListener('remove-song', this._onRemoveSong)
  this.model.removeListener('move-to-top', this._onMoveToTop)

  var DOM = this.view.DOM

  DOM.$songQueue.sortable('destroy')
  DOM.$songQueue.empty() // remove all children & their event listeners
  
}

QueueController.prototype._calculateInfoHash = function (file, cb) {
  console.log('calc infoHash of file ', file)
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
