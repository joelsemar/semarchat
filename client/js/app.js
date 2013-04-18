var socket = io.connect();
var hasHistory = false;
var urlrex = new RegExp(/^(https?:\/\/)?[a-zA-Z0-9]+\.[a-zA-Z0-9]+/i )
var defaultTitle = 'SemarChat';
var username 
  , unSeenMessages = 0
  , windowFocused = true
  , tabToggle = false
  , tabFlashInterval;
  
var gCommentTemplate = '<div class="Comment"><span class="CommentUser">{{USER}}</span>: {{COMMENT}}<br/><i><span class="DateTime">{{DATETIME}}</span></i></div>';


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

socket.on('updatechat', function (timestamp, username, data) {
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
});

socket.on('updateusers', function(data) {
  $('#users').empty();
  $.each(data, function(key, value) {
    $('#users').append('<div>' + key + '</div>');
  });
});

function createComment( username, timestamp, data ) {
  	var comment = gCommentTemplate;
  	comment = comment.replace(/\{\{USER\}\}/g, username);
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
});

