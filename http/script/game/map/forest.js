var Forest = function() {
	
	// Atmosphere sound
	this.sound = S.map_forest;
	
	this.groundColor = "#2a6800";
	this.groundTexture = T.forest;
	this.obstaclesSmall = [T.forest_rock_small, T.forest_rock_small, T.mushroom];
	this.obstaclesBig = [T.forest_rock, T.stump, T.stump];
	T.stump.offset = 1.1;
	T.mushroom.offset = 1.3;
	
	this.drawDecor = function(ctx) {
		
		var leafs = [T.leaf, T.leaf2, T.leaf3, T.leaf4];
		
		var num = 500 + Math.random() * 500;
		
		for (i = 0; i < num; i++) {
			
			var texture = leafs[Math.floor(Math.random() * leafs.length)];
			var scale = 0.4 + Math.random() * 2.1;
			var padding = Math.max(texture.width * scale, texture.height * scale) / 2;
			
			var x = padding + Math.random() * (game.ground.realGridWidth - 2 * padding);
			var y = padding + Math.random() * (game.ground.realGridHeight - 2 * padding);
			var angle = Math.random() * 2 * Math.PI;
			
			ctx.save();
			ctx.translate(x, y);
			ctx.scale(scale, scale);
			ctx.rotate(angle);
			ctx.drawImage(texture, 0, 0);
			ctx.restore();
		}
	}
}
