// Params
var FPS = 60;
var MAX_DT = 8;
var GROUND_TEXTURE = true;
var SHADOWS = true;
var SHADOW_SCALE = 0.5;
var SHADOW_ALPHA = 0.3;
var RATIO = 1.8;
var QUALITIES = ['high', 'medium', 'low'];

var lastTime = new Date().getTime();
var dt = 0;
var frameTime = 1000 / FPS;
var lastFPS = new Array();

// var hidden, visibilityState, visibilityChange;

// if (typeof document.hidden !== "undefined") {
// 	hidden = "hidden", visibilityChange = "visibilitychange", visibilityState = "visibilityState";
// } else if (typeof document.mozHidden !== "undefined") {
// 	hidden = "mozHidden", visibilityChange = "mozvisibilitychange", visibilityState = "mozVisibilityState";
// } else if (typeof document.msHidden !== "undefined") {
// 	hidden = "msHidden", visibilityChange = "msvisibilitychange", visibilityState = "msVisibilityState";
// } else if (typeof document.webkitHidden !== "undefined") {
// 	hidden = "webkitHidden", visibilityChange = "webkitvisibilitychange", visibilityState = "webkitVisibilityState";
// }
// var document_hidden = document[hidden];
// document.addEventListener(visibilityChange, function() {
// 	if (!game) return null
// 	if (document_hidden != document[hidden]) {
// 		if (document[hidden]) {
// 			game.focus = false;
// 		} else {
// 			game.focus = true;
// 		}
// 		document_hidden = document[hidden];
// 	}
// });

function update() {
	if (!game.paused) {
		setTimeout(update, frameTime)
		game.update()
	}
}

