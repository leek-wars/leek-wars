var DEFAULT_FONT_SIZE = 16
var DEFAULT_THEME = "leek-wars"

var _BASIC = _.isTouchScreen()

var current
var currentType
var currentItem = 0
var editors = {}

var _testEvent
var _testPopup
var lastKey = -1
var lastNewAI = -1
var initialName = null
var _saving = false
var _dragging = null

// Paramètres
var _large = false
var _autoClosing = true
var _fontSize = DEFAULT_FONT_SIZE
var _theme = DEFAULT_THEME
var _autocomplete = true
var _popups = true

// Settings de test
var _testPopup = null
var _testLeek = null
var _testMode = 'solo'
var _testAI = null
var _testEnemies = null

var _searchEnabled = false

LW.pages.editor.init = function(params, $scope, $page) {

	_.get('ai/get-farmer-ais/' + LW.token(), function(data) {

		$page.render()

		LW.setTitle(_.lang.get('editor', 'title'))
		LW.setMenuTab('editor')

		var ais = data.ais
		var folders = data.folders
		var items = []
		for (var i in ais) items[ais[i].id] = ais[i]
		for (var i in folders) items[folders[i].id] = folders[i]

		// Create editors
		editors = {}
		for (var i in ais) {
			var ai = ais[i]
			editors[ai.id] = new Editor(ai.id, ai.name, ai.valid, "", ai.folder)
		}

		var drag_and_drop = function(item) {
			item.on({
		        dragstart: function(e) {
					e.originalEvent.dataTransfer.setData('text/plain', 'drag !!!')
					_dragging = $(this).attr('id')
		            $(this).addClass('dragging')
					e.stopPropagation()
		        },
		        dragend: function() {
		            $(this).removeClass('dragging')
		        }
		    })
		}

		var toggle_folder = function(folder_id, show) {
			var tab = $('#ai-list .item[id=' + folder_id + ']')
			if (show) {
				tab.find('> .content').show()
				tab.addClass('expanded')
			} else {
				tab.find('> .content').hide()
				tab.removeClass('expanded')
			}
			$('#ai-list .item').removeClass('selected')
			tab.addClass('selected')
			currentItem = folder_id
			currentType = 'folder'
			currentName = tab.find('> .label').text()
			localStorage['editor/folder/' + folder_id] = show
		}

		var update_padding = function(item_id, level) {
			var item = $('#ai-list .item[id=' + item_id + ']')
			update_padding_element(item, level)
		}

		var update_padding_element = function(item, level) {
			item.attr('level', level)
			if (item.hasClass('ai')) {
				item.find('> .label').css('padding-left', (level * 15) + 'px')
			} else {
				item.find('> .label').css('padding-left', (-5 + level * 15) + 'px')
				item.find('> .content > .item').each(function() {
					update_padding($(this).attr('id'), level + 1)
				})
			}
		}

		var insert_element = function(element, folder) {
			var is_folder = element.hasClass('folder')
			var name = element.text().toLowerCase()
			var elements = folder.find('> .item')
			folder.removeClass('empty')
			update_padding_element(element, parseInt(folder.attr('level')) + 1)
			var e = $(elements[0])
			while (e.length) {
				if ((name < e.text().toLowerCase()) || (is_folder && e.hasClass('ai'))) {
					if (is_folder || e.hasClass('ai')) {
						element.insertBefore(e)
						return
					}
				}
				e = e.next()
			}
			folder.find('> .content').append(element)
		}

		var add_folder_drag_and_drop_events = function(folder) {
			folder.on({
				drop: function(e) {
					var from_folder = $('#ai-list .item[id=' + _dragging + ']').parent().parent().attr('id')
					move_item(_dragging, from_folder, $(this).attr('id'))
					_dragging = null
					e.preventDefault()
					e.stopPropagation()
					$(this).removeClass('drag-hover')
					return false
				},
				dragenter: function(e) {
					$(this).addClass('drag-hover')
					e.stopPropagation()
				},
				dragleave: function(e) {
					$(this).removeClass('drag-hover')
					e.stopPropagation()
				},
				dragover: function(e) {
					$(this).addClass('drag-hover')
					e.preventDefault()
					e.stopPropagation()
				}
			})
		}

		var move_item = function(item_id, from_folder_id, to_folder_id) {
			// Same folder
			if (from_folder_id == to_folder_id) return null
			var item = $('#ai-list .item[id=' + item_id + ']')
			// Check all parents
			var parent = $('#ai-list .item[id=' + to_folder_id + ']')
			while (parent.length && parent.hasClass('item')) {
				if (parent.attr('id') == item_id) return null
				parent = parent.parent().parent()
			}
			// Move
			var folder = $('#ai-list .item[id=' + to_folder_id + ']')
			var level = parseInt(folder.attr('level')) + 1
			insert_element(item, folder)
			update_padding(item.attr('id'), level)
			// Update new folder
			toggle_folder(to_folder_id, true)
			// Update old folder
			var from_folder = $('#ai-list .item[id=' + from_folder_id + ']')
			from_folder.toggleClass('empty', from_folder.find('> .content > .item').length == 0)
			// Send request
			var ai = item.hasClass('ai')
			var url = ai ? 'ai/change-folder' : 'ai-folder/change-folder'
			var args = ai ? {ai_id: item_id, folder_id: to_folder_id} :
				{folder_id: item_id, dest_folder_id: to_folder_id}
			_.post(url, args)
		}

		var build_tree = function(folder_id, level) {
			var leaf = {html: $("<div class='content'>"), id: folder_id, content: []}
			for (var i in folders) {
				if (folders[i].folder == folder_id) {
					var folder = items[folders[i].id]
					var tree = build_tree(folders[i].id, level + 1)
					var opened = localStorage['editor/folder/' + folders[i].id] === 'true'
					if (!opened) {
						tree.html.hide()
					}
					var style = 'padding-left:' + (-5 + level * 15) + 'px'
					var html = $("<div id='" + folder.id + "' class='item folder " + (opened ? 'expanded' : '') + "' folder='" + folder_id + "' draggable='true' level='" + level + "'><div class='label' style='" + style + "'><div class='triangle'/><span class='icon'></span><span class='text'>" + folder.name + "</span><div class='edit'/></div></div>")
					if (tree.content.length == 0) {
						html.addClass('empty')
					}
					leaf.content.push({id: folders[i].id, contents: tree.content})
					folder.contents = []
					for (var j in tree.content) {
						folder.contents.push(items[tree.content[j].id])
					}
					html.append(tree.html)
					leaf.html.append(html)
				}
			}
			for (var i in ais) {
				if (ais[i].folder == folder_id) {
					var ai = ais[i]
					leaf.content.push({id: ai.id})
					var style = 'padding-left:' + (level * 15) + 'px'
					leaf.html.append("<div id='" + ai.id + "' class='item ai' folder='" + ai.folder + "' draggable='true' ><div class='label' style='" + style + "'><span class='text'>" + ai.name + "</span><div class='edit'/></div></div>");
				}
			}
			return leaf
		}

		var set_cursor_position = function(node, position) {
			node.focus()
			var textNode = node.firstChild
			var caret = position
			var range = document.createRange()
			range.setStart(textNode, caret)
			range.setEnd(textNode, caret)
			var sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)
		}

		var edit_name = function(item) {
			var pen = item.find('> .label > .edit')
			var id = item.attr('id')
			var text = item.find('> .label > .text')
			pen.click(function(e) {
				text.attr('contenteditable', true)
				text.focus()
				set_cursor_position(text[0], text.text().length)
				initialName = text.text()
				e.stopPropagation()
			})
			var save = function() {
				text.attr('contenteditable', false)
				var name = text.text()
				if (name == initialName) return
				if (name.length == 0) {
					text.text(initialName)
					return;
				}
				if (item.hasClass('ai')) {
					_.post('ai/rename', {ai_id: id, new_name: name}, function(data) {
						if (data.success) {
							_.toast(_.lang.get('editor', 'ai_renamed', name))
						} else {
							text.text(initialName)
							_.toast(_.lang.get('editor', 'name_already_exists', name))
						}
					})
				} else {
					_.post('ai-folder/rename', {folder_id: id, new_name: name}, function(data) {
						if (data.success) {
							_.toast(_.lang.get('editor', 'folder_renamed', name))
						} else {
							text.text(initialName)
							_.toast(_.lang.get('editor', 'name_already_exists', name))
						}
					})
				}
			}
			text.keydown(function(e) {
				if (e.keyCode == 13) {
					text.blur()
					e.preventDefault()
				}
			})
			text.focusout(function() {
				save()
			})
		}

		var add_item_events = function(item) {
			if (item.hasClass('folder')) {
				if (item.attr('id') != 0) {
					item.click(function(e) {
						toggle_folder($(this).attr('id'), !$(this).hasClass('expanded'))
						e.stopPropagation()
					})
				}
			} else {
				var ai = items[item.attr('id')]
				item.click(function(e) {
					var ai = items[$(this).attr('id')]
					e.stopPropagation()
					LW.page('/editor/' + ai.id)
				})
				if (!ai.valid) {
					item.addClass("error")
				}
			}
			item.find('> .label .text').click(function(e) {
				if ($(this).attr('contenteditable') == 'true') {
					e.stopPropagation()
				}
			})
			drag_and_drop(item)
			edit_name(item)
		}

		var update_tree = function() {
			var tree = build_tree(0, 1)
			$('#ai-list').find('> .folder').empty().append(tree.html)
			$('#ai-list .item').each(function() {
				add_item_events($(this))
			})
			for (var i in ais) {
				var ai = ais[i]
				editors[ai.id].tabDiv = $('#ai-list .ai[id=' + ai.id + ']')
			}
			$('#ai-list .folder').each(function() {
				add_folder_drag_and_drop_events($(this))
			})
		}

		update_tree()

		var get_current_folder = function() {
			var item = items[currentItem]
			if (currentType == 'ai') {
				return item.folder
			} else {
				return currentItem
			}
		}

		// New button
		$('#new-button').click(function() {
			var current_folder = get_current_folder()
			_.post('ai/new', {folder_id: current_folder}, function(data) {
				if (data.success) {
					var ai = data.ai
					ai.valid = true
					editors[ai.id] = new Editor(ai.id, ai.name, true, ai.code)
					items[ai.id] = ai
					var tab = $("<div id='" + ai.id + "' class='item ai' folder='" + ai.folder + "' draggable='true' ><div class='label'><span class='text'>" + ai.name + "</span><div class='edit'/></div></div>")
					insert_element(tab, $('#ai-list #' + current_folder))
					toggle_folder(current_folder, true)
					add_item_events(tab)
					editors[ai.id].tabDiv = tab
					current = ai.id
					currentItem = ai.id
					currentType = 'ai'
					currentName = editors[current].name
					editors[current].show()
					$page.resize()
					$('.CodeMirror').css('font-size', _fontSize)
				}
			})
		})

		// New folder
		$('#new-folder-button').click(function() {
			var current_folder = get_current_folder()
			_.post('ai-folder/new', {folder_id: current_folder}, function(data) {
				var folder = $("<div id='" + data.id + "' class='item folder empty' draggable='true' level='1'><div class='label'><div class='triangle'></div><span class='icon'></span><span class='text'>" + _.lang.get('editor', 'new_folder') + "</span><div class='edit'/></div><div class='content'></div></div>")
				add_folder_drag_and_drop_events(folder)
				add_item_events(folder)
				insert_element(folder, $('#ai-list #' + current_folder))
				toggle_folder(current_folder, true)
			})
		})

		// IA de départ
		if (params && params.id in editors) {
			current = params.id
			currentType = 'ai'
			currentItem = params.id
			currentName = editors[current].name
			localStorage['editor/last_code'] = params.id
			editors[current].show()
		} else {
			if (editors.length == 0) {
				current = null
			} else if ('editor/last_code' in localStorage && localStorage['editor/last_code'] in editors) {
				LW.page('/editor/' + localStorage['editor/last_code'])
			} else {
				LW.page('/editor/' + _.firstKey(editors))
			}
		}

		// Boutons
		$("#save-button").click(function() {
			if (current != null)
				editors[current].save()
		})

		// Delete popup
		$("#delete-button").click(function(e) {
			if (currentItem != 0) {
				var deletePopup = new _.popup.new('editor.delete_popup', {name: currentName, type: currentType}, 500)
				deletePopup.find('#delete').click(function() {
					var editor = editors[current]
					var url = currentType == 'folder' ? 'ai-folder/delete' : 'ai/delete'
					var args = currentType == 'folder' ? {folder_id: currentItem} : {ai_id: currentItem}
					_.post(url, args, function(data) {
						if (data.success) {
							var item = $('#ai-list #' + currentItem)
							var folder = item.parent().parent()
							if (folder.find('> .content > .item').length == 1) {
								folder.addClass('empty')
							}
							item.remove()
							if (currentType == 'ai') {
								delete editors[editor.id]
								$('#editors #' + editor.id).remove()
								if (!_.isEmptyObj(editors)) {
									LW.page('/editor/' + _.firstKey(editors))
								} else {
									current = null
								}
							} else {
								currentItem = 0
							}
							deletePopup.dismiss()
						} else {
							_.toast(data.error)
						}
					})
				})
				deletePopup.show(e)
			}
		})

		// $('#export-button').click(function() {
		// 	submitForm('editor_update', [ ["export_ai", true], ["id", editors[current].id] ])
		// })

		// Documentation
		if (!LW.keywords) {
			LW.keywords = generateDocumentation()
		}

		$(window).mousemove(function(e) {
			if (current != null && currentType == 'ai')
				editors[current].mousemove(e)
		})

		$('#info-button').click(function(e) {

			new _.popup.new('editor.info_popup', {}, 500).show(e)
		})

		$('#results').click(function() {
			$(this).html('')
		})

		// Chargement des paramètres
		_large = localStorage['editor/large'] == 'true'
		_autoClosing = 'editor/auto_closing' in localStorage ? localStorage['editor/auto_closing'] == 'true' : true
		_autocomplete = 'editor/autocomplete' in localStorage ? localStorage['editor/autocomplete'] == 'true' : true
		_popups = 'editor/popups' in localStorage ? localStorage['editor/popups'] == 'true' : true
		if (_large) LW.enlarge()

		_fontSize = parseInt(localStorage['editor/font_size'])
		if (isNaN(_fontSize)) _fontSize = DEFAULT_FONT_SIZE
		$('.CodeMirror').css('font-size', _fontSize)

		_theme = localStorage['editor/theme']
		$('#editor-page').addClass(_theme)

		// Popup des paramètres
		var settingsPopup = new _.popup.new('editor.settings_popup', {}, 600)

		settingsPopup.find('#setting-size').prop('checked', _large)
		settingsPopup.find('#setting-size').change(function() {
			_large = settingsPopup.find('#setting-size').is(':checked')
			localStorage['editor/large'] = _large
			if (_large) {
				LW.enlarge()
			} else {
				LW.shrink()
			}
		})

		settingsPopup.find('#setting-auto-closing').prop('checked', _autoClosing)
		settingsPopup.find('#setting-auto-closing').change(function() {
			_autoClosing = settingsPopup.find('#setting-auto-closing').is(':checked')
			localStorage['editor/auto_closing'] = _autoClosing
		})

		settingsPopup.find('#setting-autocomplete').prop('checked', _autocomplete)
		settingsPopup.find('#setting-autocomplete').change(function() {
			_autocomplete = settingsPopup.find('#setting-autocomplete').is(':checked')
			localStorage['editor/autocomplete'] = _autocomplete
		})

		settingsPopup.find('#setting-popups').prop('checked', _popups)
		settingsPopup.find('#setting-popups').change(function() {
			_popups = $('#setting-popups').is(':checked')
			localStorage['editor/popups'] = _popups
		})

		settingsPopup.find('#setting-font-size').val(_fontSize)
		settingsPopup.find('#setting-font-size').change(function() {
			var fontSize = parseInt(settingsPopup.find('#setting-font-size').val())
			if (!isNaN(fontSize) && _fontSize >= 6 && _fontSize <= 30) {
				_fontSize = fontSize
				localStorage['editor/font_size'] = _fontSize
				$('.CodeMirror').css('font-size', _fontSize)
			}
		})

		settingsPopup.find('#settings-theme #' + _theme).prop('checked', true)
		settingsPopup.find('#settings-theme input').click(function() {
			$('#editor-page').removeClass(_theme)
			_theme = $(this).val()
			localStorage['editor/theme'] = _theme
			$('#editor-page').addClass(_theme)
		})

		$('#editor-settings-button').click(function(e) {
			settingsPopup.show(e)
		})

		// Paramètres de test
		LW.pages.editor.test_popup(ais)

		// Recherche
		var searchQuery = null
		var searchIndex = 0
		var searchElement = null
		var searchLines = []
		var searchFirstLine = null

		$('.search-panel .query').keyup(function() {

			searchQuery = $(this).val().toLowerCase()
			searchIndex = 0
			searchElement = null
			searchFirstLine = null

			if (searchQuery.length > 0) {

				searchLines = []

				for (var l = 0; l < editors[current].editor.lineCount(); ++l) {
					var line = editors[current].editor.getLine(l)
					var index = -1
					while ((index = line.toLowerCase().indexOf(searchQuery, index + 1)) > -1) {
						searchLines.push([l, index])
					}
				}

				searchUpdate()

			} else {

				$('.search-panel .results').text("")

				if (editors[current].editor.overlay) {
					editors[current].editor.removeOverlay(editors[current].editor.overlay)
				}
			}
		})

		var searchUpdate = function() {

			var overlay = {token: function(stream, state, lineNo) {
				if (stream.match(searchQuery, true, true)) {
					var index = -1
					for (var l in searchLines) {
						if (searchLines[l][0] == lineNo && searchLines[l][1] == stream.start) {
							index = l
							break
						}
					}
					if (index == searchIndex) {
						return "matchhighlight-green"
					}
					return "matchhighlight"
				}
				stream.next()
				stream.skipTo(searchQuery.charAt(0), true) || stream.skipToEnd()
			}}

			if (editors[current].editor.overlay) {
				editors[current].editor.removeOverlay(editors[current].editor.overlay)
			}
			editors[current].editor.overlay = overlay
			editors[current].editor.addOverlay(overlay)

			$('.search-panel .results').text((searchIndex + 1) + " / " + searchLines.length)

			if (searchLines.length > 0) {

				var line = searchLines[searchIndex][0]
				var t = editors[current].editor.charCoords({line: line, ch: 0}, "local").top;
				var middleHeight = editors[current].editor.getScrollerElement().offsetHeight / 2;

				editors[current].editor.scrollTo(0, t - middleHeight - 5);
			}
		}

		$('.search-panel .next').click(function() {

			searchIndex = (searchIndex + 1) % searchLines.length
			searchUpdate()
		})

		$('.search-panel .previous').click(function() {

			searchIndex--
			if (searchIndex < 0) searchIndex = searchLines.length - 1
			searchUpdate()
		})
	})

	setTimeout(LW.pages.editor.resize, 200)
	setTimeout(LW.pages.editor.resize, 400)
}

