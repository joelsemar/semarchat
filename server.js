var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , client;

require('./dateformat.js');

var redis = require('redis');
client = redis.createClient(6379, 'redis', {});
client.on('error', redis_error);
function redis_error(err){
    throw new Error(err.message)
}

try{
    var config = require('./config.js')
}
catch(e){ 
    console.log("replace the config.js.template with local config.js file"); 
    process.exit(1);
}

server.listen(config.PORT);
 var emoticons = [
        { name: 'chompy', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/chompy.gif'},
        { name: 'cunt', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/21318/cunt-1350677043.png'},
        { name: 'rage', img: 'http://i2.kym-cdn.com/entries/icons/original/000/000/063/Picture_2_c.jpg'},
        { name: 'douchecanoe', img: 'https://sphotos-a.xx.fbcdn.net/hphotos-frc1/c0.0.403.403/p403x403/398855_355240054586929_1934010968_n.jpg'},
        { name: 'yuno', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/yuno.png'},
        { name: 'beer', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/beer.png'},
        { name: 'fuckyeah', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/fuckyeah.png'},
        { name: 'rageguy', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/rageguy.png'},
        { name: 'gtfo', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/gtfo.png'},
        { name: 'derp', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/derp.png'},
        { name: 'facepalm', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/facepalm.png'},
        { name: 'okay', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/okay.png'},
        { name: 'boom', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/boom.gif'},
        { name: 'orly', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/orly.png'},
        { name: 'allthethings', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/allthethings.png'},
        { name: 'twss', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/twss-1348262400.png'},
  ]
 var badWords = ["<script>", "onload", "onmouse", "onerror", "onscroll"]



function appendToHistory(data){
  client.get('history', function(err, res){
     var history = JSON.parse(res || '[]');
     history.push(data);
     client.set('history', JSON.stringify(history));
  });
}
function reverse(s){
    return s.split("").reverse().join("");
}

function auth_function(user, pass) {
   return (user == "who" && pass == "youthatiswho");
}

var auth = express.basicAuth(auth_function, 'Super duper secret area');
// routing

app.use(express.static(path.resolve('client/static/')));
app.configure(function(){
  app.get(/.*/, auth,  function (req, res) {
    res.sendfile(path.resolve('client/index.html'));
  });

  app.get('/', auth, function (req, res) {
    res.sendfile(path.resolve('client/index.html'));
  });
  app.use(app.router);

});

var usernames = {};

io.sockets.on('connection', function (socket) {

  socket.on('sendchat', function (data) {
     if(!data){
      return;
     }
     if(socket.lastMessageTime && new Date() - socket.lastMessageTime < 500){
       return;
     }
    var username = socket.username;
    for (var i=0;i<badWords.length;i++){
      if (data.indexOf(badWords[i]) !== -1){
        return;
      }
    }

    for (var j=0;j<emoticons.length;j++){
      data = data.replace('(' + emoticons[j].name + ')', "<img src='" + emoticons[j].img + "' title='" + emoticons[j].name + "'>");
    }
    var chatEntry = [new Date().format(), username, data]
    io.sockets.emit('updatechat', chatEntry[0], chatEntry[1], chatEntry[2]);
    appendToHistory(chatEntry);
    socket.lastMessageTime = new Date();
  });

  socket.on('adduser', function(username){
    socket.username = username;
    usernames[username] = username;
    io.sockets.emit('updateusers', usernames);
  });

  socket.on('gethistory', function(){
    client.get('history', function(err, res){
      var history = JSON.parse(res || '[]');
      socket.emit('history', history);
    })
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
  });
});
