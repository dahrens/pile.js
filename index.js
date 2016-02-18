"use strict";

require('app-module-path/register');
require('source-map-support').install();

var app = require('./dist/server').startServer(__dirname + '/www', 1337);


//var bots    = require('./dist/bots');
//var Player  = require("./dist/player").Player;
//var Lobby   = require("./dist/lobby").Lobby;
//var User    = require("./dist/user").User;

//GLOBAL.lobby = new Lobby(app.io);
//lobby.createRace();

// app.io.on('connection', function (socket) {
//     var player;
//     socket.on('join', function() {
//         player = new Player(app.io, socket);
//         lobby.join(player);
//         socket.emit('player', player.ui());
//     });
// });

//bots.create();
