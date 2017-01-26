module.export = HostModel

// native
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function HostModel (config) {
  this.guests = [] // peers
  this.djQueue = []
  this.votes = [] // vote history
  this.score = 0 // current song score
}

inherits(HostModel, EventEmitter)

HostModel.prototype.resetScore = function () {
  this.votes.length = 0
  this.score = 0
}

HostModel.prototype.reset = function () {
  this.guests.length = 0
  this.djQueue.length = 0
  this.rating = 0
  this.votes.length = 0
  this.score = 0
}

HostModel.prototype.addGuest = function (peer) {
  this.guests.push(peer)
}

HostModel.prototype.removeGuest = function (peer) {
  var index = this.guests.indexOf(peer)
  if (index >= 0) {
    this.guests.splice(index, 1)
  }
}

HostModel.prototype.addVote = function (vote) {
  // remove previes votes by peer
  this.votes = this.votes.filter(function (v) {
    return v.peer !== vote.peer
  })

  this.votes.push(vote)

  this._recalculateScore()
}

HostModel.prototype.addDJ = function (peer) {
  this.djQueue.push(peer)
}

HostModel.prototype.removeDJ = function (peer) {
  var index = this.djQueue.indexOf(peer)
  if (index >= 0) {
    this.djQueue.splice(index, 1)
  }
}

HostModel.prototype.cycleDJs = function () {
  if (this.djQueue.length === 0) return

  var front = this.djQueue.shift()
  this.djQueue.push(front)
}

HostModel.prototype._recalculateScore = function () {
  var score = 0
  this.votes.forEach(function (vote) {
    score += vote.value
  })
  this.score = score
  this.emit('score-update', this.score)
}

