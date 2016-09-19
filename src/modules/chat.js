// Chat

var Mustache = require('mustache')

module.exports = (function () {
  var settings = {
    maxMessageLength: 300,
    template: '#chatMessageTmpl'
  }
  //private

  //jQuery objects
  var chatBody, chatList, chatInput, chatEnterButton

  var onSubmitSuccess
  var nickname

  //TODO: fix img tag being in quotes- Mustache's doing?
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
      msg = msg.substring(0, PT.config.maxChatLength)
    }
    // strip html
    msg = $('<p>').html(msg).text()

    return msg
  }

  function isScrolledToBottom () {
    //[0] gets DOM element
    return (chatBody[0].scrollHeight - chatBody[0].offsetHeight - chatBody[0].scrollTop < 1)
  }
  //TODO: fix this
  function scrollToBottom() {
    var height = chatBody[0].scrollHeight
    chatBody.scrollTop(height)
  }

  function clearInput () {
    chatInput.val('')
  }

  function submitMessage () {
    var text = chatInput.val()

    text = filter(text)

    if (text.trim().length > 0) {
      if (onSubmitSuccess) onSubmitSuccess(text)

      appendMsg(nickname, text)
      clearInput()
      scrollToBottom()
    }
  }

  function appendMsg(id, msg) {
    msg = filter(msg)
    console.log('chat: [' + id + ' : ' + msg + ']')
    var emojiMsg = emojify(msg)

    var template = $(settings.template).html()
    var params = {id: id, message: emojiMsg}
    chatList.append(Mustache.render(template, params))

    //return filtered message for convenience
    return msg
  }

  //public
  return {
      init: function (config) {
        console.log('Initializing chat')

        chatInput = $(config.chatInput)
        chatBody = $(config.chatBody)
        chatEnterButton = $(config.chatEnterButton)
        chatList = $(config.chatList)
        nickname = config.name


        //click handlers
        chatEnterButton.click(function (e) {
          //TODO: broadcast message too
          submitMessage()
        })

        //key listeners
        var ENTER_KEY = 13

        chatInput.keydown(function (e) {
          if (e.keyCode == ENTER_KEY) {
            submitMessage()
          }
        })
      },
      getInputText: function () {
        return chatInput.val()
      },
      onSubmitSuccess: function ( callback ) {
        onSubmitSuccess = callback
      },
      appendMsg: appendMsg,
      submitMessage: submitMessage,
      clear: function () {
        chatList.html('')
      },
      clearInput: clearInput,
      scrollToBottom: scrollToBottom,
      filter: filter,
      isScrolledToBottom: isScrolledToBottom,
      emojify: emojify
    }
}())