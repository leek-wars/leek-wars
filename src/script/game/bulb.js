var Bulb = Entity.extend({}, function() {
	this.skin
	this.bulbName
	
	// Textures
	this.bodyTexFront
	this.bodyTexBack
	this.bloodTex

	this.__construct = function() {

		Entity.prototype.__construct.call(this)

		this.type = Entity.LEEK

		this.baseZ = -6
		this.z = this.baseZ

		this.bloodTex = T.leek_blood
	}

	this.setSkin = function(skin) {

		this.bulbName = LW.summonTemplates[skin].name
		this.skin = skin
		
		if (skin == 1) {
			this.bodyTexFront = T.bulb_front
			this.bodyTexBack = T.bulb_back
		} else if (skin == 2) {
			this.bodyTexFront = T.fire_bulb_front
			this.bodyTexBack = T.fire_bulb_back
		} else if (skin == 3) {
			this.bodyTexFront = T.healer_bulb_front
			this.bodyTexBack = T.healer_bulb_back
		} else if (skin == 4) {
			this.bodyTexFront = T.rocky_bulb_front
			this.bodyTexBack = T.rocky_bulb_back
		} else if (skin == 5) {
			this.bodyTexFront = T.iced_bulb_front
			this.bodyTexBack = T.iced_bulb_back
		} else if (skin == 6) {
			this.bodyTexFront = T.lightning_bulb_front
			this.bodyTexBack = T.lightning_bulb_back
		} else if (skin == 7) {
			this.bodyTexFront = T.metallic_bulb_front
			this.bodyTexBack = T.metallic_bulb_back
		}
	}

	this.update = function(dt) {
		Entity.prototype.update.call(this, dt)
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

		if (!this.dead) {
		
			this.drawBody(texture);
			
		} else if (heightAnim > 0) {
			
			ctx.save();

			ctx.scale(this.direction, 1); 
			var realHeight = this.getHeight() * 0.7;
			var heightAnim = Math.min(1, this.deadAnim * 1.5);
			var cropHeight = realHeight * heightAnim
			var scaledWidth = (texture.width * 0.7 / 1.5) * Math.max(0.5, this.deadAnim);
			ctx.drawImage(texture, 0,0, texture.width, texture.height * heightAnim, -scaledWidth/2, -cropHeight, scaledWidth, cropHeight);
			ctx.restore();
		}
	}

	this.drawShadow = function() {
		
		var texture = this.front ? this.bodyTexBack : this.bodyTexFront;

		ctx.save();
		ctx.scale(1, -SHADOW_SCALE);
		ctx.globalAlpha = SHADOW_ALPHA;
		
		ctx.translate(0, - this.z);
		
		this.drawBody(texture.shadow);
		
		ctx.restore();
	}

	this.drawBody = function(texture) {
		
		if (texture == null) return;
		
		ctx.save();
		
		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter';
		}
		
		ctx.scale(this.direction, this.oscillation);

		// Body
		var realHeight = this.getHeight() * 0.7;
		ctx.drawImage(texture, -this.bodyTexFront.width * 0.7 / 1.5 / 2, -realHeight, this.bodyTexFront.width * 0.7 / 1.5, realHeight);

		ctx.restore();
	}


	this.getHeight = function() {
		return this.bodyTexFront.height / 1.5;
	}
})