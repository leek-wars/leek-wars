var R = {loadedData: 0, numData: 0};
var _skinsLoadStarted = false;
var shadowQuality = 0.3;

var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;

var Textures = function() {

	this.leek_hand = newTexture(LW.staticURL + "/image/leek_hand.png", true, shadowQuality);

	this.machine_gun = newTexture(LW.staticURL + "/image/weapon/machine_gun.png", true, shadowQuality);

	this.laser = newTexture(LW.staticURL + "/image/weapon/laser.png", true, shadowQuality);
	this.laser_bullet = newTexture(LW.staticURL + "/image/weapon/laser_bullet.png");

	this.bullet = newTexture(LW.staticURL + '/image/weapon/bullet.png');
	this.shots = newTexture(LW.staticURL + '/image/weapon/shots.png');
	this.cart_machine_gun = newTexture(LW.staticURL + '/image/weapon/cart_machine_gun.png');
	this.cart_laser = newTexture(LW.staticURL + '/image/weapon/cart_laser.png');
	this.m_laser = newTexture(LW.staticURL + "/image/weapon/m_laser.png", true, shadowQuality);
	this.m_laser_bullet = newTexture(LW.staticURL + "/image/weapon/m_laser_bullet.png");
	this.cart_m_laser = newTexture(LW.staticURL + '/image/weapon/cart_m_laser.png');
	this.leek_blood = newTexture(LW.staticURL + '/image/leek_blood.png');
	this.electrisor = newTexture(LW.staticURL + '/image/weapon/electrisor.png', true, shadowQuality);
	this.lightning = newTexture(LW.staticURL + '/image/weapon/lightning.png');
	this.purple_lightning = newTexture(LW.staticURL + '/image/weapon/purple_lightning.png');
	this.red_lightning = newTexture(LW.staticURL + '/image/weapon/red_lightning.png');
	this.particle = newTexture(LW.staticURL + '/image/weapon/particle.png');
	this.double_gun = newTexture(LW.staticURL + '/image/weapon/double_gun.png', true, shadowQuality);
	this.cart_double_gun = newTexture(LW.staticURL + '/image/weapon/cart_double_gun.png');
	this.pistol = newTexture(LW.staticURL + '/image/weapon/pistol.png', true, shadowQuality);
	this.cart_pistol = newTexture(LW.staticURL + '/image/weapon/cart_pistol.png');
	this.shotgun = newTexture(LW.staticURL + '/image/weapon/shotgun.png', true, shadowQuality);
	this.cart_shotgun = newTexture(LW.staticURL + '/image/weapon/cart_shotgun.png');
	this.magnum = newTexture(LW.staticURL + '/image/weapon/magnum.png', true, shadowQuality);
	this.cart_magnum = newTexture(LW.staticURL + '/image/weapon/cart_magnum.png');
	this.grenade_launcher = newTexture(LW.staticURL + '/image/weapon/grenade_launcher.png', true, shadowQuality);
	this.cart_grenade_launcher = newTexture(LW.staticURL + '/image/weapon/cart_grenade_launcher.png');
	this.destroyer = newTexture(LW.staticURL + '/image/weapon/destroyer.png', true, shadowQuality);
	this.cart_destroyer = newTexture(LW.staticURL + '/image/weapon/cart_destroyer.png');
	this.flame_thrower = newTexture(LW.staticURL + '/image/weapon/flame_thrower.png', true, shadowQuality);
	this.gazor = newTexture(LW.staticURL + '/image/weapon/gazor.png', true, shadowQuality);
	this.b_laser = newTexture(LW.staticURL + "/image/weapon/b_laser.png", true, shadowQuality);
	this.b_laser_bullet = newTexture(LW.staticURL + "/image/weapon/b_laser_bullet.png");
	this.cart_b_laser = newTexture(LW.staticURL + '/image/weapon/cart_b_laser.png');
	this.katana = newTexture(LW.staticURL + '/image/weapon/katana.png', true, shadowQuality);
	this.broadsword = newTexture(LW.staticURL + '/image/weapon/broadsword.png', true, shadowQuality);
	this.axe = newTexture(LW.staticURL + '/image/weapon/axe.png', true, shadowQuality);
	this.slash = newTexture(LW.staticURL + '/image/slash.png', true, shadowQuality);

	this.loader = newTexture(LW.staticURL + '/image/engrenage_black.png');
	this.box = newTexture(LW.staticURL + '/image/map/box.png', true, 1);
	this.big_box = newTexture(LW.staticURL + '/image/map/big_box.png', true, 1);
	this.factory = newTexture(LW.staticURL + '/image/map/factory_bg.png');
	this.desert = newTexture(LW.staticURL + '/image/map/desert.png');
	this.desert_rock2_small = newTexture(LW.staticURL + '/image/map/rock2_small.png', true, 1);
	this.desert_grass = newTexture(LW.staticURL + '/image/map/desert_grass.png', true, 1);
	this.cactus = newTexture(LW.staticURL + '/image/map/cactus.png', true, 1);
	this.desert_rock1_big = newTexture(LW.staticURL + '/image/map/rock1_big.png', true, 1),
	this.desert_rock2_big = newTexture(LW.staticURL + '/image/map/rock2_big.png', true, 1),
	this.desert_rock3_big = newTexture(LW.staticURL + '/image/map/rock3_big.png', true, 1),
	this.skull = newTexture(LW.staticURL + '/image/map/skull.png');
	this.cactus = newTexture(LW.staticURL + '/image/map/cactus.png', true, 1);
	this.forest = newTexture(LW.staticURL + '/image/map/forest.png');
	this.forest_rock = newTexture(LW.staticURL + '/image/map/forest_rock.png', true, 1);
	this.forest_rock_small = newTexture(LW.staticURL + '/image/map/forest_rock_small.png', true, 1);
	this.stump = newTexture(LW.staticURL + '/image/map/stump.png', true, 1);
	this.leaf = newTexture(LW.staticURL + '/image/map/leaf.png');
	this.leaf2 = newTexture(LW.staticURL + '/image/map/leaf2.png');
	this.leaf3 = newTexture(LW.staticURL + '/image/map/leaf3.png');
	this.leaf4 = newTexture(LW.staticURL + '/image/map/leaf4.png');
	this.mushroom = newTexture(LW.staticURL + '/image/map/mushroom.png', true, 1);
	this.glacier = newTexture(LW.staticURL + '/image/map/glacier.png');
	this.beach = newTexture(LW.staticURL + '/image/map/beach.png');
	this.starfish = newTexture(LW.staticURL + '/image/map/starfish.png', false, 0, true);
	this.starfish2 = newTexture(LW.staticURL + '/image/map/starfish2.png', false, 0, true);
	this.palm = newTexture(LW.staticURL + '/image/map/palm.png', true, 1, true);
	this.pebble = newTexture(LW.staticURL + '/image/map/pebble.png', true, 1, true);
	this.pebble_small = newTexture(LW.staticURL + '/image/map/pebble_small.png');
	this.snowman = newTexture(LW.staticURL + '/image/map/snowman.png', true, 1, true);
	this.fir = newTexture(LW.staticURL + '/image/map/fir.png', true, 1, true);
	this.ice = newTexture(LW.staticURL + '/image/map/ice.png', true, 1, true);
	this.ice_small = newTexture(LW.staticURL + '/image/map/ice_small.png', true, 1, true);
	this.barrel = newTexture(LW.staticURL + '/image/map/barrel.png', true, 1);
	this.cone = newTexture(LW.staticURL + '/image/map/cone.png', true, 1);
	this.cone_big = newTexture(LW.staticURL + '/image/map/cone_big.png', true, 1);
	this.fire = newTexture(LW.staticURL + '/image/weapon/fire.png');
	this.gaz = newTexture(LW.staticURL + '/image/weapon/gaz.png');
	this.grenade = newTexture(LW.staticURL + '/image/weapon/grenade.png');
	this.explosion = newTexture(LW.staticURL + '/image/weapon/explosion.png');
	this.cloud = newTexture(LW.staticURL + '/image/cloud.png');
	this.grey_cloud = newTexture(LW.staticURL + '/image/grey_cloud.png');
	this.black_cloud = newTexture(LW.staticURL + '/image/black_cloud.png');
	this.nexus_bg = newTexture(LW.staticURL + '/image/map/nexus_bg.png');
	this.nexus_block = newTexture(LW.staticURL + '/image/map/nexus_block.png');
	this.nexus_block_small = newTexture(LW.staticURL + '/image/map/nexus_block_small.png');
	this.rock = newTexture(LW.staticURL + '/image/map/rock.png');
	this.stalactite = newTexture(LW.staticURL + '/image/stalactite.png');
	this.iceberg = newTexture(LW.staticURL + '/image/iceberg.png');
	this.ice_part = newTexture(LW.staticURL + '/image/ice_part.png');
	this.ice_part2 = newTexture(LW.staticURL + '/image/ice_part2.png');
	this.meteorite = newTexture(LW.staticURL + '/image/meteorite.png');
	this.pumpkin = newTexture(LW.staticURL + '/image/map/pumpkin.png', true, 1, true);
	this.red_circle = newTexture(LW.staticURL + '/image/red_circle.png')
	this.daemon_shadow = newTexture(LW.staticURL + '/image/daemon_shadow.png')

	// Chips
	this.cure_aureol = newTexture(LW.staticURL + '/image/cure_aureol.png');
	this.shield_aureol = newTexture(LW.staticURL + '/image/shield_aureol.png');
	this.buff_aureol = newTexture(LW.staticURL + '/image/buff_aureol.png');
	this.halo = newTexture(LW.staticURL + '/image/halo.png');
	this.heal_cross = newTexture(LW.staticURL + '/image/heal_cross.png');
	this.liberation_halo = newTexture(LW.staticURL + '/image/liberation.png');
	this.poison_aureol = newTexture(LW.staticURL + '/image/poison_aureol.png');
	this.shackle_aureol = newTexture(LW.staticURL + '/image/shackle_aureol.png');
	this.damage_return_aureol = newTexture(LW.staticURL + '/image/damage_return_aureol.png');

	// Buff
	this.chip_steroid = newTexture(LW.staticURL + '/image/chip/glyph/steroid.png');
	this.chip_protein = newTexture(LW.staticURL + '/image/chip/glyph/protein.png');
	this.chip_warm_up = newTexture(LW.staticURL + '/image/chip/glyph/warm_up.png');
	this.chip_stretching = newTexture(LW.staticURL + '/image/chip/glyph/stretching.png');
	this.chip_reflexes = newTexture(LW.staticURL + '/image/chip/glyph/reflexes.png');
	this.chip_doping = newTexture(LW.staticURL + '/image/chip/glyph/doping.png');
	this.chip_adrenaline = newTexture(LW.staticURL + '/image/chip/glyph/adrenaline.png');
	this.chip_motivation = newTexture(LW.staticURL + '/image/chip/glyph/motivation.png');
	this.chip_rage = newTexture(LW.staticURL + '/image/chip/glyph/rage.png');
	this.chip_seven_league_boots = newTexture(LW.staticURL + '/image/chip/glyph/seven_league_boots.png');
	this.chip_leather_boots = newTexture(LW.staticURL + '/image/chip/glyph/leather_boots.png');
	this.chip_winged_boots = newTexture(LW.staticURL + '/image/chip/glyph/winged_boots.png');
	this.chip_whip = newTexture(LW.staticURL + '/image/chip/glyph/whip.png');
	this.chip_acceleration = newTexture(LW.staticURL + '/image/chip/glyph/acceleration.png');
	this.chip_solidification = newTexture(LW.staticURL + '/image/chip/glyph/solidification.png');
	this.chip_ferocity = newTexture(LW.staticURL + '/image/chip/glyph/ferocity.png');
	this.chip_collar = newTexture(LW.staticURL + '/image/chip/glyph/collar.png');
	this.chip_bark = newTexture(LW.staticURL + '/image/chip/glyph/bark.png');

	// Shield
	this.chip_helmet = newTexture(LW.staticURL + '/image/chip/glyph/helmet.png');
	this.chip_wall = newTexture(LW.staticURL + '/image/chip/glyph/wall.png');
	this.chip_armor = newTexture(LW.staticURL + '/image/chip/glyph/armor.png');
	this.chip_shield = newTexture(LW.staticURL + '/image/chip/glyph/shield.png');
	this.chip_fortress = newTexture(LW.staticURL + '/image/chip/glyph/fortress.png');
	this.chip_rampart = newTexture(LW.staticURL + '/image/chip/glyph/rampart.png');
	this.chip_carapace = newTexture(LW.staticURL + '/image/chip/glyph/carapace.png');

	// Heal
	this.chip_bandage = newTexture(LW.staticURL + '/image/chip/glyph/bandage.png');
	this.chip_cure = newTexture(LW.staticURL + '/image/chip/glyph/cure.png');
	this.chip_vaccine = newTexture(LW.staticURL + '/image/chip/glyph/vaccine.png');
	this.chip_regeneration = newTexture(LW.staticURL + '/image/chip/glyph/regeneration.png');
	this.chip_drip = newTexture(LW.staticURL + '/image/chip/glyph/drip.png');
	this.chip_armoring = newTexture(LW.staticURL + '/image/chip/glyph/armoring.png');
	this.chip_remission = newTexture(LW.staticURL + '/image/chip/glyph/remission.png');
	this.chip_loam = newTexture(LW.staticURL + '/image/chip/glyph/loam.png');
	this.chip_fertilizer = newTexture(LW.staticURL + '/image/chip/glyph/fertilizer.png');

	// Damage return
	this.chip_thorn = newTexture(LW.staticURL + '/image/chip/glyph/thorn.png');
	this.chip_mirror = newTexture(LW.staticURL + '/image/chip/glyph/mirror.png');

	// Poison
	this.chip_venom = newTexture(LW.staticURL + '/image/chip/glyph/venom.png');
	this.chip_toxin = newTexture(LW.staticURL + '/image/chip/glyph/toxin.png');
	this.chip_plague = newTexture(LW.staticURL + '/image/chip/glyph/plague.png');

	// Shackles
	this.chip_slow_down = newTexture(LW.staticURL + '/image/chip/glyph/slow_down.png');
	this.chip_ball_and_chain = newTexture(LW.staticURL + '/image/chip/glyph/ball_and_chain.png');
	this.chip_tranquilizer = newTexture(LW.staticURL + '/image/chip/glyph/tranquilizer.png');
	this.chip_soporific = newTexture(LW.staticURL + '/image/chip/glyph/soporific.png');
	this.chip_fracture = newTexture(LW.staticURL + '/image/chip/glyph/fracture.png');

	// Lama
	this.lama = newTexture(LW.staticURL + '/image/lama_big.png');

	// Bug
	this.bug = newTexture(LW.staticURL + '/image/leek_bug.png');

	// Bulbs
	this.bulb_front = newTexture(LW.staticURL + '/image/bulb/puny_bulb_front.png', true, shadowQuality);
	this.bulb_back = newTexture(LW.staticURL + '/image/bulb/puny_bulb_back.png', true, shadowQuality);
	this.fire_bulb_front = newTexture(LW.staticURL + '/image/bulb/fire_bulb_front.png', true, shadowQuality);
	this.fire_bulb_back = newTexture(LW.staticURL + '/image/bulb/fire_bulb_back.png', true, shadowQuality);
	this.healer_bulb_front = newTexture(LW.staticURL + '/image/bulb/healer_bulb_front.png', true, shadowQuality);
	this.healer_bulb_back = newTexture(LW.staticURL + '/image/bulb/healer_bulb_back.png', true, shadowQuality);
	this.rocky_bulb_front = newTexture(LW.staticURL + '/image/bulb/rocky_bulb_front.png', true, shadowQuality);
	this.rocky_bulb_back = newTexture(LW.staticURL + '/image/bulb/rocky_bulb_back.png', true, shadowQuality);
	this.iced_bulb_front = newTexture(LW.staticURL + '/image/bulb/iced_bulb_front.png', true, shadowQuality);
	this.iced_bulb_back = newTexture(LW.staticURL + '/image/bulb/iced_bulb_back.png', true, shadowQuality);
	this.lightning_bulb_front = newTexture(LW.staticURL + '/image/bulb/lightning_bulb_front.png', true, shadowQuality);
	this.lightning_bulb_back = newTexture(LW.staticURL + '/image/bulb/lightning_bulb_back.png', true, shadowQuality);
	this.metallic_bulb_front = newTexture(LW.staticURL + '/image/bulb/metallic_bulb_front.png', true, shadowQuality);
	this.metallic_bulb_back = newTexture(LW.staticURL + '/image/bulb/metallic_bulb_back.png', true, shadowQuality);
}

