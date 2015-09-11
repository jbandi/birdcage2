(function (global) {
	'use strict';

	var FIREBASE_URL = 'https://scorching-inferno-3523.firebaseio.com',
		_firebase = new Firebase(FIREBASE_URL),
		_authData = {},
		_user = undefined,
		_tweets = [],
        _firebaseListener = undefined,
		_tweetSubject = new Rx.ReplaySubject();


	global.birdcage2 = {
		init: init,
		getAuthData: getAuthData,
		getUser: getUser,
        loadTweets: loadTweets,
		updateUser: updateUser,
		onTweetsChange: onTweetsChange,
		postTweet: postTweet,
		increasePriority: increasePriority,
		deleteTweetById: deleteTweetById,
		randomize: randomize
	};

	function init() {
		return new Promise(function (resolve, reject) {
			_authData = ref.getAuth();
			if (!_authData) {
				ref.authWithOAuthPopup("twitter", function (error, authData) {
					if (error) {
						console.log("Login Failed!", error);
					}
					else {
						console.log("Authenticated successfully with payload:", authData)
						_authData = authData;
						loadData();
					}

				});
			}
			else {
				loadData();
			}

			function loadData() {
				var userPromise = createOrLoadUser();
				var tweetsPromise = loadTweets();

				Promise.all([userPromise, tweetsPromise])
					.then(resolve)
					.catch(function () {
						console.log("An error occured while loading data!");
					})
			}
		})
	}

	function getAuthData() {
		return _authData;
	}

	function getUser() {
		return _user;
	}

	function updateUser(user) {
		_firebase.child('users/' + _authData.uid).update(user);
	}

	function onTweetsChange(handler) {
		_tweetSubject.subscribe(handler);
	 }

	function postTweet(text) {
		var tweet = {
			content: text,
			'.priority': Date.now(),
			sent_count: 0
		}
		_firebase.child('posts/' + _authData.uid).push(tweet);
	}

	function increasePriority(tweet) {
		var index = _tweets.indexOf(tweet);
		if (index > 0) {
			var prevPrio = _tweets[index - 1]['.priority'];
			_firebase.child('posts/' + _authData.uid + '/' + tweet.id).update({ '.priority': prevPrio - 1 });
		}
	}

	function deleteTweetById(tweetId) {
		ref.child('posts/' + _authData.uid + '/' + tweetId).remove();
	}


	function randomize() {
		$.each(_tweets, function (index, tweet) {
			var randomPrio = Math.floor(Math.random() * 90000) + 10000
			ref.child('posts/' + _authData.uid + '/' + tweet.id).update({ '.priority': randomPrio });
		})
	}

	function createOrLoadUser() {

		return new Promise(function (resolve, reject) {
			_firebase.child("users/" + _authData.uid).once("value", function (snapshot) {

				_user = snapshot.val();

				if (!_user) {
					console.log("Creating new user!");
					_user = {
						access_token: _authData.twitter.accessToken,
						access_token_secret: _authData.twitter.accessTokenSecret,
						active: false,
						reshedule: false,
						uid: _authData.uid,
						username: _authData.twitter.username
					};
					ref.child('users/' + _authData.uid).set(_user, function () {
						console.log("Loaded created!");
						resolve();
					});
				}
				else {
					console.log("User loaded.");
					resolve();
				}
			});
		});
	}

	function loadTweets(all) {
        //all = true;
        _firebaseListener && _firebaseListener.off();
        _firebaseListener = _firebase.child("posts/" + _authData.uid)
                                .orderByPriority()
                                .startAt(all ? 0 : 2);

		return new Promise(function (resolve) {
            _firebaseListener
				.on("value", function (snapshot) {
					_tweets = [];
					var tweetsObj = snapshot.exportVal(); // also get priorities
					if (tweetsObj){
						var tweetsArray = $.map(tweetsObj, function (value, id) {
							value.id = id;
							return value;
						});



						_tweets = tweetsArray;
					}
					resolve(); // resolving on any change ... not really elegant
					_tweetSubject.onNext(_tweets);
				});
		});
	}

})(window);