module.exports = {
  trackerURL: 'wss://tracker.openwebtorrent.com',
  chat: {
    messageTemplate: '#chatMessageTmpl',
    chatBody: '#chat .panel-body',
    chatList: '#chat-list',
    chatInput: '#chat-text',
    chatEnterButton: '#chat-enter'
  },
  rtc: {
    iceServers: [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun4.l.google.com:19302'},
      {'urls': 'turn:numb.viagenie.ca', 'username': 'peertunes.turn@gmail.com', 'credential': 'peertunes-turn'},
      {'urls': 'turn:w3.xirsys.com:80?transport=udp', 'username': '3bb9834c-642a-11e7-9004-cef4158965a4', 'credential': '3bb983ce-642a-11e7-aa80-1fb2cc031dcb'}
    ]
  },
  selectors: {
    likeButton: '#like-button',
    dislikeButton: '#dislike-button',
    joinQueueButton: '#btn-join-queue',
    volumeSlider: '#volume-slider'
  },
  moshpit: {
    selector: '#moshpit'
  },
  songQueue: {
    queue: '#my-queue-list',
    localstorageKey: 'queue',
    queueItem: '.queue-item',
    itemTemplate: '#queueItemTmpl'
  },
  player: {
    audio: '#vid2',
    video: '#vid1'
  },
  navBar: {
    leaveButton: '#btn-leave-room'
  }
}
