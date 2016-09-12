var BULLET_SPEED = 25;
var CARTRIDGE_SPEED = 5;
var FIRE_SPEED_MIN = 3;
var FIRE_SPEED_MAX = 5;
var GAZ_SPEED_MIN = 4;
var GAZ_SPEED_MAX = 7;

var BULLET_LIFE = 300;
var FIRE_LIFE = 100;
var SHOT_LIFE = 10;
var GAZ_LIFE = 100;
var CARTRIDGE_LIFE = 200;
var LASER_LIFE = 20;
var BLOOD_LIFE = 12;
var LIGHTNING_LIFE = 10;
var GRENADE_LIFE = 10000;
var EXPLOSION_LIFE = 15;
var GARBAGE_LIFE = 50;

var NUM_SHOTS_SPRITES = 4;
var NUM_BLOOD_SPRITES = 4;

var Particles = function() {
	
	this.particles = new Array();
	this.groundParticles = []
	
	this.addBullet = function(x, y, z, angle, leeks) {
		
		var bullet = new Particle(BULLET, x, y, z);
		bullet.texture = T.bullet;
		bullet.dx = Math.cos(angle) * BULLET_SPEED;
		bullet.dy = Math.sin(angle) * BULLET_SPEED;
		bullet.angle = angle;
		bullet.rotation = 0;
		bullet.life = BULLET_LIFE;
		bullet.targets = leeks;
		
		// Vérification traversée
		if (leeks != null && leeks.length > 0) {
			var leek = leeks[0];
			var dx = leek.ox - x;
			var dy = leek.oy - y;
			var dist = Math.sqrt(dx * dx + dy * dy);
			var dx2 = leek.ox - (x + bullet.dx);
			var dy2 = leek.oy - (y + bullet.dy);
			var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
			if (dist2 > dist) { // la balle recule
			
				leek.hurt(leek.ox, leek.oy, z, bullet.dx, bullet.dy, 0);
				game.actionDone();
				return;
			}
		}
		
		this.add(bullet);
	}
	
	this.addLaser = function(x, y, z, angle, width, texture, cell, leeks) {
		
		var laser = new Particle(LASER, x, y, z);
		laser.texture = texture;
		laser.angle = angle;
		laser.life = LASER_LIFE;
		laser.width = width;
		
		this.add(laser);
		
		// Collision
		if (leeks != null) {
			
			for (var l in leeks) {
				
				var leek = leeks[l];
				leek.hurt(leek.ox, leek.oy, z, Math.cos(angle) * 10, Math.sin(angle) * 10, 0);
			}
			game.actionDone();
		}
	}
	
	this.addLightning = function(x, y, z, angle, cell, targets, texture) {
		
		var lightning = new Particle(LIGHTNING, x, y, z);
		lightning.texture = texture;
		lightning.life = LIGHTNING_LIFE;
		
		// Création de l'éclair
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);
		var vertices = new Array();
		
		var longX = x - cell.x;
		var longY = y - cell.y;
		var long = Math.sqrt(longX * longX + longY * longY);
		var points = Math.round(long / 50);
		var fragLength = long / points;
		
		// Création des points
		for (var i = 0; i <= points; i++) {
			
			var px = x + dx * i * fragLength;
			var py = y + dy * i * fragLength;
			
			var deformation = (points / 2 - Math.abs(points / 2 - i)) * 30;
			px += Math.random() * deformation - deformation / 2;
			py += Math.random() * deformation - deformation / 2;
			
			vertices.push(px, py - z);
		}
		
		for (var t in targets) {
			targets[t].electrify();
		}
		lightning.targets = null;
		lightning.vertices = vertices;
		
		this.add(lightning);
	}
	
	this.addFire = function(x, y, z, angle, targets, thrown) {
		
		var fire = new Particle(FIRE, x, y, z);
		fire.texture = T.fire;
		fire.rotation = 0;
		fire.angle = 0;
		fire.life = FIRE_LIFE;
		
		// Move angle
		angle += (Math.random() * (Math.PI/10)) - Math.PI/20;		
		
		var speed = FIRE_SPEED_MIN + Math.random() * (FIRE_SPEED_MAX - FIRE_SPEED_MIN);
		if (!thrown) speed /= 4;
		
		fire.dx = Math.cos(angle) * speed;
		fire.dy = Math.sin(angle) * speed;
		fire.targets = targets;
		
		this.add(fire);
	}
	
	this.addFireSimple = function(x, y, z, angle) {
		
		var fire = new Particle(FIRE, x, y, z);
		fire.texture = T.fire;
		fire.rotation = 0;
		fire.angle = 0;
		fire.life = FIRE_LIFE;
	
		fire.dx = Math.cos(angle);
		fire.dy = Math.sin(angle);
		
		this.add(fire);
	}
	
	this.addGaz = function(x, y, z, angle, targets, thrown) {
		
		var gaz = new Particle(GAZ, x, y, z);
		gaz.texture = T.gaz;
		gaz.textureId = Math.floor(Math.random() * 5);
		gaz.rotation = 0;
		gaz.angle = 0;
		gaz.life = GAZ_LIFE;
		
		// Move angle
		angle += (Math.random() * (Math.PI/10)) - Math.PI/20;
		
		var speed = GAZ_SPEED_MIN + Math.random() * (GAZ_SPEED_MAX - GAZ_SPEED_MIN);
		if (!thrown) speed /= 3;
		
		gaz.dx = Math.cos(angle) * speed;
		gaz.dy = Math.sin(angle) * speed;
		gaz.targets = targets;
		
		this.add(gaz);
	}
	
	
	this.addMeteorite = function(x, y, z, angle, size, targets) {
		
		var meteorite = new Particle(METEORITE, x, y, z);
		meteorite.texture = T.meteorite;
		meteorite.size = size;
		meteorite.dx = Math.cos(angle) * 8;
		meteorite.dz = -Math.sin(angle) * 8;
		meteorite.originalAngle = angle;
		meteorite.angle = Math.random() * Math.PI * 2;
		meteorite.life = 1000;
		meteorite.rotation = 0;
		meteorite.targets = targets;
		
		this.add(meteorite);
	}
	
	this.addGrenade = function(x, y, z, angle, cell, targets) {
		
		var grenade = new Particle(GRENADE, x, y, z);
		grenade.texture = T.grenade;
		var dist = Math.sqrt((x - cell.x) * (x - cell.x) + (y - cell.y) * (y - cell.y));
		grenade.dx = Math.cos(angle) * dist * 0.033;
		grenade.dy = Math.sin(angle) * dist * 0.033;
		grenade.angle = angle;
		grenade.rotation = (Math.random() - 0.5) / 2;
		grenade.life = GRENADE_LIFE;
		grenade.targets = targets;
		
		this.add(grenade);
	}
	
	this.addShot = function(x, y, z, angle) {
		
		var shot = new Particle(SHOT, x, y, z);
		shot.texture = T.shots;
		shot.textureId = Math.floor(Math.random() * NUM_SHOTS_SPRITES);
		shot.angle = angle;
		shot.rotation = 0;
		shot.life = SHOT_LIFE;
		
		this.add(shot);
	}
	
	this.addExplosion = function(x, y, z) {
		
		var explosion = new Particle(EXPLOSION, x, y, z);
		explosion.texture = T.explosion;
		explosion.textureId = Math.floor(Math.random() * NUM_SHOTS_SPRITES);
		explosion.angle = 0;
		explosion.rotation = 0;
		explosion.life = EXPLOSION_LIFE;
		
		this.add(explosion);
	}
	
	this.addCartridge = function(x, y, z, dx, dy, dz, texture) {
		
		var cartridge = new Particle(CARTRIDGE, x, y, z);
		cartridge.texture = texture;
		cartridge.dx = dx;
		cartridge.dy = dy;
		cartridge.dz = dz;
		cartridge.angle = Math.random() * Math.PI * 2;
		cartridge.rotation = Math.random() * 0.1 - 0.05;
		cartridge.life = CARTRIDGE_LIFE;
		
		this.add(cartridge);
	}
	
	this.addGarbage = function(x, y, z, dx, dy, dz, texture, orientation, rotation, scale) {
		
		var garbage = new Particle(GARBAGE, x, y, z);
		garbage.texture = texture;
		garbage.orientation = orientation;
		garbage.dx = dx;
		garbage.dy = dy;
		garbage.dz = dz;
		garbage.angle = 0;
		
		if (scale == undefined) {
			garbage.scale = 1;
		} else {
			garbage.scale = scale;
		}
		
		if (rotation == undefined) {
			garbage.rotation = Math.random() * 0.1 - 0.05;
		} else {
			garbage.rotation = rotation;
		}
		garbage.life = GARBAGE_LIFE;
		
		this.add(garbage);
	}
	
	this.addImage = function(x, y, z, dx, dy, dz, angle, texture, life, alpha, onground) {
		
		var image = new Particle(IMAGE, x, y, z);
		image.texture = texture;
		image.dx = dx;
		image.dy = dy;
		image.dz = dz;
		image.angle = angle;
		image.rotation = 0;
		image.life = life;
		image.totalLife = life;
		image.targets = null;
		image.alpha = typeof(alpha) === 'undefined' ? 1 : alpha
		
		this.add(image, onground);
	}

	this.addRectangle = function(x, y, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life) {
		
		var rect = new Particle(RECTANGLE, x, y, z);
		rect.dx = dx;
		rect.dy = dy;
		rect.dz = dz;
		rect.angle = angle;
		rect.rotation = 0;
		rect.life = life;
		rect.totalLife = life;
		rect.targets = null;
		rect.sx = sx;
		rect.sy = sy;
		rect.dsx = dsx;
		rect.dsy = dsy;
		rect.color= color;
		rect.alpha = alpha;
		
		this.add(rect);
	}
	
	this.addBlood = function(x, y, z, dx, dy, dz, texture) {
		
		var blood = new Particle(BLOOD, x, y, z);
		blood.textureId = Math.floor(Math.random() * NUM_BLOOD_SPRITES);
		blood.texture = texture;
		blood.dx = dx;
		blood.dy = dy;
		blood.dz = dz;
		blood.angle = Math.random() * Math.PI * 2;
		blood.life = BLOOD_LIFE;
		
		this.add(blood);
	}
	
	this.addBloodOnGround = function(x, y, texture) {
		
		var angle = Math.random() * Math.PI * 2;
		var textureId = Math.floor(Math.random() * NUM_BLOOD_SPRITES);
		
		game.ground.drawTextureCropScale(texture, x, y, angle, textureId * 50, 0, 50, 50, 1, 0.5);
	}
	
	
	this.add = function(particle, onground) {

		if (onground) {
			this.groundParticles.push(particle)
		} else {
			this.particles.push(particle);
		}
	}

	this.update = function(dt) {

		this._update(this.particles, dt)
		this._update(this.groundParticles, dt)
	}
	
	this._update = function(particles, dt) {
		
		for (var i = 0; i < particles.length; i++) {
			
			var particle = particles[i];
			
			// Mouvement
			particle.x += particle.dx * dt;
			particle.y += particle.dy * dt;
			particle.z += particle.dz * dt;
			
			// Rotation
			particle.angle += particle.rotation;
			
			// Mouvement complexe
			if (particle.type == CARTRIDGE || particle.type == GRENADE || particle.type == GARBAGE) {
				
				particle.dz -= 0.3 * dt;
				
				// Stalactite ou iceberg
				if (particle.texture == T.iceberg || particle.texture == T.stalactite) {
					if (particle.z < particle.texture.height / 2.8) {
						
						// Débrits de glace
						this.addGarbage(particle.x + 5, particle.y + 7, particle.z - 10, 0.2, 1.5, 0, T.ice_part, 1, 0.02);
						this.addGarbage(particle.x + 3, particle.y + 4, particle.z + 10, -1.3, 0.4, 0, T.ice_part2, 1, -0.05);
						this.addGarbage(particle.x - 3, particle.y + 3, particle.z + 20, 0.5, -1.4, 0, T.ice_part, 1, 0.05);
						this.addGarbage(particle.x - 2, particle.y - 8, particle.z - 20, -0.7, 1.1, 0, T.ice_part2, 1, -0.02)
						
						particles.splice(i, 1);
						i--; 
						continue;
					}
				}
				
				if (particle.z <= 0) {
					
					particle.z -= particle.dz;
					particle.dz = -particle.dz * 0.4;
					if (particle.dz < 1) {
						
						if (particle.type == CARTRIDGE) {
							// Draw on ground
							game.ground.drawTexture(particle.texture, particle.x, particle.y - particle.z, particle.angle);
							
						} else if (particle.type == GRENADE) {
							this.addExplosion(particle.x, particle.y, particle.z);
							
							for (var t in particle.targets) {
								var target = particle.targets[t];
								target.hurt(particle.x, particle.y, particle.z, particle.dx, particle.dy, particle.dz);
							}
							game.actionDone();
						}
						
						// Delete particle
						particles.splice(i, 1);
						i--; 
						continue;
					}
					particle.dx *= 0.5;
				}
			}
			
			// Météorite
			if (particle.type == METEORITE) {
				
				// Fire
				if (Math.random() > 0.3) {
					var x = particle.x + Math.random() * 60 - 30;
					var y = particle.y + Math.random() * 60 - 30;
					this.addFireSimple(x, y, particle.z, (particle.originalAngle) * (0.2 + Math.random() * 0.2));
				}
			
				if (particle.z < 20) {
					
					this.addExplosion(particle.x, particle.y, particle.z);
					
					if (particle.targets) {
						for (var t in particle.targets) {
							var target = particle.targets[t];
							target.hurt(particle.x, particle.y, particle.z, particle.dx, particle.dy, particle.dz);
						}
						game.actionDone();
					}
					
					// Delete
					particles.splice(i, 1);
					i--; 
					continue;
				}
			}
			
			// Sortie de terrain
			if (particle.type != LASER && particle.type != METEORITE) {
				if (particle.x < -game.ground.startX - 50 || particle.y < -game.ground.startY - 50 || particle.x > game.ground.startX + game.ground.width + 50 || particle.y > game.ground.startY + game.ground.height + 50) {
					
					if (particle.targets != null) {
						
						if (particle.type == BULLET) {
							
							game.actionDone();
						}
						
						particle.targets = null;
						game.actionDone();
					}
					
					particles.splice(i, 1);
					i--;
					continue;
				}
			}

			if (particle.type == RECTANGLE) {
				particle.sx += particle.dsx * dt;
				particle.sy += particle.dsy * dt;
			}
			
			// Life
			particle.life -= dt;

			if (particle.life <= 0) {
				
				if (particle.targets != null) { // On termine l'action si la balle est supprimée
					
					if (particle.type == BULLET) {
						
						game.actionDone();
					}
					
					game.actionDone();
				}
				
				particles.splice(i, 1);
				i--;
				continue;
			}
			
			// Collisions !
			if (particle.targets != null) {
				
				for (var t in particle.targets) {
					
					var target = particle.targets[t];
					
					if (target != null) {
						
						if (target.collide(particle.x, particle.y, particle.z)) {
							
							if (particle.type == BULLET) {
								
								target.hurt(particle.x, particle.y, particle.z, particle.dx, particle.dy, particle.dz);
								game.actionDone();
								particle.targets.splice(t, 1);
								t--;
								
							} else if (particle.type == FIRE || particle.type == GAZ) {
									
								particle.targets.splice(t, 1);
								t--;
							}
						}
					}
				}
				
				// Plus de cibles, c'est fini
				if (particle.targets.length == 0) {
					
					particles.splice(i, 1);
					i--;
					continue;
				}
			}
		}
	}

	this.drawGround = function() {

		this.draw(this.groundParticles)
	}

	this.drawAir = function() {

		this.draw(this.particles)
	}
	
	this.draw = function(particles) {
		
		ctx.save();
		ctx.scale(game.ground.scale, game.ground.scale);
		
		for (var i in particles) {
			
			var particle = particles[i];
			
			ctx.save();
			
			// Translate and rotate
			ctx.translate(particle.x, particle.y - particle.z);
			ctx.rotate(particle.angle);
			
			var texture = particle.texture;
			
			if (particle.type == SHOT) {
				
				ctx.globalAlpha = particle.life / 10;
				ctx.drawImage(texture, particle.textureId * 50, 0, 50, 50, -25, -25, 50, 50);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == BLOOD) {
				
				ctx.globalAlpha = particle.life / 4;
				ctx.drawImage(texture, particle.textureId * 50, 0, 50, 50, -25, -25, 50, 50);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == LASER) {
				
				var height = particle.life * texture.height / 10;
				ctx.globalAlpha = particle.life / 15;
				ctx.drawImage(texture, -particle.width / 2, -height / 2, particle.width, height);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == LIGHTNING) {
				
				ctx.translate(-particle.x, -particle.y + particle.z);
				ctx.globalAlpha = particle.life / 4;
				
				for (var j = 0; j < particle.vertices.length - 2; j += 2) {

					var x1 = particle.vertices[j];
					var y1 = particle.vertices[j+1];
					var x2 = particle.vertices[j+2];
					var y2 = particle.vertices[j+3];
					
					var dx = x2 - x1;
					var dy = y2 - y1;
					var angle = Math.atan2(dy, dx);
					
					var width = Math.sqrt(dx * dx + dy * dy) + 2;
					
					ctx.save();
					ctx.translate(x1, y1);
					ctx.rotate(angle);
					ctx.drawImage(texture, 0, -texture.height/2, width, texture.height);
					ctx.restore();
				}
				
				ctx.globalAlpha = 1;
				
			} else if (particle.type == FIRE) {
				
				ctx.globalAlpha = particle.life / 100;
				var size = 70 - particle.life / 2.5;
				var textureId = 10 - Math.round(particle.life / 10);
				ctx.drawImage(texture, textureId * 20, 0, 20, 20, -size/2, -size/2, size, size);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == GAZ) {
				
				ctx.globalAlpha = particle.life / 100;
				var size = 70 - particle.life / 2.5;
				ctx.drawImage(texture, particle.textureId * 20, 0, 20, 20, -size/2, -size/2, size, size);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == EXPLOSION) {
				
				ctx.globalAlpha = particle.life / 5;
				var size = 300 - 15 * particle.life;
				ctx.drawImage(texture, 0, 0, texture.width, texture.height, -size/2, -size/3.6, size, size/1.8);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == GARBAGE) {
				
				ctx.globalAlpha = particle.life / 5;
				var size = 300 - 15 * particle.life;
				ctx.scale(particle.orientation, 1);
				ctx.drawImage(texture, 0, 0, texture.width, texture.height, -texture.width * particle.scale/2, -texture.height * particle.scale/2, texture.width * particle.scale, texture.height * particle.scale);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == IMAGE) {
				
				ctx.globalAlpha = particle.alpha * Math.min(1, (particle.life / 20) * ((particle.totalLife - particle.life) / 30));
				ctx.drawImage(texture, -texture.width / 2 , -texture.height / 2);
				ctx.globalAlpha = 1;
				
			} else if (particle.type == METEORITE) {
				
				ctx.drawImage(texture, 0, 0, 60, 54, -30*particle.size , -27*particle.size, 60*particle.size, 54*particle.size);

			} else if (particle.type == RECTANGLE) {

				ctx.globalAlpha = particle.alpha;
				ctx.beginPath();
			    ctx.rect(0, 0, particle.sx, particle.sy);
			    ctx.fillStyle = particle.color;
			    ctx.fill();
			    ctx.globalAlpha = 1;
				
			} else {
				ctx.drawImage(texture, -texture.width / 2 , -texture.height / 2);
			}
			
			ctx.restore();
		}
		
		ctx.restore();
	}
}
