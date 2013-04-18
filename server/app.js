var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , client;

try{
   var redis = require('redis');
   client = redis.createClient();
   client.on('error', dummyRedis);
}
catch(e){
  dummyRedis();
}
try{
  var config = require('./config.js')
}
catch(e){
  console.log("replace the config.js.template with local config.js file");
  process.exit(1);
}
  

function dummyRedis(){
  client = {
    set: function(key, value){
      this[key] = value;
    },
    get: function(key, callback){
      callback(null, this[key]);
    }
  }

};

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
        { name: 'orly', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/orly.png'},
        { name: 'twss', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/twss.png'},
        { name: 'allthethings', img: 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/allthethings.png'},
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


var auth = express.basicAuth(function(user, pass) {     
   return (user == "admin" && pass == "marissa");
},'Super duper secret area');
// routing

app.use(express.static(path.resolve('../client')));
app.configure(function(){
  app.get('/resume.pdf', function(req, res){
    res.sendfile('/home/joel/resume.pdf');
  })
  app.post('/deploy', function(req, res){
     var exec  = require('child_process').exec;
     var cmd = 'cd /home/joel/nodechat && git pull && sudo forever app.js restart';
     exec(cmd, function (error, stdout, stderr) {
        if (stdout){
            console.log(stdout);
        }
        if (stderr){
            console.log('ERROR: ' + stderr);
        }
        if (error !== null) {
          console.log('exec error: ' + error);
        }
     });
  })

  app.get(/.*/, auth,  function (req, res) {
    res.sendfile(path.resolve('../client/index.html'));
  });

  app.get('/', auth, function (req, res) {
    res.sendfile(path.resolve('../client/index.html'));
  });
  app.use(app.router);

});

var usernames = {};
var kylenames = ["millerkb", 'k.b.m.', 'joelisacunt', 'kmiller', 'kmeezy', 'kbm', 'joelhasamicropenis'];
var goodnames = ['megs', 'kmiller', 'joel', 'spartacus', 'andrew', 'leddo', 'poko'];

io.sockets.on('connection', function (socket) {

  socket.on('sendchat', function (data) {
     if(!data){
      return;
     }
  //   data = data.replace(/</g, '');
  //   data = data.replace(/>/g, '');
     if(socket.lastMessageTime && new Date() - socket.lastMessageTime < 500){
       return;
     }
     //data = 'Kyle is a douchecanoe';
    var username = socket.username;
   // var username = 'spartacus';
   // data = data.replace(/s/gi, 'sh');
  //  data = data.replace(/f/gi, 't');
  //  data = data.replace(/t/gi, 'f');
  //  data = data.replace(/g/gi, 'k');
   // data = data.replace(/k/gi, 'g');
   // data = data.replace(/w/gi, 'v');
    if(goodnames.indexOf(username) === -1){
   //    data = data.toUpperCase();
    }
    for (var i=0;i<badWords.length;i++){
      if (data.indexOf(badWords[i]) !== -1){
        return;
      }
    }

    for (var j=0;j<emoticons.length;j++){
      data = data.replace('(' + emoticons[j].name + ')', "<img src='" + emoticons[j].img + "' title='" + emoticons[j].name + "'>");
    }
    var chatEntry = [new Date().toLocaleTimeString(), username, data]
    io.sockets.emit('updatechat', chatEntry[0], chatEntry[1], chatEntry[2]);
    appendToHistory(chatEntry);
    socket.lastMessageTime = new Date();
  });

  socket.on('adduser', function(username){
    if(goodnames.indexOf(username) === -1){
    //  return;
    }
    socket.username = username;
    usernames[username] = username;
    io.sockets.emit('updateusers', usernames);
  });

  socket.on('gethistory', function(){
    client.get('history', function(err, res){
      var history = JSON.parse(res || '[]');
      for(var i=0;i<history.length;i++){
        socket.emit('updatechat', history[i][0], history[i][1], history[i][2]);
      }
    })
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
  });
});
