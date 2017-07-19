//3rd party
var Mustache = require('mustache')

module.exports = MoshpitView

function MoshpitView (config) {
  this.avatarTemplate = $('#avatarTmpl').html()

  this.DOM = {
    $moshpit: $(config.selector)
  }

  // speeds up future renders
  Mustache.parse(this.avatarTemplate)
}

MoshpitView.prototype.getDOM = function () {
  return this.DOM
}

MoshpitView.prototype.addAvatar = function (user) {
  var x = Math.random() * 80 + 10
  var y = Math.random() * 100 + 5
  var userId = 'user-' + user.id

  var params = {userId: userId, avatar: user.avatar, x: x, y: y, z: Math.floor(y)}
  var rendered = Mustache.render(this.avatarTemplate, params)

  var $avatar = $(rendered)
  if (user.headbob) $avatar.find('.audience-head').addClass('headbob-animation')

  this._initPopover(user, $avatar)

  this.DOM.$moshpit.append($avatar)
}

MoshpitView.prototype.removeAvatar = function (user) {
  var $avatar = $('#user-' + user.id)
  $avatar.remove()
  $avatar.webuiPopover('destroy')
}

MoshpitView.prototype.setHeadbobbing = function (id, headbob) {
  var $avatarHead = $('#user-' + id + ' .audience-head')
  $avatarHead.toggleClass('headbob-animation', bobbing)
}

MoshpitView.prototype._initPopover = function (user, $avatar) {
  // popover init
  var template = $('#popoverTmpl').html()
  Mustache.parse(template)
  var params = {nicename: user.nicename}
  var rendered = Mustache.render(template, params)
  $avatar.webuiPopover({title: '', content: rendered, placement: 'top', trigger: 'hover', padding: false})
}


MoshpitView.prototype.chatPopover = function (id, content) {
  content = '<div class="text-center">'+content+'</div>'

  var selector = '#user-'+id+' .audience-head'
  $user = $(selector)
  var options = {
    title: '',
    placement: 'top',
    content: content,
    trigger:'manual',
    width: 190,
    animation: 'pop',
    multi: true,
    cache: false, // doesn't work?
    autoHide: 2600,
    onHide: function ($el) { // hack so content will update
      $user.webuiPopover('destroy')
    }
  }

  $user.webuiPopover(options)

  $user.webuiPopover('show')
}

