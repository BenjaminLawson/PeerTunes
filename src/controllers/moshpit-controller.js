module.exports = MoshpitController

function MoshpitController (view, model) {
  var self = this

  this.view = view
  this.model = model

  this._onAvatarAdd = this.view.addAvatar.bind(this.view)
  this._onAvatarRemove = this.view.removeAvatar.bind(this.view)
  this._onAvatarHeadbob = this.view.setHeadbobbing.bind(this.view)

  this.model.on('avatar:add', this._onAvatarAdd)
  this.model.on('avatar:remove', this._onAvatarRemove)
  this.model.on('avatar:headbob', this._onAvatarHeadbob)
  
}

MoshpitController.prototype.destroy = function () {
  this.model.removeListener('avatar:add', this._onAvatarAdd)
  this.model.removeListener('avatar:remove', this._onAvatarRemove)
  this.model.removeListener('avatar:headbob', this._onAvatarHeadbob)
}











