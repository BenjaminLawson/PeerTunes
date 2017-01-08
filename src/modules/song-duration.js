//trick to get the duration of an audio file

var SongDuration = {
  get: function (file, callback) {
		var fileURL = URL.createObjectURL(file)

		//create temporary audio element to read duration from
		var $audio = $('<audio id="sd-temp"></audio>')
		$audio.css('display', 'none')
		$audio.on('canplaythrough', function (e) {
			var duration = e.currentTarget.duration //seconds

			//free memory
			URL.revokeObjectURL(fileURL)

			//destroy element
			$(this).remove()

			callback(duration)
		})

		$('body').append($audio)
		$audio.prop('src', fileURL)
  }
}

module.exports = SongDuration
