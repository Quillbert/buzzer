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
				io.to(rooms[i].code).emit("end", "host left");
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
				var name = data.name.replace(/[^a-zA-Z0-9 ,.$#!-]/g, "");
				return element.name == name;
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
		if(room != null) {
			var name = data.name.replace(/[^a-zA-Z0-9 ,.$#!-]/g, "");
			room.players.push(new Player(socket.id, name));
			socket.join(data.room);
			if(room.buzzed != "") {
				io.to(socket.id).emit("buzzed", room.buzzed);
			}
			listPlayers(room, room.host);
		}
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
			if(room.buzzed == "") {
				var out = {
					name: player.name,
					team: player.team
				};
				io.to(room.code).emit("buzzed", out);
				room.buzzed = player.name;
			}
		}
	});
	socket.on("reset", function(data) {
		var room = rooms.find(function(element) {
			return element.host == socket.id;
		});
		if(room != null) {
			io.to(room.code).emit("reset", "");
			room.buzzed = "";
		}
	});
	socket.on("players", function(data) {
		var room = rooms.find(function(element) {
			return element.host == socket.id;
		});
		if(room != null) {
			listPlayers(room, socket.id);
		}
	});
	socket.on("color", function(data) {
		var room = rooms.find(function(element) {
			return element.host == socket.id;
		});
		if(room != null) {
			if(socket.id == room.host) {
				var player = null;
				for(let i = 0; i < room.players.length; i++) {
					if(room.players[i].name == data.player) {
						player = room.players[i];
						break;
					}
				}
				if(player != null) {
					if(data.color == "red") {
						player.team = "r";
					} else if(data.color == "blue") {
						player.team = "b";
					} else {
						player.team = "n";
					}
				}
			}
			listPlayers(room, socket.id);
		}
	});
	socket.on("clear-teams", function(data) {
		var room = rooms.find(function(element) {
			return element.host == socket.id;
		});
		for(let i = 0; i < room.players.length; i++) {
			room.players[i].team = "n";
		}
		listPlayers(room, socket.id);
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

function listPlayers(room, socket) {
	var out = [];
	for(let i = 0; i < room.players.length; i++) {
		var player = {
			name: room.players[i].name,
			team: room.players[i].team
		}
		out.push(player);
	}
	io.to(socket).emit("players", out);
}
