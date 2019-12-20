//Networking
var ip = "10.2.17.120";
console.log("Being hosted on: " + ip);
var socket = new WebSocket("ws://" + ip + ":8081");
var id; //Local id
var players = []; //All players
var p; //Local player

//IO Event Listeners
var keyDown = [];

var canJump = true;

onkeydown = function(e){
  keyDown[e.which] = true;
  if(keyDown[32] && players[id] != null){
    attack();
  }
}
onkeyup = function(e){
  keyDown[e.which] = false;
}

//Cleans up screen on client exiting
window.onbeforeunload = function(){
  p.x = -100;
  socket.send(JSON.stringify(p));
}
window.onunload = function(){
  p.x = -100;
  socket.send(JSON.stringify(p));
}

//Graphics
var scale = 1.5;
var c = document.getElementById("gameCanvas");
c.height = scale * window.innerHeight;
c.width = c.height;
document.body.style.zoom = 1 / scale; //Rescale screen- helps resolution if canvas's height is bigger than actual screen
var ctx = c.getContext("2d");

//Socket listening for messages from server, then updates local data accordingly
socket.onmessage = function(message){
  if(id == undefined){
    id = message.data;
    start();
  } else if(message.data.substring(0, 1) == "p"){
    players = JSON.parse(message.data.substring(1));
  } else if(message.data.substring(0, 1) == "b"){
    blocks = JSON.parse(message.data.substring(1));
    for(var i = 0; i < blocks.length; i++){
      blocks[i] = new StaticRectBlock(blocks[i].c0, blocks[i].c1, blocks[i].c2, blocks[i].c3);
    }
  }
}

//Offline testing
var offline = false;

//Player constructor
function Player(id, x, y){
  this.id = id;

  //Scales are different because of the viewport dimensions
  this.x = x; //X is on scale of 0-100
  this.y = y; //Y is on scale of 0-75
  this.velocityY = 0; //Pretty much just used for gravity
}

//Blocks (for standing)
var blocks = [];

//Updates Blocks
function updateBlocks(){
  canJump = true;
  for(var i = 0; i < blocks.length; i++){
    ctx.fillStyle = "black";
    blocks[i].draw();
    blocks[i].colliding();
  }
}

//Waits for socket to establish connection and get data, then this function is called
function start(){
  p = new Player(id, 50, 50);
  setInterval(update, 1000 / 60);
}

function startOffline(){
  offline = true;
  id = 0;
  p = new Player(id, 50, 50);
  players = [p];
  setInterval(update, 1000 / 60);
}

//Sends JSON string of local player object
function sendSelf(){
  socket.send(JSON.stringify(p));
}

//Updates game world for local player and sends out data
function update(){
  //reset screen
  ctx.clearRect(0, 0, c.height, c.height);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 0.005 * c.height;
  ctx.strokeRect(0, 0, c.height, c.height);

  move();

  drawPlayers();

  updateBlocks();

  //Update postion serverside
  if(!offline) sendSelf();
}

//Moves local player
function move(){
  var speed = 0.5;
  var jumpSpeed = -1.5;

  //Normal movement
  if(keyDown[65]){
    p.x -= speed;
  }
  if(keyDown[68]){
    p.x += speed;
  }
  /*if(keyDown[83]){

  }*/
  if(keyDown[87] && p.velocityY == 0 && canJump){
    p.velocityY = jumpSpeed;
  }

  //gravity
  if(p.velocityY <= 10) p.velocityY += 0.05;

  p.y += p.velocityY;
}

//Draws everyone, but uses local variables for the local player, as opposed to data from updater on the others
function drawPlayers(){
  for(var i = 0; i < players.length; i++){
    if(players[i] != null){
      if(players[i].id != id){
        ctx.fillStyle = "red";
        ctx.strokeStyle = "red";
        ctx.fillRect((players[i].x / 100) * c.height - (((5 / 100) * c.height) / 2), (players[i].y / 100) * c.height - (((5 / 100) * c.height) / 2), ((5 / 100) * c.height), (5 / 100) * c.height);
        ctx.beginPath();
        ctx.arc((players[i].x / 100) * c.height,  (players[i].y / 100) * c.height, 5 / 100 * c.height, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
      } else {
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
        ctx.fillRect((p.x / 100) * c.height - (((5 / 100) * c.height) / 2), (p.y / 100) * c.height - (((5 / 100) * c.height) / 2), (5 / 100) * c.height, (5 / 100) * c.height);
        ctx.beginPath();
        ctx.arc((p.x / 100) * c.height,   (p.y / 100) * c.height, 5 / 100 * c.height, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
}

//Constructor for a block: takes four corner arrays as arguements
function StaticRectBlock(c0, c1, c2, c3){
  /*Corners are laid out like:
  C0---------------C1
  |                        |
C2---------------C3
  */
  var pSize = 5;

  //Test if colliding w/ player and do stuff accordingly
  this.colliding = function(){
    var angle = getAngle([(c0[0] + c1[0]) / 2, (c0[1] + c3[1]) / 2], [p.x, p.y]);

    var midPoint = [(c0[0] + c1[0]) / 2, (c0[1] + c3[1]) / 2];

    if(angle >= getAngle(midPoint, c0) && angle <= getAngle(midPoint, c1)){
      if(p.y + (pSize / 2) > c0[1] && (p.x - (pSize / 2) < c1[0]) && (p.x + (pSize / 2) > c0[0]) && p.y < ((c0[1] + c2[1]) / 2)){
        p.y = c0[1] - (pSize / 2);
        p.velocityY = 0;
      }
    }
    else if(angle >= getAngle(midPoint, c3) && angle <= getAngle(midPoint, c2)){
      if(p.y - (pSize / 2) < c2[1] && (p.x - (pSize / 2) < c1[0]) && (p.x + (pSize / 2) > c0[0]) && p.y > ((c0[1] + c2[1]) / 2)){
        p.y = c2[1] + (pSize / 2);
        p.velocityY = 0;
        canJump = false;
      }
    }
    else if(angle >= getAngle(midPoint, c2) && angle <= getAngle(midPoint, c0)){
      if(p.x + (pSize / 2) > c0[0] && p.y - (pSize / 2) < c2[1]  && p.y + (pSize / 2) > c0[1] && p.x < ((c0[0] + c1[0]) / 2)){
        p.x = c0[0] - (pSize / 2);
      }
    } else {
      if(p.x - (pSize / 2) < c1[0] && p.y - (pSize / 2) < c2[1]  && p.y + (pSize / 2) > c0[1] && p.x > ((c0[0] + c1[0]) / 2)){
        p.x = c1[0] + (pSize / 2);
      }
    }
  }
  this.draw = function(){
    var ds = c.height / 100; //draw scale
    ctx.fillRect(c0[0] * ds, c0[1] * ds, (c1[0]-c0[0]) * ds, (c2[1]-c0[1]) * ds);
  }
}

/*
blocks[0] = new StaticRectBlock([0, 80], [100, 80], [0, 100], [100, 100]);

blocks[1] = new StaticRectBlock([50, 55], [60, 55], [50, 70], [60, 70]);
*/

//Gets angle between two points
function getAngle(p0, p1){
  var slope = (p0[1] - p1[1]) / (p0[0] - p1[0]);

  if(slope == Infinity){
    slope = -10;
  }

  if(slope == -Infinity){
    slope = 10;
  }

  var angle = Math.atan(slope) * (180 / Math.PI);

  if(p0[0] > p1[0]){
    angle += 180;
  }

  while(angle < 0){
    angle += 360;
  }

  return angle % 360;
}

function attack(){
  socket.send("a" + p.id);
}
