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
    btnRandomize = $('#randomize'),
    chkShowAll = $('#showAll');


birdcage2.init()
    .then(renderUserData);
    
birdcage2.onTweetsChange(renderTweets);

btnLogin.on('click', login);
btnLogout.on('click', logout);
btnTweet.on('click', tweet);
chkActive.on('change', saveUserData);
chkReshedule.on('change', saveUserData);
nmbrInterval.on('blur', saveUserData);
txtContent.on('keyup', updateLength);
txtContent.on('blur', contentChanged);
btnRandomize.on('click', randomize);
chkShowAll.on('change', loadTweets);

function renderUserData() {
    var user = birdcage2.getUser();
    spnUsername.text(user.username);
    chkActive.prop('checked', user.active);
    chkReshedule.prop('checked', user.reshedule);
    nmbrInterval.val(user.post_interval);
    txtBitlyLogin.val(user.bitly_login);
    txtBitlySecret.val(user.bitly_secret);
}

function renderTweets(tweets) {

    var scheduledTweets = tweets.filter(function(e){return e['.priority'] > 1});
    var unscheduledTweets = tweets.filter(function(e){return e['.priority'] <= 1});

    tweets = scheduledTweets.concat(unscheduledTweets);

    tweetList.empty();
    $.each(tweets, function (index, tweet) {

        var li = $('<li>').html('(' + tweet['.priority'] + ') ' + Autolinker.link(tweet.content));

        if (index > 0) {
            var upButton = $('<button>').text('up');
            upButton.on('click', function () {
                birdcage2.increasePriority(tweet);
            });

            li.append(upButton);
        }

        var deleteButton = $('<button>').text('delete');
        deleteButton.on('click', function () {
            birdcage2.deleteTweetById(tweet.id);
        });
        li.append(deleteButton);

        li.appendTo(tweetList);
    });
}

function saveUserData() {
    var userData = {
        active: chkActive.prop('checked'),
        reshedule: chkReshedule.prop('checked'),
        post_interval: nmbrInterval.val(),
        bitly_login: txtBitlyLogin.val(),
        bitly_secret: txtBitlySecret.val()
    };

    birdcage2.updateUser(userData)
}

function loadTweets(){
    birdcage2.loadTweets(chkShowAll.prop('checked'));
}

function tweet() {
    birdcage2.postTweet(txtContent.val());
}

function randomize(){
    birdcage2.randomize();
}

function contentChanged() {
    updateLength();
    shorten();
}

function updateLength() {
    var remaining = 140 - txtContent.val().length;
    spnChars.text(remaining);
}

function shorten() {
    var url = parseUrl()

    if (url) {
        $.ajax({
            url: "http://api.bitly.com/v3/shorten?login=" + birdcage.user.bitly_login + "&apiKey=" + birdcage.user.bitly_secret + "&longUrl=" + url,
            dataType: "jsonp",
            success: function (result) {
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
