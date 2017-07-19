
module.exports = MoshpitModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function MoshpitModel (config) {
  // { id: meta{nicename, headbob, avatar}}
  this.users = {}

  EventEmitter.call(this)
}

inherits(MoshpitModel, EventEmitter)

// user = {id, nicename, headbob (bool)}
MoshpitModel.prototype.addAvatar = function (user) {
  //prevent adding duplicates
  if (this.users[user.id]) return
  
  this.users[user.id] = user
  this.emit('avatar:add', user)
}

MoshpitModel.prototype.removeAvatar = function (id) {
  // don't delete a user that doesn't exist
  if (!this.users[id]) return
  
  this.emit('avatar:remove', this.users[id])
  delete this.users[id]
}

MoshpitModel.prototype.removeAllAvatars = function () {
  var self = this
  
  Object.keys(this.users).forEach(function (id) {
    self.emit('avatar:remove', self.users[id])
  })
  this.users = {}
}

// headbob = bool
MoshpitModel.prototype.setHeadbobbing = function (id, headbob) {
  if (!this.users[id]) return

  this.users[id].headbob = headbob
  this.emit('avatar:headbob', id, headbob)
}

// currently unused
MoshpitModel.prototype.stopAllHeadbobs = function () {
  var self = this
  Object.keys(this.users).forEach(function (id) {
    self.setHeadbobbing(id, false)
  })
}
