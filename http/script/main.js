/*
 * Leek Wars main object
 */
var LW = {

	version: __VERSION,
	subVersion: __SUB_VERSION,
	updated: false,
	currentPage: '/',
	prod: location.host.indexOf("leekwars.com") === 0,
	dev: location.host.indexOf("dev.leekwars.com") === 0,
	test: location.host.indexOf("test.leekwars.com") === 0,
	beta: location.host.indexOf("beta.leekwars.com") === 0,
	local: location.host.indexOf("localhost") === 0 && __FULL_LOCAL,
	mixed_local: location.host.indexOf("localhost") === 0 && !__FULL_LOCAL,
	staticURL: __STATIC_URL,
	avatarURL: __AVATAR_URL,
	api: __API_URL,
	farmer: {},
	key: null,
	connected: false,
	initialized: false,
	socket: {
		socket: null,
		tentative: 0,
		connected: false,
		queue: [],
		tentatives: 5,
		tentative: 1,
		delay: 1000
	},
	smileys: [
		[":O", ":-O", ":o"], [":D", ":-D"], ["&lt;3", "(l)", "(L)", "<3"], [":)", ":-)", ":]"], [":/"], [";)", ";-)"],
		[":("], [":p", ":P", ":-p"], ["(lama)"], [":B", ":b"], ["(lucky)"]
	],
	views: {},
	chat: {
		controller: null,
		messages: {}
	},
	notifications: {
		unread: 0,
		notifications: []
	},
	messages: {
		unread: 0,
		conversations: []
	},
	util: {},
	time: {
		delta: (Date.now() / 1000 | 0) - __SERVER_TIME
	},
	sfw: {},
	callbacks: {
		pageload: [],
		initialized: []
	},
	konami: '',
	hatTemplates: {},
	chipTemplates: {},
	weaponTemplates: {},
	codePreviewI: 1,
	tooltipCount: 0,
	beta_options: {
		desactivated_pages: ['forum', 'forum_category', 'forum_topic', 'messages', 'bank']
	}
}

/*
 * Constants
 */
var TEAM_CHAT_SEND = 1;
var TEAM_CHAT_RECEIVE = 2;
var TEAM_CHAT_MEMBERS = 3;
var TEAM_CHAT_ENABLE = 4;
var MP_RECEIVE = 5;
var NOTIFICATION_RECEIVE = 6;
var FORUM_CHAT_ENABLE = 7;
var FORUM_CHAT_SEND = 8;
var FORUM_CHAT_RECEIVE = 9;
var MP_UNREAD_MESSAGES = 10;
var MP_READ = 11;
var FIGHT_LISTEN = 12;
var FIGHT_GENERATED = 12;
var FIGHT_WAITING_POSITION = 13;
var FORUM_CHAT_DISABLE = 19;
var RESET_NOTIFICATIONS = 20;
var CHAT_REQUEST_MUTE = 21;
var CHAT_MUTE_USER = 22;
var CHAT_REQUEST_UNMUTE = 23;
var CHAT_UNMUTE_USER = 24;
var YOU_ARE_MUTED = 25;
var LUCKY = 26;
var GET_LUCKY = 27;
var BATTLE_ROYALE_REGISTER = 28;
var BATTLE_ROYALE_UPDATE = 29;
var BATTLE_ROYALE_START = 30;
var BATTLE_ROYALE_LEAVE = 31;

var NOTIFICATION_UP_LEVEL = 1 // Passage de niveau
var NOTIFICATION_FIGHT_REPORT = 2 // Rapport de combat
var NOTIFICATION_NEW_MESSAGE = 3 // Nouveau message (forum)
var NOTIFICATION_COMPOSITION_FIGHT_REPORT = 4 // Rapport de combat de composition
var NOTIFICATION_TEAM_BANNED = 5 // Banni d'une team
var NOTIFICATION_TEAM_NEW_CANDIDACY = 6 // Nouvelle candidature (à voir parceque si le mec fait Rejoindre/Annuler ma demande en boucle ça va vite être chiant)
var NOTIFICATION_CANDIDACY_ACCEPTED = 7 // Accepté dans une team
var NOTIFICATION_CANDIDACY_REFUSED = 8 // Refusé dans une team
var NOTIFICATION_TOURNAMENT_WINNER = 9 // Gagnant d'un tournoi
var NOTIFICATION_NO_TOURNAMENT = 10 // Pas de place pour le tournoi
var NOTIFICATION_TROPHY_UNLOCKED = 11 // Nouveau trophée
var NOTIFICATION_FIGHT_COMMENT = 12 // Quelqu'un commente un combat dans lequel vous jouez
var NOTIFICATION_TOURNAMENT_END = 13 // Fin d'un tournoi
var NOTIFICATION_CHALLENGE = 14 // Quelqu'un nous a challengé
var NOTIFICATION_FARMER_FIGHT_REPORT = 15 // Aggression par un farmer
var NOTIFICATION_TEAM_NEW_FARMER = 16 // Nouveau Farmer dans une team
var NOTIFICATION_FARMER_TOURNAMENT_WIN = 17 // Victoire tournoi éleveur
var NOTIFICATION_NEW_GODSON = 18 // Nouveau Filleul (params : id_godson, name_godson)
var NOTIFICATION_FARMER_TOURNAMENT_END = 19 // Fin d'un tournoi de farmer
var NOTIFICATION_NEW_WARNING = 20 // Warning
var NOTIFICATION_TOURNAMENT_COMMENT = 21 // Quelqu'un commente un tournoi dans lequel vous jouez
var NOTIFICATION_TEAM_TOURNAMENT_WIN = 22 // Victoire tournoi team
var NOTIFICATION_TEAM_TOURNAMENT_END = 23 // Fin d'un tournoi de team
var NOTIFICATION_REPORTING_PROCESSED = 24 // Signalement traité par un modérateur
var NOTIFICATION_FARMER_CHALLENGE = 25 // Défi éleveur

LW.WARNING = {
	INCORRECT_FARMER_NAME: 1,
	INCORRECT_LEEK_NAME: 2,
	INCORRECT_AI_NAME: 3,
	INCORRECT_TEAM_NAME: 4,
	INCORRECT_TEAM_DESCRIPTION: 5,
	RUDE_SAY: 6,
	RUDE_FORUM: 7,
	RUDE_CHAT: 8,
	INSULT_MODERATOR: 9,
	INSULT_ADMIN: 10,
	CHEAT: 11,
	FLOOD_FORUM: 12,
	FLOOD_CHAT: 13,
	PROMO_CHAT: 14,
	PROMO_FORUM: 15,
	INCORRECT_AVATAR: 16,
	INCORRECT_EMBLEM: 17,
	REPORTING_ABUSE: 100,
	SERVER_ATTACK: 101,
	BUG_EXPLOITATION: 102,
	BOT_OR_SCRIPT_USE: 103
}

var ITEM_WEAPON = 1
var ITEM_CHIP = 2
var ITEM_POTION = 3
var ITEM_HAT = 4

var POTION_EFFECT_RESTAT = 1;
var POTION_EFFECT_CHANGE_SKIN = 2;

// Actions
var ACTION_START_FIGHT = 0;
var ACTION_USE_WEAPON = 1;
var ACTION_USE_CHIP = 2;
var ACTION_SET_WEAPON = 3;
var ACTION_END_FIGHT = 4;
var ACTION_PLAYER_DEAD = 5;
var ACTION_NEW_TURN = 6;
var ACTION_LEEK_TURN = 7;
var ACTION_END_TURN = 8;
var ACTION_SUMMON = 9;
var ACTION_MOVE_TO = 10;
var ACTION_TP_LOST = 100;
var ACTION_LIFE_LOST = 101;
var ACTION_MP_LOST = 102;
var ACTION_CARE = 103;
var ACTION_BOOST_VITA = 104;
var ACTION_RESURRECTION = 105;
var ACTION_SAY = 200;
var ACTION_LAMA = 201;
var ACTION_SHOW = 202;
var ACTION_ADD_WEAPON_EFFECT = 301;
var ACTION_ADD_CHIP_EFFECT = 302;
var ACTION_REMOVE_EFFECT = 303;
var ACTION_BUG = 1002;

// Effets
LW.EFFECT = {
	DAMAGE: 1,
	HEAL: 2,
	BUFF_STRENGTH: 3,
	BUFF_AGILITY: 4,
	RELATIVE_SHIELD: 5,
	ABSOLUTE_SHIELD: 6,
	BUFF_MP: 7,
	BUFF_TP: 8,
	POISON: 13,
	SUMMON: 14,
	SHACKLE_MP: 17,
	SHACKLE_TP: 18,
	SHACKLE_STRENGTH: 19,
	DAMAGE_RETURN: 20,
	BUFF_RESISTANCE: 21,
	BUFF_WISDOM: 22,
	ANTIDOTE: 23,
	SHACKLE_MAGIC: 24
}

// Fight types
LW.FIGHT_TYPE = {
	SOLO: 0,
	FARMER: 1,
	TEAM: 2,
	BATTLE_ROYALE: 3
}

// Fight contexts
LW.FIGHT_CONTEXT = {
	TEST: 0,
	CHALLENGE: 1,
	GARDEN: 2,
	TOURNAMENT: 3,
	BATTLE_ROYALE: 4
}

// Colors
LW.TEAM_COLORS = [
	"#0000AB", // blue
	"#DC0000", // red
	"#4FBF1C", // green
	"#FDED00", // yellow
	"#B02D20", // brown
	"#A2A2A2", // grey
	"#9800AE", // purple
	"#FF7D00", // orange
	"##14D7E4", // cyan
	"#E414C9", // pink
	"#000000", // black
	"#ffffff" // white
]

var MP_COLOR = "#08D900"
var LIFE_COLOR = "#ff0000"
var TP_COLOR = "#FF7F01"
var SHIELD_COLOR = "#FF4A01"
var STRENGTH_COLOR = "#833100"
var AGILITY_COLOR = "#0080F7"
var WISDOM_COLOR = "#5ebe00"
var RESISTANCE_COLOR = "#fe7700"
var MAGIC_COLOR = "#b800b6"

// Areas
var AREA_SINGLE_CELL = 1;
var AREA_LASER_LINE = 2;
var AREA_CIRCLE1 = 3;
var AREA_CIRCLE2 = 4;
var AREA_CIRCLE3 = 5;

var AREA_SINGLE_CELL = 1
var AREA_LASER_LINE = 2
var AREA_CIRCLE1 = 3
var AREA_CIRCLE2 = 4
var AREA_CIRCLE3 = 5

var SKINS = {
	1: "green",
	2: "blue",
	3: "yellow",
	4: "red",
	5: "orange",
	6: "pink",
	7: "cyan",
	8: "purple",
	9: "multi",
	10: "rasta",
	11: "white",
	12: "black",
	13: "alpha",
	14: "apple",
	15: "gold"
}

var SKINS_COLORS = {
	1: "#00aa00",
	2: "#0077DC",
	3: "#DCCA00",
	4: "#CD1300",
	5: "#EB9206",
	6: "#FF00AA",
	7: "#18FFBC",
	8: "#C900FC",
	9: "#ff0000",
	10: "#ff0000",
	11: "#ffffff",
	12: "#000000",
	13: "#aaaaaa",
	14: "#C1E424",
	15: "#ffd500"
}

LW.ENABLE_CHAT = 7

LW.config = {

	viewCache: false,
	langCache: true
}

