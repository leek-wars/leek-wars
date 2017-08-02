var whiteWeaponUpdate = function(weapon, dt) {

	if (weapon.inte < 1) {
		if (weapon.step == 1) {
			weapon.inte += dt * 0.04;
		} else {
			weapon.inte += dt * 0.1;
		}
		if (weapon.inte >= 1) {
			weapon.step++
			if (weapon.step == 2) {
				S.sword.play()
				var angle = weapon.angle + (1 - weapon.direction) * Math.PI / 2
				game.particles.addImage(weapon.leekX + Math.cos(angle) * 50, weapon.leekY, 50 - Math.sin(angle) * 50, weapon.direction * 0.2, 0, 0, angle, T.slash, 30);
			}
			if (weapon.step <= weapon.steps) {
				weapon.inte = 0.001
			} else {
				game.actionDone()
				weapon.step = 0
				weapon.inte = 1
			}
		}
	}
}

var whiteWeaponDraw = function(weapon, texture, front) {

	if (!weapon.front) ctx.translate(0, 40);

	if (weapon.step == 1) {
		ctx.translate(-weapon.inte * 40, -weapon.inte * 30);
	}

	ctx.rotate(front ? -Math.PI / 2 : -Math.PI / 4);

	if (weapon.step == 1) {
		var i = 1 - Math.min(1, (0.1 / weapon.inte))
		ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) * i)
	} else if (weapon.step == 2) {
		var i = 1 - Math.min(1, (0.05 / weapon.inte))
		ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) + (Math.PI / 2.6 + (front ? Math.PI / 3 : Math.PI / 3)) * i)
	}

	ctx.drawImage(texture, 0,0, texture.width, texture.height);
}

function Axe() {

	this.white = true

	// Textures de l'arme
	this.texture = T.axe;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 5;
	this.cz = 40;
	this.ocx = 25;

	// Position de l'arme par rapport au centre
	this.x = 40;
	this.z = -40;

	// Position des mains
	this.mx1 = 32;
	this.mz1 = 32;
	this.mx2 = 55;
	this.mz2 = 32;

	this.step = 0
	this.steps = 2
	this.inte = 1

	Axe.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		this.step = 1
		this.inte = 0.001

		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation == Entity.SOUTH || orientation == Entity.EAST) ? 1 : -1;
		this.angle = angle
	}

	Axe.prototype.update = function(dt) {

		whiteWeaponUpdate(this, dt)
	}

	Axe.prototype.draw = function(texture, front) {

		whiteWeaponDraw(this, texture, front)
	}
}


function BLaser() {

	// Textures de l'arme
	this.texture = T.b_laser;
    this.cartTexture = T.cart_b_laser;
    this.bulletTexture = T.b_laser_bullet;

    // Son de l'arme
    this.sound = S.laser;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 38;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -70;
	this.z = -20;

	// Position des mains
	this.mx1 = 33;
	this.mz1 = 33;
	this.mx2 = 80;
	this.mz2 = 33;

	// Position du tir
	this.sx = 960;
	this.sz = 25;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	BLaser.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, target, success) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Bullets
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		var width = 1600;
		game.particles.addLaser(X, Y, z, realAngle, width, this.bulletTexture, target, success);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();

		game.actionDone();
	}

	BLaser.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Broadsword() {

	this.white = true

	// Textures de l'arme
	this.texture = T.broadsword;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 5;
	this.cz = 40;
	this.ocx = 15;

	// Position de l'arme par rapport au centre
	this.x = 15;
	this.z = -15;

	// Position des mains
	this.mx1 = 14;
	this.mz1 = 14;
	this.mx2 = 30;
	this.mz2 = 14;

	this.step = 0
	this.steps = 2
	this.inte = 1

	Broadsword.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		this.step = 1
		this.inte = 0.001
		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation == Entity.SOUTH || orientation == Entity.EAST) ? 1 : -1;
		this.angle = angle
	}

	Broadsword.prototype.update = function(dt) {

		whiteWeaponUpdate(this, dt)
	}

	Broadsword.prototype.draw = function(texture, front) {

		whiteWeaponDraw(this, texture, front)
	}
}

