//Screen Dimensions//
const WIDTH = 740;
const HEIGHT = 580;

//Screen//
var screen = document.createElement('canvas');
var screenCtx = screen.getContext('2d');
screen.height = HEIGHT;
screen.width = WIDTH;
document.body.appendChild(screen);

//BackBuffer//
var backBuffer = document.createElement('canvas');
var backBufferCtx = screen.getContext('2d');
backBuffer.height = HEIGHT;
backBuffer.width = WIDTH;

//Global Variables//
var start = null;
var clearLevelFlag = true;
var gameOverFlag = false;
var level = 1;
var score = 0;
var currentInput = {
	space: false,
	up: false,
	left: false,
	right: false,
}
var priorInput = {
	space: false,
	up: false,
	left: false,
	right: false,
}

//Sprites//
var bullets = [];
var asteroids = [];
var player = new Player(WIDTH/2, HEIGHT/2); 
var lives = 3;
var dead = false;

//Sounds//
var laser = new Sound("Laser_Shoot.wav");
var collision = new Sound("Hit_Hurt.wav");
var death = new Sound("Game_Over.wav");
var explosion = new Sound("Explosion.wav");

/** @function handleKeydown
  * Event handler for keydown events
  * @param {KeyEvent} event - the keydown event
  */
function handleKeydown(event) {
	switch(event.key){
		case ' ':
			currentInput.space = true;
			break;
		case 'w':
			currentInput.up = true;
			break;
		case 'a':
			currentInput.left = true;
			break;
		case 'd':
			currentInput.right = true;
			break;
	}
}
window.addEventListener('keydown', handleKeydown ); 

/** @function handleKeyup
  * Event handler for keyup events
  * @param {KeyEvent} event - the keyup event
  */
function handleKeyup(event) {
	switch(event.key){
		case ' ':
			currentInput.space = false;
			break;
		case 'w':
			currentInput.up = false;
			break;
		case 'a':
			currentInput.left = false;
			break;
		case 'd':
			currentInput.right = false;
			break;
	}
}  
window.addEventListener('keyup', handleKeyup );

/** @function copyInput
  * Copies the current input into the previous input
  */
function copyInput() {
	priorInput = JSON.parse(JSON.stringify(currentInput));
}

/** @function loop
  * The main game loop
  * @param {DomHighResTimestamp} timestamp - the current system time
  */
function loop(timestamp){	
	if(!start) {
		start = timestamp;		
		player.render(backBufferCtx);
	}
	var elaspedTime = timestamp - start;
	start = timestamp;
	update(elaspedTime);
	render(backBufferCtx);
	screenCtx.drawImage(backBuffer, 0, 0);
	copyInput();
	window.requestAnimationFrame(loop);
}

/** @function gameOver
  * Renders endgame screen
  * @param {canvas} Ctx - canvas being drawn to
  */
function gameOver(Ctx){
	Ctx.fillStyle = 'white';
	Ctx.font = '20 px Ariel white'
	Ctx.fillText('GAME OVER!  FINAL SCORE:  ' + score, WIDTH/2 - 120, HEIGHT/2); 
}

/** @function update
  * Updates the game's state
  * @param {double} elapsedTime - the amount of time elapsed between frames
  */
function update(elaspedTime){
	if(!gameOverFlag) {
		if(currentInput.up){
			player.update(elaspedTime, 0, 0.2);
		}	
		if(currentInput.left && !currentInput.up){
			player.update(elaspedTime, -0.1, 0);
		}
		if(currentInput.right && !currentInput.up){
			player.update(elaspedTime, 0.1, 0);
		}
		if(currentInput.space && !priorInput.space && !dead) {
			bullets.push(new Bullet(player.x, player.y, 2, 0.5, player.angle));
			laser.play();
		}	
		asteroids.forEach(function(asteroid,index){
			asteroid.update(elaspedTime);
		});
		bullets.forEach(function(bullet, index){
			bullet.update(elaspedTime);
			if(bullet.y < 0 || bullet.y > HEIGHT || bullet.x < 0 || bullet.x > WIDTH){ bullets.splice(index, 1);}
		});
		
		if(!dead){detectPlayerCollision();}
		detectAsteroidCollision()
		detectBulletCollision();
	}
}

/** @function render
  * Renders the game into the canvas
  * @param {} Ctx - context that render is drawing to.
  */
function render(Ctx){
	Ctx.clearRect(0, 0, WIDTH, HEIGHT);	
	Ctx.moveTo(0,0);
	Ctx.font = '15px Ariel';
	Ctx.fillText("Level: " + level + "          Lives: " +lives + "          Score: " + score + "          Asteroids: " +asteroids.length + "", 20, 50 );	
	Ctx.fillStyle = 'white';
	Ctx.closePath();	
	if(gameOverFlag){
		gameOver(Ctx);
	} else {
		if(clearLevelFlag){
			var numOfAsteroids = level + 4;
			for(var i = 0; i < numOfAsteroids; i++){
				addAsteroid();
			}
			clearLevelFlag = false;		
		}	
		if(!dead){	player.render(Ctx); }
		bullets.forEach(function(bullet){ bullet.render(Ctx);});
		asteroids.forEach(function(asteroid){ asteroid.render(Ctx);});
		if(asteroids.length == 0){ 
			level++;
			clearLevelFlag = true;
		}
	}
}

/** @function addAsteroid
  * Constructs a new asteroid object and randomly assigns it a position on the canvas. Then adds asteroid to
  * array of asteroids.
  */