LW.pages = {

	error: {},
	signup: {
		langs: ['farmer']
	},
	activate: {
		langs: ['signup']
	},
	login: {},
	forgot_password: {
		langs: ['farmer']
	},
	leek: {
		scripts: [['lib/', 'chartist.min.js']],
		styles: ['item_preview.css', ['lib/', 'chartist.min.css']],
		langs: ['chip', 'weapon', 'hat', 'report', 'moderation']
	},
	new_leek: {
		langs: ['leek']
	},
	farmer: {
		langs: ['report', 'country', 'moderation']
	},
	team: {
		styles: ['chat.css']
	},
	editor: {
		cache: true,
		scripts: [
			['lib/codemirror/', 'codemirror.js'],
			['lib/codemirror/', 'leekscript.js'],
			['lib/codemirror/', 'matchbrackets.js'],
			['lib/codemirror/', 'match-highlighter.js'],
			'editor_class.js',
			['lib/jsbeautifier/', 'beautify.js']
		],
		styles: [
			['lib/codemirror/', 'codemirror.css'],
			['lib/codemirror/', 'dialog.css'],
			'code.css',
			'item_preview.css'
		],
		langs: ['documentation', 'java_compilation']
	},
	garden: {},
	fight: {
		langs: ['entity'],
		scripts: [
			'game/R.js',
			'game/class.js',
			'game/entity.js',
			'game/bubble.js',
			'game/leek.js',
			'game/bulb.js',
			'game/ground.js',
			'game/game.js',
			'game/particles.js',
			'game/particle.js',
			'game/obstacle.js',
			'game/hud.js',
			'game/infotext.js',
			'game/map/nexus.js',
			'game/map/factory.js',
			'game/map/desert.js',
			'game/map/forest.js',
			'game/map/glacier.js',
			'game/map/beach.js',
			'game/weapons.js',
			'game/chips.js',
		],
		styles: [

		]
	},
	report: {
		scripts: [
			['lib/', 'chartist.min.js']
		],
		styles: [
			['lib/', 'chartist.min.css']
		],
		langs: ['fight', 'entity']
	},
	market: {
		styles: [
			'item_preview.css'
		],
		langs: ['leek']
	},
	ranking: {},
	help: {},
	forum: {
		connected: true,
		styles: [
			'chat.css'
		],
		langs: ['report', 'moderation']
	},
	forum_category: {
		connected: true,
		langs: ['forum']
	},
	forum_topic: {
		connected: true,
		langs: ['forum'],
		scripts: [
			['lib/codemirror/', 'codemirror.js'],
			['lib/codemirror/', 'leekscript.js'],
			['lib/codemirror/', 'runmode.js']
		],
		styles: [
			['lib/codemirror/', 'codemirror.css'],
			'code.css',
		]
	},
	chat: {
		connected: true,
		langs: ['report', 'moderation']
	},
	settings: {
		connected: true,
		langs: ['farmer', 'mail']
	},
	about: {},
	bank: {},
	bank_buy: {},
	bank_validate: {},
	tutorial: {
		scripts: [
			['lib/codemirror/', 'codemirror.js'],
			['lib/codemirror/', 'leekscript.js'],
			['lib/codemirror/', 'runmode.js']
		],
		styles: [
			['lib/codemirror/', 'codemirror.css'],
			'code.css',
		],
		langs: ['editor']
	},
	general_help: {},
	documentation: {
		scripts: [
			['lib/codemirror/', 'codemirror.js'],
			['lib/codemirror/', 'leekscript.js'],
			['lib/codemirror/', 'runmode.js']
		],
		styles: [
			['lib/codemirror/', 'codemirror.css'],
			'code.css',
		],
	},
	trophies: {},
	changelog: {},
	tournament: {
		connected: true
	},
	messages: {
		styles: ['chat.css']
	},
	notifications: {},
	legal: {},
	conditions: {},
	search: {},
	line_of_sight: {},
	api: {},
	translation: {
		scripts: [
			['lib/', 'jquery.tablednd.0.7.min.js']
		]
	},

	moderation: {
		moderator: true
	},

	admin: {connected: true, admin: true},
	admin_services: {connected: true, admin: true},
	admin_error_manager: {
		connected: true,
		admin: true,
		scripts: [
			['lib/codemirror/', 'codemirror.js'],
			['lib/codemirror/', 'leekscript.js'],
			['lib/codemirror/', 'runmode.js']
		],
		styles: [
			['lib/codemirror/', 'codemirror.css'],
			'code.css',
		]
	},
	admin_servers: {connected: true, admin: true},
	admin_trophies: {connected: true, admin: true},
	admin_mails: {connected: true, admin: true},
	admin_translation: {connected: true, admin: true}
}

$(document).ready(function() {

	_.init({
		api: LW.api,
		version: LW.subVersion,
		view_cache: LW.prod,
		lang_cache: true
	})

	_.lang.init(
		[
			{code: 'en', name: 'English', flag: 'image/flag/32/gb.png'},
			{code: 'fr', name: 'Français', flag: 'image/flag/32/fr.png'}
		],
		__DEFAULT_LANGUAGE
	)

	// if (LW.dev || LW.test || LW.beta) {
		_.logOn()
	// }

	setTimeout(function() {
		if (LW.dev) {
			_.favicon(LW.staticURL + '/image/favicon_dev.png')
			$('body').addClass('dev')
		} else if (LW.test || LW.mixed_local || LW.local) {
			_.favicon(LW.staticURL + '/image/favicon_test.png')
			$('body').addClass('test')
		} else if (LW.beta) {
			_.favicon(LW.staticURL + '/image/favicon_beta.png')
			$('body').addClass('beta')
		}
	})
	_.title('Leek Wars')

	LW.page = page

	// Init Leek Wars
	LW.init(function() {

		_.view.load('main', false, function() {

			$('body').html(_.view.render('main', {
				dev_site: LW.dev,
				test_site: LW.test || LW.mixed_local || LW.local,
				beta_site: LW.beta
			}))

			LW.loader.show()

			$('#page').css('min-height', Math.max(600, $(window).height() - 277))

			LW.handleHTML('body')

			resizePanel()

			$('#social-panel .chat-input').keydown(function(e) {
				if (e.keyCode == 13) {
					if ($.trim($(this).val()).length > 0) {
						LW.socket.send([FORUM_CHAT_SEND, _.lang.current, $(this).val()])
						$(this).val("").height(0)
					}
					e.preventDefault()
				}
			})

			$('#social-panel .panel').each(function() {
				var key = 'main/' + $(this).attr('panel') + '-collapsed'
				if (key in localStorage && localStorage[key] === 'true') {
					$(this).addClass('collapsed')
					$(this).find('.expand img').attr('src', LW.staticURL + 'image/icon/collapse.png')
				}
			})
			$('#social-panel .expand').click(function() {
				var panel = $(this).closest('.panel')
				if (panel.hasClass('collapsed')) {
					panel.removeClass('collapsed')
					$(this).find('img').attr('src', LW.staticURL + 'image/icon/expand.png')
				} else {
					panel.addClass('collapsed')
					$(this).find('img').attr('src', LW.staticURL + 'image/icon/collapse.png')
				}
				LW.trigger('resize')
				localStorage['main/' + panel.attr('panel') + '-collapsed'] = panel.hasClass('collapsed')
			})

			$('#menu-button').click(function() {
				$('body').toggleClass('menu-collapsed')
				LW.trigger('resize')
				localStorage['main/menu-collapsed'] = $('body').hasClass('menu-collapsed')
			})

			$('#social-button').click(function() {
				$('body').toggleClass('social-collapsed')
				LW.trigger('resize')
				localStorage['main/social-collapsed'] = $('body').hasClass('social-collapsed')
			})
			if ('main/social-collapsed' in localStorage && localStorage['main/social-collapsed'] === 'true') {
				$('body').toggleClass('social-collapsed')
				LW.trigger('resize')
			}
			if ('main/menu-collapsed' in localStorage && localStorage['main/menu-collapsed'] === 'true') {
				$('body').toggleClass('menu-collapsed')
				LW.trigger('resize')
			}

			$(".messages-button").click(function(event) {

				LW.setPopups()

				$('#messages-popup .messages').html('')

				for (var c = LW.messages.conversations.length - 1; c >= 0; --c) {
					var conversation = LW.messages.conversations[c]
					$('#messages-popup .messages').append(_.view.render('main.message', conversation))
				}

				$('#messages-popup').toggle()
				if ($('#notifications-popup').is(':visible')) {
					$('#notifications-popup').hide()
				}
				event.stopPropagation()
			});

			$(".notifications-button").click(function(event) {

				LW.setPopups()

				$('#notifications-popup .notifications').html('')

				for (var c = LW.notifications.notifications.length - 1; c >= 0; --c) {
					var notification = LW.notifications.notifications[c]
					$('#notifications-popup .notifications').append(_.view.render('main.notification', notification))
				}

				LW.notifications.unread = 0
				LW.updateCounters()
				_.post('notification/read-all')

				$('#notifications-popup').toggle()
				if ($('#messages-popup').is(':visible')) {
					$('#messages-popup').hide()
				}
				event.stopPropagation()
			})

			$('html').click(function() {
				if ($('#notifications-popup').is(':visible')) {
					$('#notifications-popup').hide()
				}
				if ($('#messages-popup').is(':visible')) {
					$('#messages-popup').hide()
				}
			})

			$(window).resize(function() {
				LW.setPopups()
				LW.trigger('resize')
			})
			$(window).keyup(function(event) {
				if ($('#social-panel .chat-input').is(':focus')) {
					return null
				}
				LW.trigger('keyup')
			})
			$(window).keydown(function(event) {
				if ($('#social-panel .chat-input').is(':focus')) {
					return null
				}
				LW.trigger('keydown', event)
			})
			$(window).scroll(function() {
				LW.trigger('scroll', $(window).scrollTop())
			})

			$(window).on('beforeunload', function() {
				return LW.trigger('leave')
			})

			LW.consoleAlertMessage()


			// LW is initialized
			for (var c in LW.callbacks['initialized']) {
				LW.callbacks['initialized'][c]()
			}
			LW.callbacks['initialized'] = []
			LW.initialized = true


			// Connect and start page
			if (localStorage['connected'] === 'true') {

				_.get('farmer/get-from-token/' + LW.token(), function(data) {
					if (data.success) {
						LW.connect(data.farmer, function() {
							page()
						})
					} else {
						localStorage['connected'] = false
						LW.page('/')
					}
				})
			} else {
				page()
			}
		})
	})
})

LW.init = function(callback) {

	var count = 0
	var all = false
	var ready = function() {
		if (--count == 0 && all) callback()
	}

	count++
	_.lang.load('main', false, ready)

	// Check update
	if ('version' in localStorage && 'sub_version' in localStorage) {
		var version = parseInt(localStorage['version'])
		var subVersion = parseInt(localStorage['sub_version'])
		if (version != LW.version || subVersion != LW.subVersion) {
			LW.clear()
			if (version != LW.version) {
				LW.updated = true
			}
		}
	} else {
		LW.clear()
	}
	localStorage['version'] = LW.version
	localStorage['sub_version'] = LW.subVersion

	// Load common langs
	;['notifications', 'tournament', 'messages', 'potion', 'weapon',
	'chip', 'potion', 'effect', 'hat', 'trophy'].map(function(l) {
		count++
		_.lang.load(l, false, ready)
	})

	// General data
	var values = [
		['chips', 'chips', 'chip/get-all'], ['constants', 'constants', 'constant/get-all'],
		['functions', 'functions', 'function/get-all'], ['hats', 'hats', 'hat/get-all'],
		['weapons', 'weapons', 'weapon/get-all'], ['potions', 'potions', 'potion/get-all'],
		['hatTemplates', 'hat_templates', 'hat/get-templates'],
		['weaponTemplates', 'weapon_templates', 'weapon/get-templates'],
		['chipTemplates', 'chip_templates', 'chip/get-templates'],
		['summonTemplates', "summon_templates", 'summon/get-templates'],
		['trophies', 'trophies', 'trophy/get-all'],
		['trophyCategories', 'trophy_categories', 'trophy/get-categories']
	]

	var loadData = function(d) {
		count++
		_.get(d[2], function(data) {
			if (data.success) {
				LW[d[0]] = data[d[1]]
				localStorage['data/' + d[1]] = JSON.stringify(data[d[1]])
			}
			ready()
		})
	}

	for (var v in values) {

		var value = values[v]

		if (('data/' + value[1]) in localStorage) {
			LW[value[0]] = _.parseJSON(localStorage['data/' + value[1]])
		} else {
			loadData(value)
		}
	}

	all = true
	++count && ready()
}

LW.initConnected = function(callback) {

	LW.loader.show()

	// SFW
	LW.sfw.init()

	// Init websocket
	LW.initWebSocket()
	LW.chat.init()

	// Konami code
	$(window).keyup(function(e) {
		if (e.keyCode == 37) LW.konami += "l"
		else if (e.keyCode == 38) LW.konami += "u"
		else if (e.keyCode == 39) LW.konami += "r"
		else if (e.keyCode == 40) LW.konami += "d"
		else if (e.keyCode == 65) LW.konami += "a"
		else if (e.keyCode == 66) LW.konami += "b"
		if (/uuddlrlrba$/.test(LW.konami)) {
			_.log("Konami !")
			_.post('trophy/unlock', {trophy_id: 113})
			LW.konami = ""
		}
		if (LW.konami.length > 12) LW.konami = LW.konami.substring(1)
	})

	callback()
}

