var Beach = function() {
	
	// Atmosphere sound
	this.sound = S.map_beach;
	
	this.groundColor = "#ffff52";
	this.groundTexture = T.beach;
	this.obstaclesSmall = [T.starfish, T.starfish2, T.palm];
	this.obstaclesBig = [T.pebble, T.pebble, T.pebble];
	T.starfish.offset = 1.2;
	T.starfish2.offset = 1.2;
	T.palm.offset = 4.0;
	
	this.drawDecor = function(ctx) {
		
		
	}
	
}