function addAsteroid(){
	var x_pos = Math.floor(Math.random() * (WIDTH) );
	if( Math.abs(x_pos - WIDTH/2) <= 100) { x_pos +=100; } 
	var y_pos = Math.floor(Math.random() * (HEIGHT) );
	if( Math.abs(y_pos - HEIGHT/2) <= 100) { y_pos +=100; }
	var radius = Math.floor(Math.random() * 10) + (level*10);	
	var velocity = Math.floor(Math.random()) + 0.1;
	var angle = Math.floor(Math.random() * 360);
	var mass = Math.floor(Math.random() * 100);
	asteroids.push(new Asteroid(x_pos, y_pos, radius, velocity, angle, mass));
}


/** @function detectCollision
  * Detects a collision between a player's bullet and an asteroid. Removes bullet and asteroid from
  * screen if their is a collision detected.
  */
function detectBulletCollision(){
	for(var j = 0; j < bullets.length; j++){
		for(var i = 0; i < asteroids.length; i++){	
			var tempAsteroid = asteroids[i];			
			var distSquared = Math.pow(tempAsteroid.x - bullets[j].x, 2) + Math.pow(tempAsteroid.y - bullets[j].y, 2);
			if(distSquared <= Math.pow(tempAsteroid.radius + bullets[j].radius,2)){
				console.log('Collision!');
				bullets.splice(j, 1);
				asteroids.splice(i,1);
				if(tempAsteroid.radius > 10){
					var tempMass = tempAsteroid.mass/2;
					var tempVelocity = (tempAsteroid.mass*tempAsteroid.velocity) / tempMass;
					asteroids.splice(i, 0, new Asteroid(tempAsteroid.x+5, tempAsteroid.y+5, tempAsteroid.radius/2, tempVelocity, tempAsteroid.angle, tempMass), new Asteroid(tempAsteroid.x-5, tempAsteroid.y-5, tempAsteroid.radius/2, -tempVelocity, tempAsteroid.angle, tempMass));
				} 
				score += 10;
				explosion.play();
				return;
			} 		
		}
	}
}

/** @function detectAsteroidCollision
  * Detects a collision between two asteroids. Asteroids deflect off of one another.
  */
function detectAsteroidCollision(){
	for(var i = 0; i < asteroids.length-1; i++){	
		for(var j = i+1; j < asteroids.length; j++){
			var distSquared = Math.pow(asteroids[i].x - asteroids[j].x, 2) + Math.pow(asteroids[i].y - asteroids[j].y, 2);
			if(distSquared <= Math.pow(asteroids[i].radius + asteroids[j].radius,2)){
				//console.log('asteroid collision');	
				var thetai = asteroids[i].angle;
				var thetaj = asteroids[j].angle;
				
				var phi = Math.atan2(asteroids[j].y - asteroids[i].y, asteroids[j].x - asteroids[i].x);
				
				var massi = asteroids[i].mass;
				var massj = asteroids[j].mass;
				var velocityi = asteroids[i].velocity;
				var velocityj = asteroids[j].velocity;
				
				var dxi = (velocityi * Math.cos(thetai - phi) * (massi-massj) + 2*massj*velocityj*Math.cos(thetaj - phi)) / (massi+massj) * Math.cos(phi) + velocityi*Math.sin(thetai-phi) * Math.cos(phi+Math.PI/2);
				var dyi = (velocityi * Math.cos(thetai - phi) * (massi-massj) + 2*massj*velocityj*Math.cos(thetaj - phi)) / (massi+massj) * Math.sin(phi) + velocityi*Math.sin(thetai-phi) * Math.sin(phi+Math.PI/2);
				
				var dxj = (velocityj * Math.cos(thetaj - phi) * (massj-massi) + 2*massi*velocityi*Math.cos(thetai - phi)) / (massi+massj) * Math.cos(phi) + velocityj*Math.sin(thetaj-phi) * Math.cos(phi+Math.PI/2);
                var dyj = (velocityj * Math.cos(thetaj - phi) * (massj-massi) + 2*massi*velocityi*Math.cos(thetai - phi)) / (massi+massj) * Math.sin(phi) + velocityj*Math.sin(thetaj-phi) * Math.sin(phi+Math.PI/2);
				
				asteroids[i].x_vector = dxi;
				asteroids[i].y_vector = dyi;
				
				asteroids[j].x_vector = dxj;
				asteroids[j].y_vector = dyj;
			}
		}
	}
}

/** @function detectPlayerCollision
  * Detects a collision between a player and an asteroid. Removes player and asteroid from
  * screen and decrements player's number of lives by one.
  */
function detectPlayerCollision(){
	for(var i = 0; i < asteroids.length; i++){
		var rx = asteroids[i].x.clamp(player.x, player.x + player.width);
		var ry = asteroids[i].y.clamp(player.y, player.y + player.length);
		var distSquared = Math.pow(rx - asteroids[i].x, 2) + Math.pow(ry - asteroids[i].y, 2); 
		if(distSquared <= Math.pow(asteroids[i].radius, 2)){
			console.log('Collision!');
			asteroids.splice(i, 1);
			lives -= 1;	
			dead = true;
			if(lives <= 0){
				gameOverFlag=true;
				death.play();
				return;
			}
			setTimeout(function(){	dead = false; player.x = WIDTH/2; player.y = HEIGHT/2;}, 2000);
			collision.play();
			i=0;			
		} 
	}
}

/** @function clamp
  * Clamps the x and y coordinates of a circle to bounds defined by the sides of a rectangle
  * @Param {integer} min - The lower boundary
  * @Param {integer} max - The upper boundary
  * @returns A number between min and max
  */
Number.prototype.clamp = function(min, max) {	
  return Math.min(Math.max(this, min), max);
};

//Sound Class//
/** @function Sound 
  * Constructor to a sound object 
  * @param {pathway/file address} src - location/pathway to audio file storing sound
  */
function Sound(src){
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
	this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

window.requestAnimationFrame(loop);