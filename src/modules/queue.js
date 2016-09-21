// Queue
//TODO: cache selectors & use

var localforage = require('localforage')
var Mustache = require('mustache')
var dragDrop = require('drag-drop')
var TagReader = require('./tag-reader')

module.exports = Queue

function Queue (config) {
	var self = this

	this.$songQueue =$(config.queue)
	this.songQueue = config.queue //selector string

	this.queueItem = config.queueItem

	this.localstorageKey = config.localstorageKey

	this.$itemTemplate = $(config.itemTemplate)

	this.tagReader = new TagReader()


	//TODO: move to queue module
  //TODO: race condition if song added to top of queue right before DJing
  //fix by adding loading bar before for localforage before actually added to queue
  dragDrop('#my-queue', function (files) {
    // console.log('Here are the dropped files', files)
    var file = files[0]
    var key = file.name


    console.log('Reading tags')

    self.tagReader.tagsFromFile(file, function(tags) {
      self.addSong({title: tags.combinedTitle, source: 'MP3', id: key})
    })

    // store files in localstorage so they can be seeded in future
    //TODO: add loading indicator while song saved to localstorage
    var blob = new Blob([file])
    localforage.setItem(key, blob).then(function () {

      console.log('Done saving file to localstorage')
      return localforage.getItem(key)
    }).then(function (value) {
      //set successful

    }).catch(function (err) {
      console.log('Error retreiving file:', err)
    })
  })

}

Queue.prototype.front = function () {
	var $items = this.$songQueue.find('li')
  var queueSize = $items.length
  if (queueSize > 0) {
    var $top = $items.first()
    var song = {id: $top.data('id'), source: $top.data('source'), title: $top.data('title')}
    return song
  }
  return null
}

Queue.prototype.cycle = function () {
  this.$songQueue.find('li').first().remove().appendTo(this.songQueue)
  this.saveToLocalStorage()
}

Queue.prototype.addSong = function (meta) {
  this.appendSong(meta)
  this.saveToLocalStorage()
}

//like addSong, but doesn't save
Queue.prototype.appendSong = function (meta) {
	var template = this.$itemTemplate.html()
  Mustache.parse(template)
  var params = {title: meta.title,source: meta.source, id: meta.id}
  this.$songQueue.append(Mustache.render(template, params))
}

Queue.prototype.saveToLocalStorage = function () {
  var queue = []
  //{source, id, title}
  this.$songQueue.find(this.queueItem).each(function (index) {
    var title = $(this).data('title')
    var source = $(this).data('source')
    var id = $(this).data('id')
    queue.push({title: title, source: source, id: id})
  })
  var queueJSON = {queue: queue}
  //console.log('saving queue to localstorage:', queueJSON)
  localforage.setItem(this.localstorageKey, queueJSON).then(function () {
    return localforage.getItem('queue')
  }).then(function (value) {
    //console.log('Queue saved to localstorage')
  }).catch(function (err) {
    console.log('Error saving queue: ', err)
  })
}

Queue.prototype.getFromLocalStorage = function (callback) {
  localforage.getItem(this.localstorageKey).then(function(value) {
    //console.log('Got queue from localstorage: ', value)
    callback(value.queue)
  }).catch(function(err) {
      console.log('Error retreiving queue from localstorage, maybe this is the first use')
      console.log(err)
  })
}

Queue.prototype.setFromArray = function (queueArray) {
  var self = this
  queueArray.forEach(function (item) {
    self.appendSong(item)
  })
}

Queue.prototype.restore = function () {
  var self = this
  //console.log('Restoring song queue')
  this.getFromLocalStorage(function (queue) {
    self.setFromArray(queue)
  })
}


