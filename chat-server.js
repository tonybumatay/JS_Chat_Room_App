// Require the packages we will use:
var http = require("http"),
	socketio = require("socket.io"),
	url = require('url'),
	path = require('path'),
	mime = require('mime'),
	path = require('path'),
	fs = require('fs');
 
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html:
var app = http.createServer(function(req, resp){
	var filename = path.join(__dirname, "static", url.parse(req.url).pathname);
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}
 
				// File exists and is readable
				var mimetype = mime.lookup(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	});
});
app.listen(3456);
 
var users = [];
var usernames = [];
var rooms = [];
var roomNames = [];
var banned = [];
roomNames.push("public1");
roomNames.push("public2");
rooms["public1"] = {password:"", host:""};
rooms["public2"] = {password:"public2", host:""}
var numUsers = 0; 
// Do the Socket.IO magic:
var io = socketio.listen(app);
io.sockets.on("connection", function(socket){
	// This callback runs when a new Socket.IO connection is established.
	var addedUser = false;

 	socket.on("username", function(data){
 		if(!(data["username"] in usernames)){
 			socket.emit("successJoin", {username: data["username"], room:"public1"});
	 		
	 		numUsers += 1;
	 		addedUser = true;

	 		socket.username = data["username"];
	 		socket.join('public1');
	 		socket.join(data["username"]);
	 		
	 		usernames[data["username"]] = data["username"];

	 		users[data["username"]] = {
	 			username:data["username"],
	 			room:"public1",
	 			socketid:socket.id,
	 			bannedRooms:[],
	 			numBans:0
	 		};

	 		io.to("public1").emit('user_joined', {
	 			username:socket.username
	 		});
 		} else {
 			socket.emit("username_taken");
 		}
 	});

 	//find out is a user is in a given room
 	socket.on("query_users", function(data){
 		var tempUsers = [];
 		for(x in users){
 			if(users[x].room == data["room"]){
 				tempUsers.push(users[x].username);
 			}
 		}
 		socket.emit("usersInRoom", {room: data["room"], users:tempUsers});
 	});

 	//SEND A MESSAGE TO A CHAT ROOM
	socket.on('message_to_room', function(data) {
		// This callback runs when the server receives a new message from the client.
		io.to(data["room"]).emit("message_to_room",{message:data["message"], username_from:socket.username});
	});

	//SEND A PRIVATE MESSAGE
	socket.on("send_message_to_person", function(data){
		console.log("sent");
		//socket.emit("sent_message_to_person", {message:data["message"], username_to:data["username_to"], username_from:socket.username});
		io.to(users[data["username_to"]].socketid).emit("message_to_person", {message:data["message"], username_from:socket.username});
	});
	
	//MAKE A USER HOST
	socket.on("makeHost", function(data){
		io.to(users[data["host"]].socketid).emit("you_host", {room:data["room"]});
	});

	//JOIN A ROOM
	socket.on("join_room", function(data){
		if(users[socket.username].bannedRooms.indexOf(data["roomName"]) != -1){
			socket.emit("banned");
		} 
		else if(rooms[data["roomName"]].password != ""){//if pass is not null
			if(data["password"] == ""){
				socket.emit("needRoomPassword", {roomName:data["roomName"]});
			} else if(rooms[data["roomName"]].password == data["password"]){
				//successful join
				socket.leave(users[socket.username].room);
				io.to(users[socket.username].room).emit("user_left", {username:socket.username});
				users[socket.username].room = data["roomName"];
				io.to(users[socket.username].room).emit("user_joined", {username:socket.username});
				socket.join(data["roomName"]);
				socket.emit("successJoin", {username:socket.username, room:data["roomName"]});
			} else {
				//wrong pw
				socket.emit("wrongPassword", {roomName:data["roomName"]});
			}
		} else {
			socket.leave(users[socket.username].room);
			io.to(users[socket.username].room).emit("user_left", {username:socket.username});
			users[socket.username].room = data["roomName"];
			io.to(users[socket.username].room).emit("user_joined", {username:socket.username});
			socket.join(data["roomName"]);
			socket.emit("successJoin", {username:socket.username, room:data["roomName"]});
		}
	});

	//CREATE A ROOM
	socket.on("create_room", function(data){
		if(data["roomName"] in roomNames){
			socket.emit("roomNameTaken");
		} else {
			rooms[data["roomName"]] = {
				password:data["roomPassword"],
				host:socket.username
			}
			roomNames.push(data["roomName"]);
			io.sockets.emit("room_created", {roomName:data["roomName"], host:socket.username, });
		}
	});

	//QUERY ROOMS
	socket.on("query_rooms", function(data){
		socket.emit("rooms", {roomsList:roomNames});
	});
	//KICK A USER
	socket.on('kick', function(data){
		socket.to(data["userToKick"]).emit("leaveRoom");
	});
	//BAN A USER
	socket.on('ban', function(data){
		socket.to(data["userToBan"]).emit("leaveRoom");
		users[data["userToBan"]].bannedRooms.push(data["kickedFrom"]);
		users[data["userToBan"]].numBans += 1;
	});

	socket.on('disconnect', function () {
    if (addedUser) {
      delete users[socket.username];
      --numUsers;

      io.sockets.emit('user_left', {
        username: socket.username,
        room: socket.room
      });
   	 }
	});
});