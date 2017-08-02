/*
 * Fonctions utiles pour les sorts
 */
function createChipAureol(targets, texture) {
	
	for (var target in targets) {
		
		var t = targets[target];
		var x = t.ox;
		var y = t.oy;
		var z = t.getHeight() + 20;
		
		game.particles.addImage(x, y, z, 0, 0, -0.6, 0, texture, 60);
	}
}

function createChipImage(targets, texture) {
	
	for (var target in targets) {
		
		var t = targets[target];
		var x = t.ox;
		var y = t.oy; 
		var z = t.getHeight() + 40;
		
		game.particles.addImage(x, y, z, 0, 0, 0.2, 0, texture, 70);
	}
}
 
function createChipHalo(targets) {
	
	for (var target in targets) {
		
		var t = targets[target]; 
		var dx = Math.random() * 100 - 50;
		var x = t.ox + dx;
		var y = t.oy + Math.random() * 30 - 15;  
		var z = Math.random() * 10;
		var speed = 1.5 + (50 - Math.abs(dx))/50; 
		var life = 80 - Math.abs(dx);
		
		game.particles.addImage(x, y, z, 0, 0, speed, 0, T.halo, life);
	}
}

function createChipHeal(targets) {
	
	for (var target in targets) {
		
		var t = targets[target]; 
		var dx = Math.random() * 100 - 50;
		var x = t.ox + dx;
		var y = t.oy + Math.random() * 30 - 15;  
		var z = Math.random() * 10;
		var speed = 1.5 + (50 - Math.abs(dx))/50; 
		var life = 80 - Math.abs(dx);
		
		game.particles.addImage(x, y, z, 0, 0, speed, 0, T.heal_cross, life);
	}
}

var Adrenaline = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_adrenaline);
		createChipAureol(targets, T.buff_aureol);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE1, 'blue');
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Armor = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_armor);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Armoring = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_armoring);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Bandage = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_bandage);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Carapace = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_carapace);
		createChipAureol(targets, T.shield_aureol);
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}


var Cure = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;

		createChipImage(targets, T.chip_cure);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();		
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var DevilStrike = function() {
	
	this.done = false;
	//NEED SOUND
	this.duration = 100;
	this.willFinish = false;
	this.delay = 0;
	
	this.x;
	this.y;
	this.targets;
	this.vx;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.x = targetCell.x;
		this.y = targetCell.y;
		this.targets = targets;
		this.vx = (500 + Math.random() * 300) * ((Math.random() > 0.5) ? 1 : -1);
		
		game.setEffectArea(this.x, this.y, AREA_CIRCLE3, 'red', 180);

		game.particles.addImage(this.x, this.y, 0, 0, 0, 0, 0, T.red_circle, 120, 0.6, true)

		game.particles.addImage(this.x, this.y, 50, 0, 0, 1.2, 0, T.daemon_shadow, 100, 0.9)

		S.fire.play()
	}
	
	this.update = function(dt) {
		
		this.duration -= dt

		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 12

			var x = Math.random() * 250 - 125
			var y = Math.random() * 125 - 62.5
			game.particles.addLaser(this.x + x, this.y + y, 230, Math.PI/2, 500, T.m_laser_bullet, null, null)
			S.rock.play()
		}
		
		if (this.duration <= 0) {
			this.done = true
		}
	}
}

