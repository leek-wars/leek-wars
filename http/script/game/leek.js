var Leek = {}

Leek.SKINS = [
	"green", // 1
	"blue", // 2
	"yellow", // 3
	"red", // 4
	"orange", // 5
	"pink", // 6
	"cyan", // 7
	"purple", // 8
	"multi", // 9
	"rasta", // 10
	"white", // 11
	"black", // 12
	"alpha", // 13
	"apple", // 14
	"gold", // 15
]

Leek.handSize = 14
Leek.handSize2 = Leek.handSize / 2

Leek = Entity.extend(Leek, function() {

	// Textures
	this.bodyTexFront;
	this.bodyTexBack;
    this.handTex;
    this.bloodTex;
    this.hatFront;
    this.hatBack;
    this.hatName
    this.hat

	// Animations
	this.handPos = 0;

	// Weapon
	this.weapon = null;


	this.__construct = function() {

		Entity.prototype.__construct.call(this)

		this.type = Entity.LEEK

		this.baseZ = -5
		this.z = this.baseZ
	}

	this.setSkin = function(appearence, skin, hat) {

		if (typeof Leek.SKINS[skin - 1] === 'undefined') skin = 1;

		this.skin = skin
		this.bodyTexFront = newTexture(LW.staticURL + "image/leek/leek" + appearence + "_front_" + Leek.SKINS[skin - 1] + ".png", true, shadowQuality);
		this.bodyTexBack = newTexture(LW.staticURL + "image/leek/leek" + appearence + "_back_" + Leek.SKINS[skin - 1] + ".png", true, shadowQuality);

		if (hat) {
			this.hat = hat
			this.hatTemplate = LW.hats[LW.hatTemplates[hat].item]
			this.hatName = this.hatTemplate.name
			this.hatFront = newTexture(LW.staticURL + "image/hat/" + this.hatName + ".png", true, shadowQuality);
			this.hatBack = newTexture(LW.staticURL + "image/hat/" +  this.hatName + "_back.png", true, shadowQuality);

			this.hatX = 0
		}

		this.handTex = T.leek_hand;
    	this.bloodTex = T.leek_blood;
	}

	this.setWeapon = function(weapon) {
		this.weapon = weapon;
		//play sound
		if(this.weapon != null){
			S.set_weapon.play();
		}
	}

	this.update = function(dt) {

		Entity.prototype.update.call(this, dt);

		this.handPos = Math.cos(this.frame / 17 - Math.PI / 6) * 3;

		// Update weapon
		if (this.weapon != null) {
			this.weapon.update(dt);
		}
	}

	this.useWeapon = function(cell, leeks) {

		if (this.weapon != null) {

			var pos = game.ground.cellToXY(cell);
			var x = pos.x;
			var y = pos.y;

			// Angle
			var south = this.y > y;
			var east = this.x > x;

			this.setOrientation(south ? (east ? Entity.NORTH : Entity.EAST) : (east ? Entity.WEST : Entity.SOUTH));

			this.angle = Math.atan2(Math.abs(this.x - x), (this.y - y) / 2) - Math.PI/2;

			var cellPixels = game.ground.xyToXYPixels(x,y);

			this.weapon.shoot(this.ox, this.oy, this.handPos + this.z, this.angle, this.direction, cellPixels, leeks);

			if (this.weapon.white) {
				this.jump()
			}
		}
	}


	this.randomHurt = function() {
		var z = 20 + Math.random() * 40;
		var dx = Math.random() * 30 - 15;
		var dy = Math.random() * 30 - 15;
		var dz = Math.random() * 30 - 15;
		var x = this.ox + Math.random() * 40 - 20;
		var y = this.oy + Math.random() * 40 - 20;
		this.hurt(x, y, z, dx, dy, dz);
	}

	this.hurt = function(x, y, z, dx, dy, dz) {

		// Blood
		var dir = Math.random();
		dx *= dir / 10;
		dy *= dir / 10;
		var bx = this.ox + dx * (40 + Math.random(60));
		var by = this.oy + dy *  (40 + Math.random(60));
		game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex);
		game.particles.addBloodOnGround(bx, by, this.bloodTex);

		dx = -dx
		dy = -dy
		bx = this.ox + dx * (40 + Math.random(60));
		by = this.oy + dy * (40 + Math.random(60));
		game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex);
		game.particles.addBloodOnGround(bx, by, this.bloodTex);

		this.flash = 5;
	}

	this.draw = function() {

		Entity.prototype.draw.call(this)

		// Draw normal
		this.drawNormal()

		// Draw shadow
		if (game.quality == 'high' && !this.dead) {
			this.drawShadow()
		}

		Entity.prototype.endDraw.call(this)
	}

	this.drawNormal = function() {

		var texture = this.front ? this.bodyTexFront : this.bodyTexBack;
		var hatTexture = this.front ? this.hatFront : this.hatBack;

		if (!this.dead) {

			if (this.weapon != null) {

				// Weapon !
				if (this.front) {

					this.drawBody(texture, hatTexture);
					this.drawWeapon(this.weapon.texture);

				} else {

					this.drawWeapon(this.weapon.texture);
					this.drawBody(texture, hatTexture);
				}

			} else {
				// No weapon
				ctx.drawImage(this.handTex, 12 - 5, -20 - this.handPos - 5, 10, 10); // back hand
				this.drawBody(texture, hatTexture);
				ctx.drawImage(this.handTex, -12 - 7, -20 - this.handPos - 7, 14, 14); // front hand
			}

		} else if (heightAnim > 0) {

			ctx.save();

			ctx.scale(this.direction, 1)
			var realHeight = this.getHeight()
			var heightAnim = Math.min(1, this.deadAnim * 1.5)
			var cropHeight = realHeight * heightAnim
			var scaledWidth = (texture.width / 1.5) * Math.max(0.5, this.deadAnim);
			ctx.drawImage(texture, 0,0, texture.width, texture.height * heightAnim, -scaledWidth/2, -cropHeight, scaledWidth, cropHeight);
			ctx.restore();
		}
	}

	this.drawWeapon = function(texture, shadow) {

		ctx.save();

		// Translate to center
		ctx.translate((this.weapon.cx + (this.front ? 0 : -this.weapon.ocx)) * this.direction, - this.weapon.cz - this.handPos + (this.front ? 5 : -5));

		// Inverse
		ctx.scale(this.direction * 0.8, 0.8);

		// Rotate
		if (shadow) {
			ctx.rotate(-this.angle * 1.5);
		} else {
			ctx.rotate(this.angle);
		}

		if (this.weapon.white) {

			this.weapon.draw(texture, this.front)

		} else {

			// Translate to the weapon texture origin
			ctx.translate(this.weapon.x - this.weapon.recoil + (this.front ? 2 : -8), this.weapon.z);

			// Draw the weapon
			ctx.drawImage(texture, 0,0, this.weapon.texture.width, this.weapon.texture.height);
		}

		// Draw hands
		if (!shadow) {
			ctx.drawImage(this.handTex, this.weapon.mx1 - Leek.handSize2, this.weapon.mz1 - Leek.handSize2, Leek.handSize, Leek.handSize);
			ctx.drawImage(this.handTex, this.weapon.mx2 - Leek.handSize2, this.weapon.mz2 - Leek.handSize2, Leek.handSize, Leek.handSize);
		}

		ctx.restore();
	}

	this.drawShadow = function() {

		var texture = this.front ? this.bodyTexBack : this.bodyTexFront;
		var hatTexture = this.front ? this.hatBack : this.hatFront;

		ctx.save();
		ctx.scale(1, -SHADOW_SCALE);
		ctx.globalAlpha = SHADOW_ALPHA;

		ctx.translate(0, - this.z);

		if (this.weapon != null) {
			this.drawBody(texture.shadow, hatTexture ? hatTexture.shadow : null);
			this.drawWeapon(this.weapon.texture.shadow, true);
		} else {
			this.drawBody(texture.shadow, hatTexture ? hatTexture.shadow : null);
		}

		ctx.restore();
	}

	this.drawBody = function(texture, hatTexture) {

		if (texture == null) return;

		ctx.save();

		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter';
		}

		ctx.scale(this.direction, this.oscillation)

		var leekWidth = this.bodyTexFront.width / 1.5

		// Body
		var realHeight = this.getHeight()
		ctx.drawImage(texture, -leekWidth / 2, -realHeight, leekWidth, realHeight)

		// Hat
		if (hatTexture) {

			if (this.hatX == 0) {
				var leekWidth = this.bodyTexFront.width / 1.5
				this.hatWidth = leekWidth * this.hatTemplate.width
				this.hatHeight = this.hatWidth * (this.hatFront.height / this.hatFront.width)
				this.hatX = - this.hatWidth / 2 - (leekWidth / 25)
				this.hatY = -(this.getHeight() - this.getHeight() * this.hatTemplate.height + this.hatHeight)
			}

			ctx.drawImage(hatTexture, this.hatX, this.hatY, this.hatWidth, this.hatHeight)
		}

		ctx.restore();
	}


	this.getHeight = function() {
		return this.bodyTexFront.height / 1.5;
	}
})
