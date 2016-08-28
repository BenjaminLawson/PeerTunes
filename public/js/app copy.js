//app.js

var isHost;
var peerId;
var peer;
var hasVoted = false;
//var nConnected = 0;

//peer to host
var hostconn = null;

//for host
var connections = [];
var rating = 0;
var djQueue = [];

/*
TODO:
-multiple peers can connect to host
*/

$( document ).ready(function() {
    console.log( "jQuery document ready!" );

    //peerJS
	peer = new Peer({key: 'e5wgcbh28l1sjor'});

	peer.on('open', function(id) {
	  console.log('peerID: ' + id);
	  peerId = id;
	});

	peer.on('connection', function(conn) {
		console.log('Connection made with ' + conn.peer);
		connections.push(conn);
		addAvatar(conn.peer);

		conn.on('open', function() {
		  broadcast({type: "new-user", value: conn.peer}, null);
		  //send old users
		  for(var i=connections.length-1; i>=0; i--){
			if(connections[i].peer != conn.peer) conn.send({type: "new-user", value: connections[i].peer}); 
	      }
	      conn.send({type: "new-user", value: peerId}); //host

		  conn.on('data', function(data) {
		    console.log('Received', data);
		    if(data.type == "rate"){
		    	rating = (data.value == 1) ? rating+1 : rating-1;
		    	console.log("Rating: " + rating);

		    	//TODO: don't broadcast to original sender
		    	$('#user-' + conn.peer + " .audience-head").addClass('headbob-animation');
		    	broadcast({type: "rating", value: {rating: rating, id: conn.peer}}, conn.peer);
		    }
		    if(data.type == "dj"){
		    	//TODO: check if dj is already in queue
		    	djQueue.push(conn.peer);
		    }
		    if(data.type == "chat"){
		    	broadcast({type: "chat", value: {id: conn.peer, msg: data.msg}}, conn.peer);
		    	var wasAtBottom = chatIsScrolledToBottom();
		    	appendMsgToChat(conn.peer, data.msg);
		    	if(wasAtBottom) scrollToBottomOfChat();
		    }

		  });

		  //updateNConnected();
		});

		conn.on('close', function() {
			for(var i=connections.length-1; i>=0; i--){
		        if(connections[i].peer==conn.peer){
		           connections.splice(i,1);
		           removeAvatar(conn.peer);
		           broadcast({type: "leave", value: conn.peer});
		           //updateNConnected();
		           break;
		        }
	    	}
		});
	});


	//==== click handlers ====
	//queue
	$('#song-submit-button').click(function(event) {
		//update host's player
		/*
		$('#video-container').html(
			'<iframe width="413px" height="231px" src="https://www.youtube.com/embed/'
		    + $('#song-submit-text').val()
		    + '?autoplay=1" frameborder="0"></iframe>'
		);
		broadcast({type: "video", value: $('#song-submit-text').val()}, null);

		rating = 0;
	    hasVoted = false;
	    */
	    $('#my-queue-list').append('<li>'+$('#song-submit-text').val()+'</li>');
	    $('#song-submit-text').val('');
	    $('.sortable').sortable();

	});
	//$('.sortable').sortable();
	//create room
	$('#create-room').click(function(event) {
		socketConnect();
		addAvatar(peerId);
		appendMsgToChat("Notice", "Room Created");
	});
	//rating buttons
	$('#like-button').click(function(event) {
		if(!hasVoted){
			$('#user-' + peerId + " .audience-head").addClass('headbob-animation');
			if(isHost){
				rating++;
		    	console.log("Rating: " + rating);
				broadcast({type: "rating", value: {rating: rating, id: peerId, action: 1}}, null);
			}
			else{
				hostconn.send({type: "rate", value: 1});
			}
			hasVoted = true;
			
		}
	});
	$('#dislike-button').click(function(event) {
		if(!hasVoted){
			$('#user-' + peerId + " .audience-head").removeClass('headbob-animation');
			if(isHost){
				rating--;
		    	console.log("Rating: " + rating);
				broadcast({type: "rating", value: {rating: rating, id: peerId, action: 0}}, null);
			}
			else{
				hostconn.send({type: "rate", value: -1});
			}
			hasVoted = true;
			
		}
	});
	//room modal
    $('a[data-target="#roomModal"]').click(function(event) {
    	refreshRoomListing();
    });


    $('#room-refresh').click(function(event) {
    	refreshRoomListing();
    });
    //chat
    //TODO max length
    $('#chat-enter').click(function(event) {
    	var msg = $('#chat-text').val();
    	if(isHost){
    		broadcast({type: "chat", value: {id: peerId + " [Host]", msg: msg}});
    		//appendMsgToChat(peerId, msg);
    	}
    	else{
    		if(hostconn != null){
    			hostconn.send({type: "chat", msg: msg});
    		}
    	}

    	var chatBody = $('#chat .panel-body');

    	//uncomment when ignoring broadcast to sender implemented
    	appendMsgToChat(peerId, msg);
    	scrollToBottomOfChat();
    });


    //==== utility functions ====
    var refreshRoomListing = function(){
    	console.log("refreshing room listing");
    	$.getJSON("api/rooms", function(result){
    		//console.log("room request complete:" + result);
    		$('#roomModal .modal-body').html("");
	        $.each(result.hosts, function(i, field){
	        	//onclick="connectToPeer('<%= rooms[i].peerID %>')"
	        	//<button onclick="connectToPeer(' + field.peerID + ')" type="button" class="btn btn-link"><%= rooms[i].peerID %></button><br>
	        	$('#roomModal .modal-body').append('<button onclick="connectToPeer(\'' + field.peerID + '\')" type="button" class="btn btn-link">' + field.peerID + '</button><br>');
	            //$('#roomModal .modal-body').append(field.peerID + "<br>");
	        });
	    });
    };

    var socketConnect = function(){
		//TODO: room meta (eg. name)
		var socket = io();
		socket.emit('create room', peerId);
		isHost = true;
	};

	var broadcast = function(data, exception){
		console.log("Broadcasting: " + data);
		for(var i=connections.length-1; i>=0; i--){
			if(connections[i].peer != exception) connections[i].send(data); 
	    }
	};

	//TODO: optimize
	/*
	var sendUsersArray = function(toConn){

		for(var i=connections.length-1; i>=0; i--){
			if(connections[i].peer != exception) connections[i].send(data); 
	    }
	};
	*/

	

	
});

