var Factory = function() {
	
	// Atmosphere sound
	this.sound = S.map_factory;
	
	this.groundColor = "#8C8C8C";
	this.groundTexture = T.factory;
	this.obstaclesSmall = [T.box, T.barrel, T.cone];
	this.obstaclesBig = [T.big_box, T.big_box, T.cone_big];
	T.barrel.offset = 1.0;
	T.cone.offset = 1.15;
	T.box.offset = 1.2;
	
	this.drawDecor = function(ctx) {
		
		
	}
	
	
}