var newTexture = function(path, buildShadow, quality, inverse) {
	R.numData++;

	var texture = new Image();

	texture.crossOrigin = "anonymous";

	texture.onload = function() {
		if (buildShadow) {
			buildTextureShadow(this, quality);
		}
		resourceLoaded(path);
	};
	texture.onerror = function(err) {
		_.logW("Error loading : " + path);
		resourceLoaded(path);
	}
	texture.onabort = function(err) {
		_.logW("Error loading : " + path);
		resourceLoaded(path);
	}
	texture.inverse = inverse;


	// Start loading
	texture.src = path;

    return texture;
}

var _createScaledTexture = function(texture, width, height, inverse) {

	try {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		var ctx = canvas.getContext('2d');
		if (inverse) {
			ctx.translate(width, 0);
			ctx.scale(-1, 1);
		}
		ctx.drawImage(texture, 0, 0, width, height);
		if (isFinite(width) && isFinite(height))
			ctx.putImageData(ctx.getImageData(0, 0, width, height), 0, 0);

		return canvas;
	} catch (e) {
		return texture;
	}
}

var buildTextureShadow = function(texture, quality) {

	try {

		if (quality == null) quality = 1;

		var canvas = document.createElement('canvas');
		canvas.width = texture.width * quality;
		canvas.height = texture.height * quality;
		var context = canvas.getContext('2d');
		context.drawImage(texture, 0, 0, canvas.width, canvas.height);

		var newTexture = new Image();
		newTexture = context.getImageData(0, 0, canvas.width, canvas.height);

		var textureSize = canvas.width * canvas.height;
		for (var i = 0; i < textureSize * 4; i += 4) {
		  newTexture.data[i] = 0;
		  newTexture.data[i + 1] = 0;
		  newTexture.data[i + 2] = 0;
		}

		context.putImageData(newTexture, 0, 0);
		texture.shadow = canvas;

	} catch (e) {
		return null;
	}
}

