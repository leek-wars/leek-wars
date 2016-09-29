/*
 * Quick JavaScript utility library
 * Based on jQuery
 * v 12.12
 */

var _ = {
	api: '',
	version: 0,
	currentTitle: '',
	currentCounter: 0,
	script: {
		loaded: {},
		loading: {},
		callbacks: {}
	},
	style: {
		loaded: {}
	},
	lang: {
		cache: true,
		current: null,
		langs: {},
		languages: [],
	},
	view: {
		cache: true,
		loaded: {}
	},
	format: {},
	upload: {},
	popup: {
		queue: [],
		current: null
	},
	pagination: {},
	fullscreen: {
		on: false
	}
}

$(document).ready(function() {

	// Dismiss popup
	$("html").click(function(e) {
		if (_.popup.current && _.popup.current.options.dismissable) {
			_.popup.current.dismiss()
			e.stopPropagation()
		}
	})
})

_.init = function(params) {

	if ('api' in params) {
		_.api = params.api
	}
	if ('version' in params) {
		_.version = params.version
	}
	if ('view_cache' in params) {
		_.view.cache = params.view_cache
	}
	if ('lang_cache' in params) {
		_.lang.cache = params.lang_cache
	}
	_.log = function() {}
	_.logW = function() {}
}

/*
 * Generic functions
 */

_.logOn = function() {
	_.log = console.log.bind(console)
	_.logW = console.warn.bind(console)
}

_.title = function(title) {
	_.currentTitle = title
	_.privateUpdateTitle()
}

_.titleCounter = function(counter) {
	_.currentCounter = counter
	_.privateUpdateTitle()
}

_.privateUpdateTitle = function() {
	if (_.currentCounter > 0)
		document.title = '(' + _.currentCounter + ') ' + _.currentTitle
	else
		document.title = _.currentTitle
}

_.favicon = function(image) {
	$("link[rel*='icon'").attr("href", image);
}

_.reverse = function(array) {
	if (!array) return []
    var r = new Array
    for (var i = array.length - 1; i >= 0; i--) {
        r.push(array[i])
    }
    return r
}

_.shuffle = function(array) {
	var j
	for (var i = 0; i < array.length; i++) {
		j = Math.floor(Math.random() * array.length)
		$(array[i]).before($(array[j]))
	}
	return array
}

_.selectWhere = function(array, attr, condition) {
	for (var i = 0; i < array.length; ++i) {
		if (array[i] && array[i][attr] == condition) {
			return array[i]
		}
	}
	return null
}

_.removeWhere = function(array, attr, condition) {
	for (var i = 0; i < array.length; ++i) {
		if (array[i] && array[i][attr] == condition) {
			array.splice(i, 1)
			i--
		}
	}
}

_.removeOneWhere = function(array, attr, condition) {
	for (var i = 0; i < array.length; ++i) {
		if (array[i] && array[i][attr] == condition) {
			array.splice(i, 1)
			return
		}
	}
}

_.anyAttrEqual = function(array, attr, condition) {
	for (var i in array) {
		if (array[i] && array[i][attr] == condition) {
			return true
		}
	}
	return false
}

_.protect = function(string) {
	return ('' + string).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

_.clone = function(obj) {

	return JSON.parse(JSON.stringify(obj))
}

_.reload = function() {
	location.reload()
}

_.isTouchScreen = function() {

	if (navigator.userAgent.match(/Android/i)
		|| navigator.userAgent.match(/webOS/i)
		|| navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
		|| navigator.userAgent.match(/BlackBerry/i)
		|| navigator.userAgent.match(/Windows Phone/i)
	) {
		return true
	} else {
		return false
	}
}

_.parseJSON = function(data, defaultValue) {
	try {
		return JSON.parse(data)
	} catch (e) {
		return defaultValue ? defaultValue : null
	}
}

_.ucfirst = function(str) {
	str += ''
	var f = str.charAt(0).toUpperCase()
	return f + str.substr(1)
}

_.findPos = function(obj) {
    var curleft = 0, curtop = 0
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft
            curtop += obj.offsetTop
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop }
    }
    return {x: 0, y: 0};
}

_.first = function(obj) {
	for (var e in obj) {
		return obj[e]
	}
}

_.firstKey = function(obj) {
	for (var e in obj) {
		return e
	}
}

_.isEmptyObj = function(obj) {
	return $.isEmptyObject(obj)
}

