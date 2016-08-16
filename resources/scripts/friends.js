var socket;
var intervalUpdateCL = false;

var contactList = {
	incoming: [],
	outgoing: [],
	friends: []
};

var defaultAvatar = '';

var incomingCallData = {
	id: false,
	name: false
};

var outgoingCallData = {
	id: false,
	name: false
};

var incomingCallRejectTimeout = false;
var incomingCallSound = false;
var outgoingCallRejectTimeout = false;
var outgoingCallSound = false;

var globalNotification = false;
var hiddenApi = false;
var isConnected = false; // detect server restarts
var friendsInitCompleted = false;

function requestContactList() {
	socket.emit('getContactList');
}

function requestAvatar(uid, callback){
	callback(defaultAvatar);
	return false;
	/*
	$.ajax({
		method: 'POST',
		url: 'auth.php',
		data: { get_avatar: 1, uid: uid },
		dataType: 'json',
		success: function(json){
			if (typeof json.url != 'undefined'){
				callback(json.url);
			} else {
				callback(defaultAvatar);
			}
		},
		error: function(){
			callback(defaultAvatar);
		}
	});
	*/
}

function showProfile(e) {
	console.log(e);
	
	var login = e.dataset.login;
	var id = e.dataset.id;
	sendCallRequest(id, login);
	// $('#mini-profile-login').html(login);
	// $('#mini-profile').css({
	// 	left: e.offsetLeft + 20,
	// 	top: e.offsetTop + e.offsetHeight
	// });
	// $('#mini-profile').fadeIn('fast');
}

function incomingCall(id, name) {
	incomingCallData = {
		id: id,
		name: name
	};
	
	requestAvatar(name, function(url) {
		$('#call-avatar').attr('src', url);
	});
	
	$('#call-name').html(name);
	$('#call-text').html('is calling you');
	$('#call-backdrop').fadeIn('fast');
	$('#call-window').fadeIn('fast');
	$('#call-controls-incoming').show();
	$('#call-controls-outgoing').hide();
	incomingCallSound.play();
	
	if (globalNotification && globalNotification.notificationObject) {
		globalNotification.notificationObject.close();
	}
	
	if (hiddenApi && hiddenApi.isPageHidden) {
		globalNotification = new NotificationWrapper("SpeakUP", {
			body: name + " is calling!",
			icon: Config.staticPath + '/apps/speakup/images/icons/favicon-64x64.png'
		});
	}
	
	if (incomingCallRejectTimeout) {
		clearTimeout(incomingCallRejectTimeout);
	}
	
	incomingCallRejectTimeout = setTimeout(function() {
		Call.reject();
	}, 30000);
	
	EventLogger.log('call_incoming');
}

function sendCallRequest(id, name) {
	outgoingCallData = {
		id: id,
		name: name
	};
	
	socket.emit('callRequest', {
		destination: id
	});
	
	requestAvatar(name, function(url) {
		$('#call-avatar').attr('src', url);
	});
	
	$('#call-name').html(name);
	$('#call-text').html('waiting for answer');
	$('#call-backdrop').fadeIn('fast');
	$('#call-window').fadeIn('fast');
	$('#call-controls-incoming').hide();
	$('#call-controls-outgoing').show();
	outgoingCallSound.play();
	
	if (outgoingCallRejectTimeout) {
		clearTimeout(outgoingCallRejectTimeout);
	}
	
	outgoingCallRejectTimeout = setTimeout(function() {
		Call.cancel();
	}, 30000);
	
	EventLogger.log('call_outgoing');
}

function setLoading() {
	$('#friends-app').html("<div id='loading-alert' class='alert alert-info'>Please, wait, data is loading</div>");
}