var Doping = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_doping);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Drip = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_drip);
		createChipAureol(targets, T.cure_aureol);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE2, 'green');
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Flame = function() {
	
	this.done = false;
	this.sound = S.fire;
	this.num = 0;
	this.cell; 
	this.delay = 2;
	this.targets;
	this.duration = 70;
	
	this.launch = function(launchCell, targetCell, targets) {
		 
		this.cell = targetCell;
		this.targets = targets;
		
		for (var t in targets) {
			targets[t].burnAnim(100);
		}
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		
		if (this.delay <= 0) {
			
			this.delay = 12;
		
			for (var t in this.targets) {
				
				var z = 20 + Math.random() * 30;
				var dx = Math.random() * 8 - 4;
				var dy = Math.random() * 8 - 4;
				var x = Math.random() * 40 - 20;
				var y = Math.random() * 40 - 20;
				
				this.targets[t].hurt(this.targets[t].ox + x,this.targets[t].oy + y,z, dx,dy,0);
			}
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Flash = function() {
	
	this.done = false;
	this.sound = S.lightning;
	this.num = 0;
	this.cell;
	this.delay = 1;
	this.targets;
	this.duration = 70;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		game.particles.addImage(this.cell.x - 50, this.cell.y, 220, 0.5, 0, 0, 0, T.grey_cloud, 80);
		game.particles.addImage(this.cell.x + 50, this.cell.y, 220, -0.5, 0, 0, 0, T.grey_cloud, 80); 
		game.particles.addImage(this.cell.x + 10, this.cell.y, 230, 0.2, 0, 0, 0, T.grey_cloud, 80);
		game.particles.addImage(this.cell.x - 10, this.cell.y, 230, -0.2, 0, 0, 0, T.grey_cloud, 80);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE1, 'red');
		
		this.sound.play();
	}
	
	this.update = function(dt) { 
		
		this.delay -= dt;
		
		if (this.delay <= 0) {
			
			this.delay = 1;
		
			var da = Math.random() * Math.PI/20 - Math.PI/40;
			
			var dx = Math.random() * 60 - 30;
			var dy = Math.random() * 4 - 2;
			
			game.particles.addLightning(this.cell.x + dx, this.cell.y - 200 + dy, 0, Math.PI/2 + da, this.cell, null, T.purple_lightning);
			
			for (var t in this.targets) {
				this.targets[t].electrify();
			}
			
			this.duration -= dt;
			if (this.duration <= 0) {
				this.done = true;
			}
		}
	}
}

var Fortress = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_fortress);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Helmet = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets; 
		
		createChipImage(targets, T.chip_helmet);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Ice = function() {
	
	this.done = false;
	this.sound = S.ice;
	this.duration = 30;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		game.particles.addGarbage(targetCell.x, targetCell.y, 100, 0, 0, 1.5, T.ice_small, 1, 0);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Iceberg = function() {
	
	this.done = false;
	this.sound = S.ice;
	this.duration = 40;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		game.particles.addGarbage(targetCell.x, targetCell.y, 180, 0, 0, 3, T.iceberg, 1, 0);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE2, 'red');
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Inversion = function() {
	
	this.done = false;
	this.sound = S.teleportation;
	this.inverted = false;
	
	this.cell;
	this.target;
	this.duration = 120;
	 
	this.launch = function(launchCell, targetPos, targets, targetCell, launcher) {
		
		this.launcher = launcher; 
		this.target = targets[0];

		this.launchPos = {x: launchCell[0], y: launchCell[1]};
		this.targetPos = targetPos;
	}
	
	this.update = function(dt) {

		this.duration -= dt;

		if (Math.random() > 0.8 && this.duration > 40) {

			var xx = Math.random() * 60 - 30;
			var x1 = this.launchPos.x + xx;
			var y1 = this.launchPos.y;
			var x2 = this.targetPos.x + xx;
			var y2 = this.targetPos.y;
			var z = 0;
			var dz = 1.7;
			var dx = 0;
			var dy = 0;
			var angle = 0;
			var sx = 10;
			var sy = 10;
			var dsx = 0;
			var dsy = 0.6;
			var color = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)];
			var life = 50;
			var alpha = 0.4;

			game.particles.addRectangle(x1, y1, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life);
			game.particles.addRectangle(x2, y2, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life);
		}

		if (!this.inverted && this.duration < 40) {

			var cell = this.launcher.cell;
			this.launcher.setCell(this.target.cell);
			this.target.setCell(cell);
			
			this.inverted = true;
		}

		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var LeatherBoots = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_leather_boots);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Liberation = function() {
	
	this.done = false;
	this.sound = S.liberation;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		this.sound.play();
	
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}

		if (Math.random() > 0.5) {
			var t = this.targets[0]; 

			var angle = Math.random() * Math.PI * 2;

			var dx = Math.cos(angle) * 2;
			var dy = Math.sin(angle);

			angle = Math.atan2(dy, dx);

			var x = t.ox + dx * 10;
			var y = t.oy + dy * 10;  
			var z = 50;
			
			game.particles.addImage(x, y, z, dx, dy, 0, angle, T.liberation_halo, 60);
		}
	}
}

