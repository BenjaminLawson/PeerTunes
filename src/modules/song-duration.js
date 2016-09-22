//trick to get the duration of an audio file

var SongDuration = {
	get: function (file, callback) {
		var fileURL = URL.createObjectURL(file)

		var $audio = $('<audio id="sd-temp"></audio>')
		$audio.css('display', 'none')
		$audio.on('canplaythrough', function (e) {
			var duration = e.currentTarget.duration //seconds
			URL.revokeObjectURL(fileURL)
			$(this).remove()

			callback(duration)
		})

		$('body').append($audio)
		$audio.prop('src', fileURL)
	}
}

module.exports = SongDuration