LW.connect = function(farmer, callback) {

	LW.initConnected(function() {

		LW.connected = true
		LW.farmer = farmer

		localStorage['connected'] = true

		$('body').addClass('connected')

		if (LW.farmer.avatar_changed > 0) {
			$('.farmer-avatar').attr('src', LW.avatarURL + '/avatar/' + LW.farmer.id + '.png?' + LW.farmer.avatar_changed)
		}
		$('.farmer-name').text(LW.farmer.name)
		$('#farmer-habs').html(_.format.number(LW.farmer.habs))
		$('#farmer-crystals').html(_.format.number(LW.farmer.crystals))

		// Leek tabs
		var leeks = LW.farmer.leeks
		$('#menu .leeks, #menu-mobile .leeks').empty()
		for (var l in leeks) {
			var leek = leeks[l]
			$('#menu .leeks, #menu-mobile .leeks').append(_.view.render('main.leek_tab', leek))
			if (leek.capital > 0) {
				$('#leek-tab-' + leek.id).attr('label', leek.capital)
			}
		}
		if (_.objectSize(LW.farmer.leeks) < 4) {
			$('#menu .leeks, #menu-mobile .leeks').append("<a href='/new-leek'>" +
				"<div class='section'>" +
				"<img src='" + LW.staticURL + "image/icon/add.png'>" +
				"<div class='text'>" + _.lang.get('main', 'add_leek') + "</div>" +
				"</div>" +
			"</a>")
		}
		if (leeks.length == 1) {
			$('#menu .separator').hide()
		}

		// Team ?
		if (LW.farmer.team) {
			$('#menu #team-tab').show()
			$('#menu-mobile #team-tab').css('display', 'inline-block')
		}

		// Load notifications
		LW.notifications.load()

		// Load messages
		LW.messages.load()

		// Moderation
		if (farmer.moderator) {
			$('#moderation-tab').show()
		} else {
			$('#moderation-tab').remove()
		}

		// Admin
		if (farmer.admin) {
			$('#admin-tab').show()
		} else {
			$('#admin-tab').remove()
		}

		// Keep connected
		setInterval(function() {
			LW.farmer.last_connection = LW.time.get()
			_.post('farmer/update')
		}, 59 * 1000)

		// Popup changelog
		if (LW.updated) {
			LW.changelogPopup()
		}

		callback()
	})
}

LW.disconnect = function() {

	_.post('farmer/disconnect')

	LW.connected = false
	LW.farmer = null
	LW.socket.disconnect()
	localStorage['connected'] = false
	$('body').removeClass('connected')

	$('#menu .leeks').empty()
	$('#menu #team-tab').hide()

	LW.chat.messages = {}
}

LW.token = function() {
	if (LW.mixed_local) return localStorage['token'] // Get the token directly
	return '$' // Get the token from the cookie
}

LW.clear = function() {

	var prefixesToRemove = ['data', 'imagesize', 'lang', 'view']

	for (var key in localStorage) {
		if (prefixesToRemove.indexOf(key.split('/')[0]) != -1) {
			localStorage.removeItem(key)
		}
	}
}

LW.changelogPopup = function() {

	_.lang.load('changelog', false, function() {
		_.get('changelog/get-last/' + _.lang.current, function(data) {
			if (data.success) {
				new _.popup.new('main.changelog_popup', data.changelog, undefined, true).show()
			}
		})
	})
}

LW.trigger = function(action, params) {
	if (LW.currentPage != null && LW.pages[LW.currentPage] && action in LW.pages[LW.currentPage]) {
		return LW.pages[LW.currentPage][action](params)
	}
}

LW.enlarge = function() {
	$('#wrapper').css('max-width', 'none')
	LW.trigger('resize')
}

LW.shrink = function() {
	$('#wrapper').css('max-width', '1200px')
	LW.trigger('resize')
}

LW.setPopups = function() {

	var window_width = $(window).width();

	// Messages popup
	var button = $(".messages-button:visible img");

	var width = Math.min(400, window_width);

	var left = button.offset().left + 14 - $('#messages-popup').width() / 2;
	if (left > window_width - width) {
		$('#messages-arrow').css('left', 190 + (left - window_width + width))
		left = window_width - width;
	} else {
		$('#messages-arrow').css('left', 190)
	}

	$('#messages-popup').css('left', left);
	$('#messages-popup').css('top', button.offset().top + 46);
	$('#messages-popup').css('width', width);

	// Notifications popup
	var button = $(".notifications-button:visible img");

	var width = Math.min(400, window_width);

	var left = button.offset().left + 14 - $('#notifications-popup').width() / 2
	if (left > window_width - width) {
		$('#notifs-arrow').css('left', 190 + (left - window_width + width))
		left = window_width - width
	} else {
		$('#notifs-arrow').css('left', 190)
	}

	$('#notifications-popup').css('left', left);
	$('#notifications-popup').css('top', button.offset().top + 46);
	$('#notifications-popup').css('width', width);
}

$(window).bind("popstate", function() {
  // Google analytics
	ga('set', 'page', window.location.pathname);
	ga('send', 'pageview');
});

function onPushState(callback) {
  (function(pushState) {
     history.pushState = function() {
         pushState.apply(this, arguments);
         callback.apply(window, arguments);
     };
  })(history.pushState);
}

onPushState(function() {
  // Google analytics
	ga('set', 'page', window.location.pathname);
	ga('send', 'pageview');
});

page('/', function() {
	if (LW.connected) {
		LW.loadPage('leek')
	} else {
		LW.loadPage('signup')
	}
})

page('/godfather', function() {
	page.redirect('/')
})

page('/godfather/:godfather', function(ctx) {
	if (LW.connected) {
		LW.loadPage('leek')
	} else {
		LW.loadPage('signup', ctx.params)
	}
})

page('/activate/:id/:code', function(ctx) {
	LW.loadPage('activate', ctx.params)
})

page('/login', function() {
	// Already connected ?
	if (LW.connected) {
		page.redirect('/')
		return null
	}
	LW.loadPage('login')
})

page('/leek', function(ctx) {
	if (LW.connected) {
		LW.loadPage('leek', ctx.params)
	} else {
		page.redirect('/')
	}
})

page('/leek/:id', function(ctx) {
	LW.loadPage('leek', ctx.params)
})

page('/farmer', function() {
	if (LW.connected) {
		LW.loadPage('farmer', {id: LW.farmer.id})
	} else {
		page.redirect('/')
	}
})

page('/farmer/:id', function(ctx) {
	LW.loadPage('farmer', ctx.params)
})

page('/trophies', function() {
	if (LW.connected) {
		LW.loadPage('trophies', {id: LW.farmer.id})
	} else {
		page.redirect('/')
	}
})

page('/trophies/:id', function(ctx) {
	LW.loadPage('trophies', ctx.params)
})

page('/team', function() {
	LW.loadPage('team')
})

page('/team/:id', function(ctx) {
	LW.loadPage('team', ctx.params)
})

page('/editor', function() {
	if (LW.connected) {
		LW.loadPage('editor')
	} else {
		page.redirect('/')
	}
})

page('/editor/:id', function(ctx) {
	if (LW.connected) {
		LW.loadPage('editor', ctx.params)
	} else {
		page.redirect('/')
	}
})

page('/garden', function() {
	LW.loadPage('garden')
})

page('/garden/challenge/:id', function(ctx) {
	LW.loadPage('garden', {challenge: true, type: 'leek', challenge_target: ctx.params.id})
})

page('/garden/challenge/:type/:id', function(ctx) {
	LW.loadPage('garden', {challenge: true, type: ctx.params.type, challenge_target: ctx.params.id})
})

page('/fight/:id', function(ctx) {
	LW.loadPage('fight', ctx.params)
})

page('/report/:id', function(ctx) {
	LW.loadPage('report', ctx.params)
})

page('/market', function() {
	LW.loadPage('market')
})

page('/market/:item', function(ctx) {
	LW.loadPage('market', ctx.params)
})

page('/ranking', function() {
	LW.loadPage('ranking')
})

page('/ranking/fun', function(ctx) {
	LW.loadPage('ranking', {fun: true})
})

page('/ranking/:category', function(ctx) {
	LW.loadPage('ranking', ctx.params)
})

page('/ranking/:category/page-:page', function(ctx) {
	LW.loadPage('ranking', ctx.params)
})

page('/ranking/:category/:order', function(ctx) {
	LW.loadPage('ranking', ctx.params)
})

page('/ranking/:category/:order/page-:page', function(ctx) {
	LW.loadPage('ranking', ctx.params)
})

page('/help', function() {
	LW.loadPage('help')
})

page('/forum', function() {
	LW.loadPage('forum')
})

page('/forum/category-:category', function(ctx) {
	LW.loadPage('forum_category', ctx.params)
})

page('/forum/category-:category/page-:page', function(ctx) {
	LW.loadPage('forum_category', ctx.params)
})

page('/forum/category-:category/topic-:topic', function(ctx) {
	LW.loadPage('forum_topic', ctx.params)
})

page('/forum/category-:category/topic-:topic/page-:page', function(ctx) {
	LW.loadPage('forum_topic', ctx.params)
})

page('/chat', function() {
	LW.loadPage('chat')
})

page('/documentation', function() {
	LW.loadPage('documentation')
})

page('/help/documentation', function() {
	LW.loadPage('documentation')
})

page('/help/documentation/:item', function(ctx) {
	LW.loadPage('documentation', ctx.params)
})

page('/tutorial', function() {
	LW.loadPage('tutorial')
})

page('/help/tutorial', function() {
	LW.loadPage('tutorial')
})

page('/help/tutorial', function() {
	LW.loadPage('tutorial')
})

page('/general_help', function() {
	LW.loadPage('general_help')
})

page('/help/general', function() {
	LW.loadPage('general_help')
})

page('/settings', function() {
	LW.loadPage('settings')
})

page('/about', function() {
	LW.loadPage('about')
})

page('/bank', function() {
	LW.loadPage('bank')
})

page('/bank/buy/:packID/:offerID', function(ctx) {
	LW.loadPage('bank_buy', ctx.params)
})

page('/bank/result/:message/:vendor/:crystals', function(ctx) {
	LW.loadPage('bank_result', ctx.params)
})

page('/bank/validate', function() {
	LW.loadPage('bank_validate')
})

page('/bank/validate/success/:crystals/:vendor', function(ctx) {
	LW.loadPage('bank_validate', {state: 'success', crystals: ctx.params.crystals, vendor: ctx.params.vendor})
})

page('/bank/validate/failed/:vendor/:reason', function(ctx) {
	LW.loadPage('bank_validate', {state: 'failed', vendor: ctx.params.vendor, reason: ctx.params.reason})
})

page('/tutorial', function() {
	LW.loadPage('tutorial')
})

page('/general_help', function() {
	LW.loadPage('general_help')
})

page('/changelog', function() {
	LW.loadPage('changelog')
})

page('/new-leek', function() {
	LW.loadPage('new_leek')
})

page('/tournament/:id', function(ctx) {
	LW.loadPage('tournament', ctx.params)
})

page('/messages', function() {
	LW.loadPage('messages')
})

page('/messages/conversation/:id', function(ctx) {
	LW.loadPage('messages', ctx.params)
})

page('/messages/new/:id', function(ctx) {
	LW.loadPage('messages', {new_conversation: true, new_farmer: ctx.params.id})
})

page('/notifications', function() {
	LW.loadPage('notifications')
})

page('/legal', function() {
	LW.loadPage('legal')
})

page('/conditions', function() {
	LW.loadPage('conditions')
})

page('/search', function() {
	LW.loadPage('search')
})

page('/search/:query', function(ctx) {
	LW.loadPage('search', ctx.params)
})

page('/search/:query/:farmer', function(ctx) {
	LW.loadPage('search', ctx.params)
})

page('/search/:query/:farmer/page-:page', function(ctx) {
	LW.loadPage('search', ctx.params)
})

page('/forgot-password', function() {
	LW.loadPage('forgot_password')
})

page('/forgot-password/email-sent/:email', function(ctx) {
	LW.loadPage('forgot_password', {state: 'email_sent', email: ctx.params.email})
})

page('/forgot-password/:id/:code', function(ctx) {
	LW.loadPage('forgot_password', {state: 'change_password', id: ctx.params.id, code: ctx.params.code})
})

page('/help/line-of-sight', function() {
	LW.loadPage('line_of_sight')
})

page('/help/api', function() {
	LW.loadPage('api')
})

page('/translation/:file', function(ctx) {
	LW.loadPage('translation', ctx.params)
})

page('/moderation', function() {
	LW.loadPage('moderation')
})

page('/admin', function() {
	LW.loadPage('admin')
})
page('/admin/error-manager', function() {
	LW.loadPage('admin_error_manager')
})
page('/admin/services', function() {
	LW.loadPage('admin_services')
})
page('/admin/trophies', function() {
	LW.loadPage('admin_trophies')
})
page('/admin/servers', function() {
	LW.loadPage('admin_servers')
})
page('/admin/mails', function() {
	LW.loadPage('admin_mails')
})
page('/admin/translation', function() {
	LW.loadPage('admin_translation')
})

page('*', function() {
	LW.error('404')
})

LW.setTitle = function(title) {
	_.title(title + ' - Leek Wars')
}

LW.setMenuTab = function(tab) {
	$("#menu .section").removeClass('selected')
	if (tab != null) {
		$("#menu .section[tab=" + tab + ']').addClass('selected')
	}
}

