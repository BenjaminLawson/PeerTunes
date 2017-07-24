/*
optionally pass data to route
in room, check if host
- if so, check that passed data exists & connect to lobby if exists
- if not host, just connect to room

use pushstate state?

*/


var localforage = require('localforage')
var sodium = require('sodium-universal')
var config = require('../config')

var LobbyController = require('../controllers/lobby-controller')
var Peertunes = require('./peertunes')

module.exports = Router

function Router () {
  var self = this
  
  console.log('init Router')

  this.identity = null

  this.previousPage = null
  
  self.render(decodeURI(window.location.hash))

  /*
  $(window).bind('popstate', function (e) {
    console.log('popstate ', e)
    self.render(decodeURI(window.location.hash))
    })
  */
  $(window).on('hashchange', function() {
    self.render(decodeURI(window.location.hash))
  })
}

Router.prototype.route = function (path, opts) {
  console.log('Router: route ', path, opts)
  //history.pushState(null, null, path)
  this.render(path, opts)
}

Router.prototype.render = function (hash, opts) {
  var self = this

  opts = opts || {}
  
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
          
        handleRoute(hash, opts)
      }
    })
    return
  }

  handleRoute(hash, opts)

  function handleRoute (route, opts) {
    var parts = route.split('/')
    var path = parts[0]

    if (self.previousPage) {
      console.log('Router: previous page exists, destroying')
      self.previousPage.destroy()
      self.previousPage = null
    }
    else {
      console.log('Router: no previous page exists')
    }
    
    
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
        $('#btn-create-room').show()
        
        var lobbyController = new LobbyController({router: self, identity: self.identity})
        self.previousPage = lobbyController
      },
      '#room': function (opts) {
        // must specify room id (host's public key)
        if (parts.length !== 2) {
          console.log('missing room id param')
          self.redirect('#lobby')
          return
        }

        // render room
        $('.page#room').show()
        $('#btn-room-listing').show()

        // TODO: leave lobby

        // init room
        opts.roomPubkey = parts[1]

        opts.username = self.identity.username
        opts.keys = self.identity.keypair
        opts.identity = self.identity
        opts.router = self
        var room = new Peertunes(opts)
        self.previousPage = room
      }
    }

    // hide all pages
    $('#main-content .page').hide()
    $('.navbar-btn').hide()

    if (routes[path]) {
      routes[path](opts)
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
  this.route(hash)
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
