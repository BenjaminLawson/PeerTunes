var localforage = require('localforage')
var sodium = require('sodium-universal')

var LobbyController = require('../controllers/lobby-controller')

module.exports = Router

function Router () {
  var self = this
  
  console.log('init Router')

  this.identity = null
  
  self.render(decodeURI(window.location.hash))
  
  $(window).on('hashchange', function(){
    console.log('hashchange: ', window.location.hash)
    self.render(decodeURI(window.location.hash))   
  })
}

Router.prototype.render = function (hash, opts) {
  var self = this
  
  // first check if identity exists
  if (!this.identity && hash !== '#login') {
    this.getIdentity(function (identity) {
      if (!identity) {
        // no identity found, redirect to login page
        console.log('No identity')
        self.redirect('#login')
        return
      }
      else {
        self.identity = identity
        
        handleRoute(hash)
      }
    })
    return
  }

  handleRoute(hash)

  function handleRoute (route) {
    console.log('handle route')
    var parts = route.split('/')
    var path = parts[0]
    
    
    var routes = {
      '': function () {
        self.redirect('#lobby')
      },
      '#login': function () {
        self.renderLoginView()
      },
      '#lobby': function (opts) {
        // render lobby
        $('.page#lobby').show()
        var lobbyController = new LobbyController({router: self, identity: self.identity})
      },
      '#room': function (opts) {
        // must specify room id (host's public key)
        if (parts.length !== 2) {
          self.redirect('#lobby')
          return
        }

        // render room
        $('.page#room').show()

        // render buttons
      }
    }

    // hide all pages
    $('#main-content .page').hide()

    if (routes[path]) {
      routes[path]()
    }
    else {
      // invalid route
      console.log('Router: invalid route ', route)
      self.redirect('#lobby')
    }
  }
  
  

}

Router.prototype.redirect = function (hash) {
  console.log('Router: redirecting to ', hash)
  window.location.hash = hash
}

Router.prototype.getIdentity = function (cb) {
  // check for identity in localstorage
  // if not found, identity will be null
  console.log('getting identity')
  localforage.getItem('identity').then(function (identity) {
    console.log('got encoded identity: ', identity)
    if (identity) identity.keypair = decodeKeypair(identity.keypair)
    cb(identity)
  }).catch(function (error) {
    console.log(error)
  })
}

// TODO: move to separate module
Router.prototype.renderLoginView = function () {
  var self = this
  console.log('render login')
  
  $('.page#login').show()

  $('#btn-login').click(function (e) {
    console.log('login button clicked')
    var username = $('#input-username').val()

    // TODO: alert user
    if (username.length === 0) {
      console.log('Error: Username field empty')
      return
    }
    
    var keypair = generateKeypair()
    var identity = {username: username, keypair: keypair}

    self.identity = identity
    console.log('generated identity ', identity)

    saveIdentity(identity, function () {
      self.redirect('#lobby')
    })
  })

  function generateKeypair() {
    console.log('generating keypair...')

    var private = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    var public = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)

    // create elliptic curve key pair
    sodium.crypto_sign_keypair(public, private)

    return {public: public, private: private}
  }

  function saveIdentity(identity, cb) {
    var encodedIdentity = {
      keypair: encodeKeypair(identity.keypair),
      username: identity.username
    }
    
    localforage.setItem('identity', encodedIdentity).then(function () {
      cb()
    }).catch(function (error) {
      console.log(error)
    })
  }
}

function encodeKeypair(keypair) {
  return  {
    public: keypair.public.toString('base64'),
    private: keypair.private.toString('base64')
  }
}

function decodeKeypair(keypair) {
  return {
    public: Buffer.from(keypair.public, 'base64'),
    private: Buffer.from(keypair.private, 'base64')
  }
}