function Destroyer() {

	// Textures de l'arme
	this.texture = T.destroyer;
	this.cartTexture= T.cart_destroyer;

    // Son de l'arme
    this.sound = S.double_gun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 38;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -50;
	this.z = -15;

	// Position des mains
	this.mx1 = 47;
	this.mz1 = 39;
	this.mx2 = 88;
	this.mz2 = 42;

	// Position du tir
	this.sx = 182;
	this.sz = 14;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	// Fréquence de tir
	this.delay = 5;
	this.currentDelay = 0;

	Destroyer.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		this.bulletZ = this.cz + this.z + this.sz + handPos;

		// Rotation
		this.bulletX = leekX + (this.cx + x * cos - y * sin) * orientation;
		this.bulletY = leekY + (y * cos + x * sin);

		// Shot
		this.bulletAngle = (angle + Math.PI/2) * orientation - Math.PI/2;

		this.bulletTargets = leeks;

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		this.cartridgeZ = this.cz + this.z + this.cartZ + handPos;
		this.cartridgeX = leekX + (this.cx + x * cos - y * sin) * orientation;
		this.cartridgeY = leekY + (y * cos + x * sin);
		this.cartridgeOrientation = orientation;

		// Shot
		game.particles.addShot(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle);

		// Bullet
		game.particles.addBullet(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.bulletTargets);

		// Cartridge
		var cartAngle = this.bulletAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var cartDx = Math.cos(cartAngle) * 3 * this.cartridgeOrientation;
		var cartDy = Math.random() - 0.5;
		var cartDz = 4 + Math.random() * 2;
		game.particles.addCartridge(this.cartridgeX, this.cartridgeY, this.cartridgeZ, cartDx, cartDy, cartDz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	Destroyer.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function DoubleGun() {

	// Textures de l'arme
	this.texture = T.double_gun;
	this.cartTexture= T.cart_double_gun;

    // Son de l'arme
    this.sound = S.double_gun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 35;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -10;
	this.z = -15;

	// Position des mains
	this.mx1 = 11;
	this.mz1 = 30;
	this.mx2 = 32;
	this.mz2 = 31;

	// Position du tir
	this.sx = 160;
	this.sz = 14;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	DoubleGun.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Bullets
		game.particles.addBullet(X, Y, z, realAngle - Math.PI / 40, leeks);
		game.particles.addBullet(X, Y, z, realAngle + Math.PI / 40, null);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	DoubleGun.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Electrisor() {

	// Textures de l'arme
	this.texture = T.electrisor;

    // Son de l'arme
    this.sound = S.electrisor;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 5;
	this.cz = 52;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -30;
	this.z = 0;

	// Position des mains
	this.mx1 = 42;
	this.mz1 = 31;
	this.mx2 = 72;
	this.mz2 = 34;

	// Position du tir
	this.sx = 105;
	this.sz = -18;

	// Longueur de recul
	this.recoil = 0;

	// Tirs à réaliser
	this.shoots = 0;
	this.delay = 2;
	this.currentDelay = 0;
	this.lightningX;
	this.lightningY;
	this.lightningZ;
	this.lightningAngle;
	this.lightningCell;
	this.lightningTargets;

	Electrisor.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		var x = this.x + this.sx;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		this.lightningX = leekX + (this.cx + x * cos - y * sin) * orientation;
		this.lightningY = leekY + (y * cos + x * sin);
		this.lightningZ = z;
		this.lightningAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		this.lightningCell = cell;
		this.lightningTargets = leeks;

		this.shoots = 40;

		game.setEffectArea(cell.x, cell.y, AREA_CIRCLE1, 'red');
		this.sound.play();
	}

	Electrisor.prototype.update = function(dt) {

		if (this.shoots > 0) {

			this.currentDelay -= dt;
			if (this.currentDelay <= 0) {

				this.currentDelay = this.delay;

				game.particles.addLightning(this.lightningX, this.lightningY, this.lightningZ, this.lightningAngle, this.lightningCell, this.lightningTargets, T.lightning);



				this.shoots--;
				if (this.shoots == 0) {
					game.actionDone();
				}
			}
		}
	}
}

function FlameThrower() {

	// Textures de l'arme
	this.texture = T.flame_thrower;

    // Son de l'arme
    this.sound = S.flame_thrower;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 25;
	this.cz = 60;

	// Position de l'arme par rapport au centre
	this.x = -60;
	this.z = -15;
	this.ocx = 0;

	// Position des mains
	this.mx1 = 31;
	this.mz1 = 51;
	this.mx2 = 80;
	this.mz2 = 50;

	// Position du tir
	this.sx = 145;
	this.sz = 2;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	// Shoot
	this.shoots = 0;
	this.bulletX;
	this.bulletY;
	this.bulletZ;
	this.bulletTargets;

	FlameThrower.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		this.bulletZ = this.cz + this.z + this.sz + handPos;

		// Rotation
		this.bulletX = leekX + (this.cx + x * cos - y * sin) * orientation;
		this.bulletY = leekY + (y * cos + x * sin);

		this.bulletAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		this.bulletTargets = leeks;

		this.shoots = 42;

		// Send a first fire that will have a target
		game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.bulletTargets, true);

		this.sound.play();

	}

	FlameThrower.prototype.update = function(dt) {

		if (this.shoots > 0) {

			// Send other particles
			for (var i = 0; i < Math.round(3 * dt); i++)
				game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, null, true);

			// Sound
			//~ this.sound.play();

			// Recoil
			this.recoil = this.recoilForce;

			this.shoots--;
			if (this.shoots <= 0) {
				game.actionDone();
			}
		}

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Gazor() {

	// Textures de l'arme
	this.texture = T.gazor;

    // Son de l'arme
    this.sound = S.gazor;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 60;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -43;
	this.z = -12;

	// Position des mains
	this.mx1 = 28;
	this.mz1 = 52;
	this.mx2 = 74;
	this.mz2 = 50;

	// Position du tir
	this.sx = 130;
	this.sz = 2;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	// Shoot
	this.shoots = 0;
	this.bulletX;
	this.bulletY;
	this.bulletZ;

	Gazor.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		this.bulletZ = this.cz + this.z + this.sz + handPos;

		// Rotation
		this.bulletX = leekX + (this.cx + x * cos - y * sin) * orientation;
		this.bulletY = leekY + (y * cos + x * sin);

		this.bulletAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		this.bulletTargets = leeks;

		this.shoots = 50;

		// Send a first gaz that will have a target
		game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.bulletTargets, true);

		game.setEffectArea(cell.x, cell.y, AREA_CIRCLE3, 'red');

		this.sound.play();
	}

	Gazor.prototype.update = function(dt) {

		if (this.shoots > 0) {

			for (var i = 0; i < Math.round(3 * dt); i++)
				game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, null, true);

			// Sound
			//~ this.sound.play();

			// Recoil
			this.recoil = this.recoilForce;

			this.shoots--;
			if (this.shoots <= 0) {
				game.actionDone();
			}
		}

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function GrenadeLauncher() {

	// Textures de l'arme
	this.texture = T.grenade_launcher;
	this.cartTexture= T.cart_grenade_launcher;

    // Son de l'arme
    this.sound = S.grenade_shoot;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 0;
	this.cz = 40;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -35;
	this.z = -15;

	// Position des mains
	this.mx1 = 38;
	this.mz1 = 28;
	this.mx2 = 66;
	this.mz2 = 29;

	// Position du tir
	this.sx = 150;
	this.sz = 14;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	GrenadeLauncher.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Bullets
		game.particles.addGrenade(X, Y, z, realAngle, cell, leeks);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();

		game.setEffectArea(cell.x, cell.y, AREA_CIRCLE2, 'red');
	}

	GrenadeLauncher.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Katana() {

	this.white = true

	// Textures de l'arme
	this.texture = T.katana;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 5;
	this.cz = 40;
	this.ocx = 10;

	// Position de l'arme par rapport au centre
	this.x = 15;
	this.z = -15;

	// Position des mains
	this.mx1 = 30;
	this.mz1 = 12;
	this.mx2 = 42;
	this.mz2 = 12;

	this.step = 0
	this.steps = 2
	this.inte = 1

	Katana.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		this.step = 1
		this.inte = 0.001
		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation == Entity.SOUTH || orientation == Entity.EAST) ? 1 : -1;
		this.angle = angle
	}

	Katana.prototype.update = function(dt) {

		whiteWeaponUpdate(this, dt)
	}

	Katana.prototype.draw = function(texture, front) {

		whiteWeaponDraw(this, texture, front)
	}
}

