module.export = HostController

var SongManager = require('../modules/song-manager')

function HostController (model, config) {
  this.model = model
  this.songManager = new SongManager()

  this.songManager.on('song-end', this._onSongEnd.bind(this))
}

HostController.prototype._onSongEnd = function () {
  this.model.cycleDJs()
  this.model.resetScore()
}

HostController.prototype.stop = function () {
  this.songManager.end()
  this.model.reset()
}