var Sounds = function() {

	this.machine_gun = new Sound(LW.staticURL + "/sound/machine_gun.wav");
	this.laser = new Sound(LW.staticURL + "/sound/laser.wav");
	this.m_laser = new Sound(LW.staticURL + "/sound/m_laser.wav");
	this.electrisor = new Sound(LW.staticURL + "/sound/m_laser.wav");
	this.double_gun = new Sound(LW.staticURL + "/sound/double_gun.wav");
	this.shotgun = new Sound(LW.staticURL + "/sound/shotgun.wav");
	this.grenade_launcher = new Sound(LW.staticURL + "/sound/grenade_launcher.wav");
	this.sword = new Sound(LW.staticURL + "/sound/sword.wav");
}

function Sound(src) {

	if (_iOS) return;

	R.numData++;

	this.sound = document.createElement('audio');
	this.sound.controls = true;
	this.sound.addEventListener("loadeddata", function() {
		resourceLoaded(src);
	}, true);
	this.sound.addEventListener("error", function() {
		//~ _.log("Error loading (error) : " + src);
		resourceLoaded(src);
	}, true);
	this.sound.addEventListener("abort", function() {
		//~ _.log("Error loading (abort) : " + src);
		resourceLoaded(src);
	}, true);
	this.sound.addEventListener("stalled", function() {
		//~ _.log("Error loading (stalled) : " + src);
		resourceLoaded(src);
	}, true);
	this.sound.addEventListener("suspend", function() {
		//~ _.log("Suspend : " + src);
	}, true);
	this.sound.addEventListener("emptied", function() {
		//~ _.log("Emptied : " + src);
	}, true);

	this.play = function() {
		if (game.sound) {
			this.sound.currentTime = 0;
			this.sound.play();
		}
	}

	this.sound.src = src;
	this.sound.load();
}

var Maps = function() {

	return [
		new Nexus(),
		new Factory(),
		new Desert(),
		new Forest(),
		new Glacier(),
		new Beach()
	];
}

function resourceLoaded(res) {
	R.loadedData++;
	//~ console.log("Resource loaded : " + res + " (" + R.loadedData + "/" + R.numData + ")");
	if (R.loadedData == R.numData && game.initialized == true) {
		game.launch(); // Start game if all resources are loaded
	}
}