LW.loadPage = function(pageID, params) {

	_.log('Load page ' + pageID)

	// Check if page exists
	if (!(pageID in LW.pages)) {
		_.logW('Page "' + pageID + '" does not exists')
		return null
	}

	// Beta desactivated page?
	if (LW.beta && LW.beta_options.desactivated_pages.indexOf(pageID) >= 0) {
		_.logW('Page "' + pageID + '" desactivated')
		LW.page.redirect('/')
		return null
	}

	var page = LW.pages[pageID]

	// Update of the current page
	if (LW.currentPage === pageID && 'update' in page) {
		LW.trigger('update', params)
		return null
	}

	// Connected page
	if ('connected' in page && page.connected && !LW.connected) {
		LW.page('/')
		return null
	}

	// Admin page
	var admin = 'admin' in page ? page.admin : false
	if (admin && !LW.farmer.admin) {
		LW.page('/')
		return null
	}

	var next = function() {

		LW.currentPage = pageID

		// if (page.initialized && page.cache) {
		// 	page.render()
		// 	return
		// }

		LW.loader.show()

		// We have to load all the ressources the page want
		var count = 0
		var all = false

		var ready = function() {
			if (--count == 0 && all) {

				if (!page.render) {
					page.render = function() {

						var render = _.view.render(pageID, page.scope)
						LW.setPageContent(pageID, render)

						$(window).scrollTop(0)
						LW.loader.hide()
						LW.shrink()
						LW.setMenuTab(null)

						if (LW.socket.connected) LW.trigger('wsconnected')

						// Page load callbacks
						for (var c in LW.callbacks['pageload']) {
							LW.callbacks['pageload'][c]()
						}
					}
				}

				page.scope = {}
				page.init(params ? params : {}, page.scope, page)
				page.initialized = true
			}
		}

		// Template
		count++
		_.view.load(pageID, admin, ready)

		// Load page main langs
		count++
		_.lang.load(pageID, admin, ready)

		// Main script
		count++
		_.script.load(LW.staticURL + '/script/', pageID + '.js', ready)

		// Other page scripts
		if ('scripts' in page) {
			for (var s in page.scripts) {
				count++
				var file = page.scripts[s]
				var path = 'script/'
				if (typeof file === 'object') {
					path = file[0]
					file = file[1]
				}
				_.script.load(LW.staticURL + '/' + path, file, ready)
			}
		}

		// Other page styles
		if ('styles' in page) {
			for (var s in page.styles) {
				var file = page.styles[s]
				var path = 'style/'
				if (typeof file === 'object') {
					path = file[0]
					file = file[1]
				}
				_.style.load(LW.staticURL + '/' + path, file)
			}
		}

		// Load style main page
		_.style.load(LW.staticURL + '/style/', pageID + '.css')

		// Langs
		if ('langs' in page) {
			for (var l in page.langs) {
				count++
				_.lang.load(page.langs[l], admin, ready)
			}
		}

		all = true
		++count && ready()
	}

	// End previous page
	if (LW.currentPage) {

		LW.trigger('pause')

		$('#tooltips .tooltip[location=page]').remove()

		var message = LW.trigger('leave')
		if (message) {
			var popup = new _.popup.new('main.quit_confirm_popup', {message: message}, 600, true)
			popup.setDismissable(false)
			popup.show()
			popup.find('.stay').click(function() {
				popup.dismiss()
				// next page is not loaded
			})
			popup.find('.leave').click(function() {
				popup.dismiss()
				// load next page
				next()
			})
		} else {
			next()
		}
	} else {
		next()
	}
}

LW.on = function(event, callback) {

	if (event in LW.callbacks) {

		if (event == 'initialized' && LW.initialized) {
			callback()
			return
		}

		LW.callbacks[event].push(callback)
	}
}

LW.setPageContent = function(page, content) {

	$('#page').html("<div id='" + page + "-page'>" + content + "</div>")

	$('#page .panel').first().addClass('first')

	LW.handleHTML('#page', 'page')
}

LW.handleHTML = function(element, location) {

	$(element + ' [autostopscroll]').bind('mousewheel', function(e, d) {

		var mode = $(this).attr('autostopscroll')
		var top = mode == 'top' || mode == ''
		var bottom = mode == 'bottom' || mode == ''

		if ((top && d > 0 && this.scrollTop == 0) || (bottom && d < 0 && this.scrollTop == this.scrollHeight - $(this).outerHeight())) {
			e.preventDefault()
		}
	})

	$(element + ' .tooltip').each(function() {

		LW.tooltipCount++

		$(this).appendTo('#tooltips');
		$(this).append("<div class='arrow'></div>")
		if (location) $(this).attr('location', location)

		var tt = this
		var id = $(this).attr("id").substring(3)
		var parent = $("#" + id)
		var persistent = $(this).hasClass('persistent')

		LW.setTooltipParent(id, parent, persistent)

		if (persistent) {
			$('html').click(function() {
				$(tt).stop(1,1).fadeOut(100)
			})
		}
	})
}

LW.setTooltipParent = function(id, parent, persistent) {

	var tt = $("#tt_" + id)

	parent.on(persistent ? 'click' : 'mouseenter', function(e) {

		if ($.trim(tt.html()) == '') return null

		if (tt.is(':visible')) {
			tt.stop(1,1).fadeOut(100)
		} else {

			if (tt.hasClass('disabled')) return null

			LW.resizeTooltip(tt, parent)

			tt.stop(1,1).fadeIn(100)
		}

		if (persistent) e.stopPropagation()
	})

	if (!persistent) parent.mouseleave(function() {
		tt.stop(1,1).fadeOut(100)
	})
}

LW.resizeTooltip = function(tt, parent) {

	var height = $(parent).outerHeight() + ($(parent)[0].getBBox ? $(parent)[0].getBBox().height : 0);
	if ($(tt).hasClass('top')) {
		$(tt).css('top', $(parent).offset().top - $(tt).outerHeight() - 15);
	} else {
		$(tt).css('top', $(parent).offset().top + height + 15);
	}
	var width = $(parent).outerWidth() + ($(parent)[0].getBBox ? $(parent)[0].getBBox().width : 0);
	$(tt).css('left', $(parent).offset().left + width / 2);
	$(tt).css('margin-left',  - $(tt).outerWidth() / 2);
}

LW.setTooltipContent = function(tt, content) {
	tt.html(content)
	tt.append("<div class='arrow'></div>")
	$(tt).css('margin-left',  - $(tt).outerWidth() / 2)
}

LW.addTooltip = function(id, content) {
	var tt = $("<div class='tooltip' id='tt_" + id + "'><div class='arrow'></div>" + content + "</div>")
	$('#tooltips').append(tt)
	LW.setTooltipParent(id, $('#' + id), false)
}

LW.initWebSocket = function() {

	if (window.MozWebSocket) {
		window.WebSocket = window.MozWebSocket;
	}

	var protocol = LW.local ? 'ws' : 'wss'
	var host = LW.mixed_local ? 'leekwars.com' : window.location.host
	LW.socket.socket = new WebSocket(protocol + '://' + host + "/ws")

	LW.socket.socket.onopen = function() {

		//_.log('Socket connected!')

		LW.socket.connected = true

		for (var p in LW.socket.queue) {
			LW.socket.sendDirect(LW.socket.queue[p])
		}
		LW.socket.queue = []

		LW.trigger('wsconnected')
	}

	LW.socket.socket.onclose = function() {

		LW.trigger('wsclosed')

		if (LW.socket.tentatives > 0) {
			LW.socket.tentatives--;
			setTimeout(function() {
				LW.initWebSocket();
			}, LW.socket.delay);
		} else {
			//_.log("Socket closed")
		}
	}

	LW.socket.socket.onerror = function() {
		//_.log('Socket : Une erreur est survenue');
	}

	LW.socket.socket.onmessage = function(msg) {

		data = JSON.parse(msg.data)
		_.log("WS received : ", data)

		var id = data[0]
		var data = data[1]

		LW.trigger('wsreceive', {type: id, data: data})

		switch (id) {

			case 0 : {
				send({id: 0})
				break
			}

			case FORUM_CHAT_RECEIVE : {
				LW.chat.receive(data)
				break
			}

			case CHAT_MUTE_USER : {

				var moderator_name = data[2]
				var muted = data[3]
				if (muted == LW.farmer.id) {
					_.toast(_.lang.get('moderation', 'you_have_been_muted_by_x', moderator_name))
				}

				LW.chat.mute_user(data)
				break
			}

			case YOU_ARE_MUTED : {

				_.toast(_.lang.get('moderation', 'you_are_muted'))
				break
			}

			case CHAT_UNMUTE_USER : {

				var moderator_name = data[2]
				var unmuted = data[3]
				if (unmuted == LW.farmer.id) {
					_.toast(_.lang.get('moderation', 'you_have_been_unmuted_by_x', moderator_name))
				}
				break
			}

			case NOTIFICATION_RECEIVE : {

				LW.notifications.unread = data[0]
				LW.updateCounters()

				LW.notifications.receive({
					date: LW.time.get(),
					type: data[1],
					parameters: data[2]
				})
				break
			}

			case RESET_NOTIFICATIONS : {

				LW.notifications.unread = 0
				LW.updateCounters()
				break
			}

			case MP_RECEIVE : {

				LW.messages.receive({
					conversation: data[0],
					farmer: {
						id: data[1],
						name: data[2],
						avatar_changed: data[6],
						color: data[5]
					},
					message: data[3],
					date: LW.time.get()
				})
				break
			}
			case MP_UNREAD_MESSAGES : {

				LW.messages.unread = data[0]
				LW.updateCounters()
				break
			}
			case LUCKY: {

				LW.lucky()
				break
			}
		}
	}
}

LW.socket.send = function(request) {
	if (LW.socket.connected) {
		LW.socket.sendDirect(request)
	} else {
		LW.socket.queue.push(request)
	}
}

LW.socket.sendDirect = function(request) {

	//_.log("Requête :", request);
	LW.socket.socket.send(JSON.stringify(request))
}

LW.socket.disconnect = function() {

	LW.socket.socket.close()
	LW.socket.connected = false
}

LW.updateCounters = function() {

	_.titleCounter(LW.messages.unread + LW.notifications.unread)

	$('#social-panel #notifications .header .label, \
	   .notifications-button .counter')
		.toggle(LW.notifications.unread > 0)
		.text(LW.notifications.unread)

	$('#social-panel #messages .header .label, \
	   .messages-button .counter')
		.toggle(LW.messages.unread > 0)
		.text(LW.messages.unread)
}

