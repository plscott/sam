// Drawing
var CANVAS_SIZE = 400;

// audio context (global variable)
var context = new (window.AudioContext || window.webkitAudioContext);

// object used to represent the socket io connection
var socket = null;

// variable needed for peer to peer connection
var peer_key = "";
var peer_id = "";
var peer = null;
var peer_client_ids = [];
var peer_connections = {};
var muted = false;
var current_dir = "src/main/resources/static/testdirectory";
var songsdiv = $("<div></div>");
var API_KEY = "0d73a4465bd208188cc852a95b011b22";

var svg = d3.select("#clients-canvas")
   .append("svg:svg")
   .attr("width", CANVAS_SIZE)
   .attr("height", CANVAS_SIZE);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white")
    .attr("fill-opacity", .5)
    .attr("style", "outline: thin solid black;")

var focusGroup = svg.append("svg:g");
var focus = focusGroup.select("circle").append("circle");

var circleGroupH = svg.append("svg:g");
var circleGroup; 
var running = false;
var focus_x = -1;
var focus_y = -1;
var nowPause = true;
var saved_clients = null;

var xPos = 0;
var yPos = 0;
var quick = false;
$("#clients-canvas").on('mousedown', function(event){
	var xPos = event.pageX - $("#clients-canvas")[0].offsetLeft;
	var yPos = event.pageY - $("#clients-canvas")[0].offsetTop;

	focus_x = xPos;
	focus_y = yPos;
	draw(saved_clients);
	quick = false;
	$.post("/changeFocus", {x : xPos, y : yPos, quick:quick}, function(responseJSON) {
		var responseObject = JSON.parse(responseJSON);
		var clients = responseObject.clients;
		saved_clients = clients;
		updateVolumeOfPeers();
	});

	$("#clients-canvas").on('mouseup mousemove', function handler(event) {
		if (event.type == 'mousemove') {
			var xPos = event.pageX - $("#clients-canvas")[0].offsetLeft;
			var yPos = event.pageY - $("#clients-canvas")[0].offsetTop;

			focus_x = xPos;
			focus_y = yPos;
			quick = false;
			draw(saved_clients);
			$.post("/changeFocus", {x : xPos, y : yPos, quick:quick}, function(responseJSON) {
			});
		} else {
			var xPos = event.pageX - $("#clients-canvas")[0].offsetLeft;
			var yPos = event.pageY - $("#clients-canvas")[0].offsetTop;
			
			focus_x = xPos;
			focus_y = yPos;
			quick = false;
			draw(saved_clients);
			$("#clients-canvas").off('mouseup mousemove', handler);
			$.post("/changeFocus", {x : xPos, y : yPos, quick:quick}, function(responseJSON) {
				var responseObject = JSON.parse(responseJSON);
				var clients = responseObject.clients;
				saved_clients = clients;
				updateVolumeOfPeers();
			});
		}
	});
});
var pulseTime = 3000;
var timer;
var down = false;

function pulse() {
	if (paused) {
		return;
	}
	console.log("nowPause: " + nowPause);
	console.log("focusDec: " + focusDec);
	console.log("pause: " + paused);
	console.log("focus_x: " + focus_x);
	console.log("focus_y: " + focus_x);


	if (focusDec && !paused) {
		if (down) {
			down = false;
			focus
				.transition()
				.duration(pulseTime/2*(focus.attr("r")-7)/6)
				.attr("stroke-width", 1.5)
				.attr("r", 7)
				.ease('sine')
				.transition()
				.duration(pulseTime/2)
				.attr('stroke-width', 0.5)
				.attr("r", 13)
				.ease('sine')
		}
		else {
			down = true;
			focus
				.transition()
				.duration(pulseTime/2*(13-focus.attr("r"))/6)
				.attr('stroke-width', 0.5)
				.attr("r", 13)
				.ease('sine')
				.transition()
				.duration(pulseTime/2)
				.attr("stroke-width", 1.5)
				.attr("r", 7)
				.ease('sine')
		}
	}
}
$("#clear-focus").click(function(event) {
	if (running) {
		nowPause = true;
		paused = false;
		draw(saved_clients);
		$.post("/changeFocus", {x : focus_x, y : focus_y}, function(responseJSON) {
		});
	}
});

$("#mute").click(function(event) {
	if (running) {
		$.post("/mute", {}, function(responseJSON) {
			muted = !muted;
			if (muted) {
				$("#mute").text("Unmute");
			} else {
				$("#mute").text("Mute");
			}
		});
	}
});

