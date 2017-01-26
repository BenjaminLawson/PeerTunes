module.exports = PlayerController

function PlayerController (view, model, config) {
  var self = this
  
  this.view = view
  this.model = model
  

  var DOM = this.view.DOM
  DOM.$volumeSlider.on('change mousemove', function () {
    var volume = $(this).val() / 100
    self.model.setVolume(volume)
  })
}

PlayerController.prototype.playYouTube = function (meta, time) {
  var id = meta.id
  var src = {type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + id }
  this._play(src, 'video', time)
}

PlayerController.prototype.playMP3 = function (meta, time, url) {
  var src = { type: 'audio/mp3', src: url }
  this._play(src, 'audio', time)
}

PlayerController.prototype._play = function (src, type, time) {
  var player = this.model.getPlayer()
  player.src(src)
  this.player.currentTime(time / 1000)
  this.player.play()

  this.view.setVisiblePlayer(type)
}

PlayerController.endSong = function () {
  var player = this.model.getPlayer()
  this.player.pause()
}
