//Tag Reader

var mediaTags = require('jsmediatags')

module.exports = TagReader

function TagReader () {

}

TagReader.prototype.tagsFromFile = function (file, callback) {
  mediaTags.read(file, {
      onSuccess: function(tag) {
        tag = tag.tags

        //https://github.com/aadsm/jsmediatags/issues/13
        if (tag.picture) {
            var base64String = ''
            for (var i = 0; i < tag.picture.data.length; i++) {
                base64String += String.fromCharCode(tag.picture.data[i])
            }
            var base64 = 'data:image/jpeg;base64,' + window.btoa(base64String)
            tag.picture = base64
          } else {
            //TODO: use placeholder image
            tag.picture = null
          }


        var meta = {
          artist: tag.artist,
          title: tag.title,
          cover: tag.picture,

          combinedTitle: tag.title + ' - ' + tag.artist //Here Comes the Sun - The Beatles
        }

        callback(meta)
      },
      onError: function(error) {
        console.log('Error reading MP3 tags: ', error)
      }
    })
}