function parseContactList() {
	var iconTemplate = "<svg class='icon %1'><use xlink:href='/resources/fonts/symbol-defs.svg#icon-%2'></use></svg>";
	var iconUser = iconTemplate
	                    .replace("%1", 'icon-user')
						.replace("%2", 'user');
	var iconOut = iconTemplate
	                    .replace("%1", 'icon-user')
						.replace("%2", 'user');
	var iconIn = iconTemplate
	                    .replace("%1", 'icon-user')
						.replace("%2", 'user');
	$('#friends-app').html('');
	if (contactList.incoming.length === 0 && contactList.outgoing.length === 0 && contactList.friends.length === 0) {
		$('#friends-app').append("<div class='alert alert-info'>Your friend list is empty at the moment.</div>");
	} else {
		if (contactList.friends.length > 0) {
			var content = "<div class='list-group'>";
			for (var i = 0; i < contactList.friends.length; i++) {
				var friend = contactList.friends[i];
				var onlineClass = friend.online ? "list-group-item-success" : "list-group-item-danger";
				content += "<a data-login='" + friend.name + "' data-id='" + friend.id + "' class='list-group-item " + onlineClass + "' onClick='showProfile(this); return false;' href='?method=profile&id=" + friend.name + "'>" +
					iconUser + " " + friend.name + "</a>";
			}
			content += "</div>";
			$('#friends-app').append(content);
		}
		
		if (contactList.incoming.length > 0) {
			var content = "<h3>Friend Requests</h3>";
			content += "<div class='list-group'>";
			for (var i = 0; i < contactList.incoming.length; i++) {
				var friend = contactList.incoming[i];
				var onlineClass = '';
				content += "<a data-login='" + friend.name + "' data-id='" + friend.id + "' class='list-group-item " + onlineClass + "' onClick='showProfile(this); return false;' href='?method=profile&id=" + friend.name + "'>" +
					iconIn + " " + friend.name + "</a>";
			}
			content += "</div>";
			$('#friends-app').append(content);
		}
		
		if (contactList.outgoing.length > 0) {
			var content = "<h3>You have sent a friend request</h3>";
			content += "<div class='list-group'>";
			for (var i = 0; i < contactList.outgoing.length; i++) {
				var friend = contactList.outgoing[i];
				var onlineClass = '';
				content += "<a data-login='" + friend.name + "' data-id='" + friend.id + "' class='list-group-item " + onlineClass + "' onClick='showProfile(this); return false;' href='?method=profile&id=" + friend.name + "'>" +
					iconOut + " " + friend.name + "</a>";
			}
			content += "</div>";
			$('#friends-app').append(content);
		}
	}
}

function NotificationWrapper (title, options) {
	this.permission = false;
	this.notification = {
		title: 'No title',
		options: {
			body: '',
			icon: ''
		}
	};
	this.notificationObject = false;
	
	this.notification.title = title;
	if (options && options.body && options.icon) {
		this.notification.options = options;
	}
	
	this.showNotification();
}

NotificationWrapper.prototype.showNotification = function() {
	if (this.permission) {
		this.notificationObject = new Notification(this.notification.title, this.notification.options);
		this.notificationObject.onclick = function() {
			window.focus();
			this.close();
		};
	} else {
		this.checkPermissions();
	}
};

NotificationWrapper.prototype.checkPermissions = function () {
	if (!("Notification" in window)) {
		this.permission = false;
		console.log("This browser does not support desktop notification");
	} else if (Notification.permission === "granted") {
		this.permission = true;
		this.showNotification();
	} else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (p) {
			if (p === "granted") {
				this.permission = true;
				this.showNotification();
			} else {
				console.log("Notification request denied");
			}
		});
	}
};

function pageHiddenApi() {
	// https://www.binpress.com/tutorial//163
	var hidden;
	var owner = this;
	
	this.isPageHidden = true;
	
	if (typeof document.hidden !== 'undefined') {
		// Opera 12.10, Firefox >=18, Chrome >=31, IE11
		hidden = 'hidden';
		visibilityChangeEvent = 'visibilitychange';
	} else if (typeof document.mozHidden !== 'undefined') {
		// Older firefox
		hidden = 'mozHidden';
		visibilityChangeEvent = 'mozvisibilitychange';
	} else if (typeof document.msHidden !== 'undefined') {
		// IE10
		hidden = 'msHidden';
		visibilityChangeEvent = 'msvisibilitychange';
	} else if (typeof document.webkitHidden !== 'undefined') {
		// Chrome <31 and Android browser (4.4+ !)
		hidden = 'webkitHidden';
		visibilityChangeEvent = 'webkitvisibilitychange';
	}

	// Event handler: log change to browser console
	this.visibleChangeHandler = function () {
		if (document[owner.hidden]) {
			owner.isPageHidden = true;
		} else {
			owner.isPageHidden = false;
		}
	}

	//Register event handler
	if (typeof document.addEventListener === 'undefined' ||
		typeof document[this.hidden] === 'undefined'   )
	{
		console.log('Page Visibility API isnt supported!');
	} else {
		document.addEventListener(this.visibilityChangeEvent, this.visibleChangeHandler, false);
	}
	
	// perform first time check
	this.visibleChangeHandler();
}

var Call = {
	accept: function() {
		socket.emit("callAnswered", incomingCallData);
		this.hideForm();
		
		if (globalNotification && globalNotification.notificationObject) {
			globalNotification.notificationObject.close();
		}
		
		if (incomingCallRejectTimeout) {
			clearTimeout(incomingCallRejectTimeout);
		}
	},
	
	reject: function() {
		socket.emit("callRejected", incomingCallData);
		this.hideForm();
		
		if (globalNotification && globalNotification.notificationObject) {
			globalNotification.notificationObject.close();
		}
		
		if (incomingCallRejectTimeout) {
			clearTimeout(incomingCallRejectTimeout);
		}
	},
	
	hideForm: function() {
		$('#call-backdrop').fadeOut('fast');
		$('#call-window').fadeOut('fast');
		incomingCallSound.pause();
		incomingCallSound.currentTime = 0;
		outgoingCallSound.pause();
		outgoingCallSound.currentTime = 0;
	},
	
	cancel: function() {
		socket.emit("callCancelled", outgoingCallData);
		this.hideForm();
	}
}