var FormatTime = function(time) {

	var hours = Math.floor(time / 3600);
	var minuts = Math.floor((time % 3600) / 60);
	var seconds = time - hours * 3600 - minuts * 60;

	var res = "";
	if (hours > 0) res += hours + "h ";
	if (minuts > 0) res += minuts + "m ";
	res += seconds + "s";

	return res;
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

LW.smiley = function(data) {

	for (var s in LW.smileys) {
		for (var i in LW.smileys[s]) {
			var x = -1 - s * 18;
			data = data.replace(new RegExp("(^|\\s)" + escapeRegExp(LW.smileys[s][i]), "g"),
			"$1<span class='smiley' title='" + LW.smileys[s][i] + "' style=\"background-position: " + x + "px -1px;\"></span>");
		}
	}
	return data
}

LW.smileyElem = function(elem) {

	$(elem).html(LW.smiley($(elem).html()))

	// Remove smiley in code tags
	$('pre .smiley').each(function() {
		$(this).replaceWith($(this).attr('title'))
	})
}

function linkify(text) {

	var urlPattern = /(\b([\w-]+:\/\/?|www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;\(\)]*)/gim;

	// Email addresses
	var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;

	var blank = function (url) {
		return (url.indexOf("http://www.leekwars.com") != 0
		 && url.indexOf("http://leekwars.com") != 0
		 && url.indexOf("https://www.leekwars.com") != 0
		 && url.indexOf("www.leekwars.com") != 0
		 && url.indexOf("leekwars.com") != 0) ? "target='_blank' rel='nofollow'" : "";
	};

	return text
		.replace(urlPattern, function(url) {
			var http = url.indexOf('http') != 0 ? 'http://' : '';
			return '<a ' + blank(url) + ' href="' + http + url + '">' + url + '</a>'
		})
		.replace(emailAddressPattern, '<a target="_blank" rel="nofollow" href="mailto:$&">$&</a>');
}

function linkifyElem(elem) {

	$(elem).html(linkify($(elem).html()));
}

function commands(text, authorName) {

	text = text.replace(/(^| )\/me($|\s)/g, "$1<i>" + authorName + "</i>$2");
	text = text.replace(/(^| )\/lama($|\s)/g, "$1<i>#LamaSwag</i>$2");
	text = text.replace(/(^| )\/admin($|\s)/g, "$1<i>" + authorName + " aime les admins !</i>$2");

	return text;
}

LW.chat.init = function() {

	LW.chat.channels = _.parseJSON(localStorage['chat/channels'], [])
	if (LW.chat.channels.length == 0) {
		LW.chat.channels.push(_.lang.current)
	}

	LW.chat.controller = new ChatController($('#mini-chat'))

	for (var c in LW.chat.channels) {
		LW.socket.send([LW.ENABLE_CHAT, LW.chat.channels[c]])
	}
}

LW.chat.addChannel = function(channel) {

	if (LW.chat.channels.indexOf(channel) == -1) {

		LW.chat.channels.push(channel)
		LW.socket.send([FORUM_CHAT_ENABLE, channel])

		localStorage['chat/channels'] = JSON.stringify(LW.chat.channels)
	}
}

LW.chat.removeChannel = function(channel) {

	var pos = LW.chat.channels.indexOf(channel)
	if (pos != -1) {

		LW.chat.channels.splice(pos, 1)
		LW.socket.send([FORUM_CHAT_DISABLE, channel])

		localStorage['chat/channels'] = JSON.stringify(LW.chat.channels)
	}
}

LW.chat.receive = function(data) {

	var message = {
		lang: data[0],
		farmer_id: data[1],
		farmer_name: data[2],
		content: data[3],
		date: data[4],
		farmer_color: data[5],
		avatar_changed: data[6]
	}

	LW.chat.controller.receive_message(message)

	if (!(message.lang in LW.chat.messages)) LW.chat.messages[message.lang] = []
	LW.chat.messages[message.lang].push(message)
}

LW.chat.mute_user = function(data) {

	LW.chat.controller.mute_user(data);
}

function resizePanel() {

	if ('main/social-width' in localStorage) {
		$('#social-panel').width(localStorage['main/social-width'])
	}

    $('#social-panel').find('.resizer').on('mousedown', function(e) {

		var startX = e.clientX
		var startWidth = $('#social-panel').width()

		$(document.documentElement).on('mousemove', function(e) {
			var w = Math.max(400, Math.min(800, startWidth + startX - e.clientX))
			localStorage['main/social-width'] = w
			$('#social-panel').width(w)
		})

		$(document.documentElement).on('mouseup', function(e) {
			$(document.documentElement).off('mousemove mouseup')
		})

		e.preventDefault()
	})
}

LW.loader = {
	visible: false,
	show: function() {
		if (!this.visible) {
			$('#loader').stop().fadeIn(200).css("display", "flex")
			this.visible = true
		}
	},
	hide: function() {
		if (this.visible) {
			$('#loader').stop().fadeOut(200)
			this.visible = false
		}
	},
	toggle: function() {
		if (this.visible) this.hide()
		else this.show()
	}
}

LW.error = function(title, message) {

	_.view.load('error', false, function() {
		LW.loader.hide()
		LW.setPageContent('error', _.view.render('error', {title: title, message: message}))
	})
}

LW.notifications.load = function() {

	_.get('notification/get-latest/20/' + LW.token(), function(data) {

		if (data.success) {

			LW.notifications.unread = data.unread
			LW.updateCounters()

			_.reverse(data.notifications).map(function(n) {

				var notification = LW.notifications.getData(n)
				notification.formatted_date = LW.util.formatDuration(n.date)
				LW.notifications.add(notification, false)
			})
		}
	})
}

LW.notifications.receive = function(notification) {

	notification = LW.notifications.getData(notification)
	notification.formatted_date = LW.util.formatDuration(notification.date)

	LW.notifications.add(notification, true)

	LW.squares.add({
		image: LW.staticURL + 'image/notif/' + notification.image + '.png',
		title: _.lang.get('notifications', 'title_' + notification.type, notification.title),
		message: _.lang.get('notifications', 'message_' + notification.type, notification.message),
		link: notification.link,
		padding: true
	})
}

LW.notifications.add = function(notification, animation) {

	LW.notifications.notifications.push(notification)

	var view = _.view.render('main.notification', notification)

	$('#notifications .list').prepend(view)

	if (animation === true) {
		$('#notifications .list').scrollTop(0)
		$('#notifications .notification').first()
		.css('margin-left', '100%').css('margin-right', '-100%')
		.animate({
			marginLeft: '0%',
			marginRight: '0%',
		}, 1000);
	}
}

LW.squares = {}

LW.squares.add = function(params) {

	message = _.protect(params.message)
	message = LW.smiley(message)
	// message = linkify(message)

	var square = "<a href='" + params.link + "'>";
	square += "<div class='square'>";
	square += "<img class='image " + (params.padding ? 'padding' : '') + "' src='" + params.image + "'></img>";
	square += "<div class='title'>" + params.title + "</div>";
	square += "<div class='message'>" + message + "</div>";
	square += "</div></a>";

	$('#squares').append(square);

	// Animation
	$("#squares .square").last().css('margin-bottom', -$("#squares .square").last().outerHeight());
	$("#squares .square").last().animate({
		marginBottom: 20,
		}, 500, function() {
			$("#squares .square").last().css('margin-bottom', 20);
		}
	);
	$("#squares .square").last().delay(5000).animate({
		marginRight: -220,
		}, 500, function() {
			$(this).remove();
		}
	);
};


LW.util.formatDuration = function(timestamp, capital) {

	if (timestamp == 0 || timestamp == null) return "-"

	var seconds = LW.time.get() - timestamp

	var text = ""

	if (seconds < 60) { // en dessous d'une minute
		text = _.lang.get("main", "time_just_now")
	} else if (seconds < 3600) { // en dessous d'une heure
		var minuts = Math.floor(seconds / 60)
		if (minuts == 1) {
			text = _.lang.get("main", "time_1_minute_ago")
		} else {
			text = _.lang.get("main", "time_x_minutes_ago", minuts)
		}
	} else if (seconds < 24 * 3600) { // en dessous d'un jour
		var hours = Math.floor(seconds / 3600)
		if (hours == 1) {
			text = _.lang.get("main", "time_1_hour_ago")
		} else {
			text = _.lang.get("main", "time_x_hours_ago", hours)
		}
	} else if (seconds < 30 * 24 * 3600) { // en dessous d'un mois
		var days = Math.floor(seconds / (24 * 3600))
		if (days == 1) {
			text = _.lang.get("main", "time_1_day_ago")
		} else {
			text = _.lang.get("main", "time_x_days_ago", days)
		}
	} else { // au dessus d'un mois
		var months = Math.floor(seconds / (30 * 24 * 3600))
		if (months == 1) {
			text = _.lang.get("main", "time_1_month_ago")
		} else {
			text = _.lang.get("main", "time_x_months_ago", months)
		}
	}

	if (capital === true) {
		text = _.ucfirst(text)
	}

	return text
}

LW.notifications.getData = function(notification) {

	var type = notification.type
	var params = notification.parameters
	var leeks = []
	for (var l in LW.farmer.leeks) {
		leeks[LW.farmer.leeks[l].id] = LW.farmer.leeks[l]
	}

	var link = ""
	var image = ""
	var title = []
	var message = []

	if (type == NOTIFICATION_UP_LEVEL) {

		leekId = params[0]
		leekName = leeks[params[0]].name
		level = params[1]

		link = "/leek/" + leekId
		image = "level_up"
		title = [leekName, level]
		message = [leekName]

	} else if (type == NOTIFICATION_FIGHT_REPORT) {

		leekName = "?"
		if (params[0] in leeks) {
			leekName = leeks[params[0]].name
		}
		fightId = params[1]
		enemyName = params[2]

		link = "/fight/" + fightId
		image = "fight"
		title = [leekName, enemyName]

	} else if (type == NOTIFICATION_NEW_MESSAGE) {

		farmerName = params[0]
		topicId = params[1]
		catgoryId = params[3]
		page = params[4]
		topicTitle = params[5]

		link = "/forum/category-" + catgoryId + "/topic-" + topicId + (page > 1 ? "/page-" + page : "") + "#message-" + params[2]
		image = "forum_response"
		title = [farmerName, topicTitle]

	} else if (type == NOTIFICATION_COMPOSITION_FIGHT_REPORT) {

		leekName = leeks[params[0]].name
		fightId = params[1]
		teamName = params[2]

		link = "/fight/" + fightId
		image = "team_fight"
		title = [leekName, teamName]

	} else if (type == NOTIFICATION_TEAM_BANNED) {

		teamName = params[0]

		link = "/farmer"
		image = "team_banned"
		title = [teamName]

	} else if (type == NOTIFICATION_TEAM_NEW_CANDIDACY) {

		teamID = params[0]
		teamName = params[1]
		farmerName = params[2]

		link = "/team/" + teamID
		image = "team_candidacy"
		title = [farmerName, teamName]

	} else if (type == NOTIFICATION_CANDIDACY_ACCEPTED) {

		teamID = params[0]
		teamName = params[1]

		link = "/team/" + teamID
		image = "team_accepted"
		title = [teamName]

	} else if (type == NOTIFICATION_CANDIDACY_REFUSED) {

		teamID = params[0]
		teamName = params[1]

		link = "/team/" + teamID
		image = "team_refused"
		title = [teamName]

	} else if (type == NOTIFICATION_TOURNAMENT_WINNER) {

		tournamentID = params[0]
		leekName = params[1]

		link = "/tournament/" + tournamentID
		image = "tournament_win"
		title = [leekName]

	} else if (type == NOTIFICATION_NO_TOURNAMENT) {

		link = "/farmer"
		image = "tournament_fail"

	} else if (type == NOTIFICATION_TROPHY_UNLOCKED) {

		trophyID = params[0]
		trophyName = _.lang.get('trophy', LW.trophies[trophyID - 1].code)

		link = "/farmer"
		image = "trophy_unlocked"
		title = [trophyName]

	} else if (type == NOTIFICATION_FIGHT_COMMENT) {

		farmerName = params[0]
		fightID = params[1]

		link = "/fight/" + fightID
		image = "comment"
		title = [farmerName]

	} else if (type == NOTIFICATION_TOURNAMENT_COMMENT) {

		farmerName = params[0]
		tournamentID = params[1]

		link = "/tournament/" + tournamentID
		image = "comment"
		title = [farmerName]

	} else if (type == NOTIFICATION_TOURNAMENT_END) {

		tournamentID = params[0]
		lastRound = params[1]
		leekID = params[2]
		leekName = params[3]

		rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']

		lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]

		link = "/tournament/" + tournamentID
		image = "tournament_end"
		title = [leekName, _.lang.get('tournament', lastRoundName)]

	} else if (type == NOTIFICATION_CHALLENGE) {

		leekName = leeks[params[0]].name
		fightID = params[1]
		enemyName = params[2]

		link = "/fight/" + fightID
		image = "fight"
		title = [leekName, enemyName]

	} else if (type == NOTIFICATION_FARMER_CHALLENGE) {

		fightID = params[0]
		enemyName = params[1]

		link = "/fight/" + fightID
		image = "fight"
		title = [enemyName]

	} else if (type == NOTIFICATION_FARMER_FIGHT_REPORT) {

		fightID = params[1]
		farmerName = params[2]

		link = "/fight/" + fightID
		image = "fight"
		title = [farmerName]

	} else if (type == NOTIFICATION_TEAM_NEW_FARMER) {

		teamID = params[0]
		farmerName = params[1]

		link = "/team/" + teamID
		image = "team_accepted"
		title = [farmerName]

	} else if (type == NOTIFICATION_FARMER_TOURNAMENT_WIN) {

		tournamentID = params[0]

		link = "/tournament/" + tournamentID
		image = "tournament_win"

	} else if (type == NOTIFICATION_NEW_GODSON) {

		godsonID = params[0]
		godsonName = params[1]

		link = "/farmer/" + godsonID
		image = "godfather"
		title = [godsonName]

	} else if (type == NOTIFICATION_FARMER_TOURNAMENT_END) {

		tournamentID = params[0]
		lastRound = params[1]

		rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']

		lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]

		link = "/tournament/" + tournamentID
		image = "tournament_end"
		title = [_.lang.get('tournament', lastRoundName)]

	} else if (type == NOTIFICATION_NEW_WARNING) {

		link = "/farmer"
		image = "warning"

	} else if (type == NOTIFICATION_TEAM_TOURNAMENT_WIN) {

		tournamentID = params[0]
		leekName = params[1]

		link = "/tournament/" + tournamentID
		image = "tournament_win"
		title = [compoName]

	} else if (type == NOTIFICATION_TEAM_TOURNAMENT_END) {

		tournamentID = params[0]
		lastRound = params[1]
		compoName = params[2]

		rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']

		lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]

		link = "/tournament/" + tournamentID
		image = "tournament_end"
		title = [compoName, _.lang.get('tournament', lastRoundName)]

	} else if (type == NOTIFICATION_REPORTING_PROCESSED) {

		targetName = params[0]

		image = "reporting_processed"
		title = [targetName]

	} else {

		title = "? type " + type
		message = "id " + notification.id
	}

	for (var t in title) title[t] = _.protect(title[t])

	return {type: type, link: link, image: image, title: title, message: message,
		date: notification.date}
}

