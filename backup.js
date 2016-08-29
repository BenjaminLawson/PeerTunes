/*
-user connects to swarm
-users tell swarm that they are hosting a room
-->TODO: propogate message to unconnected peers in swarm
-users subscribe to host's room updates
-host controls & relays room data
--> this way only host has control of queue, and can kick/ban users (by ip)

//TODO: central message type/string object
//TODO: change everything to ids, since user doesn't have peer object for themself
*/

var hat = require('hat')
var Peer = require('simple-peer')
var Tracker = require('bittorrent-tracker/client')

var YT = {
    config: {
        apiKey: 'AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY' //YouTube data api key
    },
    getVideoMeta: function(id, callback){
        var meta = {
            id: id,
            title: '',
            description: '',
            duration: 0 //milliseconds
        };
        var apiQuery = "https://www.googleapis.com/youtube/v3/videos?id="+id+"&key="+YT.config.apiKey+"&part=snippet,contentDetails";
        var firstResult, ISODuration;

        console.log("YT API query: ", apiQuery);
        $.getJSON(apiQuery, function(result){
            console.log("YT API Result: ", result);
            firstResult = result.items[0];
            meta.title = firstResult.snippet.title;
            meta.description = firstResult.snippet.description;
            //YouTube gives duration in ISO format, need to convert to milliseconds
            ISODuration = firstResult.contentDetails.duration;
            meta.duration = moment.duration(ISODuration).asMilliseconds();
            callback(meta);
        });
    }
};

