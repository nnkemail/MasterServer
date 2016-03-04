var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;





function Client(serverAdr, idRoom) {
this.tick_counter      = 0;
this.inactive_interval = 0;
this.balls             = {};
this.my_balls          = [];
this.myPoints          = [];
this.score             = 0;
this.totalScore        = 0;
this.ballList          = [];
this.ballsIds           = [];
    this.leaderBoard    = []
    this.serverAdress = serverAdr
    this.idRoom = idRoom

//==================

this.ratio = 1;
this.screenRenderSize = 10;
//var cx= 0;
//var cy= 0;
this.px = 0;
this.py = 0;

//PLAYER

this.positionX = 250;
this.positionY = 100;

this.xoffset = 0;
this.yoffset = 0;

this.screenWidth = window.innerWidth;
this.screenHeight = window.innerHeight;

//writeToScreen("doszlo do po window")
this.canvas = document.getElementById('cvs');
this.context = this.canvas.getContext('2d');
this.lbCanvas = null; //dodac ddrawimage
this.scoreCanvas = null;
    
//CANVAS

//MOUSE
this.mouseX = 250;
this.mouseY = 100;

this.mouseX2 = 250;
this.mouseY2 = 100;

this.keySpace = false;
this.keyW = false;
this.isTyping = false;

this.timestamp = +new Date;

this.canvas.width = this.screenWidth; this.canvas.height = this.screenHeight;
}

Client.prototype = {
connect: function() {
this.ws            = new WebSocket(this.serverAdress)
this.ws.onopen     = this.onConnect.bind(this);
this.ws.onmessage  = this.onMessage.bind(this);
this.ws.onclose    = this.onDisconnect.bind(this);
//this.ws.onerror    = this.onError.bind(this);
},

sendWebSocket: function (object) {
    this.ws.send(JSON.stringify(object));
},

reset: function () {
    this.mouseX2 = (this.mouseX - this.screenWidth / 2) / this.ratio + this.px;
    this.mouseY2 = (this.mouseY - this.screenHeight / 2) / this.ratio + this.py;
},

sendNewName: function (newName) {
	this.sendWebSocket({type: "Name", name: newName})
},

    initializeInputCapture: function() {
        window.onkeydown   = this.onKeyDown.bind(this);
        window.onkeyup     = this.onKeyUp.bind(this);
//this.canvas.addEventListener('mousemove', this.getMousePos, false);
        this.canvas.addEventListener('mousemove', this.getMousePos.bind(this), false);
    },

getMousePos: function (evt) {
    this.mouseX = evt.clientX;
    this.mouseY = evt.clientY;
    this.reset();
    this.sendWebSocket({type: "Coord", x: this.mouseX2, y: this.mouseY2});
},

onConnect: function() {
    var client = this;
    this.initializeInputCapture();
    //this.sendWebSocket({type: "JoinRoom", idRoom: this.idRoom, name: this.client_name});
    this.sendWebSocket({type: "JoinRoom", idRoom: this.idRoom});
    this.animloop();
},

onDisconnect: function() {
    this.ws.close();
},

drawTotalScore: function() {
	this.scoreCanvas = null;
	this.scoreCanvas = document.createElement("canvas");
    var ctx = this.scoreCanvas.getContext("2d");
    this.scoreCanvas.width = 500;
    this.scoreCanvas.height = 30;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#add8e6";
    ctx.font = "30px Ubuntu";
    ctx.fillText("YOUR SCORE: " + this.totalScore, 0, 30);
},
    drawLeaderBoard: function () {
        this.lbCanvas = null;
        if (0 != this.leaderBoard.length) {
            this.lbCanvas = document.createElement("canvas");
            var ctx = this.lbCanvas.getContext("2d");
            var boardLength = 60;
            boardLength = boardLength + 24 * this.leaderBoard.length;
            //var scaleFactor = Math.min(0.22*canvasHeight, Math.min(200, .3 * canvasWidth)) / 200;
            var scaleFactor = Math.min(200, 0.3 * this.canvas.width) / 200;
            this.lbCanvas.width = 200 * scaleFactor;
            this.lbCanvas.height = boardLength * scaleFactor;


            ctx.scale(scaleFactor, scaleFactor);
            ctx.globalAlpha = .4;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 200, boardLength);

            ctx.globalAlpha = 1;
            ctx.fillStyle = "#FFFFFF";
            var c = "TOP 10";
            ctx.font = "30px Ubuntu";
            ctx.fillText(c, 100 - ctx.measureText(c).width / 2, 40);
            var b;
            //writeToScreen("Po leadeboard napis")

            for (ctx.font = "20px Ubuntu", b = 0; b < this.leaderBoard.length; ++b) {
                c = this.leaderBoard[b].name || "An unnamed cell";
                if (-1 != this.my_balls.indexOf(this.leaderBoard[b].id)) {
                    if (this.balls.hasOwnProperty(this.my_balls[this.leaderBoard[b].id].id)) {
                        this.balls[this.my_balls[0].id].name && (c = this.balls[this.my_balls[0].id].name);
                    }
                    ctx.fillStyle = "#FFAAAA";
                    c = b + 1 + ". " + c;
                    //}
                    ctx.fillText(c, 100 - ctx.measureText(c).width / 2, 70 + 24 * b);
                } else {
                    ctx.fillStyle = "#FFFFFF";
                    c = b + 1 + ". " + c;
                    ctx.fillText(c, 100 - ctx.measureText(c).width / 2, 70 + 24 * b);
                }
            }

        }
    },

