var BULLET = 0;
var SHOT = 1;
var CARTRIDGE = 2;
var LASER = 3;
var BLOOD = 4;
var LIGHTNING = 5;
var FIRE = 6;
var GAZ = 7;
var GRENADE = 8;
var EXPLOSION = 9;
var GARBAGE = 10;
var IMAGE = 11;
var METEORITE = 12;
var RECTANGLE = 13;

var Particle = function(type, x, y, z) {
	
	this.type = type;
	this.texture;
	
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.dx = 0;
	this.dy = 0;
	this.dz = 0;
	
	this.angle = 0;
	this.rotation = 0;

	this.life = 0;
	this.totalLife = 0;
	
	this.width = 0;
	
	this.vertices;
	
	this.targets;
	this.success;
}