var Lightning = function() {
	
	this.done = false;	
	this.sound = S.lightning;
	
	this.num = 0;
	this.cell;
	this.delay = 1;
	this.duration = 80;
	this.targets;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		game.particles.addImage(this.cell.x - 50, this.cell.y, 230, 0.5, 0, 0, 0, T.black_cloud, 90);
		game.particles.addImage(this.cell.x + 50, this.cell.y, 230, -0.5, 0, 0, 0, T.black_cloud, 90);
		game.particles.addImage(this.cell.x + 10, this.cell.y, 240, 0.2, 0, 0, 0, T.black_cloud, 90);
		game.particles.addImage(this.cell.x - 10, this.cell.y, 240, -0.2, 0, 0, 0, T.black_cloud, 90);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE2, 'red');
		
		this.sound.play();
		
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		
		if (this.delay <= 0) {
			
			this.delay = 1;
		
			var da = Math.random() * Math.PI/20 - Math.PI/40;
			
			var dx = Math.random() * 80 - 40;
			var dy = Math.random() * 4 - 2;
			
			game.particles.addLightning(this.cell.x + dx, this.cell.y - 200 + dy, 0, Math.PI/2 + da, this.cell, null, T.red_lightning);
			
			for (var t in this.targets) {
				this.targets[t].electrify();
			}
			
			this.duration -= dt;
			if (this.duration <= 0) {
				this.done = true;
			}
		}
	}
}

var Meteorite = function() {
	
	this.done = false;
	this.sound = S.meteorite;
	this.willFinish = false;
	
	this.count = 6;
	this.delay = 0;
	
	this.x;
	this.y;
	this.targets;
	this.vx;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.x = targetCell.x;
		this.y = targetCell.y;
		this.targets = targets;
		this.vx = (500 + Math.random() * 300) * ((Math.random() > 0.5) ? 1 : -1);
		
		game.setEffectArea(this.x, this.y, AREA_CIRCLE2, 'red', 180);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		
		if (this.delay < 0) {
			
			this.delay = 5 + Math.random() * 15;
			
			this.count--;
			
			if (this.count > 0) {
				
				var targets = this.count == 1 ? this.targets : null;
				
				var y = this.y;
				var z = this.y + 200;
				var x = this.x + this.vx;
				var angle = Math.atan2(this.vx, z) + Math.PI/2;
				
				var ox = Math.random() * 120 - 60;
				var oy = Math.random() * 120 - 60;
				
				var size = 0.7 + Math.random() * 0.5;
				
				game.particles.addMeteorite(x + ox, y + oy, z, angle, size, targets);
				
			} else {
				this.willFinish = true;
				
				if (this.targets.length == 0) {
					this.done = true;
				}
			}
		}
	}
}

