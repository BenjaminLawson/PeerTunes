module.exports = Router

function Router () {
  var self = this
  
  $(window).on('hashchange', function(){
        self.render(decodeURI(window.location.hash));
  })
}

Router.prototype.render = function (hash) {
  
  //first check if identity
  
  
  var parts = hash.split('/')
  var path = parts[0]
  
  
  var hashMap = {
    '': function () {
      // redirect to lobby
      window.location.hash = '#lobby'
    },
    '#lobby': function () {
      // render lobby
      
    },
    '#room': function () {
      // must specify room id (host public key)
      if (parts.length !== 2) window.location.hash = '#lobby'

      // render room


      // render buttons
    }
  }

  // hide all pages
  $('#content .page').hide()

  if (hashMap[path]) {
    hashMap[path]()
  }
  else {
    
  }

}

Router.prototype.hasIdentity = function () {
  // check for identity in localstorage
  // only check localstorage first time, then cache result
  
}
