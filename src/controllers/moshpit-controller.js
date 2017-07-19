module.exports = MoshpitController

function MoshpitController (view, model) {
  var self = this

  this.view = view
  this.model = model

  this.model.on('avatar:add', this.view.addAvatar.bind(this.view))
  this.model.on('avatar:remove', this.view.removeAvatar.bind(this.view))
  this.model.on('avatar:headbob', this.view.setHeadbobbing.bind(this.view))
  
}