LW.pages.editor.update = function(params) {

	if ('id' in params && params.id in editors) {
		current = params.id
		currentType = 'ai'
		currentItem = params.id
		currentName = editors[current].name
		editors[current].show()
		localStorage['editor/last_code'] = params.id
	} else {
		LW.loader.hide()
	}
}

LW.pages.editor.resize = function() {

	var offset = 160 + (_searchEnabled ? 40 : 0)

	$('.CodeMirror-scroll').css('height', $(window).height() - offset)
	$('#ai-list').css('height', $(window).height() - 160 - 83)
}

LW.pages.editor.leave = function() {

	var num = 0
	for (var i in editors) {
		if (editors[i].modified) {
			num++
		}
	}
	if (num > 0) {
		return _.lang.get('editor', 'n_ais_unsaved', num)
	}
}

LW.pages.editor.keydown = function(e) {

	if (current == null) return null

	// Escape
	if (e.keyCode == 27) {
		LW.pages.editor.search(false)
	}

	// Ctrl-Q" : test
	if (e.ctrlKey && e.keyCode == 81) {
		_testEvent = e
		editors[current].test()
		e.preventDefault()
	}

	// Ctrl-S" : save
	if (e.ctrlKey && e.keyCode == 83) {
		editors[current].save()
		e.preventDefault()
	}

	// Ctrl-F" : search
	if (e.ctrlKey && e.keyCode == 70) {
		LW.pages.editor.search(true)
		e.preventDefault()
	}

	// Ctrl-F" : search
	if (e.ctrlKey && e.shiftKey && e.keyCode == 191) {
		editors[current].commentCode()
		e.preventDefault()
	}

	// Ctrl-Space : autocompletion
	if (e.ctrlKey && e.keyCode == 32) {
		editors[current].autocomplete(true)
		e.preventDefault()
	}

	// Ctrl-Shift-F : format code
	if (e.shiftKey && e.ctrlKey && e.keyCode == 70) {
		editors[current].formatCode()
		e.preventDefault()
	}
}

