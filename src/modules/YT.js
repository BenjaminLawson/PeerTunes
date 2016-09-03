// YouTube

module.exports = (function () {
  //private
  
  var config = {
    apiKey: 'AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY' // YouTube data api key
  }

  //public
  return {
    getVideoMeta: function (id, callback) {
      var meta = {
        id: id,
        title: '',
        description: '',
        duration: 0 //seconds
      }

      var apiQuery = 'https://www.googleapis.com/youtube/v3/videos?id=' + id + '&key=' + config.apiKey + '&part=snippet,contentDetails'
      var firstResult, ISODuration

      console.log('YT API query: ', apiQuery)
      $.getJSON(apiQuery, function (result) {
        //console.log('YT API Result: ', result)
        firstResult = result.items[0]
        meta.title = firstResult.snippet.title
        meta.description = firstResult.snippet.description
        // YouTube gives duration in ISO format, need to convert to milliseconds
        ISODuration = firstResult.contentDetails.duration
        meta.duration = moment.duration(ISODuration).asSeconds()
        callback(meta)
      })
    }
  }
}())