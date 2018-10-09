//Bullet Class//
/** @function Bullet
  * Constructor to the Bullet Object 
  * @param {integer} x - x-coordinate of bullet
  * @param {integer} y - y-coordinate of bullet
  * @param {integer} radius - radius of the bullet
  * @param {float} velocity - the velocity of bullet
  * @param {float} angle - the angle of trajectory
  */
function Bullet(x, y,radius, velocity, angle){
	this.x = x-5;
	this.y = y+5;
	this.radius = radius;
	this.velocity = velocity;
	this.angle = angle;
}

/** @function update
  * Updates position of Bullet on canvas
  * @param {double} deltaT - the total change in time 
  */
Bullet.prototype.update = function(deltaT) {
	var x_vector = this.velocity*Math.cos(this.angle);
	var y_vector = this.velocity*Math.sin(this.angle);
	this.x += deltaT * x_vector;
	this.y += deltaT * y_vector;
}

/** @function render
  * Draws bullet on canvas
  * @param {canvas} context - canvas being drawn to
  */
Bullet.prototype.render = function(context){
	context.beginPath();
	context.fillStyle = 'white'
	context.arc(this.x + this.radius, this.y - this.radius, 2*this.radius, 2*this.radius, 0, 2*Math.PI);
	context.fill();
	context.closePath();
}