LW.pages.editor.test = function(e) {
	_testPopup.show(e)
	_testPopup.find('.tab').removeClass('selected').first().addClass('selected')
	_testPopup.find('.view').hide()
	_testPopup.find('.view').first().css('display', 'flex')
}

LW.pages.editor.jumpTo = function(ai, line) {

	if (ai != current) {
		LW.page('/editor/' + ai)
	}

	line--
	editors[current].editor.setCursor({line: line, ch: 0})
    var myHeight = editors[current].editor.getScrollInfo().clientHeight
    var coords = editors[current].editor.charCoords({line: line, ch: 0}, "local")
    editors[current].editor.scrollTo(null, (coords.top + coords.bottom - myHeight) / 2)
}

LW.pages.editor.open_folder = function(id) {
	current = id
	currentType = 'folder'
	//$('#editors .editor, #editors .folder-content').hide()
	//$('#editor-page .folder-content[folder=' + id + ']').show()
	$('#ai-list .item').removeClass('selected')
	$('#ai-list .folder[id=' + id + ']').addClass('selected')
}

function _saveTestSettings() {

	localStorage['editor/test_type'] = _testType
	localStorage['editor/test_leek'] = _testLeek
	localStorage['editor/test_ai'] = _testAI
	localStorage['editor/test_enemies'] = JSON.stringify(_testEnemies)
}

