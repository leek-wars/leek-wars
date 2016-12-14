var Entity = {}

// Type
Entity.LEEK = 0
Entity.BULB = 1

// Direction
Entity.NORTH = 0
Entity.SOUTH = 1
Entity.EAST = 2
Entity.WEST = 3

Entity.MOVE_DELAY = 3

Entity = Class.extend(Entity, function() {

	// Infos générales
	this.name = ""
	this.id
	this.level = 1
	this.team
	this.farmer
	this.type
	this.summon = false
	this.summoner
	this.active = false

	// Caractéristiques
	this.life = 0
	this.strength = 0
	this.wisdom = 0
	this.agility = 0
	this.resistance = 0
	this.frequency = 0
	this.science = 0
	this.magic = 0
	this.tp = 0
	this.mp = 0

	this.maxLife = 0
	this.maxTP = 0
	this.maxMP = 0
	this.absoluteShield = 0
	this.relativeShield = 0
	this.damageReturn = 0

	// Position
	this.x = 0
	this.y = 0
	this.z = 0;
	this.baseZ = 0;
	this.cell = 0;

	// Position réelle
	this.rx = 0;
	this.ry = 0;

	// Destination
	this.dx = 0;
	this.dy = 0;
	this.dz = 0;

	// Position en pixels
	this.ox = 0;
	this.oy = 0;

	// Orientation
	this.angle = 0;
	this.orientation = Entity.SOUTH;
	this.front = true;
	this.direction = 1;
	this.isTop = false; // Sur les lignes du haut

	// Vitesse de déplacement
	this.speed = 0.04;
	this.moveDelay = 0;
	this.jumpHeight = 35;

	// Drawing
	this.drawID = null;

	// States
	this.dead = false;
	this.flash = 0;
	this.burning = 0;
	this.burningAnim = 0;
	this.gazing = 0;

	// Bulle de parole
	this.bubble;
	
	// Info text
	this.infoText;
	
	// Movement
	this.path;
	
	// Dead
	this.deadAnim = 1;

	// Animation
	this.oscillation = 1;
	this.frame;


	this.__construct = function() {

		this.bubble = new Bubble();
		this.infoText = new Array();
		this.path = new Array();

		this.frame = Math.random() * 100
	}

	this.isDead = function() {
		return this.dead;
	}

	this.setCell = function(cell) {
		
		this.cell = cell
		
		var pos = game.ground.cellToXY(cell)
		
		this.setPosition(pos.x, pos.y)
		this.computeOrginPos()
	}

	this.computeOrginPos = function() {
		
		var pos = game.ground.xyToXYPixels(this.x, this.y);
		this.ox = pos.x;
		this.oy = pos.y;
	}

	this.setPosition = function(x,y) {

		var oldY = this.y;

		this.x = x;
		this.dx = x;
		this.rx = x;
		
		this.y = y;
		this.dy = y;
		this.ry = y;
		
		this.computeOrginPos();

		if (oldY != y && this.drawID != null) {
			game.moveDrawableElement(this, this.drawID, oldY, y);
		}
	}

	this.setOrientation = function(orientation) {
		
		this.orientation = orientation;
		
		this.front = orientation == Entity.SOUTH || orientation == Entity.WEST;
		this.direction = (orientation == Entity.SOUTH || orientation == Entity.EAST) ? 1 : -1;
		
		this.angle = this.front ? Math.PI/7 : -Math.PI/7;
	}

	this.jump = function() {
		
		if (this.dz == 0) {
			this.dz = this.jumpForce;
		}
		
	}

	this.move = function(path) { // Move along a path

		this.path = [];
		
		for (var i in path) {
			this.path.push(path[i]);
		}

		this.pathNext(); // Start movement
	}

	this.pathNext = function() {
		
		if (this.path.length == 0) {
			game.actionDone();
			return;
		}
		
		// Set destination
		this.rx = this.x;
		this.ry = this.y;
		
		var cell = this.path[0];
		this.cell = cell;
		
		var pos = game.ground.cellToXY(cell);
		
		this.dx = pos.x;
		this.dy = pos.y;
		
		// Jump
		this.jump();
		S.move.play();
		// Orientation
		if (this.dx > this.rx) {
			if (this.dy > this.ry)
				this.setOrientation(Entity.SOUTH);
			else
				this.setOrientation(Entity.EAST);
		} else {
			if (this.dy > this.ry)
				this.setOrientation(Entity.WEST);
			else
				this.setOrientation(Entity.NORTH);
		}
		
		// Update line
		game.moveDrawableElement(this, this.drawID, this.ry, this.dy);
		
		this.path.shift(); // Supprime la première case
	}

	this.looseMP = function(mp, jump) {

		this.mp -= mp;
		
		if (!jump) {
			var info = new InfoText();
			info.init("-" + mp, MP_COLOR, -this.getHeight(), this.isTop); 
			this.infoText.push(info);
		}
	}

	this.buffMP = function(mp, jump) {
		
		this.mp += mp;
		
		if (!jump) {
			var info = new InfoText();
			info.init("+" + mp, MP_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.buffWisdom = function(wisdom, jump) {
		
		this.wisdom += wisdom;
		
		if (!jump) {
			var info = new InfoText();
			info.init("+" + wisdom, WISDOM_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.buffResistance = function(resistance, jump) {
		
		this.resistance += resistance;
		
		if (!jump) {
			var info = new InfoText();
			info.init("+" + resistance, RESISTANCE_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.looseLife = function(life, jump) {
		
		this.life -= life;
		if (this.life < 0) this.life = 0;
		
		if (!jump) {
			var info = new InfoText();
			info.init("-" + life, LIFE_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.looseStrength = function(strength, jump) {

		this.strength -= strength;
		
		if (!jump) {
			var info = new InfoText();
			info.init("-" + strength, STRENGTH_COLOR, -this.getHeight(), this.isTop); 
			this.infoText.push(info);
		}
	}

	this.looseMagic = function(magic, jump) {

		this.magic -= magic;
		
		if (!jump) {
			var info = new InfoText();
			info.init("-" + magic, MAGIC_COLOR, -this.getHeight(), this.isTop); 
			this.infoText.push(info);
		}
	}

	this.care = function(life, jump) {
		
		this.life += life;
		
		if (!jump) {
			var info = new InfoText();
			info.init("+" + life, LIFE_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.boostVita = function(life, jump) {
		
		this.life += life;
		this.maxLife += life;

		if (!jump) {
			var info = new InfoText();
			info.init("+" + life, LIFE_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.looseTP = function(tp, jump) {

		this.tp -= tp
		
		if (!jump) {
			var info = new InfoText();
			info.init("-" + tp, TP_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}

	this.buffTP = function(tp, jump) {

		this.tp += tp
		
		if (!jump) {
			var info = new InfoText();
			info.init("+" + tp, TP_COLOR, -this.getHeight(), this.isTop);
			this.infoText.push(info);
		}
	}
 
	this.buffStrength = function(strength, jump) {

		this.strength += strength
		if (!jump) this.newInfoText("+" + strength, STRENGTH_COLOR)
	}

	this.buffAgility = function(agility, jump) {

		this.agility += agility
		if (!jump) this.newInfoText("+" + agility, AGILITY_COLOR)
	}

	this.buffWisdom = function(wisdom, jump) {

		this.wisdom += wisdom
		if (!jump) this.newInfoText("+" + wisdom, WISDOM_COLOR)
	}

	this.buffResistance = function(resistance, jump) {

		this.resistance += resistance
		if (!jump) this.newInfoText("+" + resistance, RESISTANCE_COLOR)
	}

	this.buffRelativeShield = function(relativeShield, jump) {

		this.relativeShield += relativeShield
		if (!jump) this.newInfoText("+" + relativeShield + '%', SHIELD_COLOR)
	}

	this.buffAbsoluteShield = function(absoluteShield, jump) {

		this.absoluteShield += absoluteShield
		if (!jump) this.newInfoText("+" + absoluteShield, SHIELD_COLOR)
	}

	this.buffDamageReturn = function(damageReturn, jump) {

		this.damageReturn += damageReturn
		if (!jump) this.newInfoText("+" + damageReturn + '%', '#000000')
	}

	this.fail = function(jump) {

		if (!jump) this.newInfoText(_.lang.get('fight', 'fail'), '#000000')
	}

	this.newInfoText = function(text, color) {

		var info = new InfoText()
		info.init(text, color, -this.getHeight(), this.isTop)
		this.infoText.push(info)
	}

	this.update = function(dt) {
	
		// Update si dead
		if (this.dead) {
			
			if (this.deadAnim >= 0) {
				
				this.deadAnim -= 0.04 * dt;
				
				if (this.deadAnim <= 0) {
					game.removeDrawableElement(this.drawID, this.dy);
					game.actionDone();
				}
			}
		}
			
		if (!this.dead) {

			var pathNext = false;
			
			// Animation
			this.frame += dt / Math.max(1, game.speed / 6);
			this.oscillation = 1 + Math.cos(this.frame / 17) / 40;
			
			// Déplacement
			if (this.moveDelay > 0) {
				
				this.moveDelay -= dt;
				
			} else {
				
				var check = false;
				
				if (this.x != this.dx) {
					if (this.x < this.dx) this.x += this.speed * dt;
					if (this.x > this.dx) this.x -= this.speed * dt;
					
					// Saut
					this.z = this.baseZ + (0.5 - Math.abs((this.dx + this.ox) / 2 - this.x)) * 2 * this.jumpHeight;
					check = true;
				} 
				if (this.y != this.dy) {
					if (this.y < this.dy) this.y += this.speed * dt;
					if (this.y > this.dy) this.y -= this.speed * dt;
					
					// Saut
					this.z = this.baseZ + (0.5 - Math.abs((this.dy + this.ry) / 2 - this.y)) * 2 * this.jumpHeight;
					check = true;
				}
				
				if (check && Math.abs(this.x - this.dx) <= dt * this.speed &&
					Math.abs(this.y - this.dy) <= dt * this.speed) { // Arrivé
					
					this.x = this.dx;
					this.y = this.dy;
					this.z = this.baseZ;
					
					this.moveDelay = Entity.MOVE_DELAY;
					pathNext = true;
				}
			}
			
			// Compute origin position
			this.computeOrginPos();
		
			// Is on top ?
			this.isTop = this.y <= 3;

			// Start new path
			if (pathNext) this.pathNext();
		}
		
		// Update bubble
		if (this.bubble != null) {
			this.bubble.update(dt);
		}
		 
		// Update info text 
		for (var i = 0; i < this.infoText.length; i++) {
			this.infoText[i].life -= dt;
			if (this.infoText[i].life <= 0) {  
				this.infoText.splice(i, 1);  
				i--;
				continue;
			}
			var d = (this.infoText[i].life / 50) * (1 + (this.infoText.length - i - 1) / 1.2) * dt;
			this.infoText[i].y -= d * this.infoText[i].bottom;
		}
		
		// Update states
		if (this.flash > 0) {
			this.flash -= dt;
		}
		if (this.burning > 0 || this.burningAnim > 0) {
			this.burningAnim -= dt;
			for (var i = 0; i < Math.round(dt) / 2.5; i++)
				game.particles.addFire(this.ox + Math.random() * 40 - 20, this.oy + Math.random() * 40 - 20, 10, -Math.PI/2, null);
		}
		if (this.gazing > 0) {
			if (Math.random() > 0.8)
				for (var i = 0; i < Math.round(dt); i++)
					game.particles.addGaz(this.ox + Math.random() * 40 - 20, this.oy + Math.random() * 40 - 20, 10, -Math.PI/2, null);
		}
	}

	this.useChip = function(chip, cell, targets) {
		
		var pos = game.ground.cellToXY(cell);
		var x = pos.x;
		var y = pos.y;
			
		// Inclinaison du poireau vers la cellule cible
		if (this.x != x || this.y != y) {
			
			var south = this.y > y;
			var east = this.x > x;
			
			this.setOrientation(south ? (east ? Entity.NORTH : Entity.EAST) : (east ? Entity.WEST : Entity.SOUTH));
		}
		
		var cellPixels = game.ground.xyToXYPixels(pos.x, pos.y);

		this.computeOrginPos();
		
		chip.launch([this.ox, this.oy], cellPixels, targets, cell, this);
	}

	this.say = function(message) {
		if (!this.dead) {
			this.bubble.setMessage(message);
			var time = Math.max(10, message.length / 4);
			this.bubble.show(time);
		}
	}

	this.sayLama = function() {
		if (!this.dead) {
			this.bubble.setLama();
			this.bubble.show(10);
		}
	}

	this.bug = function() {
		if (!this.dead) {
			this.bubble.setBug();
			this.bubble.show(10);
		}
	}

	this.collide = function(x, y, z) {
		if (Math.abs(x - this.ox) < 50) {
			if (Math.abs(y - this.oy) < 50) {
				return Math.abs(z - (this.z + 80)) < 80;
			}
		}
		return false;
	}

	this.electrify = function() {
		this.flash = 5;
	}

	this.burnAnim = function(time) {
		this.burningAnim += time;
	}

	this.burn = function() {
		this.burning++;
	}
	this.stopBurn = function() {
		this.burning--;
	}

	this.gaz = function() {
		this.gazing++;
	}
	this.stopGaz = function() {
		this.gazing--;
	}

	this.kill = function() {
		
		this.dead = true
		this.deadAnim = 1
		this.bubble = null
	}

	this.reborn = function() {
		this.dead = false;
		this.bubble = new Bubble();
	}

	this.draw = function() {

		ctx.save();
		ctx.scale(game.ground.scale, game.ground.scale);
		ctx.translate(this.ox, this.oy);
		
		// Team square
		ctx.save();
		
		ctx.globalAlpha = this.deadAnim;
		ctx.beginPath();
		ctx.moveTo(0, -game.ground.realTileSizeY / 2);
		ctx.lineTo(game.ground.realTileSizeX / 2, 0);
		ctx.lineTo(0, game.ground.realTileSizeY / 2);
		ctx.lineTo(-game.ground.realTileSizeX / 2, 0);
		ctx.closePath();
		
		if (this.id == game.currentPlayer) {
			
			ctx.fillStyle = LW.TEAM_COLORS[this.team - 1];
			ctx.globalAlpha = this.deadAnim * 0.5;
			ctx.fill();
		}
		
		ctx.globalAlpha = 0.8 * this.deadAnim;
		ctx.strokeStyle = LW.TEAM_COLORS[this.team - 1];
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = 4;
		ctx.stroke();
		
		ctx.globalAlpha = 1;
		ctx.restore();
			
		// Integrate z pos
		ctx.translate(0, - this.z);
	}

	this.endDraw = function() {

		ctx.restore() 
	}

	this.drawTexts = function() {

		if (this.infoText.length > 0) {

			ctx.save()
			ctx.scale(game.ground.scale, game.ground.scale)
			ctx.translate(this.ox, this.oy)

			ctx.textBaseline = "middle"
			ctx.textAlign = "center"
			ctx.textWeight = "bold" 
			ctx.lineWidth = 2
			ctx.font = "bold 22pt Roboto"

			for (var i = 0; i < this.infoText.length; i++) {
				this.infoText[i].draw()
			}
			ctx.globalAlpha = 1
			ctx.restore()
		}
	}

	this.drawPath = function() {
		
		if (this.x != this.dx || this.y != this.dy) {
			
			for (var i = 0; i < this.path.length; i++) {
				
				var pos = game.ground.cellToXY(this.path[i]);
				this.drawWhiteTile(pos.x, pos.y);
			}
			
			this.drawWhiteTile(this.dx, this.dy);
		}
	}

	this.drawWhiteTile = function(x, y) {
		
		ctx.save();
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = 'white';
		
		ctx.translate(((x + 1) / 2) * game.ground.tileSizeX, ((y + 1) / 2) * game.ground.tileSizeY);
		
		ctx.beginPath();
		ctx.moveTo(0, -game.ground.tileSizeY / 2.1);
		ctx.lineTo(game.ground.tileSizeX / 2.1, 0);
		ctx.lineTo(0, game.ground.tileSizeY / 2.1);
		ctx.lineTo(-game.ground.tileSizeX / 2.1, 0);
		ctx.closePath();
		
		ctx.fill();
		
		ctx.globalAlpha = 1;
		ctx.restore();
	}

	this.drawName = function() {
		
		ctx.save()
		ctx.scale(game.ground.scale, game.ground.scale)

		if (this.isTop) {
			ctx.translate(this.ox, this.oy)
		} else {
			ctx.translate(this.ox, this.oy - this.bodyTexFront.height * 0.85)
		}
		
		ctx.font = "12pt Roboto";
		
		var text = this.name + " (" + this.life + ")";
		var y = this.bodyTexFront.height * 0.85;
		var width = Math.max(140, ctx.measureText(text).width + 20);
		var height = 22;
		var barHeight = 12;
		
		// Fond
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = 'black';
		ctx.fillRect(-width/2, 0, width, height + barHeight);
		
		// Nom
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'white'; 
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText(text, 0, 12);
		
		// Barre de vie
		var life = this.life / this.maxLife;
		ctx.fillStyle = this.getLifeColor();
		var barWidth = life * width;
		ctx.fillRect(-width/2 + 2, height + 2, barWidth - 4, barHeight - 4);
		
		ctx.restore();
	}

	this.drawBubble = function() {

		if (this.bubble != null) {

			ctx.save();
			ctx.scale(game.ground.scale, game.ground.scale);
			ctx.translate(this.ox, this.oy);

			this.bubble.draw(0, this.getHeight() + 40, this.isTop);

			ctx.restore();
		}
	}

	this.getLifeColor = function() {
		var rgb = this.getLifeColorRGB()
		return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
	}

	this.getLifeColorRGB = function() {
		var life = this.life / this.maxLife
		return [Math.min(210, Math.round(420 * (1 - life))), Math.min(210, Math.round(420 * life)), 0]
	}
})