LW.messages.load = function() {

	_.get('message/get-latest-conversations/10/' + LW.token(), function(data) {

		if (data.success) {

			LW.messages.unread = data.unread
			LW.updateCounters()

			_.reverse(data.conversations).map(function(c) {
				LW.messages.addConversation(c)
			})
		}
	})
}

LW.messages.receive = function(message) {

	LW.squares.add({
		image: LW.util.getAvatar(message.farmer.id, message.farmer.avatar_changed),
		title: message.farmer.name,
		message: "► " + message.message,
		link: "/messages/conversation/" + message.conversation,
		padding: false
	})

	var exists = LW.messages.conversations.reduce(function(e, c) {
		return c.id == message.conversation || e
	}, false)

	if (!exists) {

		LW.messages.unread++
		LW.updateCounters()

		LW.messages.addConversation({
			id: message.conversation,
			farmers: [message.farmer],
			last_date: message.date,
			last_message: message.message,
			last_farmer_id: message.farmer.id
		})
	}

	var element = $('#messages .list .message[conversation=' + message.conversation + ']')
	var position = element.parent().index()

	var messageHTML = LW.smiley(_.protect(message.message))

	element.find('.message').html(messageHTML)
	element.find('.date').text(LW.util.formatDuration(message.date))

	if (position > 0) {
		$('#messages .list').prepend(element.parent().remove())
	}

	if (!exists || position != 0) {
		$('#messages .list').scrollTop(0)
		element.css('margin-left', '100%').css('margin-right', '-100%')
		.animate({
			marginLeft: '0%',
			marginRight: '0%',
		}, 1000)
	}
}

LW.messages.addConversation = function(conversation) {

	conversation.avatars = LW.messages.getAvatars(conversation)
	conversation.farmer_list = LW.messages.getConversationList(conversation)
	conversation.last_message = LW.messages.getConversationLastMessage(conversation)
	conversation.last_date = LW.util.formatDuration(conversation.last_date)
	conversation.link = '/messages/conversation/' + conversation.id

	LW.messages.conversations.push(conversation)

	var view = _.view.render('main.message', conversation)

	$('#messages .list').prepend(view)
}

LW.messages.getAvatars = function(conversation) {

	for (var f in conversation.farmers) {
		if (conversation.farmers[f].id == LW.farmer.id) continue
		return "<img src='" + LW.util.getAvatar(conversation.farmers[f].id, conversation.farmers[f].avatar_changed) + "'></img>"
	}
}

LW.messages.getConversationList = function(conversation) {

	var names = []
	for (var f in conversation.farmers) {
		if (conversation.farmers[f].id != LW.farmer.id) {
			names.push("<span class='" + conversation.farmers[f].color + "'>" +
					   _.protect(conversation.farmers[f].name) + "</span>")
		}
	}
	return names.join(", ")
}

LW.messages.getConversationLastMessage = function(conversation) {

	var msg = _.protect(conversation.last_message)

	if (conversation.last_farmer_id == LW.farmer.id) {
		msg = "<b>" + _.lang.get('messages', 'me') + " ►</b> " + msg
	}
	msg = LW.smiley(msg)
	return msg
}

LW.util.getAvatar = function(farmerID, avatarChanged) {

	if (avatarChanged == 0) {
		return LW.staticURL + '/image/no_avatar.png'
	} else {
		return LW.avatarURL + '/avatar/' + farmerID + '.png'
	}
};


LW.time.get = function() {

	return (Date.now() / 1000 | 0) - LW.time.delta
}

LW.sfw.init = function() {

	if (localStorage['sfw'] === 'true') {
		LW.sfw.on()
	} else {
		LW.sfw.off()
	}
}

