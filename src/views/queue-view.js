//3rd party
var Mustache = require('mustache')

module.exports = QueueView

function QueueView (config) {
  this.itemTemplate = $(config.itemTemplate).html()
  this.queueSelector = config.songQueue

  this.DOM = {
    $songQueue: $(config.songQueue)
  }

  // speeds up future renders
  Mustache.parse(this.itemTemplate)

  
}

//faster than generic re-rendering
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
  this.DOM.$songQueue.children().slice(index)
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
