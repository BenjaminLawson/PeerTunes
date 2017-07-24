// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

//3rd party
var Mustache = require('mustache')

module.exports = QueueView

function QueueView (model, config) {
  this.model = model
  this.itemTemplate = $(config.itemTemplate).html()
  this.queueSelector = config.songQueue

  this.DOM = {
    songQueue: config.songQueue,
    $songQueue: $(this.queueSelector)
  }

  // speeds up future renders
  Mustache.parse(this.itemTemplate)

  // init Dragula in queue
  // TODO: prevent top song from being dragged if DJ
  /*
  var drake = dragula([document.querySelector(this.queueSelector)])
  // save queue when reordered
  drake.on('drop', function (el, target, source, sibling) {
    this.emit('reorder', el, sibling)
  })
  */

  
}

inherits(QueueView, EventEmitter)

QueueView.prototype.render = function () {
  var self = this

  var songs = this.model.getSongs()

  var template = this.itemTemplate

  var queueHTML = ''
  songs.forEach(function (song) {
    var params = {
      title: song.title,
      source: song.source,
      id: song.id,
      duration: song.duration,
      prettyDuration: self._prettyDuration(song.duration)
    }
    queueHTML += Mustache.render(template, params)
  })

  this.DOM.$songQueue.html(queueHTML)
}

QueueView.prototype.cycle = function () {
  this.DOM.$songQueue.find('li').first().detach().appendTo(this.DOM.$songQueue)
}

QueueView.prototype.appendSong = function (song) {
  var self = this

  var template = this.itemTemplate

  var params = {
    title: song.title,
    source: song.source,
    id: song.id,
    duration: song.duration,
    prettyDuration: this._prettyDuration(song.duration)
  }

  var $renderedSong = $(Mustache.render(template, params))

  this.DOM.$songQueue.append($renderedSong)
}

QueueView.prototype.removeSong = function (index) {
  this._songAtIndex(index).remove()
}

QueueView.prototype.moveToTop = function (index) {
  var $song = this._songAtIndex(index).detach()
  this.DOM.$songQueue.prepend($song)
}

//TODO: pad numbers with 0's
QueueView.prototype._prettyDuration = function (duration) {
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

QueueView.prototype._songAtIndex = function (index) {
  return this.DOM.$songQueue.children().eq(index)
}
