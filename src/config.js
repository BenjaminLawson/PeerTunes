module.exports = {
    trackerURL: 'wss://tracker.openwebtorrent.com',
    username: null, // set by welcome view's username input
    keys: {},
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
            {'urls': 'turn:numb.viagenie.ca', 'username': 'peertunes.turn@gmail.com', 'credential': 'peertunes-turn'},
            {'urls': 'turn:w3.xirsys.com:80?transport=udp', 'username': '3bb9834c-642a-11e7-9004-cef4158965a4', 'credential': '3bb983ce-642a-11e7-aa80-1fb2cc031dcb'}
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
    },
    navBar: {
        leaveButton: '#btn-leave-room'
    }
}
