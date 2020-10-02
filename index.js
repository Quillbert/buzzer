var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static(__dirname + "/public"));
const Room = require('./room.js');
const Player = require('./player.js')
var socket = require('socket.io');
var io = socket(server);
var rooms = [];
console.log("socket started");

io.on("connection", function(socket) {
	socket.on("disconnect",function(data) {
		for(let i = 0; i < rooms.length; i++) {
			if(rooms.host == socket.id) {
				rooms.splice(i, 1);
				break;
			}
			for(let j = 0; j < rooms[i].players.length; j++) {
				if(rooms[i].players[j].id == socket.id) {
					rooms[i].players.splice(j, 1);
				}
			}
		}
	});
	socket.on("message", function(data) {
		io.emit("message", data);
	});
	socket.on("create", function(data) {
		var room = createRoom(socket.id);
		io.to(socket.id).emit("code", room.code);
		socket.join(room.code);
	});
	socket.on("ask", function(data) {
		var room = rooms.find(function(element) {
			return element.code == data.code;
		});
		if(room == null) {
			io.to(socket.id).emit("available", "room");
		} else {
			var player = room.players.find(function(element) {
				return element.name == data.name;
			});
			if(player != null) {
				io.to(socket.id).emit("available", "name");
			} else {
				io.to(socket.id).emit("available", "yes");
			}
		}
	});
	socket.on("join", function(data) {
		var room = rooms.find(function(element) {
			return element.code == data.room;
		});
		room.players.push(new Player(socket.id, data.name));
		socket.join(data.room);
	});
	socket.on("buzz", function(data) {
		var room = null;
		var player;
		for(let i = 0; i < rooms.length; i++) {
			for(let j = 0; j < rooms[i].players.length; j++) {
				if(rooms[i].players[j].id == socket.id) {
					player = rooms[i].players[j];
					room = rooms[i];
					break;
				}
			}
			if(room != null) {
				break;
			}
		}
		if(room != null) { 
			if(!room.buzzed) {
				io.to(room.code).emit("buzzed", player.name);
				room.buzzed = true;
			}
		}
	});
	socket.on("reset", function(data) {
		var room = rooms.find(function(element) {
			return element.host == socket.id;
		});
		if(room != null) {
			io.to(room.code).emit("reset", "");
			room.buzzed = false;
		}
	});
});

function createRoom(host) {
	var gameCode;
	do {
		gameCode = Math.floor(Math.random()*899999)+100000;
		var match = rooms.find(function(element) {
			return element.code == gameCode;
		});
	} while(match != null);
	var room = new Room(gameCode, host);
	rooms.push(room);
	return room;
} 