var Motivation = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_motivation);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Pebble = function() {
	
	this.done = false;
	this.sound = S.rock;
	this.duration = 30;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		game.particles.addGarbage(targetCell.x, targetCell.y, 100, 0, 0, 2, T.pebble_small, 1, 0);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Protein = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_protein);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Rage = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_rage);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Rampart = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_rampart);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Reflexes = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_reflexes);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Regeneration = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_regeneration);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Remission = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_remission);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Rock = function() {
	
	this.done = false;
	this.sound = S.rock;
	this.duration = 40;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		game.particles.addGarbage(targetCell.x, targetCell.y, 150, 0, 0, 2, T.rock, 1, 0);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Rockfall = function() {
	
	this.done = false;
	this.sound = S.rockfall;
	this.duration = 70;
	
	this.delay = 0;
	this.targetCell;
	
	this.launch = function(launchCell, targetCell, targets) {
		this.targetCell = targetCell;
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE2, 'red');
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		
		if (this.delay <= 0) {
			this.delay = 10;
			
			//~ var rot = Math.random() * 0.1 - 0.05;
			var rot = 0;
			var x = Math.random() * 100 - 50;
			var y = Math.random() * 100 - 50;
			var z = 120 + Math.random() * 100;
			var dz = -1 - Math.random() * 3;
			var scale = 0.3 + Math.random() * 0.5;
			
			game.particles.addGarbage(this.targetCell.x + x, this.targetCell.y + y, z, 0, 0, dz, T.rock, 1, rot, scale);
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var SevenLeagueBoots = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_seven_league_boots);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Shield = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_shield);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Shock = function() {
	
	this.done = false;
	this.sound = S.lightning;
	this.num = 0;
	this.cell; 
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		 
		this.cell = targetCell;
		this.targets = targets;
		
		game.particles.addImage(this.cell.x - 50, this.cell.y, 220, 0.5, 0, 0, 0, T.cloud, 70);
		game.particles.addImage(this.cell.x + 50, this.cell.y, 220, -0.5, 0, 0, 0, T.cloud, 70);
		game.particles.addImage(this.cell.x + 10, this.cell.y, 230, 0.2, 0, 0, 0, T.cloud, 70);
		game.particles.addImage(this.cell.x - 10, this.cell.y, 230, -0.2, 0, 0, 0, T.cloud, 70);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		
		if (this.delay <= 0) {
			
			this.delay = 2;
		
			var da = Math.random() * Math.PI/20 - Math.PI/40;
			
			var dx = Math.random() * 60 - 30;
			var dy = Math.random() * 4 - 2;
			
			game.particles.addLightning(this.cell.x + dx, this.cell.y - 200 + dy, 0, Math.PI/2 + da, this.cell, null, T.lightning);
			
			for (var t in this.targets) {
				this.targets[t].electrify();
			}
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Spark = function() {
	
	this.done = false;
	this.sound = S.fire;
	this.num = 0;
	this.cell; 
	this.delay = 2;
	this.targets;
	this.duration = 40;
	
	this.launch = function(launchCell, targetCell, targets) {
		 
		this.cell = targetCell;
		this.targets = targets;
		
		for (var t in targets) {
			targets[t].burnAnim(50);
		}
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Stalactite = function() {
	
	this.done = false;
	this.sound = S.ice;
	this.duration = 40;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		game.particles.addGarbage(targetCell.x, targetCell.y, 180, 0, 0, 3, T.stalactite, 1, 0);
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Steroid = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_steroid);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Stretching = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_stretching);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Teleportation = function() {
	
	this.done = false;
	this.sound = S.teleportation;
	this.teleported = false;
	
	this.cell;
	this.target;
	this.duration = 140;
	 
	this.launch = function(launchCell, targetPos, targets, targetCell) {
		
		this.cell = targetCell; 
		this.target = targets[0];

		this.launchPos = {x: launchCell[0], y: launchCell[1]};
		this.targetPos = targetPos;
		
		this.sound.play();
	}
	
	this.update = function(dt) {

		this.duration -= dt;

		if (Math.random() > 0.6) {

			var xx = Math.random() * 60 - 30;
			var yy = Math.random() * 30 - 15;

			var x1 = this.launchPos.x + xx;
			var y1 = this.launchPos.y + yy;
			var x2 = this.targetPos.x + xx;
			var y2 = this.targetPos.y + yy;
			var z = 0;
			var dz = 1.7;
			var dx = 0;
			var dy = 0;
			var angle = 0;
			var sx = 10;
			var sy = 10;
			var dsx = 0;
			var dsy = 0.5;
			var color = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)];
			var life = 50;
			var alpha = 0.4;

			if (this.duration > 70) {
				game.particles.addRectangle(x1, y1, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life);
			}
			if (this.duration < 100) {
				game.particles.addRectangle(x2, y2, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life);
			}
		}

		if (!this.teleported && this.duration < 50) {

			this.target.setCell(this.cell);
			this.teleported = true;
		}

		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Vaccine = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_vaccine);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Wall = function() {
	
	this.done = false;
	this.sound = S.shield;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_wall);
		createChipAureol(targets, T.shield_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var WarmUp = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_warm_up);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var WingedBoots = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_winged_boots);
		createChipAureol(targets, T.buff_aureol);
		
		game.setEffectArea(targetCell.x, targetCell.y, AREA_CIRCLE1, 'blue');
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}


var Whip = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_whip);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Acceleration = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_acceleration);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Loam = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_loam);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Fertilizer = function() {
	
	this.done = false;
	this.sound = S.heal;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 45;
	 
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell; 
		this.targets = targets;
		
		createChipImage(targets, T.chip_fertilizer);
		createChipAureol(targets, T.cure_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHeal(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var SlowDown = function() {
	
	this.done = false;
	this.sound = S.debuff;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_slow_down);
		createChipAureol(targets, T.shackle_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {

		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var BallAndChain = function() {
	
	this.done = false;
	this.sound = S.debuff;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_ball_and_chain);
		createChipAureol(targets, T.shackle_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {

		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Tranquilizer = function() {
	
	this.done = false;
	this.sound = S.debuff;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_tranquilizer);
		createChipAureol(targets, T.shackle_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Soporific = function() {
	
	this.done = false;
	this.sound = S.debuff;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_soporific);
		createChipAureol(targets, T.shackle_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
	
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Fracture = function() {
	
	this.done = false;
	this.sound = S.debuff;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_fracture);
		createChipAureol(targets, T.shackle_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Solidification = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_solidification);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Venom = function() {
	
	this.done = false;
	this.sound = S.poison;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_venom);
		createChipAureol(targets, T.poison_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Toxin = function() {
	
	this.done = false;
	this.sound = S.poison;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
	
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_toxin);
		createChipAureol(targets, T.poison_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Plague = function() {
	
	this.done = false;
	this.sound = S.poison;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_plague);
		createChipAureol(targets, T.poison_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Thorn = function() {
	
	this.done = false
	this.sound = S.buff;
	this.duration = 60
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_thorn)
		createChipAureol(targets, T.damage_return_aureol)
		
		this.sound.play();
	}
	
	this.update = function(dt) {

		this.duration -= dt
		if (this.duration <= 0) {
			this.done = true
		}
	}
}

var Mirror = function() {
	
	this.done = false
	this.sound = S.buff;
	this.duration = 60
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_mirror)
		createChipAureol(targets, T.damage_return_aureol)
		
		this.sound.play();
	}
	
	this.update = function(dt) {

		this.duration -= dt
		if (this.duration <= 0) {
			this.done = true
		}
	}
}

var Ferocity = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_ferocity);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Collar = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_collar);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Bark = function() {
	
	this.done = false;
	this.sound = S.buff;
	this.num = 0;
	this.cell;
	this.delay = 2;
	this.targets;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		this.cell = targetCell;
		this.targets = targets;
		
		createChipImage(targets, T.chip_bark);
		createChipAureol(targets, T.buff_aureol);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.delay -= dt;
		if (this.delay <= 0) {
			createChipHalo(this.targets);
			this.delay = 2;
		}
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}

var Burning = function() {
	
	this.done = false;
	this.sound = S.fire;
	this.duration = 60;
	
	this.launch = function(launchCell, targetCell, targets) {
		
		createChipImage(targets, T.chip_burning);
		
		this.sound.play();
	}
	
	this.update = function(dt) {
		
		this.duration -= dt;
		if (this.duration <= 0) {
			this.done = true;
		}
	}
}