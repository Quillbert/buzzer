var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static(__dirname + "/public"));
var socket = require('socket.io');
var io = socket(server);
console.log("socket started");