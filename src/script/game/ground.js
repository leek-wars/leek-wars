var GROUND_PADDING_LEFT = 210;
var GROUND_PADDING_RIGHT = 20;
var GROUND_PADDING_TOP = 70;
var GROUND_PADDING_BOTTOM = 100;

var Ground = function() {

	if ($(window).width() < 800) {
		GROUND_PADDING_LEFT = 10;
		GROUND_PADDING_RIGHT = 10;
		GROUND_PADDING_TOP = 10;
		GROUND_PADDING_BOTTOM = 20;
	}

	this.width = null
	this.height = null

	this.tileSize = 60;

	this.tilesX = 18;
	this.tilesY = 18;

	this.startX;
	this.startY;

	this.texture = null;
	this.textureCtx = null;

	this.quality;
	this.fullscreen = false;

	this.obstacles = new Array();

	this.resize = function(width, height, fullscreen, quality) {

		if (!game.inited) return null
		if (this.width == width && this.height == height) return null

		this.width = width
		this.height = height

		this.fullscreen = fullscreen;
		this.quality = quality;

		// Taille de la grille centrale
		this.gridHeight = Math.round(height - GROUND_PADDING_TOP - GROUND_PADDING_BOTTOM);
		this.gridWidth = Math.round(width - GROUND_PADDING_LEFT - GROUND_PADDING_RIGHT);
		if (this.gridHeight * 2 > this.gridWidth)
			this.gridHeight = Math.round(this.gridWidth / 2);
		if (this.gridWidth / 2 > this.gridHeight)
			this.gridWidth = Math.round(this.gridHeight * 2);

		// Calculate start position
		this.startX = Math.round(width - this.gridWidth - GROUND_PADDING_RIGHT);
		this.startY = Math.round(height - this.gridHeight - GROUND_PADDING_BOTTOM);

		// Taille des cases
		this.tileSizeX = this.gridWidth / this.tilesX;
		this.tileSizeY = this.gridHeight / this.tilesY;

		// Taille "réelle" des cases
		this.realTileSizeX = 70;
		this.realTileSizeY = 35;

		this.scale = this.tileSizeX / this.realTileSizeX;

		// Taille "réelle" de la grille
		this.realGridWidth = this.gridWidth / this.scale;
		this.realGridHeight = this.gridHeight / this.scale;

		// Set obstacles sizes
		for (var o in this.obstacles) {
			this.obstacles[o].resize();
		}

		// Create grid texture
		if (GROUND_TEXTURE) {

			this.texture = document.getElementById('bg-canvas');
			this.texture.width = width;
			this.texture.height = height;
			this.textureCtx = this.texture.getContext('2d');

			// Fill color
			this.textureCtx.fillStyle = game.map.groundColor;
			this.textureCtx.fillRect(0,0, width, height);

			// Translate
			this.textureCtx.save();
			this.textureCtx.translate(this.startX, this.startY);

			// Draw image
			this.textureCtx.drawImage(game.map.groundTexture, -30, -30, this.gridWidth + 60, this.gridHeight + 60);

			// Draw map decor
			if (game.map.drawDecor) {
				this.textureCtx.save();
				this.textureCtx.scale(this.scale, this.scale);
				game.map.drawDecor(this.textureCtx);
				this.textureCtx.restore();
			}
			// Draw lines
			this.drawGrid(this.textureCtx);

			// Obstacles shadows
			for (var o in this.obstacles) {
				this.obstacles[o].drawShadow(this.textureCtx);
			}

			this.textureCtx.scale(this.scale, this.scale);
		}
	}

	this.drawGrid = function(ctx) {

		ctx.strokeStyle = "rgba(0, 0, 0, " + (0.12 * this.scale) + ")";
		ctx.lineWidth = 2;

		for (var i = 0; i < this.tilesX; i++) {

			ctx.beginPath();
			ctx.moveTo(this.tileSizeX / 2 + i * this.tileSizeX, 0);
			ctx.lineTo(0, this.tileSizeY / 2 + i * this.tileSizeY);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(this.tileSizeX / 2 + i * this.tileSizeX, this.gridHeight);
			ctx.lineTo(0, this.gridHeight - this.tileSizeY / 2 - i * this.tileSizeY);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(this.gridWidth - this.tileSizeX / 2 - i * this.tileSizeX, 0);
			ctx.lineTo(this.gridWidth, this.tileSizeY / 2 + i * this.tileSizeY);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(this.gridWidth - this.tileSizeX / 2 - i * this.tileSizeX, this.gridHeight);
			ctx.lineTo(this.gridWidth, this.gridHeight - this.tileSizeY / 2 - i * this.tileSizeY);
			ctx.stroke();
		}
	}

	this.addObstacle = function(obstacle) {

		this.obstacles.push(obstacle);
		game.addDrawableElement(obstacle, obstacle.y + obstacle.size - 1);
	}

	this.drawTexture = function(image, x, y, angle) {
		if (GROUND_TEXTURE) {
			this.textureCtx.save();
			this.textureCtx.translate(x, y);
			this.textureCtx.rotate(angle);
			this.textureCtx.drawImage(image, -image.width/2, -image.height/2);
			this.textureCtx.restore();
		}
	}

	this.drawTextureCrop = function(image, x, y, angle, ox, oy, w, h) {
		if (GROUND_TEXTURE) {
			this.textureCtx.save();
			this.textureCtx.translate(x, y);
			this.textureCtx.rotate(angle);
			this.textureCtx.drawImage(image, ox, oy, w, h, -w/2, -h/2, w, h);
			this.textureCtx.restore();
		}
	}

	this.drawTextureScale = function(image, x, y, angle, scaleX, scaleY) {
		if (GROUND_TEXTURE) {
			this.textureCtx.save();
			this.textureCtx.translate(x, y);
			this.textureCtx.scale(scaleX, scaleY);
			this.textureCtx.rotate(angle);
			this.textureCtx.drawImage(image, -image.width/2, -image.height/2);
			this.textureCtx.restore();
		}
	}

	this.drawTextureCropScale = function(image, x, y, angle, ox, oy, w, h, scaleX, scaleY) {
		if (GROUND_TEXTURE) {
			this.textureCtx.save();
			this.textureCtx.translate(x, y);
			this.textureCtx.scale(scaleX, scaleY);
			this.textureCtx.rotate(angle);
			this.textureCtx.drawImage(image, ox, oy, w, h, -w/2, -h/2, w, h);
			this.textureCtx.restore();
		}
	}

	this.draw = function() {

		// Clear main canvas
		canvas.width = canvas.width;

		// Set origin at the start postion of the ground
		ctx.save();
		ctx.translate(this.startX, this.startY);

		// Draw cells numbers
		if (game.showCells) {
			this.drawCellNumbers();
		}
	}

	this.drawCellNumbers = function() {

		ctx.globalAlpha = 0.8;
		ctx.fillStyle = 'black';
		ctx.font = Math.floor(this.tileSizeX / 5) + "pt Roboto";
		ctx.textAlign = "center";

		var cell = 0;

		for (var i = 0; i < this.tilesY * 2 - 1; ++i) {

			var big = i % 2 == 0;
			var num = big ? this.tilesX : this.tilesX - 1

			for (var j = 0; j < num; ++j) {

				ctx.fillText(cell++, j * this.tileSizeX + this.tileSizeX / 2 + (!big * this.tileSizeX / 2), i * this.tileSizeY / 2 + this.tileSizeY / 1.5);
			}
		}
		ctx.globalAlpha = 1;
	}

	this.endDraw = function() {

		ctx.restore();
	}

	this.cellToXY = function(cell) {

		var mod = game.ground.tilesX * 2 - 1;

		var pos = {};

		pos.x = (cell % mod) * 2;
		pos.y = Math.floor(cell / mod) * 2;

		if (pos.x > mod) {
			pos.x = pos.x % mod;
			pos.y++;
		}

		return pos;
	}

	this.xyToCell = function(x, y) {

		var mod = game.ground.tilesX * 2 - 1;

		if (y % 2 == 0) {
			return (y / 2) * mod + x / 2;
		} else {
			return ((y - 1) / 2) * mod + game.ground.tilesX + (x - 1) / 2;
		}
	}

	this.xyToXYPixels = function(x, y) {
		var pixels = {};

		pixels.x = x * this.realTileSizeX / 2 + this.realTileSizeX / 2;
		pixels.y = y * this.realTileSizeY / 2 + this.realTileSizeY / 2;

		return pixels;
	}

	this.getNumCells = function() {

		return (this.tilesX * 2 - 1) * this.tilesY - this.tilesX - 1;
	}
}