onMessage: function(evt) {
    var coordinate_x;
    var coordinate_y;
    var size;
    var r;
    var g;
    var b;
    data = JSON.parse(evt.data);
    if (data.type === "modf") {
        for (var i = 0; i < data.toRemoveData.length; i++) {
            var id = data.toRemoveData[i];
            if (this.balls.hasOwnProperty(id))
                this.balls[id].destroy();
        }

        var toUpdate = data.toUpdateData;
        for (var j in toUpdate) {
            if (toUpdate.hasOwnProperty(j)) {
                var ballId = toUpdate[j].id;

                var ball;
                var colorstr = (toUpdate[j].R << 16 | toUpdate[j].G << 8 | toUpdate[j].B).toString(16);
                colorstr = '#' + ('000000' + colorstr).substr(-6);

                if (this.balls.hasOwnProperty(ballId)) {
                    ball = this.balls[ballId];
                    ball.updatePos();
                    ball.old_x = ball.x;
                    ball.old_y = ball.y;
                    ball.old_size = ball.size;
                    ball.update();

                    ball.new_x = toUpdate[j].x;
                    ball.new_y = toUpdate[j].y;
                    ball.new_size = toUpdate[j].size;
                } else {
                    ball = new Ball(this, toUpdate[j].id, toUpdate[j].x, toUpdate[j].y, toUpdate[j].size, toUpdate[j].eType, toUpdate[j].name);
                }
                ball.color = colorstr;
            }
        }

        //writeToScreen("po update")
    } else if (data.type === 'myId') {
        //writeToScreen("Przyszlo mid")
        //writeToScreen(data.nId)
        this.my_balls.push(data.nId);
        if (this.balls.hasOwnProperty(data.nId)) {
            this.px = this.balls[data.nId].x;
            this.py = this.balls[data.nId].y;
        }
        //writeToScreen("Wszystkie moje kulki po dodaniu ")
        //writeToScreen(this.my_balls);
        //build();
    } else if (data.type === 'spawnMyFirstCell') {
    	 this.totalScore = 0;
    	 this.my_balls = [];
    	 this.my_balls.push(data.firstCellId);
         if (this.balls.hasOwnProperty(data.firstCellId)) {
             this.px = this.balls[data.firstCellId].x;
             this.py = this.balls[data.firstCellId].y;
         }  
    } else if (data.type === 'showEndMenu') {
    	document.getElementById("score").innerHTML = "YOUR SCORE: " + data.score;
        $("#endMenu").show();
    } else if (data.type === 'newScore') {
    	console.log("New Score " + data.score)
    	this.totalScore = data.score; 
    	this.drawTotalScore();
    } else if (data.type === "nLb") {
        this.leaderBoard = [];

        var newLB = data.lB
        for (var k in newLB) {
            if (newLB.hasOwnProperty(k)) {
                this.leaderBoard.push({
                    id: newLB[k].id,
                    name: newLB[k].name
                })
            }
        }
        this.drawLeaderBoard();
    }

    this.reset();
    this.sendWebSocket({type: "Coord", x: this.mouseX2, y: this.mouseY2});

//writeToScreen("poOnMessage") */
//context.restore()
},