var focus;
var focusDec = false;
running = true;
var paused = false;
var text;
var textLabels;
function draw(clients) {
	if (!running) {
		alert("Server not created!");
		return;
	}

	if (paused) {
		focus.attr("r", 10);
		timer = setInterval(pulse, pulseTime/2);
	}

 	var time = 0;
 	if (nowPause && !paused) {
 		paused = true;
 		nowPause = false;
 		clearInterval(timer);
 		focus
 			.transition()
 			.transition()
 			.duration(200)
 			.attr("r", 0);

 	} else if (!focusDec) {
 		console.log("else if");
 		timer = setInterval(pulse, pulseTime/2);
 		focus = focusGroup.append("circle")
 			.attr("cx", focus_x)
			.attr("cy", focus_y)
			.attr("r", 10)
			.attr("stroke-width", 1)
			.attr("stroke", "black")
			.attr("fill", "none")
		focusDec = true;
		time = .01;
 	} else {
 		console.log("else");
 		time = Math.sqrt(Math.pow((focus.attr("cx") - focus_x), 2) + 
 			Math.pow((focus.attr("cy")-focus_y), 2));
 		time = time * 3;
 		time = Math.pow(time, .9);
 		if (quick) {
 			time = 0;
 		}
 		if (paused) {
 			time = .01;
 			paused = false;
 		}
 		focus.transition()
 		.duration(time)
 		.attr("cx", focus_x)
		.attr("cy", focus_y);
 	}
 	
 	if (saved_clients != null ){
 		circleGroupH.selectAll("circle").remove();
 		circleGroup = circleGroupH.selectAll("circle").data(saved_clients);
		var circleEnter = circleGroup.enter().append("circle");
		circleEnter.attr("cx", function(client) { 
 			if (client.x == -1) {
 				return -50;
 			}
 			
 			return client.x;
 		});
 	
 		circleEnter.attr("cy", function(client) { 
 			if (client.y == -1) {
 				return -50;
 			}
 			
 			return client.y;
 		});
 		
 		circleEnter.attr("r", function(d) {	
 			var r = d.volume;
 			if (r === null || r === undefined || paused ===true) {
 				return 10 ;
 			}
 			r = 10*r;
 			r = Math.max(r, 1);
 			return r;
 		});
 		circleEnter.style("stroke", "black");
 		circleEnter.attr("fill", "none");
	 	var prev = 	d3.selectAll("text");
	 	prev.remove();

 		text = svg.selectAll("text")
                       .data(saved_clients)
                        .enter()
                        .append("text");


		//Add SVG Text Element Attributes
		textLabels = text
            .attr("x", function(d) { return d.x-10; })
            .attr("y", function(d) { return d.y-10; })
            .text( function (d) { return d.id; })
            .attr("font-family", "sans-serif")
            .attr("font-size", "20px")
            .attr("fill", "black")
            .attr("fill-opacity", .7);
 	}
	if (time!=0 && !paused) {
		setTimeout(pulse, time);
	}
}

/* Update Client Positions */
function updateClientPositions() {
	$.get("/clients", {width : CANVAS_SIZE, height : CANVAS_SIZE}, function(responseJSON) {
		var responseObject = JSON.parse(responseJSON);
		var clients = responseObject.clients;

		draw(clients);
		saved_clients = clients;

		// update volume
		updateVolumeOfPeers();
	});
}

/* create server on click of create */
$("#server-create").click(function(event) {
	if (!socket) {
		// start the socket server
		$.post("/startServer", {}, function(responseJSON) {
			var responseObject = JSON.parse(responseJSON);
			if (!responseObject.error) {
				$("#server-create").text("Server Created");
				$.post("/getIP", {}, function(responseJSON) {
					var ipResponse = JSON.parse(responseJSON);
					if (ipResponse.success) {
						var address = ipResponse.address;
						$("#server-title").text("Server IP: " + address);
					}
				});
				// get the socket io url and port for the socket connection
				socket_url = responseObject.socket_url;
				socket_port = responseObject.socket_port;

				// set up the socket io connection
				setupSocketConnection(socket_url, socket_port);
			
				var updateClientPositionsTimer = setInterval(updateClientPositions, 3000);
			}

			alert("Server Started At IP Address: ");
		});
	}
});

/* everything below is used for playing music as it is streamed from the server*/
function setupSocketConnection(url, port) {
	socket = io('http://' + url + ':' + port);
	socket.on('connect', function() {
 		console.log("SocketIO Connection Established");

 		// get peer.js key (wait 1 second first)
 		setTimeout(function() {
 			socket.emit('peer_key', 'server');
 		}, 1000);
	});

	socket.on('disconnect', function() {
		console.log("SocketIO Connection Disconnected");
	});

	socket.on('data', function(data) {
		var response = JSON.parse(data);
		var song_bytes = response.song;
		peer_client_ids = response.client_ids;

		stream(song_bytes);
	});

	socket.on("peer_key", function(data) {
		console.log("Peer Created");
		peer_key = data;
		createPeer();
	});
}

