// YouTube

var queryString = require('query-string')

module.exports = (function () {
  //private
  
  var config = {
    apiKey: 'AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY' // YouTube data api key
  }

  var baseURL = 'https://www.googleapis.com/youtube/v3/'

  //public
  return {
    getVideoMeta: function (id, callback) {
      var meta = {
        id: id,
        title: '',
        description: '',
        duration: 0 //seconds
      }

      //TODO: use queryString

      var apiQuery = baseURL + 'videos?id=' + id + '&key=' + config.apiKey + '&part=snippet,contentDetails'
      var firstResult, ISODuration

      //console.log('YT API query: ', apiQuery)
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
    },
    //TODO: thumbnails
    getSearchResults: function (search, callback) {
      var query = {
        'part': 'snippet',
        'maxResults': 30,
        'q': search,
        'type': 'video',
        'videoDefinition': 'any',
        'videoEmbeddable': true,
        'fields': 'items(id,snippet(thumbnails/standard,title))',
        'key': config.apiKey
      }
      var apiQuery = baseURL + 'search?' + queryString.stringify(query)
      //console.log('YT Search API query: ', apiQuery)

      $.getJSON(apiQuery, function (result) {
        ///console.log('YT Search API Result: ', result)
        result = result.items.map(function (item) {
          return {id: item.id.videoId, title: item.snippet.title}
        })
        callback(result)
      })
    }
  }
}())