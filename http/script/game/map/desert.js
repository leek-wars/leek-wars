var Desert = function() {
	
	this.groundColor = "#ffc000";
	this.groundTexture = T.desert;
	this.obstaclesSmall = [T.desert_rock2_small, T.desert_grass, T.cactus];
	this.obstaclesBig = [T.desert_rock1_big, T.desert_rock2_big, T.desert_rock3_big];
	T.cactus.offset = 2.0;
	T.desert_grass.offset = 2.0;
	
	this.drawDecor = function(ctx) {
		
		var num = 3 + Math.random() * 3;
		
		for (i = 0; i < num; i++) {
			
			var scale = Math.random() + 0.5;
			var padding = Math.max(T.skull.width * scale, T.skull.height * scale) / 2;
			var x = padding + Math.random() * (game.ground.realGridWidth - 2 * padding);
			var y = padding + Math.random() * (game.ground.realGridHeight - 2 * padding);
			var angle = Math.random() * 2 * Math.PI;
			
			ctx.save();
			ctx.translate(x, y);
			ctx.scale(scale, scale);
			ctx.rotate(angle);
			ctx.drawImage(T.skull, 0, 0);
			ctx.restore();
		}
	}
}
