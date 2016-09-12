var Glacier = function() {
	
	this.groundColor = "#2effff";
	this.groundTexture = T.glacier;
	this.obstaclesSmall = [T.ice_small, T.ice_small, T.ice_small];
	this.obstaclesBig = [T.snowman, T.fir, T.ice];
	
	T.fir.offset = 1.5;
	T.snowman.offset = 0.8;
	
	this.drawDecor = function(ctx) {
		
		
	}
	
}
