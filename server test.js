var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.static('public'));

http.listen(3000, function(){
	console.log('listening on *:3000');
});


var hosts = [];

//HTTP
app.get('/', function(req, res){
	res.render('pages/index');
});

app.get('/api/rooms', function(req, res){
	res.json({hosts: hosts});
});


//WebSockets
//TODO: track number of people connected to host
io.on('connection', function(socket){
	var peerID;
  	console.log('socket connected: ' + socket.id);

  socket.on('disconnect', function(){
    console.log('socket disconnected: ' + socket.id);
    //Remove peerID from hosts array
	for( i=hosts.length-1; i>=0; i--) {
		//console.log(hosts[i].peerID + " : " + peerID);
	    if( hosts[i].peerID == peerID){
	    	hosts.splice(i,1);
	    	break;
	    }
	}
  });

  socket.on('end', function(){
  	//TODO: client disconnects
  });

  socket.on('create room', function(id){
    console.log('create room request from peerID: ' + id);
    peerID = id;
    hosts.push({peerID: id});
  });
});

