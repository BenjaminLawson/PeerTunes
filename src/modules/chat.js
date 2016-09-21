// Chat

//native
var EventEmitter = require('events').EventEmitter

//3rd party
var Mustache = require('mustache')

module.exports = (function () {
  var settings = {
    maxMessageLength: 300,
    template: '#chatMessageTmpl'
  }
  //private

  var $chatBody, $chatList, $chatInput, $chatEnterButton

  var nickname

  var emitter = new EventEmitter()

  function emojify ( msg ) {
    // replace common ascii emoticons with shortnames
    msg = msg.replace(/:\)/g, ':smile:')
    msg = msg.replace(/:D/g, ':grin:')
    msg = msg.replace(/<3/g, ':heart:')

    // convert emoji shortnames to image tags
    msg = emojione.shortnameToImage(msg)

    return msg
  }

  function filter ( msg ) {
    // truncate
    if (msg.length > settings.maxMessageLength) {
      msg = msg.substring(0, settings.maxMessageLength)
    }
    // strip html
    msg = $('<p>').html(msg).text()
    //msg = emojify(msg)
    return msg
  }

  function isScrolledToBottom () {
    //[0] gets DOM element
    return ($chatBody[0].scrollHeight - $chatBody[0].offsetHeight - $chatBody[0].scrollTop < 1)
  }
  //TODO: fix this
  function scrollToBottom() {
    var height = $chatBody[0].scrollHeight
    $chatBody.scrollTop(height)
  }

  function clearInput () {
    $chatInput.val('')
  }

  function submitMessage () {
    var text = $chatInput.val()
    if (text.trim().length < 1)  return
    //console.log('submitting ', text)

    //TODO: do not emit emojified text
    //causes guest->host emoji to be removed
    emitter.emit('submit', filter(text))

    appendMsg(nickname, text)

    clearInput()
    scrollToBottom()
  }

  function appendMsg(id, msg) {
    //console.log('chat: [' + id + ' : ' + msg + ']')
    msg = emojify( filter(msg) )
    var template = $(settings.template).html()
    var params = {id: id, message: msg}
    $chatList.append(Mustache.render(template, params))

    //return filtered message for convenience
    return msg
  }

  //public
  return {
      init: function (config) {
        console.log('Initializing chat')

        $chatInput = $(config.chatInput)
        $chatBody = $(config.chatBody)
        $chatEnterButton = $(config.chatEnterButton)
        $chatList = $(config.chatList)
        nickname = config.name


        //click handlers
        $chatEnterButton.click(function (e) {
          submitMessage()
        })

        //key listeners
        var ENTER_KEY = 13

        $chatInput.keydown(function (e) {
          if (e.keyCode == ENTER_KEY) {
            submitMessage()
          }
        })
      },
      getInputText: function () {
        return $chatInput.val()
      },
      appendMsg: appendMsg,
      submitMessage: submitMessage,
      clear: function () {
        $chatList.html('')
      },
      clearInput: clearInput,
      scrollToBottom: scrollToBottom,
      filter: filter,
      isScrolledToBottom: isScrolledToBottom,
      emojify: emojify,
      on: function (event, callback) {
        emitter.on(event, callback)
      }
    }
}())