var PT = {
    config: {
        maxRoomSize: 50, //arbitrary
        maxChatLength: 300,
        trackerURL: 'wss://tracker.webtorrent.io'
    },
    tracker: null,
    isHost: false, //true = this peer is a host, false = this peer is a client
    peers: [], //peers in swarm
    peerId: new Buffer(hat(160), 'hex'), //peer ID of this peer: new Buffer(hat(160), 'hex')
    hostPeer: null, //per object of room host
    rooms: [], //{peer, title}
    vote: 0, //vote for current video
    rating: 0, //overall song rating
    inQueue: false, //if this peer is in DJ queue
    isDJ: false, //this peer is the dj
    player: null, //videojs player object
    host:{
        //TODO: make object literal instead of array?
        peers: [], //client connections
        djQueue: [] //array of DJ's in queue
    },
    //TODO: if peer hash in url, try to connect to that peer
    init: function(){
        console.log('Initializing')

        if (!Peer.WEBRTC_SUPPORT) {
          window.alert('This browser is unsupported. Please use a browser with WebRTC support.')
        }

        PT.chat.chatBody = $('#chat .panel-body')
        console.log('Connecting to tracker: ' + PT.config.trackerURL)

        PT.tracker = new Tracker({
            peerId: PT.peerId,
            announce: PT.config.trackerURL,
            infoHash: new Buffer(20).fill('01234567890123456789') //temp
        })

        PT.initTrackerListeners()
        //PT.initClickHandlers()
        //PT.initKeyHandlers()

        PT.tracker.start()
        PT.tracker.update()

        PT.player = videojs('vid1')
        //video player listeners
        PT.player.ready(function() {
                //automatically hide/show player when song is playing
                this.on("ended", function(){
                    $('#video-frame').hide()
                })
                this.on("play", function(){
                    $('#video-frame').show()
                })
        });


    },
    initTrackerListeners: function(){
        console.log("Initializing tracker event listeners")
        PT.tracker.on('peer', function (peer) {
            console.log('Tracker sent new peer: ' + peer.id)
            PT.peers.push(peer)


            if (peer.connected) onConnect()
            else peer.once('connect', onConnect)

            function onConnect () {
                console.log("Peer connected: "+peer.id)
                peer.on('data', onMessage)
                peer.on('close', onClose)
                peer.on('error', onClose)
                peer.on('end', onClose)

                /*
                if (PT.isHost) {
                    peer.send(JSON.stringify({type: 'new-room', value: 'test title'}))
                }

                PT.broadcastToRoom({type: "new-user", value: peer.id}, null);
                //send old users
                for(var i=PT.host.peers.length-1; i>=0; i--){
                    //TODO: send current head bobbing states, maybe keep seperate array of peers and head bobbing state
                    //send new client all users except themself
                    if(PT.host.peers[i] != peer) peer.send(JSON.stringify({type: "new-user", value: PT.host.peers[i].id}))
                }
                peer.send(JSON.stringify({type: "new-user", value: PT.peerId})); //send host, since host isn't in connection array
                
                if(PT.song.meta.id !== undefined){
                    var timeSinceStart = Date.now() - PT.song.startTime;
                    peer.send(JSON.stringify({type: 'song', value: PT.song.meta.id, dj: conn.peer, time: timeSinceStart}));
                }
                */

                function onClose () {
                    console.log("Peer disconnected")

                    peer.removeListener('data', onMessage)
                    peer.removeListener('close', onClose)
                    peer.removeListener('error', onClose)
                    peer.removeListener('end', onClose)

                    /*
                    PT.peers.splice(peers.indexOf(peer), 1)
                    if (PT.isHost) {
                        var index = PT.host.djQueue.indexOf(peer)
                        if (index > -1) PT.host.djQueue.splice(index,1)
                    }
                    else {

                    }
                    */
                }
                //TODO: move message handler
                function onMessage (data) {
                    console.log('Received message: ' + data)
                    try {
                        data = JSON.parse(data)
                    } catch (err) {
                        console.error(err.message)
                    }
                    
                    if (data.type) {
                        if (PT.isHost) {
                            switch(data.type){
                                case 'rate':
                                    PT.rating = (data.value == 1) ? PT.rating+1 : PT.rating-1;
                                    console.log("Rating: " + PT.rating);

                                    //TODO: don't broadcast to original sender
                                    $('#user-' + peer.id + " .audience-head").addClass('headbob-animation');
                                    PT.broadcast({type: "rating", value: {rating: PT.rating, id: conn.peer, action: data.value}}, conn.peer);
                                    break;
                                case 'join-queue':
                                    var isAlreadyInQueue = false;
                                    for(var i=PT.host.djQueue.length-1; i>=0; i--){
                                        if(PT.host.djQueue[i]==peer.id){
                                           isAlreadyInQueue = true;
                                           break;
                                        }
                                    }
                                    if(!isAlreadyInQueue){
                                        PT.addDJToQueue(conn.peer)
                                    }
                                    break;
                                case 'leave-queue':
                                    PT.removeDJFromQueue(conn.peer);
                                    break;
                                case 'chat':
                                    data.msg = PT.chat.filter(data.msg);

                                    PT.broadcastToRoom({type: "chat", value: {id: peer.id, msg: data.msg}}, peer);
                                    var wasAtBottom = PT.chat.isScrolledToBottom();
                                    PT.chat.appendMsg(conn.peer, data.msg);
                                    if(wasAtBottom) PT.chat.scrollToBottom();
                                    break;
                                case 'song':
                                    //verify dj is at front of queue
                                    //TODO: prevent front dj from repeatedly submitting songs
                                    if(peer == PT.host.djQueue[0]){
                                        //don't start playing video until callback
                                        YT.getVideoMeta(data.value, function(meta){
                                            PT.song.meta = meta;
                                            PT.song.play(data.value, 0); //play in host's player
                                            PT.song.startTime = Date.now();
                                            PT.broadcastToRoom({type: 'song', value: data.value, dj: peer.id, time: 0}, null);
                                            setTimeout(function(){
                                                console.log("Video ended");
                                                PT.host.djQueue.shift();
                                                PT.playNextDJSong();
                                            }, meta.duration);
                                        });
                                    }
                                    break;
                                case 'new-user':
                                    PT.addRoom(peer, data.value)
                                    break;
                                default:
                                    console.log('Received data of unkown type: ', data.type);
                            }
                        }
                        else { //guest
                             switch(data.type){
                                case 'song':
                                    PT.vote = 0;
                                    PT.stopAllHeadBobbing();
                                    PT.rating = 0;
                                    PT.song.play(data.value, data.time);
                                    //TODO: leave queue if no more dj's in queue

                                    //was dj for last song => cycle song queue
                                    if (PT.isDJ) PT.cycleMyQueue();

                                    if(data.dj == PT.peerId){
                                        PT.isDJ = true;
                                    }
                                    else if(PT.isDJ){
                                        PT.isDJ = false;
                                        PT.inQueue = false;
                                        $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue');
                                    }
                                    break;
                                case 'rating':
                                    console.log("Received rating update: ", data.value);
                                    //if rating change was caused by like
                                    if(data.value.action == 1){
                                        $('#user-' + data.value.id + " .audience-head").addClass('headbob-animation');
                                    }
                                    else if(data.value.action == -1){ //if rating change was caused by dislike
                                        $('#user-' + data.value.id + " .audience-head").removeClass('headbob-animation');
                                    }
                                    break;
                                case 'chat':
                                    //new chat message
                                    var wasAtBottom = PT.chat.isScrolledToBottom();
                                    PT.chat.appendMsg(data.value.id, data.value.msg);
                                    if(wasAtBottom) PT.chat.scrollToBottom();
                                    break;
                                case 'new-user':
                                    PT.addAvatar(data.value);
                                    break;
                                case 'leave':
                                    PT.removeAvatar(data.value);
                                    break;
                                case 'queue-front':
                                    //host asks for dj's song at front of queue
                                    //implies this dj is at the front of the dj queue
                                    var queueFront = PT.frontOfSongQueue();
                                    PT.hostPeer.send(JSON.stringify({type: 'song', value: queueFront}));
                                    break;
                                case 'end-song':
                                    //end song prematurely (eg. the host leaves dj queue while their song is playing)
                                    PT.song.end();
                                    break;
                                case 'new-user': //redundancy, yuck
                                    PT.addRoom(peer, data.value)
                                    break;
                                default:
                                    console.log('received unknown data type: ', data.type);

                            }
                        }
                    } 
                    
                }
            }
        })
        PT.tracker.on('update', function (data) {
          console.log('got an announce response from tracker: ' + data.announce)
          console.log('number of seeders in the swarm: ' + data.complete)
          console.log('number of leechers in the swarm: ' + data.incomplete)
        })

        PT.tracker.on('error', function (err) {
          // fatal client error!
          console.log('Tracker Error:')
          console.log(err)
        })

        PT.tracker.on('warning', function (err) {
          // a tracker was unavailable or sent bad data to the client. you can probably ignore it
          console.log('Tracker Warning:')
          console.log(err)
        })
    },
    initKeyHandlers: function(){
        $('#chat-text').keydown(function (e){
            if(e.keyCode == 13){ //Enter
                PT.chat.submitMessage();
            }
        })
    },
    initClickHandlers: function(){
        console.log('initializing click handlers')
        //queue
        $('#song-submit-button').click(function(e) {
            $('#my-queue-list').append('<li>'+$('#song-submit-text').val()+'</li>');
            $('#song-submit-text').val('');
            $('.sortable').sortable();

        });
        //create room
        $('#create-room').click(function(e) {
            console.log('create/destroy room clicked');
            $(".audience-member").tooltip('destroy');
            $('#moshpit').html('');
            PT.chat.clear();
            if(PT.hostPeer != null){
                PT.hostPeer.send(JSON.stringify({type: 'leave'}));
            }
            if(PT.isHost){
                PT.stopHosting();
                $(this).text('Create Room');
            }
            else{
                PT.addAvatar(PT.peerId);
                PT.chat.appendMsg("Notice", "Room Created");
                $(this).text('Destroy Room');
                PT.broadcast({type: 'new-room'})
                PT.isHost = true
                //TODO: add own room
            }
        });
        //join DJ queue
        $('#btn-join-queue').click(function(e) {
            if(!PT.inQueue){
                PT.inQueue = true;
                if(PT.isHost){
                    PT.addDJToQueue(PT.peerId);
                }
                else{
                    PT.hostPeer.send(JSON.stringify({type: "join-queue"}));
                }
                $(this).removeClass('btn-primary').addClass('btn-info').text('Leave DJ Queue');
            }
            else{
                PT.inQueue = false;
                $(this).removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue');
                if(PT.isHost){
                    PT.removeDJFromQueue(PT.peerId);
                }
                else{
                    PT.hostPeer.send(JSON.stringify({type: "leave-queue"}));
                }
            }
        });

        //rating buttons
        //TODO: host keeps track of votes changing (eg. changing vote from -1 to +1 should add 2, but the client can't be trusted for this)
        $('#like-button').click(function(e) {
            if(PT.vote == 0 || PT.vote == -1){
                $('#user-' + PT.peerId + " .audience-head").addClass('headbob-animation');
                if(PT.isHost){
                    PT.rating++;
                    console.log("Rating: " + PT.rating);
                    PT.broadcast({type: "rating", value: {rating: PT.rating, id: PT.peerId, action: 1}}, null);
                }
                else{
                    PT.hostPeer.send(JSON.stringify({type: "rate", value: 1}));
                }
                PT.vote = 1;
            }
        });
        $('#dislike-button').click(function(e) {
            if(PT.vote == 1 || PT.vote == 0){
                $('#user-' + PT.peerId + " .audience-head").removeClass('headbob-animation');
                if(PT.isHost){
                    PT.rating--;
                    console.log("Rating: " + PT.rating);
                    PT.broadcast({type: "rating", value: {rating: PT.rating, id: PT.peerId, action: -1}}, null);
                }
                else{
                    PT.hostconn.send(JSON.stringify({type: "rate", value: -1}));
                }
                PT.vote = -1;
            }
        });
        //room modal
        $('a[data-target="#roomModal"]').click(function(event) {
            PT.refreshRoomListing();
        });


        $('#room-refresh').click(function(event) {
            PT.refreshRoomListing();
        });
        //chat
        //TODO max length
        $('#chat-enter').click(function(event) {
            PT.chat.submitMessage();
        });
    },
    stopHosting: function(){
        //broadcast to swarm so list is updated
        PT.broadcast({type:'host-end'})
        PT.host.djQueue.length = 0;
        PT.vote = 0;
        PT.isHost = false
    },
    broadcast: function(data, exception){
        //TODO: only send message to subscribing peers
        console.log("Broadcasting to Swarm: ", data);
        data = JSON.stringify(data)
        PT.peers.forEach(function (peer) {
            if (peer.connected && peer !== exception) peer.send(data)
        })
    },
    broadcastToRoom: function(data, exception){
        //TODO: only send message to subscribing peers
        console.log("Broadcasting To Room: ", data);
        data = JSON.stringify(data)
        PT.host.peers.forEach(function (peer) {
            if (peer.connected && peer !== exception) peer.send(data)
        })
    },
    //TODO: change to room{add(),remove()}
    addRoom: function (peer, title) {
        PT.rooms.push({peer: peer, title: title})
        PT.refreshRoomListing()
    },
    removeRoom: function(peer) {
        var index = PT.rooms.map(function(r){ return r.peer}).indexOf(peer)
        if (index > -1) {
            PT.rooms.splice(index, 1)
        }
        PT.refreshRoomListing()
    },
    refreshRoomListing: function(){
        console.log('refreshing room listing')
        $('#roomModal .modal-body').html('')
        $.each(PT.rooms, function(i, room){
            $('#roomModal .modal-body').append('\
                <button id="join-room-'+room.peer.id+'" type="button" class="btn btn-link">'
                + room.peer.id
                + '</button><br>\
            ')
            $('#join-room-'+room.peer.id).click(function(){
                //TODO: join room logic
            })
        })
    },
    chat: {
        chatBody: null,
        appendMsg: function(id, msg){
            //order important
            msg = PT.chat.filter(msg);
            console.log('chat: [' + id + ' : ' + msg + ']');
            msg = PT.chat.emojify(msg);

            PT.chat.chatBody.append(
                '<div class="message">'
                                    +'<div class="message-user"><h6>'+id+':</h6></div>'
                                    +'<div class="message-text">'+msg+'</div>'
                +'</div>'
            );
        },
        isScrolledToBottom: function(){
            return (PT.chat.chatBody[0].scrollHeight - PT.chat.chatBody[0].offsetHeight - PT.chat.chatBody[0].scrollTop < 1);
        },
        scrollToBottom: function(){
            var height = PT.chat.chatBody[0].scrollHeight;
            PT.chat.chatBody.scrollTop(height);
        },
        submitMessage: function(){
            var msg = $('#chat-text').val();

            msg = PT.chat.filter(msg);

            if(msg.trim().length > 0){
                if(PT.isHost){
                    PT.broadcastToRoom({type: "chat", value: {id: PT.peerId + " [Host]", msg: msg}});
                }
                else{
                    if(PT.hostPeer != null){
                        PT.hostPeer.send(JSON.stringify({type: "chat", msg: msg}));
                    }
                }

                PT.chat.appendMsg(PT.peerId, msg);
                $('#chat-text').val('');
                PT.chat.scrollToBottom();
            }
        },
        clear: function(){
            $('#chat .panel-body').html('');
        },
        filter: function(msg){
            //truncate
            if(msg.length > PT.config.maxChatLength){
                msg = msg.substring(0,PT.config.maxChatLength);
            }
            //strip html
            msg = $("<p>").html(msg).text();

            return msg;
        },
        emojify: function(msg){
            //replace common ascii emoticons with shortnames
            msg = msg.replace(/:\)/g, ':smile:');
            msg = msg.replace(/:D/g, ':grin:');
            msg = msg.replace(/<3/g, ':heart:');

            //convert emoji shortnames to image tags
            msg = emojione.shortnameToImage(msg);

            return msg;
        }
    },
    connectToHost: function(hostPeer){
        if(PT.isHost){
            //host tries to connect to self
            if(PT.peerId == hostPeer.id) return;

            //TODO: make nonblocking HUD
            var doDestroy = confirm('Joining a room will destroy your room!');
            if(!doDestroy) return;

            PT.stopHosting();
            $(".audience-member").tooltip('destroy');
            $('#moshpit').html('');
            PT.chat.clear();
            $('#create-room').text('Create Room');
        }

        console.log('connecting to peer: ' + hostPeer.id);


        PT.hostPeer = hostPeer
        hostPeer.send(JSON.stringify({type: 'join-room'}))
    },

    addAvatar: function(id){
        var x = Math.random() * 80 + 10;
        var y = Math.random() * 100 + 5;
        var userId = 'user-' + id;
        $('#moshpit').append('\
            <div id="'+userId+'"class="audience-member" style="left: '+x+'%; top: '+y+'%; z-index: '+Math.floor(y)+'"\
                data-toggle="tooltip" title="'+id+'">\
                <img src="./img/avatars/1_HeadBack.png" class="audience-head" />\
                <img src="./img/avatars/1_BodyBack.png" class="audience-body" />\
            </div>\
            '); 
        $('#'+userId).tooltip(); 
    },
    removeAvatar: function(id){
        $('#user-'+id).remove();
        $('#user-'+id).tooltip('destroy');
    },
    stopAllHeadBobbing: function(){
        $('.audience-head').removeClass('headbob-animation');
    },
    song: {
        meta: {},
        startTime: 0, //set to start time of this song (used to find time since start of song)
        timeout: null,
        //TODO: source (soundcloud, youtube, etc.) parameter
        play: function(id, time){//video id, start time
            console.log('play id: ' + id + ' time: ' + time);
            PT.player.src({ type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + id });
            PT.player.currentTime(time/1000); //time in milliseconds, currentTime takes seconds
            PT.player.play();
            PT.rating = 0;
            PT.vote = 0;
            PT.stopAllHeadBobbing();
        },
        end: function(){
            PT.player.trigger('ended');
            PT.player.pause();
        }
    },
    playNextDJSong: function(){
        if (PT.host.djQueue.length > 0) {
            //host is first in dj queue
            if(PT.host.djQueue[0] == PT.peerId){
                //don't start playing video until callback
                var videoId = PT.frontOfSongQueue();
                YT.getVideoMeta(videoId, function(meta){
                    PT.song.meta = meta;
                    PT.song.play(videoId,0); //play in host's player
                    PT.song.startTime = Date.now();
                    PT.broadcastToRoom({type: 'song', value: videoId, dj: PT.peerId, time: 0}, null);

                    PT.song.timeout = setTimeout(function(){
                            console.log("Video ended");
                            PT.host.djQueue.shift();
                            PT.inQueue = false;
                            $('#btn-join-queue').removeClass('btn-info').addClass('btn-primary').text('Join DJ Queue');
                            PT.playNextDJSong();
                    }, meta.duration);
                });
                PT.cycleMyQueue();
            }
            else{ //host is not first in queue
                PT.host.djQueue[0].send(JSON.stringify({type: 'queue-front'}))
            }
            

        }
        else{
            console.log('DJ queue empty');
            PT.song.meta = {};
        }
    },
    //HOST function
    addDJToQueue: function(djId){
        PT.host.djQueue.push(djId);
        if (PT.host.djQueue.length == 1) {
            PT.playNextDJSong();
        }
    },
    //HOST function
    removeDJFromQueue: function(peer){
        var index = PT.host.djQueue.indexOf(peer)
        if (index > -1) {
            PT.host.djQueue.splice(i,1);
            if(index == 0){ //currently playing dj
                clearTimeout(PT.song.timeout);
                if(PT.host.djQueue.length == 0){
                    PT.song.end();
                    PT.broadcastToRoom(JSON.stringify({type: 'end-song'}));
                }
                else{
                    PT.playNextDJSong();
                }
            }
        }
    },
    cycleMyQueue: function(){
        $('#my-queue-list li').first().remove().appendTo('#my-queue-list');
        $('.sortable').sortable(); //moving element breaks sortable, need to initialize again :P
    },
    frontOfSongQueue: function(){
        var queueSize = $('#my-queue-list li').length;
        if(queueSize > 0){
            return $('#my-queue-list li').first().text();
        }
        return null;
    }
};

$( document ).ready(PT.init);
