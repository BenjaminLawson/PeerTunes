var express = require('express');
var app = express();
var http = require('http').Server(app);

app.set('view engine', 'ejs');
app.use(express.static('public'));

http.listen(3000, function() {
    console.log('listening on *:3000');
});

//HTTP
app.get('/', function(req, res) {
    res.render('index');
});





