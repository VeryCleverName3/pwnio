var WebSocket = require("ws");
var server = new WebSocket.Server({port: 8081});
var express = require("express");

var app = express();

var nextId = 0;

var clients = [];

var blocks = [];

var killed = [];

server.on("connection", function(socket){
	socket.on("message", function(message){
		if(message.substring(0, 1) == "a"){
			var id = message.substring(1);
			var hit = false;
			if(!killed[id]){
				var attacker = clients[id];
				for(var i = 0; i < clients.length; i++){
					console.log("ID" + id);
					if(clients[i] != null && i != id){
						if((Math.hypot(attacker.y - clients[i].y, attacker.x - clients[i].x)) <= 5){
							delete clients[i];
							killed[i] = true;
							hit = true;
						}
					}
				}
				console.log(hit);
				if(!hit){
					delete clients[id];
					killed[id] = true;
				}
			}
		} else {
			//Format is [clientID, x, y]
			var a = JSON.parse(message);
			clients[a.id] = a;
			if(clients[a.id].x == -100){
				delete clients[a.id];
			}
		}
	});
	socket.on("close", function(message){
		console.log(message);
	});
	socket.send(nextId);
	clients[nextId] = new Player(nextId, 0, 0);
	nextId++;

});

//Sends data to all clients
function sendDataToClients(){
	server.clients.forEach(function(client){
		for(var i = 0; i < clients.length; i++){
			if(killed[i]) clients[i] = null;
		}
		client.send("p" + JSON.stringify(clients));
	});
}

//Constructor for players
function Player(id, x, y){
	this.id = id;
	this.x = x;
	this.y = y;
}

//Updates clientside data periodically
setInterval(sendDataToClients, 1000 / 60);

//Send blocks to all clients
function sendBlocksToClients(){
        server.clients.forEach(function(client){
                client.send("b" + JSON.stringify(blocks));
        });
}

setInterval(sendBlocksToClients, 1000 / 60);

function StaticRectBlock(c0, c1, c2, c3){
	this.c0 = c0;
	this.c1 = c1;
	this.c2 = c2;
	this.c3 = c3;
}

loadMapOne();

function loadMapOne(){
	blocks = [];
	blocks[0] = new StaticRectBlock([20, 80], [80, 80], [20, 90], [80, 90]);
	blocks[1] = new StaticRectBlock([10, 60], [20, 60], [10, 70], [20, 70]);
	blocks[2] = new StaticRectBlock([80, 60], [90, 60], [80, 70], [90, 70]);
	blocks[3] = new StaticRectBlock([20, 40], [80, 40], [20, 45], [80, 45]);
}

function distance(p0, p1){
	console.log(p0);
	return Math.hypot(p0.y - p1.y, p0.x - p1.x);
}

app.use(express.static("client"));

app.get("*", function(req, res){
	res.sendFile("C:/Users/carte/OneDrive/Desktop/pwnio/client/index.html");
	console.log("new connec");
});

app.listen(8080);
