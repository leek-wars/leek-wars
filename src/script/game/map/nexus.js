var Nexus = function() {
	
	// Atmosphere sound
	this.sound = S.map_nexus;
	
	this.groundColor = "#fff";
	this.groundTexture = T.nexus_bg;
	this.obstaclesSmall = [T.nexus_block_small, T.nexus_block_small, T.nexus_block_small];
	this.obstaclesBig = [T.nexus_block, T.nexus_block, T.nexus_block];
	T.nexus_block.offset = 1.15;
	T.nexus_block_small.offset = 1.15;
	
	this.drawDecor = function(ctx) {
		
		
	}
	
	
}