function onCursorChange(editor) {
	editors[current].cursorChange()
}

function onEditorChange(editor, changes) {
	editors[current].change(changes)
}

String.prototype.insert = function( idx, s ) {
    return (this.slice(0,idx) + s + this.slice(idx))
}

function _firstKey(array) {
    for (var k in array) return k
}

LW.pages.editor.search = function(activate) {

	if (activate) {

		_searchEnabled = true
		LW.pages.editor.resize()
		$('#editor-page .search-panel').css('display', 'flex')

		$('#editor-page .search-panel input').focus()

	} else {

		_searchEnabled = false
		if (editors[current].editor.overlay) {
			editors[current].editor.removeOverlay(editors[current].editor.overlay)
		}
		$('#editor-page .search-panel').hide()
		LW.pages.editor.resize()
	}
}

LW.pages.editor.test_popup = function(ais) {

	var data = {
		ais: ais
	}
	_testPopup = new _.popup.new('editor.test_popup', data, 1024)
	_testPopup.setDismissable(true)

	_testPopup.find('.tab').click(function() {
		_testPopup.find('.view').hide()
		_testPopup.find('.tab').removeClass('selected')
		$(this).addClass('selected')
		_testPopup.find('.view[tab=' + $(this).attr('tab') + ']').css('display', 'flex')
	})

	/*
	 * Maps
	 */
	var _maps = {}
	var _current_map = null
	var load_map = function(map) {
		if (_current_map && timeout) {
			if (timeout) {
				window.clearTimeout(timeout)
				timeout = null
			}
			save_map(_current_map)
		}
		_current_map = map
		_testPopup.find('.map .cell').removeClass('obstacle').removeClass('team1').removeClass('team2')
		for (var c in map.data.obstacles) {
			_testPopup.find('.map .cell[cell=' + map.data.obstacles[c] + ']').addClass('obstacle')
		}
		for (var c in map.data.team1) {
			_testPopup.find('.map .cell[cell=' + map.data.team1[c] + ']').addClass('team1')
		}
		for (var c in map.data.team1) {
			_testPopup.find('.map .cell[cell=' + map.data.team2[c] + ']').addClass('team2')
		}
	}
	var select_map = function(map) {
		_testPopup.find('.maps .map').removeClass('selected')
		_testPopup.find('.maps .map[map=' + map.id + ']').addClass('selected')
		load_map(map)
	}
	var add_map_events = function(e) {
		e.click(function() {
			select_map(_maps[$(this).attr('map')])
		})
	}
	_.get('test-map/get-all/' + LW.token(), function(data) {
		if (data.success) {
			for (var m in data.maps) {
				_maps = data.maps
				var e = $("<div class='item map' map='" +  data.maps[m].id + "'>" + data.maps[m].name + "</div>")
				_testPopup.find('.maps').append(e)
				add_map_events(e)
			}
			select_map(_.first(data.maps))
		} else {
			_.toast(data.error)
		}
	})
	var add_map_popup = new _.popup.new('editor.input_popup', {title: "Ajouter une carte", validate: "Ajouter"})
	add_map_popup.find('.validate').click(function() {
		var name = add_map_popup.find('input').val()
		_.post('test-map/new', {name: name}, function(data) {
			if (data.success) {
				var e = $("<div class='item map' map='" +  data.id + "'>" + name + "</div>")
				_testPopup.find('.maps').append(e)
				_maps[data.id] = ({name: name, id: data.id, data: {obstacles: [], team1: [], team2: []}})
				add_map_events(e)
				add_map_popup.dismiss()
				add_map_popup.find('input').val('')
				select_map(_maps[data.id])
			} else {
				_.toast(data.error)
			}
		})
	})
 	_testPopup.find('.view[tab="maps"] .item.add').click(function(e) {
 		add_map_popup.show(e)
 	})

	var save_map = function(map) {
		_.post('test-map/update', {id: map.id, data: JSON.stringify(map.data)}, function(data) {
			if (!data.success) {
				_.toast(data.error)
			}
		})
	}

	var timeout = null
	var reset_save_timeout = function() {
		if (timeout) window.clearTimeout(timeout)
		timeout = window.setTimeout(function() {
			timeout = null
			save_map(_current_map)
		}, 3000)
	}

	var init_map = function(element) {
		var size = 34;
		element.empty()
		for (var i = 0; i <= size; ++i) {
			var line = $("<div class='line'></div>");
			for (var j = 0; j <= size; ++j) {
				var y = i - Math.floor(size / 2)
				var x = j - Math.floor(size / 2)
				var enabled = Math.abs(x) + Math.abs(y) <= size / 2
				var clazz = enabled ? '' : 'disabled'
				var team = j < (size * (5 / 6) - i) ? '1' : (j > (size * (7 / 6) - i) ? '2' : '0')
				var cell = 306 + 18 * x + 17 * y
				line.append("<span class='cell " + clazz + "' cell='" + cell + "' team='" + team + "'></span>");
			}
			element.append(line)
		}
		map_down = false
		map_add = false
		element.find('.cell:not(.disabled)').each(function() {
			$(this).on({
				contextmenu: function(e) { // right click
					var team = $(this).attr('team')
					var cell = parseInt($(this).attr('cell'))
					if (team != 0) {
						$(this).removeClass('obstacle').toggleClass(team === '1' ? 'team1' : 'team2')
						var team_array = team === '1' ? _current_map.data.team1 : _current_map.data.team2
						var index = team_array.indexOf(cell)
						if (index != -1) {
							team_array.splice(index, 1)
						} else {
							team_array.push(cell)
						}
						reset_save_timeout()
					}
					e.preventDefault()
				},
				pointerdown: function(e) {
					if (e.originalEvent.button === 0) { // only left click
						var cell = parseInt($(this).attr('cell'))
						map_down = true
						map_add = !$(this).hasClass('obstacle')
						$(this).toggleClass('obstacle')
						var index = _current_map.data.obstacles.indexOf(cell)
						if (index != -1) {
							_current_map.data.obstacles.splice(index, 1)
						} else {
							_current_map.data.obstacles.push(cell)
						}
						reset_save_timeout()
					}
				},
				pointerenter: function(e) {
					if (map_down) {
						var has_class = $(this).hasClass('obstacle')
						if (has_class != map_add) {
							$(this).toggleClass('obstacle', map_add)
							var cell = parseInt($(this).attr('cell'))
							var index = _current_map.data.obstacles.indexOf(cell)
							if (index != -1) {
								_current_map.data.obstacles.splice(index, 1)
							} else {
								_current_map.data.obstacles.push(cell)
							}
							reset_save_timeout()
						}
					}
				},
				pointerup: function(e) {
					map_down = false
				},
				dragstart: function(e) {
					e.preventDefault()
					return false
				}
			})
		})
	}
	init_map(_testPopup.find('.map .map-wrapper'))

	_testPopup.find('.button.clear').click(function() {
		_testPopup.find('.map .cell').removeClass('obstacle')
		_current_map.data.obstacles = []
		reset_save_timeout()
	})
	_testPopup.find('.button.random').click(function() {
		_current_map.data.obstacles = []
		_testPopup.find('.map .cell').removeClass('obstacle')
		_testPopup.find('.map .cell').each(function() {
			if (Math.random() > 0.8) {
				$(this).addClass('obstacle')
				_current_map.data.obstacles.push(parseInt($(this).attr('cell')))
			}
		})
		reset_save_timeout()
	})


	/*
	 * Scenarios
	 */
	_testPopup.find('.scenario').click(function() {
		_testPopup.find('.scenario').removeClass('selected')
		$(this).addClass('selected')

		var scenario_view = _testPopup.find('.column-scenario')
	})

	/*
	 * Leeks
	 */
	var add_leek_popup = new _.popup.new('editor.input_popup', {title: "Ajouter un poireau", validate: "Ajouter"})
	_testPopup.find('.view[tab="leeks"] .item.add').click(function(e) {
		add_leek_popup.show(e)
	})

	_testAI = parseInt(localStorage['editor/test_ai'])

	if (!(_testAI in editors)) _testAI = _firstKey(editors)

	_testType = localStorage['editor/test_type']
	if (['solo', 'farmer', 'team'].indexOf(_testType) == -1) _testType = 'solo'

	_testLeek = localStorage['editor/test_leek']
	if (isNaN(_testLeek) || !LW.farmer.leeks[_testLeek]) {
		_testLeek = _testPopup.find('.myleek').first().attr('leek')
	}

	_testEnemies = 'editor/test_enemies' in localStorage ? JSON.parse(localStorage['editor/test_enemies']) : {'leek1': 2}

	_testPopup.view.find('.enemy select').click(function(e) {
		e.stopPropagation()
	})

	_testPopup.view.find('.enemy').click(function(e) {

		if ($(this).hasClass('selected') && _testPopup.view.find('.enemy.selected').length > 1) {
			$(this).removeClass('selected')
			$(this).find('input[type=checkbox]').prop('checked', false)
			delete _testEnemies['leek' + ($(this).index() + 1)]
		} else {
			$(this).addClass('selected')
			$(this).find('input[type=checkbox]').prop('checked', true)
			_testEnemies['leek' + ($(this).index() + 1)] = $(this).find('select')[0].selectedIndex
		}
		_saveTestSettings()
	})

	_testPopup.view.find('.enemy select').change(function() {
		var enemy = $(this).closest('.leek').index()
		_testEnemies['leek' + (enemy + 1)] = this.selectedIndex
		_saveTestSettings()
	})

	_testPopup.view.find("input:radio[name='test-type']").change(function() {
		_testType = $(this).attr('val')
		_saveTestSettings()
	})

	_testPopup.view.find('.myleek').click(function(e) {

		_testPopup.view.find('.myleek').removeClass('selected')
		$(this).addClass('selected')

		_testLeek = parseInt($(this).attr('leek'))
		_saveTestSettings()
	})

	_testPopup.view.find('.myleek').each(function() {

		var id = $(this).attr('leek')
		var leek = LW.farmer.leeks[id]
		var elem = this
		LW.createLeekImage(leek.id, 0.7, leek.level, leek.skin, leek.hat, function(id, data) {
			$(elem).find('.image').html(data)
		})
	})

	_testPopup.view.find('#test-ais').change(function() {
		_testAI = this[this.selectedIndex].id
		_saveTestSettings()
	})

	_testPopup.view.find("#launch").click(function() {

		var data = {}

		data.ai_id = _testAI
		data.leek_id = _testLeek
		data.bots = {}
		for (var e in _testEnemies) {
			data.bots[e] = _testEnemies[e]
		}
		data.type = _testType

		_saveTestSettings()

		_.post('ai/test', data, function(data) {

			if (data.success) {
				_testPopup.dismiss()
				LW.page('/fight/' + data.fight)
			} else {
				_.toast("Erreur : " + data.error)
			}
		})
	})

	$('#cancel-test').click(function() {
		_testPopup.dismiss()
	})

	_testPopup.view.find('#test-ais option[id=' + _testAI + ']').attr('selected', 'selected')

	_testPopup.view.find("input[name='test-type'][val='" + _testType + "']").prop('checked', true)

	_testPopup.view.find(".myleek[leek='" + _testLeek + "']").addClass('selected')

	for (var e in _testEnemies) {
		var enemy = _testPopup.view.find('.enemy')[parseInt(e.substring(4)) - 1]

		$(enemy).addClass('selected')
		$(enemy).find('input[type=checkbox]').prop('checked', true)
		$(enemy).find("select option[value='value" + _testEnemies[e] + "']").attr('selected', 'selected')
	}

	$("#test-button").click(function(e) {
		if (current != null) {
			_testEvent = e
			editors[current].test()
		}
	})
}