/* function used to stream the song to the peer connections */
function stream(bytes) {
	var array_buffer = new ArrayBuffer(bytes.length);
	var buffered = new Uint8Array(array_buffer);

	for (var i = 0; i < bytes.length; i++) {
		buffered[i] = bytes[i];
	}
	
	context.decodeAudioData(array_buffer, function(buffer) {
		var source = context.createBufferSource();
		source.buffer = buffer;
		source.start();

		//source.connect(context.destination);
		var remote = context.createMediaStreamDestination();
		source.connect(remote);

		// pass the stream to the peer
		streamToPeers(remote.stream);	
	});
}


/* create a peer connection using peerjs api */
function createPeer() {
	peer = new Peer({
		key: peer_key, 
		config: {'iceServers': [
    		{url: "stun:stun.l.google.com:19302"},
			{url:"turn:numb.viagenie.ca", credential: "password123"}]}
    });

	peer.on('open', function(id) {
		peer_id = id;
		socket.emit("server_id", peer_id);
	});

	peer.on('connection', function(conn) {
		// peer connections not really working right now
		peer_connections[conn.peer] = conn;
	});
}

/* function used to stream the song to the peer connections */
function streamToPeers(stream) {
	for (var i = 0; i < peer_client_ids.length; i++) {
		var id = peer_client_ids[i];
		if (id != peer_id) {
			var call = peer.call(id, stream);
		}
	}
}

/* function used to play song locally */
function play(song) {
	var player = new Audio();
	player.src = URL.createObjectURL(song);
	player.play();
}

/* function used to update the volume of all of the clients */
function updateVolumeOfPeers() {
	for (var i = 0; i < peer_client_ids.length; i++) {
		var id = peer_client_ids[i];
		if (id != peer_id) {
			var curr_conn = peer_connections[id];
			//curr_conn.send(JSON.stringify(saved_clients));
		}
	}
}

$.post("/chooseMusicDirectory", {dir : current_dir}, function(responseJSON) {
	songsdiv.remove();
	songsdiv = $("<div id='songs-div' style='margin-top: 25px;'></div>");

	var songs = JSON.parse(responseJSON);
	songs.forEach(function(elem) {
		var _path = elem.filePath;
		var _title = elem.title;
		var _album = elem.album;
		var _artist = elem.artist;

		$.get("http://ws.audioscrobbler.com/2.0/", {method : "album.getinfo", artist : _artist, album : _album, api_key : API_KEY, format : "json"})
	    .done(function(responseJSONSong) {
	    	var song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:width:38px;height:38px;'><p class='song'>" + _title + " by " + _artist + "</p></div>");

	    	if (typeof responseJSONSong.error == 'undefined') {
				var albumart = responseJSONSong.album.image[1]["#text"];
				
				if (typeof albumart != "undefined") {
					song = $("<div class='song'><img src='" + albumart + "' style='float:left;width:38px;height:38px;'><p class='song'>" + _title + " by " + _artist + "</p></div>");
				} else {
					if (typeof _title == 'undefined') {
						song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:38px;height:38px;'><p class='song'>Unknown by unknown </p></div>");
					} else {
						song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:38px;height:38px;'><p class='song'>" + _title + " by " + _artist + "</p></div>");
					}
				}
			}

			if (typeof _title == 'undefined' || typeof _album == 'undefined' || typeof _artist == 'undefined') {
				song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:38px;height:38px;'><p class='song'>Unknown by unknown</p></div>");
			}

			song.on('click', function(e) {
				$.post("/playSong", {songPath : _path}, function(responseJSON) {
					alert("Playing " + _title + " by " + _artist + ".");
				});
			});

			songsdiv.append(song);
		})
	    .fail(function(xhr, textStatus, errorThrown) {
	    	var song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:38px;height:38px;'><p class='song'>" + _title + " by " + _artist + "</p></div>");
			
			if (typeof _title == 'undefined' || typeof _album == 'undefined' || typeof _artist == 'undefined') {
				song = $("<div class='song'><img src='../images/placeholder.png' style='float:left;width:38px;height:38px;'><p class='song'>Unknown by unknown</p></div>");
			}

			song.on('click', function(e) {
				alert("Playing " + _title + " by " + _artist + ".");
				$.post("/playSong", {songPath : _path}, function(responseJSON) {
					
				});
			});

			songsdiv.append(song);
	    });
	});

	$("#songs-bound-div-2").append(songsdiv);
});