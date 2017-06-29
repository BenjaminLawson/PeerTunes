module.exports = {
  maxRoomSize: 50, // arbitrary until further testing, NOT USED YET
  trackerURL: 'wss://tracker.openwebtorrent.com',
  username: null, // set by welcome view's username input
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
      {'urls': 'stun:stun3.l.google.com:19302'},
      {'urls': 'stun:stun4.l.google.com:19302'},
      {'urls': 'turn:numb.viagenie.ca', 'username': 'peertunes.turn@gmail.com', 'credential': 'peertunes-turn'}
    ]
  },
  selectors: {
    moshpit: '#moshpit',

    likeButton: '#like-button',
    dislikeButton: '#dislike-button',
    joinQueueButton: '#btn-join-queue',
    volumeSlider: '#volume-slider'
  },
  moshpit: {
    // TODO
    width: -1,
    height: -1
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
  }
}