var Game = function() {

	var WEAPONS = [
		Pistol, // 1
		MachineGun, // 2
		DoubleGun, // 3
		Shotgun,  // 4
		Magnum, // 5
		Laser, // 6
		GrenadeLauncher, // 7
		FlameThrower, // 8
		Destroyer, // 9
		Gazor, // 10
		Electrisor, // 11
		MLaser, // 12
		BLaser, // 13
		Katana, // 14
		Broadsword, // 15
		Axe // 16
	];

	var CHIPS = [
		Bandage, // 1
		Cure, // 2
		Drip, // 3
		Regeneration, // 4
		Vaccine, // 5
		Shock, // 6
		Flash, // 7
		Lightning, // 8
		Spark, // 9
		Flame, // 10
		Meteorite, // 11
		Pebble, // 12
		Rock, // 13
		Rockfall, // 14
		Ice, // 15
		Stalactite, // 16
		Iceberg, // 17
		Shield, // 18
		Helmet, // 19
		Armor, // 20
		Wall, // 21
		Rampart, // 22
		Fortress, // 23
		Protein, // 24
		Steroid, // 25
		Doping, // 26
		Stretching, // 27
		WarmUp, // 28
		Reflexes, // 29
		LeatherBoots, // 30
		WingedBoots, // 31
		SevenLeagueBoots, // 32
		Motivation, // 33
		Adrenaline, // 34
		Rage, // 35
		Liberation, // 36
		Teleportation, // 37
		Armoring, // 38
		Inversion, // 39
		null, // 40
		null, // 41
		null, // 42
		null, // 43
		null, // 44
		null, // 45
		null, // 46
		Remission, // 47
		Carapace, // 48
		null, // 49
		DevilStrike, // 50
		Whip, // 51
		Loam, // 52
		Fertilizer, // 53
		Acceleration, // 54
		SlowDown, // 55
		BallAndChain, // 56
		Tranquilizer, // 57
		Soporific, // 58
		Fracture, // 59
		Solidification, // 60
		Venom, // 61
		Toxin, // 62
		Plague, // 63
		Thorn, // 64
		Mirror, // 65
		Ferocity, // 66
		Collar, // 67
		Bark, // 68
		Burning, // 69
		Antidote // 70
	];

	this.entitiesTypes = [
		Leek,
		Bulb
	];

	this.initialized = false
	this.paused = false
	this.requestPause = false
	this.speed = 1
	this.focus = true
	this.going_to_report = false

	this.width;
	this.height;

	// Particles system
	this.particles = new Particles();

	// Ground
	this.ground = new Ground();

	// Drawable elements
	this.drawableElements;
	this.drawableElementCurrentId = -1;

	// Players
	this.teams = new Array()
	this.leeks = new Array()
	this.entityOrder = new Array()
	this.states = new Array()

	// Actions
	this.data = null;
	this.actions = new Array();
	this.currentAction = -1;
	this.actionToDo = true;
	this.actionDelay = 0;
	this.fightEnd = false;
	this.turn = 1;
	this.turnPosition = new Object();

	this.effects = new Array();

	// Chips
	this.chips = new Array();

	// Hud
	this.hud = new Hud();

	// Logs
	this.logs = new Array();
	this.currentLog = 0;

	// Marqueurs
	this.markers = new Array();

	// Map
	this.map;

	this.drawArea = 0;

	// Mouse
	this.mouseX = 0;
	this.mouseY = 0;
	this.mouseTileX = 0;
	this.mouseTileY = 0;
	this.mouseCell = 0;

	// Settings
	this.large = true;
	this.debug = false;
	this.tactic = false;
	this.quality = 'high';
	this.discretePause = false;

	// Init drawable elements array
	this.drawableElements = new Array();
	for (i = 0; i < this.ground.tilesY * 2; i++) {
		this.drawableElements[i] = {};
	}

	// Settings
	if (localStorage['fight/large'] == undefined) localStorage['fight/large'] = true;
	if (localStorage['fight/sound'] == undefined) localStorage['fight/sound'] = true;

	this.large = localStorage['fight/large'] === 'true';
	this.debug = localStorage['fight/debug'] === 'true';
	this.tactic = localStorage['fight/tactic'] === 'true';
	this.quality = QUALITIES.indexOf(localStorage['fight/quality']) != -1 ? localStorage['fight/quality'] : 'high';
	this.showCells = localStorage['fight/cells'] === 'true';
	this.showLifes = localStorage['fight/lifes'] === 'true';
	this.sound = localStorage['fight/sound'] === 'true';
	this.discretePause = localStorage['fight/discrete_pause'] === 'true';

	/*
	 * Rapport reçu : on peut charger les ressources
     */
	this.init = function(fight) {

		_.log("Init fight...")

		//if (game.inited) return false;

		game.data = fight;

		// Check data
		if (fight == null) {
			_.logW("Fight is null...")
			this.error();
			return;
		}

		game.map = M[fight.data.map.type + 1]

		// Atmosphere sound of the map
		game.atmosphere = game.map.sound;

		game.obstacles = fight.data.map.obstacles

		// Add entities
		var entities = fight.data.leeks;

		for (i = 0; i < entities.length; ++i) {

			var type = typeof(entities[i].type) === 'undefined' ? Entity.LEEK : entities[i].type;

			var entity = new game.entitiesTypes[type]();

			// Infos vitales
			entity.id = entities[i].id;
			entity.name = entities[i].name;
			entity.level = entities[i].level;
			entity.team = entities[i].team;
			entity.type = type;
			entity.summon = typeof(entities[i].summon) === 'undefined' ? false : entities[i].summon;
			if (entity.team == 2) {
				entity.orientation = -1;
			}
			if (entity.summon) {
				entity.name = _.lang.get('entity', entity.name)
			}

			entity.farmer = 0
			if (typeof(entities[i].farmer) !== 'undefined') {
				entity.farmer = entities[i].farmer
			}

			////// Stats

			// Life
			entity.life = entities[i].life;
			entity.maxLife = entity.life;

			// Strength
			entity.strength = 0
			if (typeof(entities[i].force) !== 'undefined') {
				entity.strength = entities[i].force
			}
			if (typeof(entities[i].strength) !== 'undefined') {
				entity.strength = entities[i].strength
			}

			// Wisdom
			entity.wisdom = 0
			if (typeof(entities[i].wisdom) !== 'undefined') {
				entity.wisdom = entities[i].wisdom
			}

			// Agility
			entity.agility = 0
			if (typeof(entities[i].agility) !== 'undefined') {
				entity.agility = entities[i].agility
			}

			// Resistance
			entity.resistance = 0
			if (typeof(entities[i].resistance) !== 'undefined') {
				entity.resistance = entities[i].resistance
			}

			// Frequency
			entity.frequency = 0
			if (typeof(entities[i].frequency) !== 'undefined') {
				entity.frequency = entities[i].frequency
			}

			// Science
			entity.science = 0
			if (typeof(entities[i].science) !== 'undefined') {
				entity.science = entities[i].science
			}

			// Magic
			entity.magic = 0
			if (typeof(entities[i].magic) !== 'undefined') {
				entity.magic = entities[i].magic
			}

			// TP
			entity.tp = 0
			if (typeof(entities[i].pt) !== 'undefined') {
				entity.tp = entities[i].pt
			}
			if (typeof(entities[i].tp) !== 'undefined') {
				entity.tp = entities[i].tp
			}
			entity.maxTP = entity.tp

			// MP
			entity.mp = 0
			if (typeof(entities[i].pm) !== 'undefined') {
				entity.mp = entities[i].pm
			}
			if (typeof(entities[i].mp) !== 'undefined') {
				entity.mp = entities[i].mp
			}
			entity.maxMP = entity.mp

			entity.setCell(entities[i].cellPos);

			game.leeks[entity.id] = entity;
			game.entityOrder.push(entity)

			// entity
			if (entity.type == Entity.LEEK) {

				if (game.teams[entity.team - 1] == undefined) {
					game.teams[entity.team - 1] = []
				}
				game.teams[entity.team - 1].push(entity);

				// Skin
				var skin = typeof(entities[i].skin) === 'undefined' ? 1 : entities[i].skin
				var hat = typeof(entities[i].hat) === 'undefined' ? null : entities[i].hat
				entity.setSkin(entities[i].appearence, skin, hat)

				entity.active = true;

				entity.drawID = game.addDrawableElement(entity, entity.y);

			} else if (entity.type == Entity.BULB) {

				entity.setSkin(entities[i].skin);
			}
		}

		// Actions
		game.actions = fight.data.actions;
		game.currentAction = 0;

		// Check first action
		if (game.actions.length == 0 || game.actions[game.currentAction][0] != ACTION_START_FIGHT) {
			_.logW("Error ! no action START_FIGHT");
			this.error();
			return;
		}

		// Get the relative position of the turns in the actions
		game.turnPosition = {1: 0}
		for (var i = 0; i < game.actions.length; ++i) {
			if (game.actions[i][0] === ACTION_NEW_TURN) {
				game.turnPosition[game.actions[i][1]] = i / game.actions.length
			}
		}

		// Chargement des logs
		if (LW.connected) {

			_.post('fight/get-logs', {fight_id: _id}, function(data) {
				if (data.success) {
					game.setLogs(data.logs)
					LW.setHabs(data.habs)
				}
			})
		}

		// On a chargé tout le jeu, on peut charger les ressources
		// le jeu démarrera quand toutes les ressources seront ok
		game.initialized = true

		if (R.loadedData == R.numData) {
			game.launch() // Start game if all resources are loaded
		} else {
			_.log('Wait for the resources...')
		}
	}

	this.setLogs = function(logs) {

		game.logs = logs
	}

	/*
	 * Ressources chargées, on peut y aller
	 */
	this.launch = function() {

		_.log("Starting fight...")

		// Atmosphere sound
		if (game.atmosphere != null && game.sound) {
			game.atmosphere.loop()
		}

		// Obstacles
		var obstacles = game.obstacles;

		for (i in obstacles) {

			var type = obstacles[i][0];
			var size = obstacles[i][1];

			if (size != -1) {

				var obstacle = new Obstacle(type, size, i);

				game.ground.addObstacle(obstacle);
			}
		}

		$('#loading').hide();
		$('#game').show();

		// Mouse move
		this.setupMouseMove();

		this.hud.init();
		this.hud.refresh();

		if (game.large)	LW.enlarge()
		LW.pages.fight.resize()

		for (var l in game.leeks) {
			if (game.leeks[l].active) game.leeks[l].computeOrginPos()
		}

		game.log(_.lang.get('fight', 'start_of_fight'))

        for (var i = 0; i < game.leeks.length; i++) {

            var leek = game.leeks[i]

            game.states[leek.id] = {
                absolute_shield: 0,
                relative_shield: 0,
                active: leek.type == 0,
                life: leek.life,
                max_life: leek.life,
                tp: leek.tp,
                mp: leek.mp,
                agility: leek.agility,
                strength: leek.strength,
                wisdom: leek.wisdom,
                damage_return: leek.damage_return,
                science: leek.science,
                magic: leek.magic,
                resistance: leek.resistance,
                cell: leek.cell,
                weapon: undefined,
                effects: []
            }
        }

        $('#progress-bar').click(function(e) {
        	var action = Math.round(game.actions.length * (e.pageX - $(this).offset().left) / $(this).width())
        	game.jump(action)
        })

		/*
		 *  Launch!
		 */
        update()
    }

    this.error = function() {

		$('#loading').hide();
		$('#error').show();
		_error = true;
	}

	// Click
	$(canvas).click(function() {
		if (game.paused) {
			game.resume();
		}
	});

	this.computeDT = function() {

		var timeNow = new Date().getTime();
		var delay = timeNow - lastTime;
		dt = delay * 0.001 * 60 * this.speed;
		if (dt > MAX_DT) dt = MAX_DT;
		lastTime = timeNow;
		game.fps = Math.floor(1000 / delay);

		lastFPS.push(game.fps);
		if (lastFPS.length > 30) lastFPS.shift();
		game.avgFPS = 0;
		for (var f in lastFPS) game.avgFPS += lastFPS[f];
		game.avgFPS = Math.round(game.avgFPS / 30);
	}

	this.speedUp = function() {
		if (game.speed == 1) {
			game.speed = 3;
			LW.setTooltipContent($('#tt_speed-button'), _.lang.get('fight', 'accelerate_again') + ' (S)');
		} else if (game.speed == 3) {
			game.speed = 12;
			LW.setTooltipContent($('#tt_speed-button'), _.lang.get('fight', 'decelerate') + ' (S)');
		} else {
			game.speed = 1;
			LW.setTooltipContent($('#tt_speed-button'), _.lang.get('fight', 'accelerate') + ' (S)');
			$('#speed-button').css('opacity', '');
		}
	}

	this.toggleSize = function() {
		if (this.large) {
			this.large = false;
			LW.shrink()
		} else {
			this.large = true;
			LW.enlarge()
		}
		localStorage['fight/large'] = this.large
	}

	this.toggleDebug = function() {
		this.debug = !this.debug;
		localStorage['fight/debug'] = this.debug
		if (this.debug) $('#debug').show(); else $('#debug').hide();
	}

	this.toggleTactic = function() {
		this.tactic = !this.tactic;
		localStorage['fight/tactic'] = this.tactic

		this.requestPause = this.paused;
		this.draw(); // redraw
	}

	this.toggleCells = function() {
		this.showCells = !this.showCells;
		localStorage['fight/cells'] = this.showCells

		this.requestPause = this.paused;
		this.draw(); // redraw
	}

	this.toggleLifes = function() {
		this.showLifes = !this.showLifes;
		localStorage['fight/lifes'] = this.showLifes

		this.requestPause = this.paused;
		this.draw(); // redraw
	}

	this.changeQuality = function(quality) {
		this.quality = QUALITIES.indexOf(quality) != -1 ? quality : 'high';
		localStorage['fight/quality'] = this.quality
	}

	this.toggleSound = function() {
		this.sound = !this.sound;
		if (game.atmosphere != null) {
			if (this.sound) {
				game.atmosphere.loop()
			} else {
				game.atmosphere.stop()
			}
		}
		localStorage['fight/sound'] = this.sound
	}

	this.toggleDiscretePause = function() {
		this.discretePause = !this.discretePause;
		localStorage['fight/discrete_pause'] = this.discretePause

		this.requestPause = this.paused;
		this.draw(); // redraw
	}

	this.update = function() {

		if (!this.paused) {

			this.computeDT()

			// Logs
			var needPause = this.readLogs()

			// Actions
			if (!needPause) {

				if (!this.fightEnd) {

					if (this.actionToDo) {

						this.actionDelay -= dt;

						if (this.actionDelay <= 0) {

							this.actionDelay = 0
							this.actionToDo = false

							this.currentAction++
							this.updateBar()

							var action = this.actions[this.currentAction]

							if (action == undefined) {

								this.log(_.lang.get('fight', 'end_of_fight'));
								this.fightEnd = true;

								game.reportTimer = setTimeout(this.showReport, 2500)
								return
							}

							this.doAction(action)
						}
					}
				}

				this.drawArea -= dt;

				// Show cell
				if (this.showCellTime > 0) {
					this.showCellTime -= dt;
					if (this.showCellTime <= 0) {
						this.actionDone();
					}
				}

				// Leeks
				for (i in this.leeks) {
					if (this.leeks[i].active) this.leeks[i].update(dt);
				}

				// Chips
				for (var c = 0; c < this.chips.length; ++c) {
					var chip = this.chips[c];
					chip.update(dt);
					if (chip.done) {
						this.chips.splice(c, 1);
						c--;
						this.actionDone();
					}
					if (chip.willFinish) {
						this.chips.splice(c, 1);
						c--;
					}
				}

				// Particles
				this.particles.update(dt);
			}

			/// Draw
			if (this.focus) {
				this.draw();
			}
		}
	}

	this.pause = function() {
		if (!this.requestPause && !this.paused) {
			if (game.atmosphere != null) {
				game.atmosphere.stop()
			}
			this.requestPause = true
			$('#play-button').attr('src', LW.staticURL + 'image/icon/play.png')
			LW.setTooltipContent($('#tt_play-button'), _.lang.get('fight', 'resume') + ' (P)')
		}
	}

	this.resume = function() {
		if (this.paused) {
			if (game.atmosphere != null) {
				game.atmosphere.loop()
			}
			this.paused = false
			$('#play-button').attr('src', LW.staticURL + 'image/icon/pause.png')
			LW.setTooltipContent($('#tt_play-button'), _.lang.get('fight', 'pause') + ' (P)')
			update()
		}
	}

	this.doAction = function(action) {

		var type = action[0]

		switch (type) {

			case ACTION_NEW_TURN:

				this.turn = action[1]

				this.actionDone()
				break

			case ACTION_LEEK_TURN:

				this.currentPlayer = action[1];

				if (typeof(action[2]) != 'undefined' && typeof(action[3]) != 'undefined') {
					this.leeks[action[1]].tp = action[2];
					this.leeks[action[1]].mp = action[3];
				}

				if (!this.jumping) {
					// Update markers
					for (var m in this.markers) {
						var marker = this.markers[m];
						if (marker.owner == this.currentPlayer) {
							marker.duration--;
							if (marker.duration == 0) {
								delete this.markers[m];
							}
						}
					}
				}

				this.actionDone()
				break

			case ACTION_END_TURN:

				// Reinitialisation of characteristics
				this.leeks[action[1]].tp = action[2]
				this.leeks[action[1]].mp = action[3]
				if (action.length > 4) this.leeks[action[1]].strength = action[4]
				if (action.length > 5) this.leeks[action[1]].magic = action[5]

				this.actionDone()
				break

			case ACTION_MOVE_TO:

				if (this.jumping) {

					this.leeks[action[1]].cell = action[2]
					this.actionDone()

				} else {

					this.leeks[action[1]].move(action[3])
				}

				break

			case ACTION_MP_LOST:

				this.leeks[action[1]].looseMP(action[2], this.jumping)

				this.actionDone()
				break

			case ACTION_CARE:

				this.leeks[action[1]].care(action[2], this.jumping)

				if (!this.jumping) {

					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						this.colorText(_.lang.get('fight', 'n_life', action[2]), LIFE_COLOR)
					))
				}

				this.actionDone()
				break

			case ACTION_BOOST_VITA:

				this.leeks[action[1]].boostVita(action[2], this.jumping)

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						this.colorText(_.lang.get('fight', 'n_vita', action[2]), LIFE_COLOR)
					))
				}

				this.actionDone()
				break

			case ACTION_SET_WEAPON:

				this.leeks[action[1]].setWeapon(new WEAPONS[action[2] - 1]())

				if (!this.jumping) {
					this.log(_.lang.get('fight' , 'leek_take_weapon',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						_.lang.get('weapon', LW.weapons[LW.weaponTemplates[action[2]].item].name)
					))
				}
				this.actionDone()
				break

			case ACTION_USE_CHIP:

				var launcher = action[1];
				var cell = action[2];
				var chip = action[3];
				var result = action[4];
				var leeksID = action[5];

				if (this.jumping) {
					// Update leek cell after teleportation
					if (chip == 37) {
						this.leeks[launcher].cell = cell;
					}
					// Update leeks cells after inversion
					if (chip == 39) {
						this.leeks[leeksID[0]].cell = this.leeks[launcher].cell;
						this.leeks[launcher].cell = cell;
					}
					this.actionDone()
					break
				}

				var log = _.lang.get('fight', 'leek_cast',
					this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
					_.lang.get('chip', LW.chips[LW.chipTemplates[chip].item].name)
				)

				if (result > 0) { // Success!

					if (result == 2) {
						log += "... " + _.lang.get('effect', 'critical');
					}
					if (CHIPS[action[3] - 1] != undefined) {

						var chip = new CHIPS[action[3] - 1]();

						var leeks = new Array();
						for (var l in leeksID) {
							leeks.push(this.leeks[leeksID[l]]);
						}

						this.leeks[action[1]].useChip(chip, cell, leeks);
						this.chips.push(chip);

					} else {
						this.actionDone();
					}
				} else {
					// log += "... " + _.lang.get('fight', 'fail');
					this.actionDone();
				}

				this.log(log)

				break;

			case ACTION_USE_WEAPON: {

				if (this.jumping) {
					this.actionDone()
					break
				}

				var launcher = action[1];
				var cell = action[2];
				var weapon = action[3];
				var result = action[4];
				var leeksID = action[5];

				var gesture = this.leeks[action[1]].weapon.white ? 'leek_hit' : 'leek_shoot'
				var log = _.lang.get('fight', gesture, this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])));

				if (result > 0) { // Success!

					if (result == 2) {
						log += "... " + _.lang.get('fight', 'critical');
					}

					var leeks = new Array();
					for (var l in leeksID) {
						leeks.push(this.leeks[leeksID[l]]);
					}

					this.leeks[launcher].useWeapon(cell, leeks);

					// Pas de cibles workaround
					if (leeksID.length == 0) {
						this.actionDone();
					}
				}

				this.log(log)

				break
			}
			case ACTION_LIFE_LOST:

				var erosion = action.length > 3 ? action[3] : 0
				this.leeks[action[1]].looseLife(action[2], erosion, this.jumping)

				if (!this.jumping) {

					this.log(_.lang.get('fight', 'leek_loose_x',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						this.colorText(_.lang.get('fight', 'n_life', action[2]), LIFE_COLOR)
					))

					this.leeks[action[1]].randomHurt()
				}

				this.actionDone()
				break

			case ACTION_TP_LOST:

				this.leeks[action[1]].looseTP(action[2], this.jumping)

				this.actionDone()
				break

			case ACTION_PLAYER_DEAD:

				var entity = this.leeks[action[1]]
				if (entity.summon) {
					this.hud.removeEntityBlock(entity)
				}

				if (this.jumping) {

					entity.dead = true
					this.removeDrawableElement(entity.drawID, entity.dy)
					this.actionDone()

				} else {

					this.log(_.lang.get('fight', 'leek_is_dead', this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1]))));

					entity.kill() // Animation
				}

				break

			case ACTION_SAY:

				if (!this.jumping) {

					this.log(_.lang.get('fight', 'leek_speak', this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])), _.protect(action[2])));

					this.leeks[action[1]].say(action[2])
				}

				this.actionDone()
				break

			case ACTION_LAMA:

				if (!this.jumping) {
					this.leeks[action[1]].sayLama()
				}

				this.actionDone()
				break

			case ACTION_SUMMON:
				var caster = action[1];
				var summonID = action[2];
				var cell = action[3];

				var summon = this.leeks[summonID];

				summon.setCell(cell);
				summon.summoner = this.leeks[caster]
				summon.active = true;

				summon.drawID = this.addDrawableElement(summon, summon.y);

				this.hud.addEntityBlock(summon);

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'summon',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						this.colorText(summon.name, this.getLeekColor(summon.id))
					))
					S.bulb.play()
				}
				this.actionDone()
				break

			case ACTION_RESURRECTION:

				var caster = action[1]
				var target = action[2]
				var cell = action[3]
				var life = action[4]
				var maxLife = action[5]

				var entity = this.leeks[target]

				entity.setCell(cell)
				entity.life = life
				entity.maxLife = maxLife
				entity.active = true
				entity.reborn()

				entity.drawID = game.addDrawableElement(entity, entity.y)
				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_resurrect',
						this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
						this.colorText(this.leeks[action[2]].name, this.getLeekColor(action[2]))
					))
				}

				this.actionDone()
				break

			case ACTION_SHOW:

				if (this.jumping) {
					this.actionDone()
					break
				}

				this.showCellCell = action[2];
				this.showCellColor = '#' + action[3];
				var pos = this.ground.cellToXY(this.showCellCell);
				var xy = this.ground.xyToXYPixels(pos.x, pos.y);
				this.showCellX = xy.x * this.ground.scale;
				this.showCellY = xy.y * this.ground.scale;
				this.showCellTime = 50;

				this.log(_.lang.get('fight', 'leek_show_cell', this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])), action[2]));

				break;

			case ACTION_ADD_WEAPON_EFFECT : {

				this.addEffect(action, 'weapon')
				this.actionDone()
				break
			}

			case ACTION_ADD_CHIP_EFFECT : {

				this.addEffect(action, 'chip')
				this.actionDone()
				break
			}

			case ACTION_REMOVE_EFFECT : {

				this.removeEffect(action[1])
				this.actionDone()
				break
			}

			case ACTION_BUG:

				if (!this.jumping) {
					this.leeks[action[1]].bug()
				}

				this.actionDone()
				break

			case ACTION_END_FIGHT:

				this.fightEnd = true

				break

			default: {
				_.logW("Error : unknown action type (" + type + ")");
				this.actionDone()
			}
		}

		if (!this.jumping) {

			// On actualise le hud à chaque action
			this.hud.refresh()

			// On peut logger pour cette action !
			this.currentLog = 0
		}
	}

	this.addEffect = function(action, object) {

		var objectID = action[1];
		var id = action[2];
		var caster = action[3];
		var target = action[4];
		var effect = action[5];
		var value = action[6];
		var leek = this.leeks[target];

		// Ajout de l'effet
		this.effects[id] = {id: id, object: objectID, objectType: object, caster: caster, target: target, effect: effect, value: value};

		if (!this.jumping) {
			// Ajout de l'image sur le hud
			var image;
			if (object == 'chip') {

				if (objectID in LW.chips) {
					image = LW.staticURL + "image/chip/small/" + LW.chips[objectID].name + ".png";
				}

			} else if (object == 'weapon') {

				if (objectID in LW.weapons) {

					/*var WEAPONS = [
						Pistol, // 1
						MachineGun, // 2
						DoubleGun, // 3
						Shotgun,  // 4
						Magnum, // 5
						Laser, // 6
						GrenadeLauncher, // 7
						FlameThrower, // 8
						Destroyer, // 9
						Gazor, // 10
						Electrisor, // 11
						MLaser, // 12
						BLaser, // 13
						Katana, // 14
						Broadsword, // 15
						Axe // 16
					];*/

					var template = LW.weapons[objectID].template
					var img = ["1", "2", "3", "4", "5", "6", "7", "flamme", "destroyer", "gaz_icon", "11", "12", "13", "katana", "broadswoard", "axe"][template - 1];
					image = LW.staticURL + "image/weapon/" + img + ".png";

					// Gestion des états du poireau
					if (template == 8) {
						leek.burn()
					} else if (template == 10) {
						leek.gaz()
					}
				}
			}
			this.hud.addEntityEffect(this.effects[id], image)
		}

		// Action !

		switch (effect) {

			case LW.EFFECT.ABSOLUTE_SHIELD:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_absolute_shield', value), SHIELD_COLOR)
					))
				}

				leek.buffAbsoluteShield(value, this.jumping)
				break;

			case LW.EFFECT.RELATIVE_SHIELD:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_relative_shield', value + '%'), SHIELD_COLOR)
					))
				}

				leek.buffRelativeShield(value, this.jumping)
				break;

			case LW.EFFECT.VULNERABILITY:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_receives_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_vulnerability', value + '%'), SHIELD_COLOR)
					))
				}
				leek.buffRelativeShield(-value, this.jumping)
				break;

			case LW.EFFECT.BUFF_AGILITY:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_agility', value), AGILITY_COLOR)
					))
				}

				leek.buffAgility(value, this.jumping)
				break;

			case LW.EFFECT.BUFF_STRENGTH:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_strength', value), STRENGTH_COLOR)
					))
				}

				leek.buffStrength(value, this.jumping)
				break;

			case LW.EFFECT.BUFF_TP:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_tp', value), TP_COLOR)
					))
				}

				leek.buffTP(value, this.jumping);
				break;

			case LW.EFFECT.BUFF_MP:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_mp', value), MP_COLOR)
					))
				}

				leek.buffMP(value, this.jumping)
				break;

			case LW.EFFECT.BUFF_WISDOM:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_wisdom', value), WISDOM_COLOR)
					))
				}

				leek.buffWisdom(value, this.jumping)
				break;

			case LW.EFFECT.BUFF_RESISTANCE:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_resistance', value), RESISTANCE_COLOR)
					))
				}

				leek.buffResistance(value, this.jumping)
				break;

			case LW.EFFECT.SHACKLE_MP:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_loose_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_mp', value), MP_COLOR)
					))
				}

				leek.looseMP(value, this.jumping)
				break;

			case LW.EFFECT.SHACKLE_TP:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_loose_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_tp', value), TP_COLOR)
					))
				}

				leek.looseTP(value, this.jumping)
				break

			case LW.EFFECT.SHACKLE_STRENGTH:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_loose_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_strength', value), STRENGTH_COLOR)
					))
				}

				leek.looseStrength(value, this.jumping)
				break

			case LW.EFFECT.SHACKLE_MAGIC:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_loose_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_magic', value), MAGIC_COLOR)
					))
				}

				leek.looseMagic(value, this.jumping)
				break

			case LW.EFFECT.DAMAGE_RETURN:

				if (!this.jumping) {
					this.log(_.lang.get('fight', 'leek_win_x',
						this.colorText(leek.name, this.getLeekColor(target)),
						this.colorText(_.lang.get('fight', 'n_damage_return', value + '%'), 'black')
					))
				}

				leek.buffDamageReturn(value, this.jumping)
				break

			case LW.EFFECT.POISON:

				// rien
				break;
		}
	}

	this.removeEffect = function(id) {

		var effect = this.effects[id];

		if (!effect) return;

		var effectID = effect.effect;
		var leek = this.leeks[effect.target];
		var value = effect.value;

		switch (effectID) {

			case LW.EFFECT.SHACKLE_MP:
				leek.mp -= value;
				break;

			case LW.EFFECT.SHACKLE_TP:
				leek.tp -= value;
				break;

			case LW.EFFECT.SHACKLE_STRENGTH:
				leek.strength -= value;
				break;

			case LW.EFFECT.SHACKLE_MAGIC:
				leek.magic -= value;
				break;

			case LW.EFFECT.ABSOLUTE_SHIELD:
				leek.absoluteShield -= value;
				break;

			case LW.EFFECT.RELATIVE_SHIELD:
				leek.relativeShield -= value;
				break;

			case LW.EFFECT.VULNERABILITY:
				leek.relativeShield += value;
				break;

			case LW.EFFECT.BUFF_AGILITY:
				leek.agility -= value;
				break;

			case LW.EFFECT.BUFF_STRENGTH:
				leek.strength -= value;
				break;

			case LW.EFFECT.BUFF_WISDOM:
				leek.wisdom -= value;
				break;

			case LW.EFFECT.BUFF_RESISTANCE:
				leek.resistance -= value;
				break;

			case LW.EFFECT.DAMAGE_RETURN:
				leek.damageReturn -= value;
				break;
		}

		if (!this.jumping) {

			this.hud.removeLeekEffect(id)

			// Gestion des états du poireau
			if (effect.objectType == 'weapon') {
				if (effect.object == 46) {
					leek.stopBurn();
				} else if (effect.object == 48) {
					leek.stopGaz();
				}
			}
		}

		delete this.effects[id];
	}

	this.readLogs = function() {

		// Logs personnels
		if (this.logs == null) return;
		if (!(this.currentAction in this.logs)) return;

		for (var l = this.currentLog; l < this.logs[this.currentAction].length; ++l) {

			this.currentLog++;

			var log = this.logs[this.currentAction][l];
			var type = log[1];

			if (type == 5) {
				this.pause();
				return true;
			} else if (type == 4) {
				this.addMarker(log[0], log[2], log[3], log[4]);
			} else {
				this.hud.addPersonalLog(log);
			}
		}

		return false;
	}

	this.actionDone = function() {

		this.actionToDo = true
		this.actionDelay = 6
	}

	this.getLeekColor = function(leek) {
		return LW.TEAM_COLORS[this.leeks[leek].team - 1];
	}

	this.colorText = function(text, color) {
		return "<span style='color: " + color + ";'>" + text + "</span>";
	}

	this.log = function(log) {
		if (typeof(log) == 'string') {
			game.hud.addLog([log, "black"]);
		} else {
			game.hud.addLog(log);
		}
	}

	this.setupMouseMove = function() {

		var mouseOrigin = _.findPos($('#game')[0]);

		mouseOrigin.x += Math.round(this.ground.startX);
		mouseOrigin.y += Math.round(this.ground.startY);

		$(canvas).off('mousemove');
		$(canvas).mousemove(function(e) {

			game.mouseX = e.pageX - mouseOrigin.x;
			game.mouseY = e.pageY - mouseOrigin.y;

			var x = (game.mouseX / game.ground.tileSizeX) * 2 - 0.5;
			var y = (game.mouseY / game.ground.tileSizeY) * 2 - 0.5;

			var cx = Math.floor(x);
			var cy = Math.floor(y);

			var ox = x - cx - 0.5;
			var oy = y - cy - 0.5;

			if ((cx + cy) % 2 == 1) {

				if (-oy > Math.abs(ox)) { // en haut
					cy--;
				} else if (oy > Math.abs(ox)) { // en bas
					cy++;
				} else if (ox > Math.abs(oy)) { // à droite
					cx++;
				} else { // forcément à gauche
					cx--;
				}
			}

			if (cx >= 0 && cy >= 0 && cx < game.ground.tilesX * 2 - 1 && cy < game.ground.tilesY * 2 - 1) {

				game.mouseTileX = cx;
				game.mouseTileY = cy;

				game.mouseCell = game.ground.xyToCell(cx, cy);

			} else {

				game.mouseTileX = undefined;
				game.mouseTileY = undefined;
				game.mouseCell = undefined;
			}
		});
	}

	this.addMarker = function(owner, cells, color, duration) {

		for (var c in cells) {
			var pos = this.ground.cellToXY(cells[c]);
			var xy = this.ground.xyToXYPixels(pos.x, pos.y);
			var x = xy.x * this.ground.scale;
			var y = xy.y * this.ground.scale;
			if (color.length == 8) color = color.substr(2)
			this.markers[cells[c]] = {owner: owner, color: '#' + color, duration: duration, x: x, y: y};
		}
	}



	this.addDrawableElement = function(element, line) {

		this.drawableElementCurrentId++;

		//
		// if (this.drawableElements[line] == undefined) return;
		//

		this.drawableElements[line][this.drawableElementCurrentId] = element;

		return this.drawableElementCurrentId;
	}

	this.moveDrawableElement = function(element, id, line, newLine) {

		if (!this.drawableElements[newLine]) {
			_.logW("Error moving object to line " + newLine)
			return
		}

		this.drawableElements[newLine][id] = element; // Ajout de l'élément sur la nouvelle ligne
		this.removeDrawableElement(id, line); // Destruction de l'élément sur l'ancienne ligne
	}

	this.removeDrawableElement = function(id, line) {

		if (this.drawableElements[line] != undefined) {
			if (this.drawableElements[line][id] != null) {
				delete this.drawableElements[line][id];
			}
		}
	}

	this.setEffectArea = function(x, y, area, color, duration) {

		duration = duration ? duration : 80;

		x *= this.ground.scale;
		y *= this.ground.scale;

		this.drawArea = duration;
		this.areaColor = color;

		this.area = [];
		var w = this.ground.tileSizeX;
		var h = this.ground.tileSizeY;

		if (area == AREA_SINGLE_CELL) {

			this.area.push([x, y]);

		} else if (area == AREA_CIRCLE1) {

			this.area.push([x - w/2, y - h/2]);
			this.area.push([x + w/2, y - h/2]);

			this.area.push([x, y]);

			this.area.push([x - w/2, y + h/2]);
			this.area.push([x + w/2, y + h/2]);

		} else if (area == AREA_CIRCLE2) {

			this.area.push([x - w, y - h]);
			this.area.push([x, y - h]);
			this.area.push([x + w, y - h]);

			this.area.push([x - w/2, y - h/2]);
			this.area.push([x + w/2, y - h/2]);

			this.area.push([x - w, y]);
			this.area.push([x, y]);
			this.area.push([x + w, y]);

			this.area.push([x - w/2, y + h/2]);
			this.area.push([x + w/2, y + h/2]);

			this.area.push([x - w, y + h]);
			this.area.push([x, y + h]);
			this.area.push([x + w, y + h]);

		} else if (area == AREA_CIRCLE3) {

			this.area.push([x - 1.5*w, y - 1.5*h]);
			this.area.push([x - 0.5*w, y - 1.5*h]);
			this.area.push([x + 0.5*w, y - 1.5*h]);
			this.area.push([x + 1.5*w, y - 1.5*h]);

			this.area.push([x - w, y - h]);
			this.area.push([x, y - h]);
			this.area.push([x + w, y - h]);

			this.area.push([x - 1.5*w, y - h/2]);
			this.area.push([x - 0.5*w, y - h/2]);
			this.area.push([x + 0.5*w, y - h/2]);
			this.area.push([x + 1.5*w, y - h/2]);

			this.area.push([x - w, y]);
			this.area.push([x, y]);
			this.area.push([x + w, y]);

			this.area.push([x - 1.5*w, y + h/2]);
			this.area.push([x - 0.5*w, y + h/2]);
			this.area.push([x + 0.5*w, y + h/2]);
			this.area.push([x + 1.5*w, y + h/2]);

			this.area.push([x - w, y + h]);
			this.area.push([x, y + h]);
			this.area.push([x + w, y + h]);

			this.area.push([x - 1.5*w, y + 1.5*h]);
			this.area.push([x - 0.5*w, y + 1.5*h]);
			this.area.push([x + 0.5*w, y + 1.5*h]);
			this.area.push([x + 1.5*w, y + 1.5*h]);
		}
	}

	this.drawEffectArea = function() {

		ctx.save();

		ctx.globalAlpha = 0.4 * Math.min(1, this.drawArea / 10);
		ctx.fillStyle = this.areaColor;

		for (var t in this.area) {
			this.drawEffectTile(this.area[t][0], this.area[t][1]);
		}

		ctx.restore();
	}

	this.drawEffectTile = function(x, y) {

		ctx.save();

		ctx.translate(x, y);

		ctx.beginPath();
		ctx.moveTo(0, -this.ground.tileSizeY / 2.1);
		ctx.lineTo(this.ground.tileSizeX / 2.1, 0);
		ctx.lineTo(0, this.ground.tileSizeY / 2.1);
		ctx.lineTo(-this.ground.tileSizeX / 2.1, 0);
		ctx.closePath();

		ctx.fill();

		ctx.restore();
	}

	this.drawMarker = function(x, y, color) {

		ctx.save();

		ctx.globalAlpha = 0.7;
		ctx.fillStyle = color;

		ctx.translate(x, y);

		ctx.beginPath();
		ctx.moveTo(0, -this.ground.tileSizeY / 2.1);
		ctx.lineTo(this.ground.tileSizeX / 2.1, 0);
		ctx.lineTo(0, this.ground.tileSizeY / 2.1);
		ctx.lineTo(-this.ground.tileSizeX / 2.1, 0);
		ctx.closePath();

		ctx.fill();

		ctx.restore();
	}

	this.showCell = function() {

		var alpha = (50 - this.showCellTime) / 50;

		ctx.globalAlpha = alpha;

		ctx.save();

		ctx.translate(this.showCellX, this.showCellY);

		ctx.beginPath();
		ctx.moveTo(0, -this.ground.tileSizeY / 2.1);
		ctx.lineTo(this.ground.tileSizeX / 2.1, 0);
		ctx.lineTo(0, this.ground.tileSizeY / 2.1);
		ctx.lineTo(-this.ground.tileSizeX / 2.1, 0);
		ctx.closePath();

		ctx.lineCap = 'round';

		ctx.globalAlpha = 0.4;
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 8 * this.ground.scale;
		ctx.stroke();

		ctx.globalAlpha = 1;
		ctx.strokeStyle = this.showCellColor;
		ctx.lineWidth = 4 * this.ground.scale;
		ctx.stroke();

		var y = Math.pow(this.showCellTime, 2) / 15;
		ctx.beginPath();
		ctx.moveTo(-18 * this.ground.scale, -(y + 40) * this.ground.scale);
		ctx.lineTo(0, -(y + 32) * this.ground.scale);
		ctx.lineTo(18 * this.ground.scale, -(y + 40) * this.ground.scale);
		ctx.lineTo(0, -(y + 10) * this.ground.scale);
		ctx.closePath();

		ctx.globalAlpha = 0.4;
		ctx.strokeStyle = 'black';
		ctx.stroke();

		ctx.globalAlpha = 1;
		ctx.fillStyle = this.showCellColor;
		ctx.fill();

		ctx.restore();

		ctx.globalAlpha = 1;
	}

    this.draw = function() {

		// Draw ground
		this.ground.draw();

		// Draw ground particles
		this.particles.drawGround()

		// Draw leeks paths
		for (var i in game.leeks) {
			if (game.leeks[i].active) game.leeks[i].drawPath();
		}

		// Effect area
		if (this.drawArea > 0) {
			this.drawEffectArea();
		}

		// Draw markers
		for (var m in this.markers) {
			var marker = this.markers[m];
			this.drawMarker(marker.x, marker.y, marker.color);
		}

		// Draw elements
		for (var i = 0; i < this.drawableElements.length; i++) {
			var line = this.drawableElements[i];
			for (var j in line) {
				line[j].draw();
			}
		}

		// Show cell
		if (this.showCellTime > 0) {
			this.showCell();
		}

		// Draw air particles
		this.particles.drawAir();

		if (this.requestPause) {
			this.paused = true
			this.requestPause = false
			if (!this.going_to_report) {
				this.drawPause()
			}
		}

		// Draw hud
		this.hud.draw();

		// Bubbles
		for (var i in game.leeks) {
			if (game.leeks[i].active) game.leeks[i].drawBubble();
		}

		// Info texts
		for (var i in game.leeks) {
			if (game.leeks[i].active) game.leeks[i].drawTexts()
		}

		this.ground.endDraw();
	}

	this.drawPause = function() {
		ctx.save();

		ctx.translate(-game.ground.startX, -game.ground.startY);

		if (this.discretePause) {

			ctx.globalAlpha = 0.2;
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, game.width, game.height);

		} else {

			ctx.globalAlpha = 0.4;
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, game.width, game.height);

			ctx.fillStyle = 'white';
			ctx.font = "60pt Roboto";
			ctx.textAlign = "center";
			ctx.globalAlpha = 1;
			ctx.fillText("Pause", game.width / 2, game.height / 2 - 25);

			ctx.font = "30pt Roboto";
			ctx.fillText(_.lang.get('fight', 'pause_message'), game.width / 2, game.height / 2 + 25);
		}

		ctx.restore();
	}

	this.drawElement = function(element) {
		element.draw();
	}

	this.showReport = function() {
		this.going_to_report = true
		document.body.style.cursor = ''
		LW.page('/report/' + game.data.id)
	}

	this.updateBar = function() {

		$('#progress-bar .bar').css('width', (100 * this.currentAction / this.actions.length) + '%');
	}

	this.jump = function(jumpAction) {

		// Return to initial state
		for (var i in this.states) {

            this.leeks[i].active = this.states[i].active
            this.leeks[i].life = this.states[i].life
            this.leeks[i].maxLife = this.states[i].max_life
            this.leeks[i].tp = this.states[i].tp
            this.leeks[i].mp = this.states[i].mp
            this.leeks[i].agility = this.states[i].agility
            this.leeks[i].strength = this.states[i].strength
            this.leeks[i].wisdom = this.states[i].wisdom
            this.leeks[i].resistance = this.states[i].resistance
            this.leeks[i].science = this.states[i].science
            this.leeks[i].magic = this.states[i].magic
            this.leeks[i].absoluteShield = 0
            this.leeks[i].relativeShield = 0
            this.leeks[i].damageReturn = 0
            this.leeks[i].cell = this.states[i].cell

            this.leeks[i].dead = false
            this.leeks[i].bubble = new Bubble()
            $('#entity-info-' + this.leeks[i].id).removeClass('dead')

            this.leeks[i].weapon = undefined

            if (!this.leeks[i].active) {
                if (this.leeks[i].drawID) {
                    this.hud.removeEntityBlock(this.leeks[i])
                    this.removeDrawableElement(this.leeks[i].drawID, this.leeks[i].y)
                    this.leeks[i].drawID = null
                }
            } else {
                if (this.leeks[i].drawID === null && this.leeks[i].life) {
                    if (this.leeks[i].summon) this.hud.addEntityBlock(this.leeks[i])
                    this.leeks[i].drawID = this.addDrawableElement(this.leeks[i], this.leeks[i].y)
                }
            }

            this.leeks[i].moveDelay = 0
            this.leeks[i].path = []
		}

		// Cleaning
        $("#actions .action").remove()
        $("#logs .log").remove()
        $("[id^=effect]").remove()
        $('#turn').text("")

		this.effects = []

        for (var i = 0; i < this.particles.particles.length; i++) {
        	this.particles.particles.splice(i, 1)
        	i--
        }

        this.markers = []
        this.currentTurn = 0
        this.turn = 1
        this.currentPlayer = null

        this.showCellTime = 0
        for (var c = 0; c < this.chips.length; ++c) {
            this.chips[c].done = true
        }

        // Do actions
        this.jumping = true
        var action = 0

        while (action < jumpAction) {

        	this.doAction(this.actions[action])
        	action++
        }

        // End
		this.jumping = false
		this.currentAction = action

		for (var e in this.leeks) {

			var entity = this.leeks[e]
			entity.setCell(entity.cell)
		}

		this.updateBar()
		this.hud.refresh()
		this.requestPause = this.paused
		this.draw()
	}
}