function generateDocumentation() {

	var last = ""
	var overloading = 0

	var keywords = []

	for (var f in LW.functions) {

		var fun = LW.functions[f]
		var functionName = fun.name

		if (last == fun.name) {
			overloading++
			functionName += "_" + (overloading + 1)
		} else {
			overloading = 0
		}

		var text = fun.name
		var name = fun.name
		name += "("

		var i = 0
		for (var a in fun.arguments_names) {
			name += fun.arguments_names[a]
			if (i++ < fun.arguments_names.length - 1) {
				name += ", "
			}
		}
		name += ')'

		if (fun.return_type != 0) {
			name += " : " + fun.return_name
		}

		var details = "<h4>" + _.lang.get('editor', 'function_f', name) + "</h4>"

		if (fun.deprecated) {
			details += "<div class='deprecated-message'>Cette fonction est dépréciée.</div>"
		}

		if (fun.operations == -1)
			details += _.lang.get('documentation', 'variable_operations')
		else if (fun.operations == 1)
			details += _.lang.get('documentation', '1_operation')
		else
			details += _.lang.get('documentation', 'n_operations', fun.operations)

		details += "<br><br>"

		details += _.lang.get('documentation', 'func_' + functionName) + "<br>"

		if (fun.arguments_names.length > 0) {
			details += "<br><b>" + _.lang.get('editor', 'parameters') + "</b>"
			details += "<ul>"
			for (var a in fun.arguments_names) {
				details += "<li>" + fun.arguments_names[a] + " : " + _.lang.get("documentation', 'func_" + functionName + "_arg_" + (a + 1)) + "</span></li>"
			}
			details += "</ul>"
		} else {
			details += "<br>"
		}

		if (fun.return_type != 0) {
			details += "<b>" + _.lang.get('editor', 'return') + "</b><br>"
			details += "<ul><li>" + fun.return_name + " : " + _.lang.get('documentation', 'func_' + functionName + '_return') + "</li></ul>"
		}

		keywords.push([text, name, details, 'function', fun.arguments_names.length])

		last = fun.name
	}

	// Constantes
	for (var c in LW.constants) {

		var constant = LW.constants[c]
		var details = ""

		if (constant.name.substring(0, 5) == 'CHIP_') {

			var name = constant.name.substring(5).toLowerCase()
			var chip = LW.chips[LW.getChipIDByName(name)]
			details = LW.createChipPreview(chip)

		} else if (constant.name.substring(0, 7) == 'WEAPON_') {

			var weapon = LW.weapons[LW.getWeaponIDByName(constant.name.substring(7).toLowerCase())]
			details = LW.createWeaponPreview(weapon)

		} else {
			details = "<h4>" + _.lang.get('editor', 'constant', constant.name) + "</h4><br>"
			details += _.lang.get('documentation', 'const_' + constant.name)
		}

		keywords.push([constant.name, constant.name, details, 'constant'])
	}

	return keywords
}