var Friends = {
	visible: 0,
	showWindow: function() {
		this.visible = 1;
		$('#friends').animate({'margin-left': '0'});
		$('#fake-input').focus();
		$('#friends-open').fadeOut('fast');
	},
	
	hideWindow: function() {
		this.visible = 0;
		$('#friends').animate({'margin-left': '-100%'});
		$('#fake-input').focus();
		$('#friends-open').fadeIn('fast');
	}
}

function initFriendsApp() {
	if (!_session.guid) {
		$('#friends').hide();
		$('#friends-open').hide();
		return false;
	} else {
		$('#friends-open').show();
	}
	
	$('#user-profile-login').html(_session.login);
	
	$('#call-accept').unbind('click').on('click', function() {
		Call.accept();
	});
	
	$('#call-reject').unbind('click').on('click', function() {
		Call.reject();
	});
	
	$('#call-cancel').unbind('click').on('click', function() {
		Call.cancel();
	});
	
	$('#friends-close').unbind('click').on('click', function() {
		Friends.hideWindow();
	});
	
	$('#friends-open').unbind('click').on('click', function() {
		Friends.showWindow();
	});

	socket = io.connect('https://speakup.cf/', {
		"force new connection": true
	});
	
	incomingCallSound = new Audio(Config.staticPath + "/apps/speakup/sounds/ringtone.ogg");
	incomingCallSound.volume = 1;
	incomingCallSound.loop = 1;
	incomingCallSound.preload = 1;
	
	outgoingCallSound = new Audio(Config.staticPath + "/apps/speakup/sounds/dial.ogg");
	outgoingCallSound.volume = 1;
	outgoingCallSound.loop = 1;
	outgoingCallSound.preload = 1;
	
	defaultAvatar = Config.staticPath + '/img/user_default.png';

	socket.on('ping', function(e) {
		if (!isConnected) {
			isConnected = true;
			socket.emit('setMode', 'contactlist');
			socket.emit('setGuid', _session.guid);
		} else {
			alert("Server restarted, reloading", 'error');
			Sound.play('error');
			console.log("Server restarted, reloading");
			setTimeout(function() {
				LS.set('applying_settings', 1);
				location.reload();
			}, 300);
		}
	});

	socket.on('authFinished', function(e) {
		requestContactList();
		if (intervalUpdateCL !== false) {
			clearInterval(intervalUpdateCL);
		}
		
		intervalUpdateCL = setInterval(function() {
			requestContactList();
		}, 10000);
	});

	socket.on('callRequested', function(e) {
		console.log('callRequested', e);
		incomingCall(e.origin_lp_id, e.origin);
	});

	socket.on('recieveContactList', function(e) {
		$('#loading-alert').hide();
		contactList = e;
		parseContactList();
	});

	socket.on('friendRequestPerformed', function(e) {
		if (e.result && e.result == 'error' && e.reason) {
			var text = '';
			switch (e.reason) {
				case 1: text = 'DB error while requesting Contact List'; break;
				case 2: text = 'You have already sent a friend request'; break;
				case 3: text = 'Error while adding friend'; break;
				case 4: text = 'Error while confirming friendship'; break;
				case 5: text = 'No such user'; break;
				case 6: text = 'You can\'t be a friend with yourself'; break;
				default: text = 'Unknown error';
			}
			alert("Friend Request Failed: " + text, "error");
			console.log('friendRequestPerformed', 'error', text);
		} else {
			requestContactList();
		}
	});

	socket.on('callJoinRoom', function(e) {
		LS.set("applying_settings", 1);
		location.href = "/call/" + e;
		// Config.room = e;
		// setRoom(false, true);
		// webrtc.joinRoom(e);
		
	});

	socket.on('callRejected', function(e) {
		console.log('callRejected', e);
		if (e.name) {
			alert("<b>" + e.name + "</b> has rejected your call");
		}
		
		Call.hideForm();
	});
	
	socket.on('callCancelled', function(e) {
		console.log('callCancelled', e);
		if (e.name) {
			alert("<b>" + e.name + "</b> has cancelled the call");
		}
		
		Call.hideForm();
	});

	socket.on('callRequestFailed', function(e) {
		if (e && e.reason) {
			switch (e.reason) {
				case 1: text = 'User is offline'; break;
				default: text = 'Unknown error';
			}
			
			alert("Can't call this user: " + text, "error");
			console.log('callRequestFailed', text);
		}
		
		Call.cancel();
	});
	
	Notification.requestPermission(function() {});
	hiddenApi = new pageHiddenApi();
	
	setLoading();
	
	friendsInitCompleted = true;
	
	console.log("[friends]", "init completed");
	return true;
};