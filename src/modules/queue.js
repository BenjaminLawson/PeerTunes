// Queue
//TODO: cache selectors & use

var localforage = require('localforage')
var Mustache = require('mustache')

module.exports = Queue

function Queue (config) {
	this.$songQueue =$(config.songQueue)
	this.songQueue = config.songQueue //selector string

	this.localstorageKey = config.localstorageKey
}

Queue.prototype.front = function () {
  var queueSize = $('#my-queue-list li').length
  if (queueSize > 0) {
    var $top = $('#my-queue-list li').first()
    var song = {id: $top.data('id'), source: $top.data('source'), title: $top.data('title')}
    console.log('frontOfSongQueue: ', song)
    return song
  }
  return null
}

Queue.prototype.cycle = function () {
  $('#my-queue-list li').first().remove().appendTo('#my-queue-list')
}

Queue.prototype.addSong = function (meta) {
  var template = $('#queueItemTmpl').html()
  Mustache.parse(template)
  var params = {title: meta.title,source: meta.source, id: meta.id}
  $('#my-queue-list').append(Mustache.render(template, params))

  this.saveToLocalStorage()
}

Queue.prototype.saveToLocalStorage = function () {
  var queue = []
  //{source, id, title}
  $('#my-queue-list .queue-item').each(function (index) {
    var title = $(this).data('title')
    var source = $(this).data('source')
    var id = $(this).data('id')
    queue.push({title: title, source: source, id: id})
  })
  var queueJSON = {queue: queue}
  console.log('saving queue to localstorage:', queueJSON)
  localforage.setItem(this.localstorageKey, queueJSON).then(function () {
    return localforage.getItem('queue')
  }).then(function (value) {
    console.log('Queue saved to localstorage')
  }).catch(function (err) {
    console.log('Error saving queue: ', err)
  })
}

Queue.prototype.getFromLocalStorage = function (callback) {
  localforage.getItem(this.localstorageKey).then(function(value) {
    console.log('Got queue from localstorage: ', value)
    callback(value.queue)
  }).catch(function(err) {
      console.log('Error retreiving queue from localstorage, maybe this is the first use')
      console.log(err)
  })
}

Queue.prototype.setFromArray = function (queueArray) {
  var self = this
  queueArray.forEach(function (item) {
    self.addSong(item)
  })
}

Queue.prototype.restore = function () {
  var self = this

  this.getFromLocalStorage(function (queue) {
    self.setFromArray(queue)
  })
}