var appendMsgToChat = function(id, msg){
		var chatBody = $('#chat .panel-body');
    	chatBody.append(
    		'<div class="message">'
								+'<div class="message-user"><h6>'+id+':</h6></div>'
								+'<div class="message-text">'+msg+'</div>'
			+'</div>'
    	);
};


var chatIsScrolledToBottom = function(){
	var chatBody = $('#chat .panel-body');
	return (chatBody[0].scrollHeight - chatBody[0].offsetHeight - chatBody[0].scrollTop < 1);
};
var scrollToBottomOfChat = function(){
	var chatBody = $('#chat .panel-body');
	var height = chatBody[0].scrollHeight;
    chatBody.scrollTop(height);
};

var connectToPeer = function(remotePeer){
		console.log('connecting to peer: ' + remotePeer);
		hostconn = peer.connect(remotePeer);
		hostconn.on('open', function() {
			  // Receive messages
			  hostconn.on('data', function(data) {
			    console.log('Received', data);
			    if(data.type == "video"){
			    	hasVoted = false;
			    	$('#video-container').html(
						'<iframe width="413px" height="231px" src="https://www.youtube.com/embed/'
					    + data.value
					    + '?autoplay=1" frameborder="0"></iframe>'
					);
			    }
			    else if(data.type == "rating"){
			    	console.log("Received rating update: " + data.value);
			    	//if ratign change was caused by like
			    	if(data.value.action == 1){
						$('#user-' + data.value.id + " .audience-head").addClass('headbob-animation');
			    	}
			    	
			    }
			    else if(data.type == "chat"){
			    	var wasAtBottom = chatIsScrolledToBottom();
			    	appendMsgToChat(data.value.id, data.value.msg);
			    	if(wasAtBottom) scrollToBottomOfChat();
			    }
			    else if(data.type == "new-user"){
			    	addAvatar(data.value);
			    }
			    else if(data.type == "leave"){
			    	removeAvatar(data.value);
			    }
			  });
		});

		hostconn.on('close', function(){
			alert("Host Disconnected");
			var videoWrapper = document.getElementById("video-container");
			videoWrapper.innerHTML="";
			$('#moshpit').html('');
			hostconn = null; //!!!
		});
};

//avatars
var addAvatar = function(id){
	var x = Math.random() * 90 + 5;
	var y = Math.random() * 100 + 5;
	$('#moshpit').append(
		'<div id="user-'+id+'"class="audience-member" style="left: '+x+'%; top: '+y+'%;">'
			+'<img src="./img/avatars/1_HeadBack.png" class="audience-head" />'
			+'<img src="./img/avatars/1_BodyBack.png" class="audience-body" />'
		+'</div>'
		);
	
};
var removeAvatar = function(id){
	$('#user-'+id).remove();
};