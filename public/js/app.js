//app.js
"use strict";

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
        peerJSKey: 'e5wgcbh28l1sjor', //key for free PeerJS server
        maxRoomSize: 30, //arbitrary, but free PeerJS server has limit of 50 peers
        maxChatLength: 300
    },
    isHost: false, //true = this peer is a host, false = this peer is a client
    peer: null, //PeerJS object
    peerId: null, //peer ID of this peer
    hostConn: null, //connection object if peer connects to host
    vote: 0, //vote for current video
    rating: 0, //overall song rating
    inQueue: false, //if this peer is in DJ queue
    isDJ: false, //current peer is the dj
    player: null, //videojs player object
    host:{
        socket: null, //socket.io object
        //TODO: make object literal instead of array?
        connections: [], //client connections
        djQueue: [] //array of DJ's in queue
    },
    //TODO: if peer hash in url, try to connect to that peer
    init: function(){
        PT.peer = new Peer({key: PT.config.peerJSKey});

        PT.chat.chatBody = $('#chat .panel-body');

        PT.initPeerListeners();
        PT.initClickHandlers();
        PT.initKeyHandlers();

        PT.player = videojs('vid1');
        //video player listeners
        PT.player.ready(function() {
                //automatically hide/show player when song is playing
                this.on("ended", function(){
                    $('#video-frame').hide();
                });
                this.on("play", function(){
                    $('#video-frame').show();
                });
        });


    },
    initPeerListeners: function(){
        //=== host listeners ===
        PT.peer.on('open', function(id) {
          console.log('peerID: ' + id);
          PT.peerId = id;
        });

        PT.peer.on('connection', function(conn) {
            console.log('Connection made with ' + conn.peer);
            PT.host.connections.push(conn);
            PT.addAvatar(conn.peer);

            conn.on('open', function() {
                PT.broadcast({type: "new-user", value: conn.peer}, null);
                //send old users
                for(var i=PT.host.connections.length-1; i>=0; i--){
                    //TODO: send current head bobbing states, maybe keep seperate array of peers and head bobbing state
                    //send new client all users except themself
                    if(PT.host.connections[i].peer != conn.peer) conn.send({type: "new-user", value: PT.host.connections[i].peer});
                }
                conn.send({type: "new-user", value: PT.peerId}); //send host, since host isn't in connection array
                if(PT.song.meta.id !== undefined){
                    var timeSinceStart = Date.now() - PT.song.startTime;
                    conn.send({type: 'song', value: PT.song.meta.id, dj: conn.peer, time: timeSinceStart});
                }

                conn.on('data', function(data) {
                    console.log('Received', data);
                    switch(data.type){
                        case 'rate':
                            PT.rating = (data.value == 1) ? PT.rating+1 : PT.rating-1;
                            console.log("Rating: " + PT.rating);

                            //TODO: don't broadcast to original sender
                            $('#user-' + conn.peer + " .audience-head").addClass('headbob-animation');
                            PT.broadcast({type: "rating", value: {rating: PT.rating, id: conn.peer, action: data.value}}, conn.peer);
                            break;
                        case 'join-queue':
                            var isAlreadyInQueue = false;
                            for(var i=PT.host.djQueue.length-1; i>=0; i--){
                                if(PT.host.djQueue[i]==conn.peer){
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

                            PT.broadcast({type: "chat", value: {id: conn.peer, msg: data.msg}}, conn.peer);
                            var wasAtBottom = PT.chat.isScrolledToBottom();
                            PT.chat.appendMsg(conn.peer, data.msg);
                            if(wasAtBottom) PT.chat.scrollToBottom();
                            break;
                        case 'song':
                            //verify dj is at front of queue
                            //TODO: prevent front dj from repeatedly submitting songs
                            if(conn.peer == PT.host.djQueue[0]){
                                //don't start playing video until callback
                                YT.getVideoMeta(data.value, function(meta){
                                    PT.song.meta = meta;
                                    PT.song.play(data.value, 0); //play in host's player
                                    PT.song.startTime = Date.now();
                                    PT.broadcast({type: 'song', value: data.value, dj: conn.peer, time: 0}, null);
                                    setTimeout(function(){
                                            console.log("Video ended");
                                            PT.host.djQueue.shift();
                                            PT.playNextDJSong();
                                    }, meta.duration);
                                });
                            }
                            break;
                        default:
                            console.log('Received data of unkown type: ', data.type);
                    }
                });
            });
            //client disconnected
            conn.on('close', function() {
                console.log(conn.peer, ' disconnected');
                for(var i=PT.host.connections.length-1; i>=0; i--){
                    if(PT.host.connections[i].peer==conn.peer){
                       PT.host.connections.splice(i,1);
                       PT.removeAvatar(conn.peer);
                       PT.broadcast({type: "leave", value: conn.peer});
                       break;
                    }
                }
            });
        });
    },
    initKeyHandlers: function(){
        $('#chat-text').keydown(function (e){
            if(e.keyCode == 13){ //Enter
                PT.chat.submitMessage();
            }
        })
    },
    initClickHandlers: function(){
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
            if(PT.hostconn != null){
                PT.hostconn.close();
            }
            if(PT.isHost){
                PT.stopHosting();
                $(this).text('Create Room');
            }
            else{
                PT.socketConnect();
                PT.addAvatar(PT.peerId);
                PT.chat.appendMsg("Notice", "Room Created");
                $(this).text('Destroy Room');
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
                    PT.hostconn.send({type: "join-queue"});
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
                    PT.hostconn.send({type: "leave-queue"});
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
                    PT.hostconn.send({type: "rate", value: 1});
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
                    PT.hostconn.send({type: "rate", value: -1});
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
    //TODO: add peer id hash to url
    socketConnect: function(){
        //TODO: room meta (eg. name)
        PT.host.socket = io();
        PT.host.socket.emit('create-room', {peerId: PT.peerId, title: 'My Room'});
        PT.isHost = true;

        console.log('socket connected');
    },
    socketDisconnect: function(){
        PT.isHost = false;
        PT.host.socket.disconnect();
        //PT.host.socket.socket.disconnect();
        console.log('socket disconnected');
    },
    closeAllPeerConnections: function(){
        for(var i=PT.host.connections.length-1; i>=0; i--){
            PT.host.connections[i].close();
        }
    },
    stopHosting: function(){
        PT.socketDisconnect();
        PT.closeAllPeerConnections();
        PT.host.djQueue.length = 0;
        PT.vote = 0;
    },
    broadcast: function(data, exception){
        console.log("Broadcasting: ", data);
        for(var i=PT.host.connections.length-1; i>=0; i--){
            if(PT.host.connections[i].peer != exception) PT.host.connections[i].send(data);
        }
    },
    refreshRoomListing: function(){
        console.log("refreshing room listing");
        $.getJSON("api/rooms", function(result){
            //console.log("room request complete:" + result);
            $('#roomModal .modal-body').html('');
            $.each(result.hosts, function(i, host){
                //TODO: make jQuery click event
                $('#roomModal .modal-body').append('\
                    <button onclick="PT.connectToHost(\'' + host.peerId + '\')" type="button" class="btn btn-link">'
                    + host.peerId
                    + '</button><br>\
                    ');
            });
        });
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
                    PT.broadcast({type: "chat", value: {id: PT.peerId + " [Host]", msg: msg}});
                    //appendMsgToChat(peerId, msg);
                }
                else{
                    if(PT.hostconn != null){
                        PT.hostconn.send({type: "chat", msg: msg});
                    }
                }

                //TODO: uncomment when ignoring broadcast to sender implemented
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
    connectToHost: function(remotePeer){
        if(PT.isHost){
            //host tries to connect to self
            if(PT.peerId == remotePeer) return;

            var doDestroy = confirm('Joining a room will destroy your room!');
            if(!doDestroy) return;

            PT.stopHosting();
            $(".audience-member").tooltip('destroy');
            $('#moshpit').html('');
            PT.chat.clear();
            $('#create-room').text('Create Room');
        }
        if(PT.hostconn != null){
            PT.hostconn.close();
            //PT.hostconn = null;
        }

        console.log('connecting to peer: ' + remotePeer);
        PT.hostconn = PT.peer.connect(remotePeer);
        //=== client listeners ===
        PT.hostconn.on('open', function() {
            PT.chat.appendMsg('Notice', 'You have connected to ' + PT.hostconn.peer);
            // Receive messages
            PT.hostconn.on('data', function(data) {
                console.log('Received', data);
                switch(data.type){
                    case 'song': //TODO: change to 'song'
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
                        PT.hostconn.send({type: 'song', value: queueFront});
                        break;
                    case 'end-song':
                        //end song prematurely (eg. the host leaves dj queue while their song is playing)
                        PT.song.end();
                        break;
                    default:
                        console.log('received unknown data type: ', data.type);

                }
            });
        });

        PT.hostconn.on('close', function(){
            //alert("Host Disconnected");
            //console.log('Host Disconnected');
            PT.chat.clear();
            PT.chat.appendMsg('Notice', 'Host Disconnected');
            PT.song.end();
            $(".audience-member").tooltip('destroy');
            $('#moshpit').html('');
            //PT.hostconn.close();
            PT.hostconn = null; //TODO: close?
        });
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
                    PT.broadcast({type: 'song', value: videoId, dj: PT.peerId, time: 0}, null);

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
                for(var i=PT.host.connections.length-1; i>=0; i--){
                    if(PT.host.connections[i].peer==PT.host.djQueue[0]){
                        //get the first song on new dj's queue
                       PT.host.connections[i].send({type: 'queue-front'});
                       break;
                    }
                }
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
    removeDJFromQueue: function(djId){
        for(var i=PT.host.djQueue.length-1; i>=0; i--){
            if(PT.host.djQueue[i]==djId){
               PT.host.djQueue.splice(i,1);
               if(i == 0){ //currently playing dj
                    clearTimeout(PT.song.timeout);
                    if(PT.host.djQueue.length == 0){
                        PT.song.end();
                        PT.broadcast({type: 'end-song'});
                    }
                    else{
                        PT.playNextDJSong();
                    }
               }
               break;
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