onKeyDown: function (event) {
    switch (event.keyCode) {
        case 32: // split
            if ((!this.keySpace) && (!this.isTyping)) {
                this.reset();
                this.sendWebSocket({type: "Coord", x: this.mouseX2, y: this.mouseY2});
                this.sendWebSocket({type: "space"});
                this.keySpace = true;
            }
            break;
        case 87: // eject mass
            if ((!this.keyW) && (!this.isTyping)) {
                this.sendWebSocket({type: "Coord", x: this.mouseX2, y: this.mouseY2});
                this.sendWebSocket({type: "w"});
                this.keyW = true;
            }
        case 27: 
            $("#endMenu").toggle();
    }
},

onKeyUp: function (event) {
    switch (event.keyCode) {
        case 32:
            this.keySpace = false;
            break;
        case 87:
            this.keyW = false;
            break;
    }
},

draw: function () {
	//writeToScreen("draw poczatek");
    this.timestamp = +new Date;
    if (0 < this.my_balls.length) {
        this.build();
        var w = 0;
        var d = 0;
        var i = 0;

        var counter  = 0
        for (;i < this.my_balls.length;i++) {
        	//writeToScreen("my ball id petla for");
            if (this.balls.hasOwnProperty(this.my_balls[i])) {
            	counter = counter + 1;
                this.balls[this.my_balls[i]].updatePos();
                w += this.balls[this.my_balls[i]].x / this.my_balls.length;
                d += this.balls[this.my_balls[i]].y / this.my_balls.length;
            }
        }
        if (counter === this.my_balls.length) {
        this.px = w;
        this.py = d;

        this.px = (this.px + w) / 2;
        this.py = (this.py + d) / 2;
        }
    }

    this.reset();
    this.context.clearRect(0, 0, this.screenWidth, this.screenHeight);
    this.context.fillStyle = "#F2FBFF";
    this.context.fillRect(0, 0, this.screenWidth, this.screenHeight);
    this.context.save();
    this.context.strokeStyle = "#000000";
    this.context.globalAlpha = 0.2;
    this.context.scale(this.ratio, this.ratio);

    w = this.screenWidth / this.ratio;
    d = this.screenHeight / this.ratio;

    i = -0.5 + ( w / 2 -this.px) % 50;
    for (;i < w;i += 50) {
        this.context.beginPath();
        this.context.moveTo(i, 0);
        this.context.lineTo(i, d);
        this.context.stroke();
    }
    i = -0.5 + (-this.py + d / 2) % 50;
    for (;i < d;i += 50) {
        this.context.beginPath();
        this.context.moveTo(0, i);
        this.context.lineTo(w, i);
        this.context.stroke();
    }
    this.context.restore();

//items.sort(function(a, b) {
//return a.size == b.size ? a.id - b.id : a.size - b.size;
//});
    this.context.save();
    this.context.translate(this.screenWidth / 2, this.screenHeight / 2);
    this.context.scale(this.ratio, this.ratio);
    this.context.translate(-this.px, -this.py);
    this.context.globalAlpha = 1;
    var ball;
    //writeToScreen("draw przed for ball")
    for(ball in this.balls) {
        if(this.balls.hasOwnProperty(ball)) {
        this.balls[ball].updatePos();
        this.balls[ball].draw();
        }
    }


    this.context.restore();

    if (this.lbCanvas) {
        this.context.drawImage(this.lbCanvas, this.canvas.width - this.lbCanvas.width - 10, 10); }
    
    if (this.scoreCanvas) {
        this.context.drawImage(this.scoreCanvas, 10, this.canvas.height - this.scoreCanvas.height - 10); }
},

build: function () {
    var score = 0;
    var minMass = 10000000;
    for (var i = 0; i < this.my_balls.length; i++) {
        var ballId  = this.my_balls[i];
        if (this.balls.hasOwnProperty(ballId)) {
            score += this.balls[this.my_balls[i]].size;
            if(minMass > this.balls[this.my_balls[i]].size){
                minMass = this.balls[this.my_balls[i]].size;
            }
        }
    }
    score = Math.pow(Math.min(64 / score, 1), 0.4) * Math.max(this.screenHeight / 1080, this.screenWidth / 1920);
    this.ratio = (9 * this.ratio + score) / this.screenRenderSize ;
},

mainLoop: function () {
    this.draw();
    //drawLeaderBoard()
},

