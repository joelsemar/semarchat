var socket = io.connect();
var hasHistory = false;
var urlrex = new RegExp(/^(https?:\/\/)?[a-zA-Z0-9]+\.[a-zA-Z0-9]+/i )
var defaultTitle = 'SemarChat';
var isMobile = navigator.userAgent.match(/android|iphone|ipad/i);
var username 
  , unSeenMessages = 0
  , history = [],
  , defaultHistorySize = isMobile ? 100 : 1000
  , windowFocused = true
  , tabToggle = false
  , tabFlashInterval;
  
var gCommentTemplate = '<div class="Comment"><span class="CommentUser">{{USER}}</span>: {{COMMENT}}<br/><i><span class="DateTime">{{DATETIME}}</span></i></div>';
var usernameTemplate = new Template("<span class='{0}'>{1}</span>");


window.onfocus =  function(){
  windowFocused = true;
  unSeenMessages = 0;
};

window.onblur = function(){
  windowFocused = false;
};


function toggleTab(){
  tabToggle = tabToggle === false;
  if(windowFocused){
    document.title = defaultTitle;
    return;
  }
  if(tabToggle && unSeenMessages){
    document.title = defaultTitle;
  }
  else if(unSeenMessages){
    document.title = '(' + unSeenMessages + ') unread messages';
  }

}

setInterval(toggleTab, 800);

socket.on('connect', function(){
  username = window.location.pathname.replace(/\//g, '') || prompt('Username:')
  socket.emit('adduser', username);
  if(!hasHistory){
    socket.emit('gethistory', username);
    hasHistory = true;
  }

});

function updateChat(timestamp, username, data){
  if (!data){
      return;
  }
  var words = data.split(' ');
  for (var i=0;i<words.length;i++){
    if(urlrex.test(words[i])){
        var url = words[i];
        if(url.indexOf('http') === -1){
            url = 'http://' + url;
        }
        link = '<a href="' + url + '" target="_blank">' + words[i] + '</a>'
        data = data.replace(words[i], link);
        data += '<div style="width:100%"><img style="max-width:100%" src="' + url + '" onerror="$(this).parent().hide()"></div>';
    }
  }
  if(!windowFocused){
    unSeenMessages += 1;
  }
  $('#conversation').append( createComment(username, timestamp, data) );
  $("#conversation").scrollTop($("#conversation")[0].scrollHeight);
}

socket.on('updatechat',updateChat);

socket.on('updateusers', function(data) {
  $('#users').empty();
  $.each(data, function(key, value) {
    $('#users').append('<div>' + key + '</div>');
  });
});

socket.on('history', function(data){
  history = data;
  var shownHistory = history.slice(history.length - defaultHistorySize, history.length);
  for (var i=0;i<shownHistory.length;i++){
    updateChat(this, shownHistory[0]);
  }
});


function createComment( fromUser, timestamp, data ) {
  var comment = gCommentTemplate;
  var callOut = data.indexOf(username) !== -1 && fromUser !== username;
  comment = comment.replace(/\{\{USER\}\}/g, usernameTemplate.render(callOut ? 'Callout' : '', fromUser));
  comment = comment.replace(/\{\{DATETIME\}\}/g, timestamp);
  comment = comment.replace(/\{\{COMMENT\}\}/g, data);
  return comment;
}

$(function(){
  $('#datasend').click( function() {
    var message = $('#data').val();
    $('#data').val('');
    socket.emit('sendchat', message);
    $("#data").focus();
  });

  $('#data').keypress(function(e) {
    if(e.which == 13) {
      $(this).blur();
      $('#datasend').focus().click();
      $("#data").focus();
    }
  });
  
  if(isMobile) {
    $("head").append('<meta name="viewport" content="initial-scale=1, maximum-scale=1">');
    $("head").append('<link href="css/mobile.css" rel="stylesheet">');
  }
  else {
    $("head").append('<link href="css/desktop.css" rel="stylesheet">');
  }
});

function Template(string){
  this.string = string;
  this.render = function(){
    var args = Array.prototype.slice.call(arguments);
    if(args.length === 1 && typeof args[0] === 'object'){
      return this.string.replace(/{([^}]*)}/gm, function(match,key) { return args[0][key] });
    }
    return this.string.replace(/\{(\d+)\}/g, function(match, idx){ return args[idx] });
  }
}
