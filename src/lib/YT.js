// YouTube

var queryString = require('query-string')

module.exports = (function () {
  //private
  
  var config = {
    apiKey: 'AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY', // YouTube data api key
    maxResults: 35
  }

  var baseURL = 'https://www.googleapis.com/youtube/v3/'

  function secondsFromISODuration (duration) {
    return moment.duration(duration).asSeconds()
  }

  function getBatchVideoMeta (ids, callback) {
    var idList = ids.join(',')
    var query = {
      'part': 'snippet,contentDetails',
      id: idList,
      'key': config.apiKey
    }
    var apiQuery = baseURL + 'videos?' + queryString.stringify(query)
    $.getJSON(apiQuery, function (result) {
      console.log('Batch video meta result: ', result)
      var videos = result.items.map(function (item) {
        return {
          title: item.snippet.title,
          id: item.id,
          duration: secondsFromISODuration(item.contentDetails.duration),
          thumbnail: item.snippet.thumbnails.medium.url
        }
      })
      
      callback(videos)
    })
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

      //TODO: use queryString

      var apiQuery = baseURL + 'videos?id=' + id + '&key=' + config.apiKey + '&part=snippet,contentDetails'
      //console.log('YT API query: ', apiQuery)

      $.getJSON(apiQuery, function (result) {
        //console.log('YT API Result: ', result)
        var firstResult = result.items[0]
        meta.title = firstResult.snippet.title
        meta.description = firstResult.snippet.description
        // YouTube gives duration in ISO format, need to convert
        meta.duration = secondsFromISODuration(firstResult.contentDetails.duration)
        callback(meta)
      })
    },
    //TODO: thumbnails
    getSearchResults: function (search, callback) {
      //TODO: only get ids, then get details from batch query
      var query = {
        'part': 'id',
        'maxResults': config.maxResults,
        'q': search,
        'type': 'video',
        'videoDefinition': 'any',
        'videoEmbeddable': true,
        'key': config.apiKey
      }
      var apiQuery = baseURL + 'search?' + queryString.stringify(query)
      //console.log('YT Search API query: ', apiQuery)

      $.getJSON(apiQuery, function (result) {
        //console.log('YT Search API Result: ', result)
        result = result.items.map(function (item) {
          return item.id.videoId
        })
        getBatchVideoMeta(result, callback)
      })
    }
  }
}())