animloop: function () {
    var animLoopHandle = window.requestAnimFrame(this.animloop.bind(this));
    this.mainLoop();
},

playAsGuest: function () {
    this.connect();
},

RGB2HTML: function (red, green, blue)
{
    var decColor =0x1000000+ blue + 0x100 * green + 0x10000 *red ;
    return '#'+decColor.toString(16).substr(1);
}

};

function Ball(client, id, newX, newY, newSize, newType, newName) {
if(client.balls[id]) return client.balls[id];

//this.id    = id;
//this.name  = null;
//this.x = this.old_x = this.new_x = newX;
//this.y = this.old_y = this.new_y = newY;
//this.size = this.old_size = this.new_size = newSize;
//this.mass  = 0;

this.id    = id;
this.name  = null;
this.x   = newX;
this.y   = newY;
this.size  = newSize;
this.mass  = 0;

this.old_x = newX;
this.old_y = newY;
this.old_size = newSize;
this.new_x = newX;
this.new_y = newY;
this.new_size = newSize;

this.virus = false
this.mine  = false;
this.color = 0;

this.client      = client;
this.destroyed   = false;
this.visible     = false;
this.last_update = (+new Date);
this.update_tick = 0;
this.points      = []

    this.ballType = newType;
    this.nameCache = null;
    if (this.ballType === 0) {this.setName(newName); }

client.balls[id] = this;
return this;
}

Ball.prototype = {
destroy: function() {
    delete this.client.balls[this.id];
    var mine_ball_index = this.client.my_balls.indexOf(this.id);
    if(mine_ball_index > -1) {
        //writeToScreen("Do usuniecia ID");
        //writeToScreen(this.id);
        this.client.my_balls.splice(mine_ball_index, 1);
        //writeToScreen("Wszystkie moje kulki po odjeciu")
        //writeToScreen(this.client.my_balls)
    }
},

setCords: function(new_x, new_y) {
    //if(this.x == new_x && this.y == new_y) return;
    this.old_x = this.x;
    this.old_y = this.y;
    this.new_x = new_x;
    this.new_y = new_y;
},

setSize: function(new_size) {
    if(this.size == new_size) return;
    this.old_size = this.size;
    this.new_size = new_size;
    this.mass     = parseInt(Math.pow(new_size/10, 2));
},

    getNameSize : function() {
        return Math.max(~~(0.3 * this.size), 24);
    },

    setName : function(name) {
        if (this.name = name) {
            if (null == this.nameCache) {
                this.nameCache = new SVGPlotFunction(this.getNameSize(), "#FFFFFF", true, "#000000");
            } else {
                this.nameCache.setSize(this.getNameSize());
            }
            this.nameCache.setValue(this.name);
        }
    },

update: function() {
    var old_time     = this.last_update;
    this.last_update = (+new Date);
},

appear: function() {
    if(this.visible) return;
    this.visible = true;
},

disappear: function() {
    if(!this.visible) return;
    this.visible = false;
},

    updatePos : function() {
        var A;
        A = (this.client.timestamp - this.last_update) / 150;
        A = 0 > A ? 0 : 1 < A ? 1 : A;

        var getNameSize = this.getNameSize();
        this.x = A * (this.new_x - this.old_x) + this.old_x;
        this.y = A * (this.new_y - this.old_y) + this.old_y;
        this.size = A * (this.new_size - this.old_size) + this.old_size;
        return A;
    },

    getNumPoints: function() {
      return 60;
    },

draw: function() {
    this.updatePos();



    if (this.ballType === 2) {
        var numOfPoints = this.getNumPoints();
        var y = 2 * Math.PI / numOfPoints;
        var v = this.size
        this.client.context.lineJoin = "miter"
        this.client.context.lineWidth = 10;
        this.client.context.lineCap = "round";
        this.client.context.fillStyle = this.color;
        this.client.context.strokeStyle = this.color;
        this.client.context.beginPath();

        this.client.context.moveTo(this.x + Math.cos(0) * v, this.y + Math.sin(0) * v);
        for (var i = 1; i < numOfPoints; i++) {
            if (1 == i % 2) {
                v += 5;
            }
            else {
                v -= 5;
            }
            this.client.context.lineTo(this.x + Math.cos(y * i) * v, this.y + Math.sin(y * i) * v);
        }
        this.client.context.fill();
        this.client.context.closePath();
        this.client.context.stroke()
    } else if (this.ballType === 0){
        this.client.context.beginPath();
        this.client.context.lineJoin = "round"
        this.client.context.lineWidth = 10;
        this.client.context.lineCap = "round";
        this.client.context.fillStyle = this.color;
        this.client.context.strokeStyle = this.color;
        this.client.context.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
        this.client.context.fill();
        this.client.context.closePath();
        this.client.context.stroke()
        var src = ~~this.y;
            if (this.name) {
                if (this.nameCache) {
                    this.client.context.save();
                    //writeToScreen("Po this name cache")
                    this.nameCache.setSize(this.getNameSize());
                    var i = this.nameCache.render();
                     //writeToScreen("Po this name cache render")
                    this.client.context.drawImage(i, ~~this.x - ~~(i.width / 2), src - ~~(i.height / 2));
                    src += i.height / 2 + 4;
                    this.client.context.restore();
                }
            }
    } else {
        this.client.context.beginPath();
        this.client.context.lineJoin = "round"
        this.client.context.lineWidth = 10;
        this.client.context.lineCap = "round";
        this.client.context.fillStyle = this.color;
        this.client.context.strokeStyle = this.color;
        this.client.context.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
        this.client.context.fill();
        this.client.context.closePath();
        this.client.context.stroke()
    }
},

toString: function() {
    if(this.name) return this.id + '(' + this.name + ')';
    return this.id.toString();
}
};

