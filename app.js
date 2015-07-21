FIREBASE_BASE = 'https://scorching-inferno-3523.firebaseio.com';

var ref = new Firebase("https://scorching-inferno-3523.firebaseio.com");

var btnTweet = $('#tweet'),
    txtContent = $('#content'),
    tweetList = $('#tweets');

ref.authWithOAuthPopup("twitter", function(error, authData) {
  if (error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Authenticated successfully with payload:", authData);
    
    ref.child("posts/" + authData.uid).orderByPriority().startAt(2).on("value", function(snapshot) {
    console.log(snapshot.val());

    tweetList.empty();
    var tweets = snapshot.val();
    $.each(tweets, function(id, tweet){

        $('<li>')
            .text(tweet.content)
            .appendTo(tweetList);
        })
    });
   
   
   btnTweet.on('click', tweet);

    function tweet() {
        ref.child('posts/' + authData.uid).push({
                content: txtContent.val() + new Date(),
                '.priority': Date.now(),
                sent_count: 0
            }
        )
    }
    
  }
});