LW.sfw.on = function() {

	localStorage['sfw'] = true
	LW.sfw.active = true

	$('body').addClass('sfw');
	$("#favicon").attr("href", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oFFAADATTAuQQAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAEklEQVQ4y2NgGAWjYBSMAggAAAQQAAGFP6pyAAAAAElFTkSuQmCC");
}

LW.sfw.off = function() {

	if (LW.sfw.active) {
		localStorage['sfw'] = false
		LW.sfw.active = false

		$('body').removeClass('sfw');
		$("#favicon").attr("href", LW.staticURL + "/image/favicon.png");
	}
}


LW.util.createCodeArea = function(code, element) {

	CodeMirror.runMode(code, "leekscript", element);

	var pre = $(element);

	for (var i = 0; i < pre.length; i++) {
		pre[i].innerHTML = '<span class="line-number"></span>' + pre[i].innerHTML + '<span class="cl"></span>';
		var num = pre[i].innerHTML.split(/\n/).length;
		for (var j = 0; j < num; j++) {
			var line_num = pre[i].getElementsByTagName('span')[0];
			line_num.innerHTML += '<span>' + (j + 1) + '</span>';
		}
	}
}

LW.consoleAlertMessage = function() {
	if (!LW.admin) {
		var style = "color: black; font-size: 13px; font-weight: bold;"
		var styleRed = "color: red; font-size: 14px; font-weight: bold;"
		console.log("%c " + _.lang.get('main', 'console_alert_1'), style)
		console.log("%c " + _.lang.get('main', 'console_alert_2'), styleRed)
		console.log("%c " + _.lang.get('main', 'console_alert_3'), style)
		console.log("")
	}
}

LW.updateHabs = function(delta) {
	LW.farmer.habs += delta
	$('#farmer-habs').html(_.format.number(LW.farmer.habs))
}

LW.setHabs = function(habs) {
	LW.farmer.habs = habs
	$('#farmer-habs').html(_.format.number(LW.farmer.habs))
}

LW.updateCrystals = function(delta) {
	LW.farmer.crystals += delta
	$('#farmer-crystals').html(_.format.number(LW.farmer.crystals))
}

LW.setCrystals = function(crystals) {
	LW.farmer.crystals = crystals
	$('#farmer-crystals').html(_.format.number(LW.farmer.crystals))
}

LW.getImageSize = function(image, callback) {

	if ('imagesize/' + image in localStorage) {
		data = localStorage['imagesize/' + image].split(',')
		callback({width: data[0], height: data[1]})
		return
	}

	_.post('util/get-image-size', {image: image}, function(data) {
		if (data.success) {
			localStorage['imagesize/' + image] = data.width + ',' + data.height
			callback({width: data.width, height: data.height})
		} else {
			callback(null)
		}
	})
}

LW.getLeekAppearence = function(level) {
	if (level < 10) return 1
	else if (level < 20) return 2
	else if (level < 50) return 3
	else if (level < 80) return 4
	else if (level < 100) return 5
	else if (level < 150) return 6
	else if (level < 200) return 7
	else if (level < 250) return 8
	else if (level < 300) return 9
	else if (level < 301) return 10
	return 11
}

LW.skins = {
	1: "green",
	2: "blue",
	3: "yellow",
	4: "red",
	5: "orange",
	6: "pink",
	7: "cyan",
	8: "purple",
	9: "multi",
	10: "rasta",
	11: "white",
	12: "black",
	13: "alpha",
	14: "apple",
	15: "gold"
}

LW.getLeekSkinName = function(skin) {

	if (!(skin in LW.skins)) return LW.skins[1]
	return LW.skins[skin]
}

LW.createLeekImage = function(scale, level, skin, hat, callback) {

	var hatTemplate = hat ? LW.hats[LW.hatTemplates[hat].item] : null

	var leekImage = null
	var leekWidth = 0
	var leekHeight = 0
	var hatImage = null

	var generate = function(hatImage, hatWidth, hatHeight) {

		width = Math.max(leekWidth, hatWidth) + (leekWidth / 25)
		height = leekHeight
		if (hat != null) height += hatHeight - leekHeight * hatTemplate.height

		leekX = width / 2 - leekWidth / 2
		leekY = height - leekHeight

		data = "<svg viewBox='0 0 " + width + " " + height + "' width='" + width + "'' height='" + height + "''>"
		data += "<image x='" + leekX + "' y='" + leekY + "' width='" + leekWidth + "' height='" + leekHeight + "' xlink:href='" + LW.staticURL + 'image/' + leekImage + "'></image>";
		if (hat != null) {
			hatX = width / 2 - hatWidth / 2 - (leekWidth / 25)
			data += "<image y='0' x='" + hatX + "' width='" + hatWidth + "' height='" + hatHeight + "' xlink:href='" + LW.staticURL + 'image/' + hatImage + "'></image>"
		}
		data += "</svg>"

		callback(data)
	}

	leekImage = 'leek/leek' + LW.getLeekAppearence(level) + '_front_' + LW.getLeekSkinName(skin) + '.png'

	leekSize = LW.getImageSize(leekImage, function(leekSize) {

		leekWidth = leekSize.width * scale
		leekHeight = leekSize.height * scale

		if (hat != null) {

			hatImage = 'hat/' + LW.hats[LW.hatTemplates[hat].item].name + '.png'

			LW.getImageSize(hatImage, function(hatSize) {

				hatWidth = leekWidth * hatTemplate.width
				hatHeight = hatWidth * (hatSize.height / hatSize.width)

				generate(hatImage, hatWidth, hatHeight)
			})
		} else {

			generate(hatImage, 0, 0)
		}
	})
}


LW.didactitiel = function(event) {

	var load = function(c) {
		_.view.load('didactitiel', false, function() {
			_.lang.load('didactitiel', false, function() {
				_.lang.load('leek', false, function() {
					c()
				})
			})
		})
	}

	load(function() {

		var didactitiel = new _.popup.new('didactitiel', {
			farmer_name: LW.farmer.name,
			farmer_fisrt_leek: _.first(LW.farmer.leeks).name
		}, 800)

		var currentPage = 0
		var count = didactitiel.find('.content .page').length

		didactitiel.setDismissable(false)
		didactitiel.show(event)

		didactitiel.find('#dida-previous').hide()
		didactitiel.find('#dida-play').hide()

		didactitiel.find('.pagination').text("1 / " + count)

		didactitiel.find('.content .page').hide()
		didactitiel.find('.content .page').first().show()
		didactitiel.find('.content').height(didactitiel.find('.content .page').first().height() + 30)

		didactitiel.find('.skip-previous').click(function() {

			if (currentPage == 0) {
				didactitiel.dismiss()
			} else {
				currentPage--
				if (currentPage == 0) {
					$(this).find('#dida-skip').show()
					$(this).find('#dida-previous').hide()
				}

				didactitiel.find('#dida-play').show()
				didactitiel.find('#dida-next').hide()

				$(didactitiel.find('.content .page')[currentPage + 1]).animate({
					left: '820px'
				}, 600)

				$(didactitiel.find('.content .page')[currentPage]).show().css('left', '-780px').animate({
					left: '20px'
				}, 600)

				didactitiel.find('.content').animate({
					height: $(didactitiel.find('.content .page')[currentPage]).height() + 30
				}, 400)

				didactitiel.find('.pagination').text((currentPage + 1) + " / " + count)
			}
		})

		didactitiel.find('.next').click(function() {

			currentPage++

			didactitiel.find('#dida-previous').show()
			didactitiel.find('#dida-skip').hide()

			if (currentPage >= count - 1) {
				$(this).find('#dida-next').hide()
				$(this).find('#dida-play').show()
			}
			if (currentPage >= count) {
				didactitiel.dismiss()
			} else {

				$(didactitiel.find('.content .page')[currentPage - 1]).animate({
					left: '-780px'
				}, 600)

				$(didactitiel.find('.content .page')[currentPage]).show().css('left', '820px').animate({
					left: '20px'
				}, 600)

				didactitiel.find('.content').animate({
					height: $(didactitiel.find('.content .page')[currentPage]).height() + 30
				}, 400)

				didactitiel.find('.pagination').text((currentPage + 1) + " / " + count)
			}
		})
	})
}

LW.createCodeTags = function(elem) {

	data = $(elem).html();

	// On enlève les retours à la ligne après une balise code, y'a déjà un br naturel
	data = data.replace(/\[\/code\]<br>/g, "[/code]");

	var OP_SIZE = "[code]".length;
	var CL_SIZE = "[/code]".length;

	var pos = 0;
	var length = data.length;

	// Balise [code] ouvrante
	while ((pos = data.indexOf("[code]", pos)) != -1) {

		var next = data.indexOf("[code]", pos + "[code]".length);

		// On cherche la fermante...
		var closing = data.indexOf('[/code]');

		// C'est bon ?
		if (closing != -1 && (next == -1 || next > closing)) {

			var code = $.trim(data.substring(pos + OP_SIZE, closing).replace(/<br>\s\n/g, "\n").replace(/<br>/g, "\n"));

			data = data.substring(0, pos) + "<textarea class='forum-code'>" + code + "</textarea>" + data.substring(closing + CL_SIZE);

		} else {
			break; // Erreur de balise
		}
	}

	$(elem).html(data);

	$('textarea.forum-code:not(.ok)').each(function() {

		var preview = "code-preview-" + LW.codePreviewI++;
		$("<code><pre id='" + preview + "'></pre></code>").insertAfter(this);

		LW.util.createCodeArea($(this).val(), document.getElementById(preview));

		$(this).remove();
	});
}

LW.getWeaponIDByName = function(name) {
	for (var w in LW.weapons) {
		if (LW.weapons[w].name == name) return w
	}
	return null
}

LW.getChipIDByName = function(name) {
	for (var c in LW.chips) {
		if (LW.chips[c].name == name) return c
	}
	return null
}

LW.createWeaponPreview = function(template) {

	var preview = "<div class='item-preview'>"

	preview += "<div class='header'>"
	preview += "<h2 class='name'>" + _.lang.get('weapon', template.name) + "</h2>"
	preview += "<div class='level'>" + _.lang.get('effect', 'level_n', template.level) + "</div>"
	preview += "</div>"

	preview += "<div class='constant'>WEAPON_" + template.name.toUpperCase() + "</div>"
	preview += "<div class='image'><img src='" + LW.staticURL + 'image/weapon/' + template.name + ".png' ></img></div>"

	if (_.lang.has('weapon', template.name + "_desc")) {
		preview += "<div class='desc'>" + _.lang.get('weapon', template.name + "_desc") + "</div>"
	}

	preview += "<div class='stats'>"

	preview += "<div>" + LW.createScopeView(template.min_range, template.max_range, template.launch_type)

	launchType = template.launch_type == 0 ? _.lang.get('effect', 'in_lign') : ""

	preview += _.lang.get('effect', 'range', template.min_range, template.max_range) + " " + launchType
	if (!template.los) {
		preview += "<br>[<b>" + _.lang.get('effect', 'through_obstacles') + "</b>]"
	}
	preview += "</div>"

	preview += "<div><img src='" + LW.staticURL + "/image/icon_tp.png'></img> " + template.cost + "</div>"

	preview += LW.createAreaView(template.area)

	for (var e in template.effects) {
		preview += LW.getEffectDiv(template.effects[e])
	}

	preview += "</div>"
	preview += "</div>"

	return preview
}

LW.createChipPreview = function(template) {

	if (!template) return ''

	var id = template.id

	var preview = "<div class='item-preview'>"
	preview += "<div class='header'>"

	preview += "<h2 class='name'>" + _.lang.get('chip', template.name) + "</h2>"
	preview += "<div class='level'>" + _.lang.get('effect', 'level_n', template.level) + "</div>"
	preview += "</div>"

	preview += "<div class='constant'>CHIP_" + template.name.toUpperCase() + "</div>"
	preview += "<div class='image'><img src='" + LW.staticURL + "image/chip/small/" + template.name + ".png' ></img></div>"

	if (_.lang.has('chip', template.name + "_desc") && _.lang.get(template.name + "_desc")) {
		preview += "<div class='desc'>" + _.lang.get(template.name + "_desc") + "</div>"
	}

	preview += "<div class='stats'>"

	preview += "<div>" + LW.createScopeView(template.min_range, template.max_range, template.launch_type)

	launchTypeText = template.launch_type == 0 ? _.lang.get('effect', 'in_lign') : ""

	preview += _.lang.get('effect', 'range', template.min_range, template.max_range) + " " + launchTypeText

	if (!template.los) {
		preview += "<br>[<b>" + _.lang.get('effect', 'through_obstacles') + "</b>]"
	}
	preview += "</div>"

	preview += "<div><img src='" + LW.staticURL + "/image/icon_tp.png'></img> " + template.cost + "</div>";

	preview += LW.createAreaView(template.area)

	if (template.cooldown != 0) {
		var cd = _.lang.get('effect', 'cooldown', (template.cooldown >= 0 ? template.cooldown : "∞"))
		if (template.team_cooldown) {
			cd += ' (<b>' + _.lang.get('effect', 'team_cooldown') + '</b>)'
		}
		preview += "<div>" + cd + "</div>";
	}

	if (template.initial_cooldown > 0) {
		preview += "<div>" + _.lang.get('effect', 'initial_cooldown', template.initial_cooldown) + "</div>";
	}

	summon = false
	summonID = -1

	for (var e in template.effects) {

		preview += LW.getEffectDiv(template.effects[e])

		if (template.effects[e].id == LW.EFFECT.SUMMON) {
			summon = true
			summonID = template.effects[e].value1
		}
	}

	preview += "</div>"

	if (summon) {
		preview += LW.createSummonDetails(summonID)
	}

	preview += "</div>"

	return preview
}

LW.createPotionPreview = function(template) {

	var preview = "<div class='item-preview'>"

	preview += "<div class='header'>"
	preview += "<h2 class='name'>" + _.lang.get('potion', template.name) + "</h2>"
	preview += "<div class='level'>" + _.lang.get('effect', 'level_n', template.level) + "</div>"
	preview += "</div>"

	preview += "<br><img src='" + LW.staticURL + "image/potion/" + template.name + ".png' ></img>"

	if (_.lang.has('potion', template.name + "_desc")) {
		preview += "<div class='desc'>" + _.lang.get('potion', template.name + "_desc") + "</div>"
	}

	preview += "<div class='stats'>"

	var skin = null

	for (var e in template.effects) {

		var type = template.effects[e].type
		var params = template.effects[e].params

		if (type == POTION_EFFECT_CHANGE_SKIN) {

			skin = params[0]
			var skinName = _.lang.get('potion', 'skin_' + params[0])
			preview += "<div>" + _.lang.get('potion', 'effect_' + type, skinName) + "</div>"

		} else {
			preview += "<div>" + _.lang.get('potion', 'effect_' + type) + "</div>"
		}
	}

	if (skin != null) {
		preview += "<div class='leek-preview'>";
		preview += "<img width='55' src='" + LW.staticURL + "/image/leek/leek3_front_" + SKINS[skin] + ".png'></img>"
		preview += "<img width='75' src='" + LW.staticURL + "/image/leek/leek5_front_" + SKINS[skin] + ".png'></img>"
		preview += "<img width='105' src='" + LW.staticURL + "/image/leek/leek8_front_" + SKINS[skin] + ".png'></img>"
		preview += "</div>"
	}
	if (!template.consumable) {
		preview += "<div>" + _.lang.get('potion', 'reusable') + "</div>"
	}

	preview += "</div>"
	preview += "</div>"

	return preview
}

LW.createHatPreview = function(template) {

	var id = template.id

	var preview = "<div class='item-preview'>"
	preview += "<div class='header'>"

	preview += "<h2 class='name'>" + _.lang.get('hat', template.name) + "</h2>";
	preview += "<div class='level'>" + _.lang.get('effect', 'level_n', template.level) + "</div>";
	preview += "</div><br>"

	preview += "<div class='image'><img src='" + LW.staticURL + "image/hat/" + template.name + ".png' ></img></div><br>";

	if (_.lang.has('hat', template.name + "_desc")) {
		preview += "<div class='desc'>" + _.lang.get('hat', template.name + "_desc") + "</div>"
	}

	preview += "<div class='stats'></div>"
	preview += "</div>"

	return preview
}

/*
 * Crée le html d'une zone de vue (portée min et max, et type)
 */
LW.createScopeView = function(min, max, type) {

	var res = "<table class='area'>"

	for (var i = 0; i < max * 2 + 1; ++i) {
		res += "<tr>"
		for (j = 0; j < max * 2 + 1; ++j) {
			x = i - max
			y = j - max

			clazz = (Math.abs(x) + Math.abs(y) <= max && Math.abs(x) + Math.abs(y) >= min
				&& (type == 1 || (x == 0 || y == 0))) ? "full" : ""

			res += "<td class='" + clazz + "'></td>"
		}
		res += "</tr>"
	}

	res += "</table>"
	return res
}

/*
 * Crée le html d'une zone de dégâts
 */
LW.createAreaView = function(area) {

	if (area == AREA_SINGLE_CELL) return ""

	if (area == AREA_LASER_LINE) {
		return "<div><b>" + _.lang.get('effect', 'lign_until_obstacle') + "</b></div>"
	}

	if (area == AREA_CIRCLE1 || area == AREA_CIRCLE2 || area == AREA_CIRCLE3) {

		var width = 0
		if (area == AREA_CIRCLE1) width = 1
		if (area == AREA_CIRCLE2) width = 2
		if (area == AREA_CIRCLE3) width = 3

		var res = "<div><table class='area'>";

		for (i = 0; i < width * 2 + 1; ++i) {
			res += "<tr>";
			for (j = 0; j < width * 2 + 1; ++j) {
				var x = i - width;
				var y = j - width;
				var clazz = (Math.abs(x) + Math.abs(y) <= width) ? "full" : "";
				res += "<td class='" +  clazz + "'></td>";
			}
			res += "</tr>";
		}

		res += "</table></div>";
		return res;
	}

	return "<div>?</div>";
}

/*
 * Crée le html d'un effet
 */
LW.getEffectDiv = function(effect) {

	var effectNum = 0;

	var v1 = effect.value1
	var v2 = effect.value2

	var data = "<div>";

	if (v2 != 0) {

		var value2 = v1 + v2
		if (Math.floor(value2) != value2) {
			value2 = _.format.numberPrecision(value2, 1)
		}

		data += _.lang.get('effect', 'type_' + effect.id, v1, value2)
	} else {
		if (effect.id == 14) { // Invocation
			data += _.lang.get('effect', 'type_14_fixed', _.lang.get('effect', 'summon_' + v1))
		} else {
			data += _.lang.get('effect', 'type_' + effect.id + '_fixed', v1)
		}
	}
	if (effect.turns > 0) {
		data += " " + _.lang.get('effect', 'on_n_turns', effect.turns)
	}

	var targets = effect.targets

	var enemies = targets % 2
	var allies = (targets >>= 1) % 2
	var caster = (targets >>= 1) % 2
	var nonSummons = (targets >>= 1) % 2
	var summons = (targets >>= 1) % 2

	if (enemies && !allies) { // Que les ennemis
		LW.tooltipCount++
		data += "<span class='ennemies' id='target-info-" + LW.tooltipCount + "'></span>";
		data += "<div class='tooltip' id='tt_target-info-" + LW.tooltipCount + "'>" + _.lang.get('effect', 'target_enemies') + "</div>";

	} else if (allies && !enemies) { // Que les alliés
		LW.tooltipCount++
		data +=  "<span class='allies' id='target-info-" + LW.tooltipCount + "'></span>";
		data += "<div class='tooltip fluid' id='tt_target-info-" + LW.tooltipCount + "'>" + _.lang.get('effect', 'target_allies') + "</div>";
	}

	if (!caster) {
		LW.tooltipCount++
		data += "<span class='not-player' id='target-info-" + LW.tooltipCount + "'></span>";
		data += "<div class='tooltip fluid' id='tt_target-info-" + LW.tooltipCount + "'>" + _.lang.get('effect', 'target_not_player') + "</div>";
	}

	if (!nonSummons) {
		LW.tooltipCount++
		data +=  "<span class='summons' id='target-info-" + LW.tooltipCount + "'></span>";
		data += "<div class='tooltip fluid' id='tt_target-info-" + LW.tooltipCount + "'>" + _.lang.get('effect', 'target_summons') + "</div>";
	}

	if (!summons) {
		LW.tooltipCount++
		data +=  "<span class='not-summons' id='target-info-" + LW.tooltipCount + "'></span>";
		data += "<div class='tooltip fluid' id='tt_target-info-" + LW.tooltipCount + "'>" + _.lang.get('effect', 'target_not_summons') + "</div>";
	}

	data += "</div>"

	return data
}

/*
 * Créé le html des détails sur une invoc
 */
LW.createSummonDetails = function(summonID) {

	var template = LW.summonTemplates[summonID]

	var details = "<div class='summon'>"

	details += "<h4>" + _.lang.get('market', 'summon_characteristics') + '</h4>'

	details += "<table><tr><td>"

	var url = LW.staticURL + "image/bulb/" + template.name + "_front.png"
	details += "<img onload='_.resizeImage(this, 0.55)' class='summon-image' width='width' src='" + url + "'>"

	var characsNames = ['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic',
						'frequency', 'mp', 'tp']

	details += "</td><td>"

	details += "<div class='characs'>"
	var i = 0
	for (var c in characsNames) {

		var charac = characsNames[c]

		var characteristic = template.characteristics[charac]

		details += "<div class='charac charac' id='charac-" + (template.id + charac) + "'>"
		details += "	<img src='" + LW.staticURL + "/image/charac/" + charac + ".png'></img>"
		details += "	<span class='color-" + charac + "'>";
		if (charac == 'frequency') {
			details += "0"
		} else {
			if (characteristic[0] == characteristic[1]) {
				details += characteristic[0]
			} else {
				details += characteristic[0] + " à " + characteristic[1]
			}
		}
		details += "</span>"
		details += "</div>"
		details += "<div class='tooltip' id='tt_charac-" + (template.id + charac) + "'><b>" + _.lang.get('leek', charac) + "</b></div>"

		if (i++ == 4) {
			details += "</td><td>"
		}
	}
	details += "</div>"

	details += "</td></tr></table>"

	details += "<h4>" + _.lang.get('market', 'summon_available_chips') + '</h4>'

	details += "<div class='chips'>"

	for (var c in template.chips) {

		var chip = LW.chips[template.chips[c]]
		details += "<img class='chip' id='summon-chip-" + (template.id + c) + "' src='" + (LW.staticURL + '/image/chip/small/' + chip.name) + ".png'>"
		details += "<div id='tt_summon-chip-" + (template.id + c) + "' class='tooltip'>" + _.lang.get('chip', chip.name) + '</div>'
	}
	details += "</div>"
	details += "</div>"

	return details
}

LW.createReportPopup = function(parameters) {

	var popup = new _.popup.new('main.report_popup', parameters)

	popup.find('.report-validate').click(function() {

		if (popup.find("input:radio[name='reason']:checked").length == 0) {
			_.toast(_.lang.get('moderation', 'you_must_choose_reason'))
			return
		}

		var target = parameters.target
		var reason = parseInt(popup.find("input:radio[name='reason']:checked").attr('id').replace('reason-', ''))
		var message = popup.find('.report-message').val()
		var parameter = parameters.parameter ? parameters.parameter : ''

		_.post('moderation/report', {target: target, reason: reason, message: message, parameter: parameter}, function(data) {

			if (data.success) {
				_.toast(_.lang.get('moderation', 'thank_you_for_reporting'))
				popup.dismiss()
			} else {
				_.toast(data.error)
			}
		})
	})

	return popup
}

LW.addItemToInventory = function(type, item_id, item_template) {

	// _.log("Add to inventory : " + item_id + ' (type ' + type + ', template: ' + item_template + ')')

	if (type == ITEM_WEAPON) {

		LW.farmer.weapons.push({
			id: item_id,
			template: item_template
		})
	} else if (type == ITEM_CHIP) {

		LW.farmer.chips.push({
			id: item_id,
			template: item_template
		})
	} else if (type == ITEM_POTION) {

		var potion = _.selectWhere(LW.farmer.potions, 'id', item_id)
		if (potion != null) {
			potion.quantity++
		} else {
			LW.farmer.potions.push({
				id: item_id,
				template: item_template
			})
		}
	}
}

LW.removeItemFromInventory = function(type, item_template) {

	// _.log("Remove from inventory : " + item_template + ' (type ' + type + ')')

	if (type == ITEM_WEAPON) {

		_.removeOneWhere(LW.farmer.weapons, 'template', item_template)

	} else if (type == ITEM_CHIP) {

		_.removeOneWhere(LW.farmer.chips, 'template', item_template)

	} else if (type == ITEM_POTION) {

		var potion = _.selectWhere(LW.farmer.potions, 'template', item_template)
		if (potion != null) {
			potion.quantity--
		} else {
			_.removeOneWhere(LW.farmer.potions, 'template', item_template)
		}
	} else if (type == ITEM_CHIP) {

	}
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

var ChatController = function(chat_element, private_chat, team_chat) {

	var controller = this
	this.msg_elem = chat_element.find('.chat-messages')

	if (team_chat) {
		LW.socket.send([TEAM_CHAT_ENABLE])
	}

	var _chatLanguage = null

	LW.chat.channels.forEach(function(l) {
		$("#chat-languages img[code='" + l + "']").addClass('activated')
	})

	var channel = localStorage['chat/channel']
	if (channel in _.lang.languages) {
		setChatLanguage(channel)
	} else {
		setChatLanguage(_.lang.current)
	}

	$('#chat-languages img').click(function() {

		var code = $(this).attr('code')

		if ($(this).hasClass('activated')) {

			if (LW.chat.channels.length > 1) {

				LW.chat.removeChannel(code)

				$(this).removeClass('activated')
				removeChatLang(code)
				if (LW.chat.channels.length == 1) hideFlags()
				if (_chatLanguage == code && _chatLanguage != LW.chat.channels[0]) {
					setChatLanguage(LW.chat.channels[0])
				}
			}
		} else {

			LW.chat.addChannel(code)

			$(this).addClass('activated')
			if (LW.chat.channels.length > 1) showFlags()
			setChatLanguage(code)
		}
	})

	$('#chat-language').click(function(e) {

		if (!_languageSelection) {

			updateLanguageSelection()
			$('#chat-language-selection').show()
			_languageSelection = true

		} else {

			$('#chat-language-selection').hide()
			_languageSelection = false
		}

		e.stopPropagation()
	});

	$('html').click(function() {
		$('#chat-language-selection').hide()
		_languageSelection = false
	})

	$('#chat-language-selection').click(function(e) {
		e.stopPropagation()
	})

	$("#chat-language-selection input[name='language']").change(function() {
		var newLanguage = $(this).val()
		setChatLanguage(newLanguage)
	})

	if (LW.chat.channels.length <= 1) {
		hideFlags()
	}

	if (!private_chat) {

		chat_element.find('.chat-send').click(function() {
			controller.send()
		})

		chat_element.find('.chat-input').keyup(function(e) {
			if (e.keyCode == 13) {
				controller.send()
			}
		})

		if (!team_chat) {
			for (var c in LW.chat.channels) {
				for (var m in LW.chat.messages[LW.chat.channels[c]]) {

					var message = LW.chat.messages[LW.chat.channels[c]][m]
					controller.receive_message(message);
				}
			}
		}
	}

	function setChatLanguage(channel) {
		_chatLanguage = channel
		localStorage['chat/channel'] = channel
		$('#chat-language img').attr('src', $("#chat-languages img[code='" + _chatLanguage + "']").attr('src'));
		$("#chat-language-selection input[name='language'][value='" + _chatLanguage + "']").prop('checked', true);
	}

	function updateLanguageSelection() {
		var parent = '#chat-language';
		var tt = '#chat-language-selection';
		var height = $(parent).outerHeight() + ($(parent)[0].getBBox ? $(parent)[0].getBBox().height : 0);
		$(tt).css('top', $(parent).offset().top + height + 10);
		$(tt).css('left', $(parent).offset().left + $(parent).outerWidth() / 2);
		$(tt).css('margin-left', - $(tt).outerWidth() / 2);
	}

	function removeChatLang(lang) {
		controller.msg_elem.find('.chat-message').each(function() {
			if ($(this).attr('lang') == lang) $(this).remove()
		})
	}

	function showFlags() {
		$('#chat-messages .chat-message .flag').show()
	}
	function hideFlags() {
		$('#chat-messages .chat-message .flag').hide()
	}

	ChatController.prototype.send = function() {
		var message = $.trim(chat_element.find('.chat-input').val())
		if (message.length == 0) return ;
		if (message.length > 1000) {
			_.toast(_.lang.get('chat', 'too_long'))
			return ;
		}
		if (team_chat) {
			LW.socket.send([TEAM_CHAT_SEND, message])
		} else {
			LW.socket.send([FORUM_CHAT_SEND, _chatLanguage, message])
		}
		chat_element.find('.chat-input').val("").height(0)
	}

	ChatController.prototype.receive_message = function(data) {

		var lang = data.lang
		var author = data.farmer_id
		var authorName = data.farmer_name
		var msg = data.content
		var time = data.date
		var color = data.farmer_color
		var avatarChanged = data.avatar_changed
		var flag = $("#chat-languages img[code='" + lang + "']").attr('src')

		var message = _.protect(msg)

		message = LW.smiley(message)
		message = linkify(message)
		message = commands(message, authorName)

		var date = new Date(time * 1000);
		var minuts = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
		var timeStr = date.getHours() + ":" + minuts;

		var completeDate = _.lang.get('forum', 'chat_the_mdy_at_hm', date.getDate(), date.getMonth() + 1, date.getFullYear(), date.getHours(), minuts);

		// Dernier message envoyé par la meme personne, y'a moins de 2 minutes ?
		var last = null;
		var messages = this.msg_elem.find('.chat-message');
		for (var i = 0; i < messages.length; ++i) {
			var m = messages[i];
			var t = parseInt($(m).attr('time'));
			if (t > time) break;
			last = $(m);
		}

		if (lang == null) lang = '_';

		if (last != null && last.attr('author') == author && time - parseInt(last.attr('time')) < 120 && last.attr('lang') == lang) {

			// On ajoute direct dans le message précédent
			last.find('.chat-message-messages').append("<div>" + message + "</div>");

		} else {

			var avatar = avatarChanged > 0 ? LW.avatarURL + '/avatar/' + author + ".png" : LW.staticURL + "/image/no_avatar.png";

			var messageData = "<div class='chat-message' author='" + author + "' time='" + time + "' lang='" + lang + "'>";
			messageData += "<a href='/farmer/" + author + "'><img class='chat-avatar' src='" + avatar + "'></img></a>";
			messageData += "<div><a href='/farmer/" + author + "'><span class='chat-message-author " + color + "'>";
			if (lang != "_") {
				messageData += "<img class='flag' src='" + LW.staticURL + _.lang.languages[lang].flag + "'></img>";
			}
			messageData += authorName + "</span></a>"

			if (!private_chat && author != LW.farmer.id && color != 'admin') {
				messageData += "<span class='report'> • report</span>"
				if (LW.farmer.moderator) {
					messageData += "<span class='mute'> • mute</span> "
					messageData += "<span class='unmute'> • unmute</span>"
				}
			}
			messageData += "</div>";
			messageData += "<div class='chat-message-time' title='" + completeDate + "'>" + timeStr + "</div>";
			messageData += "<div class='chat-message-messages'><div>" + message + "</div></div>";

			messageData += "</div>";

			var elem = $(messageData)

			if (last == null) {
				this.msg_elem.prepend(elem);
			} else {
				elem.insertAfter(last);
			}

			elem.find('.mute').click(function() {
				_.log('mute')
				LW.socket.send([CHAT_REQUEST_MUTE, _chatLanguage, author]);
				$(this).hide()
				elem.find('.unmute').show()
			})
			elem.find('.unmute').click(function() {
				_.log('unmute')
				LW.socket.send([CHAT_REQUEST_UNMUTE, _chatLanguage, author]);
				$(this).hide()
				elem.find('.mute').show()
			})
			elem.find('.unmute').hide()

			elem.find('.report').click(function(e) {
				LW.createReportPopup({
					title: _.lang.get('moderation', 'report_farmer', authorName),
					message: _.lang.get('moderation', 'report_farmer_for_reason', authorName),
					target: author,
					reasons: [
						LW.WARNING.INCORRECT_FARMER_NAME,
						LW.WARNING.INCORRECT_AVATAR,
						LW.WARNING.FLOOD_CHAT,
						LW.WARNING.RUDE_CHAT,
						LW.WARNING.PROMO_CHAT
					],
					parameter: msg
				}).show(e)
			})
		}

		if (this.msg_elem.length > 0) {

			if (this.msg_elem[0].scrollHeight - this.msg_elem.scrollTop() - this.msg_elem.height() < 100) {
				var e = this.msg_elem

				// FIXME dirty but seems working
				setTimeout(function() {
					e.scrollTop(e[0].scrollHeight + 1000);
				}, 60)
			}
		}

		if (LW.chat.channels.length == 1) {
			hideFlags()
		}
	}

	ChatController.prototype.mute_user = function(data) {

		var lang = data[0]
		var moderator_id = data[1]
		var moderator_name = data[2]
		var muted = data[3]

		this.msg_elem.find('.chat-message[author=' + muted + ']').find('.chat-message-messages').html('censuré par <b>' + moderator_name + '</b>')
	}
}

LW.lucky = function() {
	var top = 20 + Math.random() * 50
	var left = 20 + Math.random() * ($(window).width() - 80)
	$('body').append("<img id='clover' style='top: " + top +
	"px; left: " + left + "px' src='/static/image/clover.png'>");
	var clover = $('#clover')
	clover.click(function() {
		LW.socket.send([GET_LUCKY])
		clover.fadeOut(function() {
			clover.remove()
		})
	})
	setTimeout(function() {
		clover.fadeOut(function() {
			clover.remove()
		})
	}, 5000)
}
