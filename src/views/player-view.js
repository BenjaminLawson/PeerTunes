module.exports = PlayerView

function PlayerView (model, config) {
  this.model = model

  this.DOM = {
    $audioPlayer: $(config.audioPlayer),
    $videoPlayer: $(config.videoPlayer),
    $volumeButton: $(config.volumeButton),
    $volumeSlider: $(config.volumeSlider),
    $progressBar: $(config.progressBar),
    $currentTime: $(config.currentTime),
    $title: $(config.title),
    $barCover: $(config.barCover)
  }

 

}

PlayerView.prototype.getDOM = function () {
  return this.DOM
}

PlayerView.prototype.render = function () {
  var song = this.model.getSong()
  this.setTitle(song.title)

  this.setCover(this.model.getCover())
}

PlayerView.prototype.setProgress = function (progress) {
  var percent  = progress * 100 + '%'
  this.DOM.$progressBar.css('width', percent)
}

// TODO: max length in CSS
// https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow
PlayerView.prototype.setTitle = function (title) {
  this.DOM.$title.text(title)
}

// cover must be URL, can be blob url
// used for audio player only
PlayerView.prototype.setCover = function (cover) {
  /*
  if (this.player == null) {
    this.player.posterImage.hide()
    return
  }
  */
  //this.$audio.find('.vjs-poster').css('background-image', 'url(' + cover + ')')
  //this.player.posterImage.show()
  
  this.DOM.$barCover.css('background-image', 'url(' + cover + ')')
}

PlayerView.prototype.setvisiblePlayer = function (playerType) {
  switch (playerType) {
    case 'video':
      this.DOM.$videoPlayer.removeClass('hide')
      this.DOM.$audioPlayer.addClass('hide')
      break
    case 'audio':
      this.DOM.$audioPlayer.removeClass('hide')
      this.DOM.$videoPlayer.addClass('hide')
      break
    default:
      console.log('Error: Cannot set visible player to type ', playerType)
  }
}
