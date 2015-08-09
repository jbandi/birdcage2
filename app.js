FIREBASE_BASE = 'https://scorching-inferno-3523.firebaseio.com';

var ref = new Firebase("https://scorching-inferno-3523.firebaseio.com");

var btnTweet = $('#tweet'),
    spnUsername = $('#username'),
    btnLogin = $('#login'),
    btnLogout = $('#logout'),
    chkActive = $('#active'),
    nmbrInterval = $('#interval'), 
    chkReshedule = $('#reshedule'),
    txtBitlyLogin = $('#bitly_login'),
    txtBitlySecret = $('#bitly_secret'),
    txtContent = $('#content'),
    tweetList = $('#tweets'),
    spnChars = $('#chars'),
    birdcage = {};

btnLogin.on('click', login);
btnLogout.on('click', logout);
btnTweet.on('click', tweet);
chkActive.on('change', saveUserData);
chkReshedule.on('change', saveUserData);
nmbrInterval.on('blur', saveUserData);
txtContent.on('keyup', updateLength);
txtContent.on('blur', contentChanged);

login();

function login(){
  ref.authWithOAuthPopup("twitter", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } 
      else {
        console.log("Authenticated successfully with payload:", authData);
        spnUsername.text(authData.twitter.username);
        birdcage.uid = authData.uid;
        createOrLoadUser(authData);
        loadPosts();    
      }
    }, 
    {remember: "none"}
    )
}

function createOrLoadUser(authData){
    ref.child("users/" + birdcage.uid).once("value", function(snapshot){
        console.log("Loaded user!");
        var user = snapshot.val();
        
        if(!user){
            console.log("Creating user!");
            
            user = {
                access_token: authData.twitter.accessToken,
                access_token_secret: authData.twitter.accessTokenSecret,
                active: false,
                reshedule: false,
                uid: authData.uid
            }
            
            ref.child('users/' + birdcage.uid).set(user);
        }
        birdcage.user = user;
        chkActive.prop('checked', user.active);
        chkReshedule.prop('checked', user.reshedule);
        nmbrInterval.val(user.post_interval);
        txtBitlyLogin.val(birdcage.user.bitly_login),
        txtBitlySecret.val(birdcage.user.bitly_secret)        
    });
}

function saveUserData() {
    ref.child("users/" + birdcage.uid).update({
        active: chkActive.prop('checked'),
        reshedule: chkReshedule.prop('checked'),
        post_interval: nmbrInterval.val(),
        bitly_login: txtBitlyLogin.val(),
        bitly_secret: txtBitlySecret.val()
        });
}


function loadPosts(){
    ref.child("posts/" + birdcage.uid).orderByPriority().startAt(2).on("value", function(snapshot) {
    console.log(snapshot.val());

    tweetList.empty();
    var tweets = snapshot.val();
    $.each(tweets, function(id, tweet){

        var upButton = $('<button>').text('up');
        upButton.on('click', function(){alert('up')})

        $('<li>')
            .text(tweet.content)
            .append(upButton)
            .appendTo(tweetList);
        })
    });
}

function tweet() {
    ref.child('posts/' + birdcage.uid).push({
            content: txtContent.val(),
            '.priority': Date.now(),
            sent_count: 0
        }
    )
}

function contentChanged(){
    updateLength();
    shorten();
}

function updateLength(){
    var remaining = 140 - txtContent.val().length;
    spnChars.text(remaining);
}

function shorten() {
    var url = parseUrl()
    
    if (url) {
        $.ajax({
            url: "http://api.bitly.com/v3/shorten?login=" + birdcage.user.bitly_login + "&apiKey=" + birdcage.user.bitly_secret + "&longUrl=" + url,
            dataType: "jsonp",
            success: function(result) {
                var short_url = result["data"]["url"];
                if (short_url)
                    replaceUrl(url, short_url)
            }
        })
    }
}

function parseUrl() {
        var bitly_url_regexp = /http:\/\/bit.ly\/[^\s]+/;
        var url_match = txtContent.val().match(/(http:\/\/|https:\/\/|www\.)[^\s]+/g);

        for (var i in url_match) {
            var url = url_match[i];
            if (!url.match(bitly_url_regexp))
                return url;
        }
        return null;
}

function replaceUrl(url, short_url) {
    var shortened_text = txtContent.val().replace(url, short_url);
    txtContent.val(shortened_text);
    updateLength();
}

function logout() {
    ref.unauth();
    loadPosts();
}