function Laser() {

	// Textures de l'arme
	this.texture = T.laser;
    this.cartTexture = T.cart_laser;
    this.bulletTexture = T.laser_bullet;

    // Son de l'arme
    this.sound = S.laser;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 42;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -50;
	this.z = -15;

	// Position des mains
	this.mx1 = 30;
	this.mz1 = 34;
	this.mx2 = 79;
	this.mz2 = 36;

	// Position du tir
	this.sx = 400;
	this.sz = 15;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	Laser.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, target, success) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Bullets
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		var width = 500;
		game.particles.addLaser(X, Y, z, realAngle, width, this.bulletTexture, target, success);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();

		game.actionDone();
	}

	Laser.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function MLaser() {

	// Textures de l'arme
	this.texture = T.m_laser;
    this.cartTexture = T.cart_m_laser;
    this.bulletTexture = T.m_laser_bullet;

    // Son de l'arme
    this.sound = S.laser;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 38;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -70;
	this.z = -20;

	// Position des mains
	this.mx1 = 69;
	this.mz1 = 33;
	this.mx2 = 114;
	this.mz2 = 33;

	// Position du tir
	this.sx = 960;
	this.sz = 25;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	MLaser.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, target, success) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Bullets
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		var width = 1600;
		game.particles.addLaser(X, Y, z, realAngle, width, this.bulletTexture, target, success);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();

		game.actionDone();
	}

	MLaser.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function MachineGun() {

	// Textures de l'arme
	this.texture = T.machine_gun;
	this.cartTexture= T.cart_machine_gun;

    // Son de l'arme
    this.sound = S.machine_gun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 45;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -35;
	this.z = -15;

	// Position des mains
	this.mx1 = 20;
	this.mz1 = 40;
	this.mx2 = 63;
	this.mz2 = 40;

	// Position du tir
	this.sx = 160;
	this.sz = 14;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	MachineGun.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Bullets
		game.particles.addBullet(X, Y, z, realAngle, leeks);
		game.particles.addBullet(X, Y, z, realAngle + Math.PI / 50, null);
		game.particles.addBullet(X, Y, z, realAngle - Math.PI / 50, null);
		game.particles.addBullet(X, Y, z, realAngle + Math.PI / 25, null);
		game.particles.addBullet(X, Y, z, realAngle - Math.PI / 25, null);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	MachineGun.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Magnum() {

	// Textures de l'arme
	this.texture = T.magnum;
	this.cartTexture= T.cart_magnum;

    // Son de l'arme
    this.sound = S.double_gun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 12;
	this.cz = 40;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = 15;
	this.z = -15;

	// Position des mains
	this.mx1 = 22;
	this.mz1 = 32;
	this.mx2 = 25;
	this.mz2 = 23;

	// Position du tir
	this.sx = 94;
	this.sz = 22;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	Magnum.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Bullets
		game.particles.addBullet(X, Y, z, realAngle, leeks);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	Magnum.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Pistol() {

	// Textures de l'arme
	this.texture = T.pistol;
	this.cartTexture = T.cart_pistol;

    // Son de l'arme
    this.sound = S.double_gun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 12;
	this.cz = 40;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = 15;
	this.z = -15;

	// Position des mains
	this.mx1 = 10;
	this.mz1 = 26;
	this.mx2 = 19;
	this.mz2 = 18;

	// Position du tir
	this.sx = 90;
	this.sz = 22;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	Pistol.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Bullets
		game.particles.addBullet(X, Y, z, realAngle, leeks);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	Pistol.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}

function Shotgun() {

	// Textures de l'arme
	this.texture = T.shotgun;
	this.cartTexture= T.cart_shotgun;

    // Son de l'arme
    this.sound = S.shotgun;

	// Position de l'arme par rapport au poireau (centre de rotation)
	this.cx = 15;
	this.cz = 45;
	this.ocx = 0;

	// Position de l'arme par rapport au centre
	this.x = -35;
	this.z = -15;

	// Position des mains
	this.mx1 = 17;
	this.mz1 = 30;
	this.mx2 = 63;
	this.mz2 = 30;

	// Position du tir
	this.sx = 160;
	this.sz = 14;

	// Position des cartouches
	this.cartX = 60;
	this.cartZ = 20;
	this.cartAngle = Math.PI/2;

	// Longueur de recul
	this.recoilForce = 18;
	this.recoil = 0;

	Shotgun.prototype.shoot = function(leekX, leekY, handPos, angle, orientation, cell, leeks) {

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		/// Zone de tir
		// Coordonnées sans rotation (par rapport au centre)
		var x = this.x + this.sx - this.recoil;
		var y = 0;
		var z = this.cz + this.z + this.sz + handPos;

		// Rotation
		var X = leekX + (this.cx + x * cos - y * sin) * orientation;
		var Y = leekY + (y * cos + x * sin);

		// Shot
		var realAngle = (angle + Math.PI/2) * orientation - Math.PI/2;
		game.particles.addShot(X, Y, z, realAngle);

		// Real bullet
		game.particles.addBullet(X, Y, z, realAngle, leeks);
		// Others
		for (var i = 0; i < 4; i++)
			game.particles.addBullet(X, Y, z, realAngle + Math.random() * Math.PI/4 - Math.PI/8, null);

		/// Zone des cartouches
		x = this.x + this.cartX - this.recoil;
		y = 0;
		z = this.cz + this.z + this.cartZ + handPos;
		X = leekX + (this.cx + x * cos - y * sin) * orientation;
		Y = leekY + (y * cos + x * sin);

		// Cartridge
		var cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI/4 - Math.PI/8);
		var dx = Math.cos(cartAngle) * 3 * orientation;
		var dy = Math.random() - 0.5;
		var dz = 4 + Math.random() * 2;
		game.particles.addCartridge(X, Y, z, dx, dy, dz, this.cartTexture);

		// Recoil
		this.recoil = this.recoilForce;

		// Play sound
		this.sound.play();
	}

	Shotgun.prototype.update = function(dt) {

		// Update recoil
		if (this.recoil > 0) {
			this.recoil -= 1 * dt;
			if (this.recoil < 0) this.recoil = 0;
		}
	}
}
