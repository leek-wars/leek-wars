/*
 * Classe Obstacle
 */
var Obstacle = function(type, size, cell) {

	// Get original texture
	var textureType = size == 2 ? game.map.obstaclesBig : game.map.obstaclesSmall;
	var texture = textureType[type];
	// if (Math.random() > 0.7) texture = T.pumpkin
		
	// Caractéristiques
	this.size = size;
	this.type = type;
	this.inverse = texture.inverse && Math.random() > 0.5;

	// Position
	var pos = game.ground.cellToXY(cell);
	this.x = pos.x;
	this.y = pos.y;
	
	// Offset
	var offset = 1;
	if (texture.offset) {
		offset = texture.offset;
	}
	
	this.resize = function() {
		
		// Create the cache texture
		if (size == 1) {
			
			var scale = (game.ground.tileSizeY * 1.7 * offset) / texture.width;
			
			this.realWidth = Math.round(texture.width * scale);
			this.realHeight = Math.round(texture.height * scale);
			
			this.realX = Math.round((this.x / 2) * game.ground.tileSizeX + (game.ground.tileSizeX - this.realWidth) / 2);
			this.realY = Math.round((this.y / 2 + 1) * game.ground.tileSizeY - this.realHeight + 5);
			
			this.cellX = ((this.x + 1) / 2) * game.ground.tileSizeX;
			this.cellY = ((this.y + 1) / 2) * game.ground.tileSizeY;
			
			this.texture = _createScaledTexture(texture, this.realWidth, this.realHeight, this.inverse);
			
		} else if (size == 2) {
			
			var scale = (game.ground.tileSizeY * 3.4 * offset) / texture.width;
			
			this.realWidth = Math.round(texture.width * scale);
			this.realHeight = Math.round(texture.height * scale);
			
			this.realX = Math.round(((this.x - 1) / 2) * game.ground.tileSizeX + (game.ground.tileSizeX * 2 - this.realWidth) / 2);
			this.realY = Math.round(((this.y + 3) / 2) * game.ground.tileSizeY - this.realHeight + 17);
			
			this.cellX = ((this.x + 1) / 2) * game.ground.tileSizeX;
			this.cellY = (this.y / 2 + 1) * game.ground.tileSizeY;
			
			this.texture = _createScaledTexture(texture, this.realWidth, this.realHeight, this.inverse);
		}
	}
	
	this.draw = function() {
		
		if (game.tactic) {
			
			ctx.save();
			
			ctx.globalAlpha = 0.6;
			ctx.fillStyle = "black";
			
			ctx.translate(this.cellX, this.cellY);
		
			ctx.beginPath();
			if (this.size == 1) {
				ctx.moveTo(0, -game.ground.tileSizeY / 2 + 2);
				ctx.lineTo(game.ground.tileSizeX / 2 - 4, 0);
				ctx.lineTo(0, game.ground.tileSizeY / 2 - 2);
				ctx.lineTo(-game.ground.tileSizeX / 2 + 4, 0);
			} else {
				ctx.moveTo(0, -game.ground.tileSizeY + 2);
				ctx.lineTo(game.ground.tileSizeX - 4, 0);
				ctx.lineTo(0, game.ground.tileSizeY - 2);
				ctx.lineTo(-game.ground.tileSizeX + 4, 0);
			}
			ctx.closePath();
			
			ctx.fill();
			
			ctx.restore();
			
			
		} else {
	
			ctx.drawImage(this.texture, this.realX, this.realY);
		}
	}
	
	this.drawShadow = function(ctx) {

		
		if (game.tactic) return ;

		if (texture.shadow != null) {
			
			var offsetY = size * game.ground.tileSizeY * 1.5;
		
			ctx.save();
			ctx.translate(this.realX, this.realY + this.realHeight);
			ctx.scale(1, -SHADOW_SCALE);
			ctx.globalAlpha = SHADOW_ALPHA;
			
			if (this.inverse) {
				ctx.scale(-1, 1);
				ctx.drawImage(texture.shadow, -this.realWidth, -this.realHeight + offsetY, this.realWidth, this.realHeight);
			} else {
				ctx.drawImage(texture.shadow, 0, -this.realHeight + offsetY, this.realWidth, this.realHeight);
			}
			
			ctx.restore();
		}
	}
	
	this.getX = function() {
		return this.x;
	}	
	this.getY = function() {
		return this.y;
	}
	
	this.getType = function() {
		return this.type;
	}
	this.getSize = function() {
		return this.size;
	}
}