function SVGPlotFunction(n, Var, stroke, plot) {
    if (n) {
        this._size = n;
    }
    if (Var) {
        this._color = Var;
    }
    this._stroke = stroke;
    if (plot) {
        this._strokeColor = plot;
    }
}

SVGPlotFunction.prototype = {
    _value : "",
    _color : "#000000",
    _stroke : false,
    _strokeColor : "#000000",
    _size : 16,
    _canvas : null,
    _ctx : null,
    _dirty : false,
    _scale : 1,
    setSize : function(size) {
        if (this._size != size) {
            this._size = size;
            this._dirty = true;
        }
    },
    setColor : function(color) {
        if (this._color != color) {
            this._color = color;
            this._dirty = true;
        }
    },
    setStroke : function(stroke) {
        if (this._stroke != stroke) {
            this._stroke = stroke;
            this._dirty = true;
        }
    },
    setStrokeColor : function(b) {
        if (this._strokeColor != b) {
            this._strokeColor = b;
            this._dirty = true;
        }
    },
    setValue : function(value) {
        if (value != this._value) {
            this._value = value;
            this._dirty = true;
        }
    },
    render : function() {
        if (null == this._canvas) {
            this._canvas = document.createElement("canvas");
            this._ctx = this._canvas.getContext("2d");
        }
        if (this._dirty) {
            this._dirty = false;
            var canvas = this._canvas;
            var ctx = this._ctx;
            var mass = this._value;
            var scale = this._scale;
            var fontSize = this._size;
            var font = fontSize + "px Ubuntu";
            ctx.font = font;
            var parentWidth = ctx.measureText(mass).width;
            var PX = ~~(0.2 * fontSize);
            canvas.width = (parentWidth + 6) * scale;
            canvas.height = (fontSize + PX) * scale;
            ctx.font = font;
            ctx.scale(scale, scale);
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
            //ctx.strokeStyle = this._strokeColor;
            ctx.fillStyle = this._color;
            //if (this._stroke) {
            //    ctx.strokeText(mass, 3, fontSize - PX / 2);
            //}
            ctx.fillText(mass, 3, fontSize - PX / 2);
        }
        return this._canvas;
    }
};


function writeToScreen(message) {
	var pre = document.createElement("p");
	var status = document.getElementById("status");
	pre.style.wordWrap = "break-word";
	pre.innerHTML = message + " " + new Date();
	status.appendChild(pre);
	}

	window.requestAnimFrame = (function() {
	return  window.requestAnimationFrame       ||
	    window.webkitRequestAnimationFrame ||
	    window.mozRequestAnimationFrame    ||
	    window.msRequestAnimationFrame     ||
	    function( callback ) {
	        window.setTimeout(callback, 1000 / 50);
	    };
	})();

	window.cancelAnimFrame = (function(handle) {
	return  window.cancelAnimationFrame     ||
	    window.mozCancelAnimationFrame;
	})();




