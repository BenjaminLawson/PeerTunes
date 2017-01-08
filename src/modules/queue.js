// Queue

//TODO: lock top song while DJ

var localforage = require('localforage')
var Mustache = require('mustache')
var dragDrop = require('drag-drop')

//modules
var TagReader = require('./tag-reader')
var SongDuration = require('./song-duration')

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
    	SongDuration.get(file, function (duration) {
	    	self.addSong({title: tags.combinedTitle, source: 'MP3', id: key, duration: duration})
	    })
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
    var song = {
      id: $top.data('id'),
      source: $top.data('source'),
      title: $top.data('title'),
      duration: $top.data('duration')
    }
    //console.log('Front of queue: ', song)
    return song
  }
  return null
}

Queue.prototype.cycle = function () {
  this.$songQueue.find('li').first().detach().appendTo(this.songQueue)
  this.saveToLocalStorage()
}

Queue.prototype.addSong = function (meta) {
  this.appendSong(meta)
  this.saveToLocalStorage()
}

//like addSong, but doesn't save
Queue.prototype.appendSong = function (meta) {
	var self = this

	var durationString = this.prettyDuration(meta.duration)

	var template = this.$itemTemplate.html()
  Mustache.parse(template)
  var params = {
  	title: meta.title, 
  	source: meta.source, 
  	id: meta.id, 
  	duration: meta.duration, 
  	prettyDuration: durationString
  }
  var $renderedSong = $(Mustache.render(template, params))
  this.$songQueue.append($renderedSong)

  $renderedSong.find('.song-remove').click(function(e) {
  	//console.log('Song remove clicked')
  	$renderedSong.remove()
  	self.saveToLocalStorage()
  	//TODO: remove mp3 files from localstorage
  })
  $renderedSong.find('.song-top-control').click(function(e) {
  	//console.log('Song top clicked')
  	$renderedSong.detach().prependTo(self.$songQueue)
  	self.saveToLocalStorage()
  })

}

Queue.prototype.saveToLocalStorage = function () {
  var queue = []
  //{source, id, title}
  this.$songQueue.find(this.queueItem).each(function (index) {
    var title = $(this).data('title')
    var source = $(this).data('source')
    var id = $(this).data('id')
    var duration = $(this).data('duration')

    queue.push({
    	title: title, 
    	source: source, 
    	id: id, 
    	duration: duration
    })
  })

  var queueJSON = {queue: queue}
  //console.log('saving queue to localstorage:', queueJSON)
  localforage.setItem(this.localstorageKey, queueJSON).then(function (value) {
    //console.log('Queue saved')
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

//TODO: pad numbers with 0's
Queue.prototype.prettyDuration = function (duration) {
	var momentDuration =  moment.duration(duration, 'seconds')
	var seconds = momentDuration.seconds()
	var minutes = momentDuration.minutes()
	var hours = momentDuration.hours()

	seconds = ('0' + seconds).slice(-2)

	var pretty = minutes + ':' + seconds
	if (hours > 0) {
		hours = ('0' + hours).slice(-2)
		pretty = hours + ':' + pretty
	}

	return pretty
}


