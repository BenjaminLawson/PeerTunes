var dragDrop = require('drag-drop')
var localforage = require('localforage')

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
    // console.log('Here are the dropped files', files)
    var file = files[0]
    var key = file.name

    console.log('Reading tags')

    self.tagReader.tagsFromFile(file, function (tags) {
      SongDuration.get(file, function (duration) {
        self.model.addSong({title: tags.combinedTitle, source: 'MP3', id: key, duration: duration})
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

QueueController.prototype._saveFileWithKey = function (file, key) {
  var blob = new Blob([file])
  localforage.setItem(key, blob).then(function () {
    console.log('Done saving file to localstorage')
  }).catch(function (err) {
    console.log('Error saving file:', err)
  })
}