_.objectSize = function(obj) {
    var size = 0, key
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++
    }
    return size
}

_.selectText = function(element) {

    _.removeTextSelections()

    if (document.selection) {

        var range = document.body.createTextRange()
        range.moveToElementText(element)
        range.select()

    } else if (window.getSelection) {

        var range = document.createRange()
        range.selectNode(element)
        window.getSelection().addRange(range)
    }
}

_.removeTextSelections = function() {

    if (document.selection) {
    	document.selection.empty()
    } else if (window.getSelection) {
    	window.getSelection().removeAllRanges()
	}
}

_.resizeImage = function(image, scale) {
	image.width = image.width * scale
}

_.colorToHex = function(color) {
	return "#" + ((1 << 24) + color).toString(16).slice(1);
}

_.rgbToHex = function(rgb) {
	return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

/*
 * Fonctions de formatage
 */

_.format.number = function(number) {
	return ('' + number).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;")
}

_.format.numberPrecision = function(number, precision) {
	// if (Math.floor(number) == number) return number
	return number.toPrecision(precision)
}

_.format.months = {
	fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
	en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
}

_.format.months_shorts = {
	fr: ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
	en: ['janu.', 'febr.', 'march', 'april', 'may', 'june', 'july', 'augu.', 'sept.', 'oct.', 'nov.', 'dec.']
}

_.format.date = function(timestamp) {

	var date = new Date(timestamp * 1000)
	var day = date.getUTCDate()
	var month = date.getUTCMonth()
	var year = date.getUTCFullYear()

	if (_.lang.current == 'fr') {
		return day + ' ' + _.format.months[_.lang.current][month] + ' ' + year
	} else if (_.lang.current == 'en') {
		return _.ucfirst(_.format.months[_.lang.current][month]) + ' ' + day + ', ' + year
	}
}

_.format.dateTime = function(timestamp) {

	var date = new Date(timestamp * 1000)
	var day = date.getDate()
	var month = date.getMonth()
	var year = date.getFullYear()
	var hour = date.getHours()
	var minuts = date.getMinutes()

	if (minuts < 10) minuts = '0' + minuts

	if (_.lang.current == 'fr') {

		return day + ' ' + _.format.months[_.lang.current][month] + ' ' + year + " à " + hour + ":" + minuts

	} else if (_.lang.current == 'en') {

		return _.ucfirst(_.format.months[_.lang.current][month]) + ' ' + day + ', ' + year + " at " + hour + ":" + minuts
	}
}

_.format.dayMonth = function(timestamp) {

	var date = new Date(timestamp * 1000)
	var day = date.getUTCDate()
	var month = date.getUTCMonth()

	return day + ' ' + _.format.months[_.lang.current][month]
}

_.format.dayMonthShort = function(timestamp) {

	var date = new Date(timestamp * 1000)
	var day = date.getUTCDate()
	var month = date.getUTCMonth()

	return day + ' ' + _.format.months_shorts[_.lang.current][month]
}

_.linkify = function(html) {

	var make_blank = function(url) {
		return (url.indexOf("http://www.leekwars.com") != 0
		 && url.indexOf("http://leekwars.com") != 0
		 && url.indexOf("https://leekwars.com") != 0
		 && url.indexOf("https://www.leekwars.com") != 0) ? "target='_blank' rel='nofollow'" : ""
	}

	var email_pattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim
	var match, url_regex = /((?:https?):\/\/\w+\.\w+(?:\.\w+)*)|((?:www\.)?leekwars\.com)/gim

	while (match = url_regex.exec(html)) {
		var i = match.index + match[0].length
		var par = 0, curly = 0, square = 0
		if (html[i] == '/') {
			while (i < html.length) {
				var c = html[i]
				if (c === ' ') break
				if (c === '(') par++
				if (c === '[') square++
				if (c === '{') curly++
				if (c === ')' && --par < 0) break
				if (c === ']' && --square < 0) break
				if (c === '}' && --curly < 0) break
				i++
			}
			var last = html[i - 1]
			while (/[\.!?:]/.test(last)) {
				last = html[--i - 1]
			}
		}
		var url = html.substring(match.index, i)
		var real_url = (url.indexOf('http') === -1) ? 'http://' + url : url
		var blank = make_blank(real_url)

		html = html.substring(0, match.index) + '<a ' + blank + ' href="' + real_url + '">' + url + '</a>' + html.substring(i)
		url_regex.lastIndex += real_url.length + blank.length + '<a href=""  ></a>'.length
	}
	return html.replace(email_pattern, '<a target="_blank" rel="nofollow" href="mailto:$&">$&</a>')
}

/*
 * Toasts
 */
_.toast = function(message, durationOrCallback) {

	_.log(message)

	var d = 1800
	var callback = null

	if (typeof(durationOrCallBack) == "number") {
		d = durationOrCallBack
	}
	if (typeof(durationOrCallback) == "function") {
		callback = durationOrCallback
	}

	var toast = $("<div class='toast-wrapper'><div class='toast'>" + message + "</div></div>")

	$('#toasts').append(toast)

	setTimeout(function() {

		toast.addClass('visible')

		setTimeout(function() {

			toast.removeClass('visible')

			setTimeout(function() {
				toast.remove()
				if (callback != null) callback()
			}, 600)
		}, d + 600)
	}, 100)
}

/*
 * Popups
 */
_.popup.new = function(view, data, width, direct, options) {

	var self = this

	var viewParts = view.split('.')
	var name = view
	if (viewParts.length > 1) {
		name = viewParts[1]
	}

	if (!(view in _.view.loaded)) {
		_.log("Popup view '" + view + "' does not exists")
		return null
	}

	this.id = view
	this.view = $("<div class='popup " + name + "'>" + _.view.render(view, data) + "</div>")

	this.height = $(window).height() - 200

	this.options = typeof(options) === 'undefined' ? {} : options
	this.ondismiss = null

	if (width != undefined) {
		this.view.css('width', width)
	}

	var actionCount = this.view.find('.actions div').length
	if (actionCount == 0) this.view.addClass('no-actions')

	if (this.options.draggable) {
		var dragx, dragy, startx, starty, down
		this.view.addClass('draggable')
		this.view.find('.title').on('mousedown', function(e) {
			if (e.button == 2) return false
			dragx = e.pageX
			dragy = e.pageY
			startx = parseFloat(self.view.css('left').replace('px', ''))
			starty = parseFloat(self.view.css('top').replace('px', ''))
			down = true
			var move_handler = function(e) {
				if (!down) return null
				var dx = e.pageX - dragx
				var dy = e.pageY - dragy
				self.move(startx + dx, starty + dy)
			}
			var up_handler = function(e) {
				down = false
				$('html').off('.popup')
			}
			$("html")
				.on('mousemove.popup', move_handler)
				.on('mouseup.popup', up_handler)
			e.preventDefault()
			return false
		})
	}

	this.setDismissable = function(dismissable) {
		this.options.dismissable = dismissable
	}

	this.setOnDismiss = function(ondismiss) {
		this.ondismiss = ondismiss
	}

	this.find = function(query) {
		return this.view.find(query)
	}

	this.show = function(e) {

		var popup = this

		if (e == undefined && !direct) {
			alert("Pas d'event passé dans le show()")
			return
		}

		if (this.options.draggable) {
			this.view.appendTo('body')
			popup.appear()
		} else {
			this.view.prependTo('#popups')
			this.view.hide()
			if (_.popup.queue.length == 0) {
				$('#popups').addClass('box')
				if (!this.options.draggable) {
					$('#dark').fadeIn(200)
				}
				popup.appear()
			}
			_.popup.queue.push(popup)
		}

		if (e) e.stopPropagation()
	}

	this.appear = function() {

		var popup = this

		popup.view.find('.content').css('max-height', $(window).height() - 250)

		this.view.show()
		this.view.css('display', 'inline-block')

		popup.view.css("transition", "transform ease 0.3s")
		popup.view.css("-webkit-transition", "-webkit-transform ease 0.3s")

		popup.view.css("transform", "scaleY(0.5)")
		popup.view.css("-webkit-transform", "scaleY(0.5)")

		popup.view.css("opacity", "1")

		setTimeout(function() {
			popup.view.css("transform", "scaleY(1)")
			popup.view.css("-webkit-transform", "scaleY(1)")
		})

		this.view.click(function(e) {
			e.stopPropagation()
		})

		// dismiss button
		this.view.find('.actions .action.dismiss').click(function() {
			popup.dismiss()
		})
		// dismiss option
		this.view.find('.options .option.dismiss').click(function() {
			popup.dismiss()
		})
		_.popup.current = popup

		LW.handleHTML('.popup.' + name, 'page')
	}

	this.move = function(x, y) {
		if (!this.options.draggable) return null
		self.view.css('left', Math.min(Math.max(0, x), $(window).width() - 40))
		self.view.css('top', Math.min(Math.max(0, y), $(window).height() - 40))
	}

	this.dismiss = function() {

		if (this.ondismiss) this.ondismiss()

		var popup = this
		popup.view.css("transition", "all ease 0.2s")
		popup.view.css("-webkit-transition", "all ease 0.2s")

		popup.view.css("transform", "scaleY(1)")
		popup.view.css("-webkit-transform", "scaleY(1)")

		setTimeout(function() {
			popup.view.css("transform", "scaleY(0)")
			popup.view.css("-webkit-transform", "scaleY(0)")

			popup.view.css("opacity", "0")
		})

		setTimeout(function() {

			popup.view.hide()

			_.popup.current = null

			_.popup.queue.shift()

			if (_.popup.queue.length > 0) {

				setTimeout(function() {
					_.popup.queue[0].appear()
				}, 250)

			} else {
				$('#popups').removeClass('box')
				$('#dark').fadeOut(200)
			}
		}, 200)
	}

	return this
}

/*
 * Network functions
 */
_.request = function(url, data, callback, method, log) {

	var log = typeof log == 'undefined' ? true : log

	var params = {
		type: method,
		url: _.api + url,
		data: data
	}

	if (data instanceof FormData) {
		params.cache = false
		params.processData = false
		params.contentType = false
	}

	$.ajax(params).done(function(data) {

		try {
			data = JSON.parse(data)
		} catch (e) {}

		if (log) {
			_.log("Res : ", data)
		} else {
			_.log("Res : [...]")
		}
		if (callback) {
			callback(data)
		}
	})
}

_.hide_token = function(string) {
	return string.replace(localStorage['token'], '{token}')
}

_.get = function(url, callback, log) {

	if (log || typeof(log) === 'undefined') {
 		_.log('Get : ' + _.hide_token(url))
	}

    _.request(url, null, callback, 'GET', log)
}

_.post = function(url, data, callback, log) {

	if (!data) data = {}

	if (log || typeof(log) === 'undefined') {
    	_.log('Post : ' + _.hide_token(url), data)
	}

    if (data instanceof FormData) {
    	data.append('token', LW.token())
    } else {
    	data['token'] = LW.token()
	}

    _.request(url, data, callback, 'POST', log)
}

/*
 * Styles
 */
_.style.load = function(path, file) {

	if ((path + file) in _.style.loaded) return null

	$('head').append('<link rel="stylesheet" href="' + path + file + '" type="text/css" />')

	_.style.loaded[path + file] = true
}

/*
 * Scripts
 */
_.script.load = function(path, file, callback) {

	var url = path + file

	if (url in _.script.loaded) {
		callback()
		return null
	}

	if (!_.script.loading[url]) {
		_.script.callbacks[url] = []
	}

	if (typeof(callback) === 'function') {
		_.script.callbacks[url].push(callback)
	}

	if (!_.script.loading[url]) {

		_.script.loading[url] = true

		var script = document.createElement('script')
		script.src = url // + '?' + _.version
		script.async = false

		script.onload = function() {
			_.script.loaded[url] = true
			_.script.loading[url] = false
			_.script.callbacks[url].forEach(function(c) { c() })
			_.script.callbacks[url] = []
		}
		script.onerror = function() {
			_.logW('Script load failed: ' + url)
			_.script.loading[url] = false
			_.script.callbacks[url].forEach(function(c) { c() })
			_.script.callbacks[url] = []
		}
		document.head.appendChild(script)
	}
}

/*
 * Upload functions
 */

_.upload.check = function(file) {

	if (!file) {
		// Toast(_lang('upload_no_file_selected'));
		return false;
	}

	var types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp'];

	if (types.indexOf(file.type) == -1) {
		// Toast(_lang('upload_unsupported_extension', file.type));
		return false;
	}

	if (file.size > 10485760) {
		// Toast(_lang('upload_too_heavy'));
		return false;
	}

	return true;
}

_.upload.fileToImage = function(file, imageElem) {

	if (window.FileReader) {

		reader = new FileReader();
		reader.onloadend = function(e) {
			$(imageElem).attr('src', e.target.result);
		};
		reader.readAsDataURL(file);
	}
}


/*
 * Lang
 */
_.lang.init = function(languages, defaultLang) {

	for (var l in languages) {
		_.lang.languages[languages[l].code] = languages[l]
	}

	var lang = defaultLang

	if ('lang' in localStorage) {
		if (!_.lang.isValid(localStorage['lang'])) {
			localStorage.removeItem('lang')
		} else {
			lang = localStorage['lang']
		}
	}
	_.lang.current = lang
	localStorage['lang'] = lang
}

_.lang.isValid = function(language) {

	for (var l in _.lang.languages) {
		if (_.lang.languages[l].code == language) {
			return true
		}
	}
	return false
}

_.lang.set = function(language) {

	if (!_.lang.isValid(language)) return null

	_.lang.current = language
	localStorage['lang'] = language

	_.reload()
}

_.lang.load = function(file, admin, callback) {

	var key = 'lang/' + file + '/' + _.lang.current

	if (!(_.lang.current in _.lang.langs)) _.lang.langs[_.lang.current] = {}

	if (_.lang.cache && key in localStorage) {

		_.lang.langs[_.lang.current][file] = JSON.parse(localStorage[key])
		if (callback) callback()
		return
	}

	var url = admin ? 'lang/get-private/' + file + '/' + _.lang.current + '/' + LW.token() : 'lang/get/' + file + '/' + _.lang.current

	_.get(url, function(data) {

		if (data.success) {

			_.lang.langs[_.lang.current][file] = data.lang
			localStorage[key] = JSON.stringify(data.lang)
		}
		if (callback) callback()
	})
}

_.lang.has = function(file, key) {
	return file in _.lang.langs[_.lang.current] && key in _.lang.langs[_.lang.current][file]
}

_.lang.get = function(file, key, paramslist) {

	if (!(file in _.lang.langs[_.lang.current])) return key

	if (key in _.lang.langs[_.lang.current][file]) {

		var params = []

		if (!(paramslist instanceof Array)) {
			for (var i = 2; i < arguments.length; ++i)
				params.push(arguments[i])
		} else {
			params = paramslist
		}

		var text = _.lang.langs[_.lang.current][file][key]
		if (!text) return ''

		var i = -1
		text = text.replace(/\%([0-9]+\$)?[ds]/g, function(match, contents, offset, s) {
			i++
			var arg = match.substring(1, match.length - 1)
			if (arg.length == 0) return params[i]
			var c = parseInt(arg.substring(0, arg.length - 1));
			return params[c - 1]
		});

		return text
	}
	return ''
}


/*
 * Views
 */
_.view.load = function(view, admin, callback) {

	if (view in _.view.loaded) {
		// Already loaded
		callback()
		return
	}

	if (_.view.cache && ('view/' + view) in localStorage) {

		var data = localStorage['view/' + view]

		var views = _.view.parse(view, data)
		for (var key in views) {
			_.view.loaded[key] = views[key]
		}
		callback()

	} else {

		var save_view = function(data) {
			localStorage['view/' + view] = data
			var views = _.view.parse(view, data)
			for (var key in views) {
				_.view.loaded[key] = views[key]
			}
			callback()
		}
		if (admin) {
			_.get('view/get-private/' + view + '/' + LW.token(), function(data) {
				if (typeof(data) === 'object' && data.success == false) {
					_.log('Failed to load view "' + view + '"...')
					callback()
					return
				}
				save_view(data)
			}, false)
		} else {
			$.get('/view/' + view + '.html', save_view)
		}
	}
}

_.view.parse = function(fileName, view) {

	view = view.replace(/\n/g, '')

	var i = 0
	var views = {}
	var match

	var index = view.indexOf('@view')

	if (index == -1) {

		views[fileName] = view

	} else {

		views[fileName] = view.substring(0, index)

		while (match = /@view\s*\((\w+)\)\s*(.*?)@endview/g.exec(view)) {

			views[fileName + '.' + match[1]] = match[2]

			view = view.substring(match.index + match[0].length)
		}
	}

	return views
}

_.view.render = function(__name, __data) {

	// _.log('Render view ' + __name)

	if (!(__name in _.view.loaded)) {
		_.log("Unknow view : " + __name)
		return ''
	}

	var __file = __name
	if (__name.indexOf('.') >= 0) {
		__file = __name.split('.')[0]
	}

	var __view = _.view.loaded[__name]

	// var __d = new Date().getTime()

	var __tree = _.view.buildTree(__view)

	// _.log("Temps tree : " + (new Date().getTime() - __d) + "ms")

	// _.log("Tree : ", __tree)

	__data = __data || {}

	eval('var data = __data')
	for (var __key in __data) eval('var ' + __key + ' = __data.' + __key)

	var __render = function(__tree, __context) {

		for (var __key in __context) eval('var ' + __key + ' = __context["' + __key + '"]')

		var __text = ''

		for (var __key in __tree) {

			var __value = __tree[__key]

			if ('text' in __value) {

				var __renderText = function($__tag, __protect) {

					if ($__tag[0] == '#') {

						var __params = []
						var __parts = $__tag.substr(1).split(',')
						var __langKey = __parts.shift()

						var __langFile = __file
						if (__langKey.indexOf('.') >= 0) {
							var __keyParts = __langKey.split('.')
							__langFile = __keyParts[0]
							__langKey = __keyParts[1]
						}

						for (var __i in __parts) {
							try {
								if (__protect)
									__params.push(_.protect(eval(__parts[__i])))
								else
									__params.push(eval(__parts[__i]))
							} catch (e) {
								__params.push('')
								_.log("eval error : " + __parts[__i])
							}
						}

						return _.lang.get(__langFile, __langKey, __params)

					} else if ($__tag[0] == '%') {

						var __tag = $__tag.substr(1)

						try {

							var __v = eval('typeof(' + __tag + ') === "undefined" ? undefined : (' + __tag + ')')
							return ('undefined' !== typeof __v) ? _.format.number(__v) : ''

						} catch (e) {
							_.log("eval error : " + $__tag)
							return ''
						}

					} else {

						try {
							if (__protect) {
								var __v = eval('typeof(' + $__tag + ') === "undefined" ? undefined : (' + $__tag + ')')
								return ('undefined' !== typeof __v) ? _.protect(__v) : ''
							} else {
								return eval($__tag)
							}
						} catch (e) {
							_.log("eval error : " + $__tag)
							return ''
						}
					}
				}
				// Braces (single or double)
				var __t = __value.text.replace(/(\{+)(.*?)(\}+)/g, function(__match, __open, $__tag) {
					var __protect = __open.length == 1
					if ($__tag == 'static') {
						return __STATIC_URL
					}
					return __renderText($__tag, __protect)
				})
				__text += __t

			} else {

				var __tag = __value.tag

				if (__tag == 'if') {

					var __res = false
					try {
						__res = eval(__value.cond)
					} catch (e) {
						_.log("eval error : " + __value.cond)
					}

					if (__res) {
						__text += __render(__value.then, __context)
					} else if ('else' in __value) {
						__text += __render(__value['else'], __context)
					}

				} else if (__tag == 'foreach') {

					var __array = []
					try {
						__array = eval(__value.array)
					} catch (e) {
						_.log("eval error : " + __value.array)
					}

					for (var __k in __array) {

						var __newcontext = __context
						__newcontext[__value.elem] = __array[__k]
						if (__value.key) {
							__newcontext[__value.key] = __k
						}
						__text += __render(__value.body, __newcontext)
					}

				} else if (__tag == 'include') {

					var __viewName = eval(__value.view)

					if (typeof __viewName !== 'string') {
						_.log('include error : ' + __value.view)
						continue
					}

					if (__viewName.indexOf('.') >= 0) {
						__viewName = __viewName
					} else {
						__viewName = __name + '.' + __viewName
					}

					__text += _.view.render(__viewName, eval(__value.data))
				}
			}
		}

		return __text
	}

	var __tpl = __render(__tree, [])

	// _.log("Temps : " + (new Date().getTime() - __d) + "ms")

	return __tpl
}

_.view.buildTree = function(template) {

	var filterTree = function(tree) {

		if (tree.length <= 1) return tree

		for (var i = 0; i < tree.length - 1; ++i) {

			var value = tree[i]
			var nextValue = tree[i + 1]

			if ('text' in value && 'text' in nextValue) {
				tree[i].text = value.text + nextValue.text
				tree.splice(i + 1, 1)
				i--
			}
		}

		return tree
	}

	var build = function(template) {

		var tree = []
		var eaten = 0
		var elseif = false

		while (true) {

			var match = /@(\w+)\s*(\((.*?)\))?/.exec(template)
			var tag = match ? match[1] : ''
			var index = match ? match.index : 0

			if (match == null) {
				var end = template
				if (end.length > 0) tree.push({text: end})
				return [filterTree(tree), eaten]
			}

			if (tag == 'if' || tag == 'elseif') {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				template = template.substr(index + match[0].length)
				eaten += index + match[0].length

				if (tag == 'elseif') {
					tree.push({tag: 'else'})
				}

				var res = build(template)
				var expr = match[3]
				var obj = {tag: 'if', cond: expr, then: res[0]}

				for (var i in obj.then) {
					if (obj.then[i].tag == 'else') {
						var elseObj = []
						for (var j = parseInt(i) + 1; j < obj.then.length; ++j) {
							elseObj.push(obj.then[j])
						}
						obj['else'] = elseObj
						obj.then.splice(i, obj.then.length - i)
						break
					}
				}

				tree.push(obj)

				template = template.substr(res[1])
				eaten += res[1]

				if (tag == 'elseif') {
					template = '@end' + template
					eaten -= 4
				}

			} else if (tag == 'else') {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				template = template.substr(index + match[0].length)
				eaten += index + match[0].length

				tree.push({tag: 'else'})

			} else if (tag == 'foreach') {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				template = template.substr(index + match[0].length)
				eaten += index + match[0].length

				var res = build(template)
				var expr = match[3]

				var parts = expr.split(' in ')
				var elemParts = parts[0].split(' : ')
				var elem = elemParts.length == 2 ? elemParts[1] : elemParts[0]
				var key = elemParts.length == 2 ? elemParts[0] : null
				tree.push({tag: tag, elem: elem, key: key, array: parts[1], body: res[0]})

				template = template.substr(res[1])
				eaten += res[1]

			} else if (/^end/.test(tag)) {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				eaten += index + match[0].length
				return [filterTree(tree), eaten]

			} else if (tag == 'include') {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				var parts = match[3].split(',')
				var view = $.trim(parts[0])
				var data = $.trim(parts[1])
				tree.push({tag: 'include', view: view, data: data})

				template = template.substr(index + match[0].length)
				eaten += index + match[0].length

			} else if (tag == 'includeobj') {

				var before = template.substr(0, index)
				if (before.length > 0) tree.push({text: before})

				var parts = match[3].split(',')
				var view = $.trim(parts[0])
				var data = $.trim(parts[1])

				tree.push({tag: 'include', view: view, data: '({' + data + ': ' + data + '})'})

				template = template.substr(index + match[0].length)
				eaten += index + match[0].length

			} else {

				var text = template.substr(0, index + 1)
				tree.push({text: text})

				template = template.substr(index + 1)
				eaten += index + 1
			}
		}
	}

	return build(template)[0]
}

/*
 * Créer une pagination
 */
_.pagination.create = function(current, count, page) {

	var center = Math.max(5, Math.min(count - 4, current))
	var start = center - 4
	var end = Math.min(count, center + 4)

	var data = ""

	if (start > 1) {
		data += "<a href='" + page + "'>1</a>"
		data += "..."
	}

	for (i = start; i <= end; ++i) {
		var clazz = i == current ? 'current' : ''
		if (i == 1)
			data += "<a class='" + clazz + "' href='" + page + "'>" + i + "</a>"
		else
			data += "<a class='" + clazz + "' href='" + page + "/page-" + i + "'>" + i + "</a>"
	}

	if (end < count) {
		data += "..."
		data += "<a href='" + page + "/page-" + count + "'>" + count + "</a>"
	}

	return data
}


/*
 * Plein écran
 */
_.fullscreen.enter = function(element, callback) {

	if (element.requestFullScreen) {

		document.onfullscreenchange = function() {

			_.fullscreen.on = !_.fullscreen.on
			callback(_.fullscreen.on)
		}
		element.requestFullScreen()

	} else if (element.webkitRequestFullScreen) {

		document.onwebkitfullscreenchange = function() {
			_.fullscreen.on = !_.fullscreen.on
			callback(_.fullscreen.on)
		}
		element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);

	} else if (element.mozRequestFullScreen) {

		document.onmozfullscreenchange = function() {
			_.fullscreen.on = !_.fullscreen.on
			callback(_.fullscreen.on)
		};
		element.mozRequestFullScreen()
	}
}

_.fullscreen.exit = function() {

	if (document.cancelFullScreen) {
		document.cancelFullScreen()
	} else if (document.webkitCancelFullScreen) {
		document.webkitCancelFullScreen()
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen()
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen()
	}
}
