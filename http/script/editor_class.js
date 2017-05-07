var AUTO_SHORTCUTS = [
	["lama", "#LamaSwag", "", "Le pouvoir du lama"],
	["for", "for (var i = 0; i < ", "; i++) {\n\t\n}", "<h3>Boucle for</h3><br>for (var i = 0; i < ... ; i++) { ... }"],
	["while", "while (", ") {\n\t\n}", "<h3>Boucle while</h3><br>while ( ... ) { ... }"],
	["do", "do {\n\t\n} while (", ");", "<h3>Boucle do while</h3><br>do { ... } while( ... );"],
	["if", 'if (', ') {\n\t\n}', "<h3>Condition if</h3><br>if ( ... ) { ... }"]
];

/*
 * Classe editor
 */
var Editor = function(id, name, valid, code, folder, level) {

	// Infos de base
	this.id = id;
	this.name = name;
	this.loaded = false;
	this.modified = false;
	this.error = !valid;
	this.errorLine;
	this.needTest = false;
	this.hlLine = null;
	this.pos;
	this.completionSelected;
	this.completionFrom;
	this.completionTo;
	this.hoverToken;
	this.detailTimer;
	this.functions = []

	// Dialog d'autocomplétion
	this.hintDialog = $("<div class='hint-dialog'><div class='hints'></div><div class='details'></div></div>");
	$('#hints').append(this.hintDialog);

	// Dialog de détail
	this.detailDialog = $("<div class='detail-dialog'></div>");
	$('#hints').append(this.detailDialog);

	// Ajout de l'éditeur
	$('#editors').append("<div id='" + id + "' class='editor'></div>");

	this.editorDiv = $('#editors .editor[id=' + id + ']')
	this.editorDiv.hide()

	var editor = this

	this.editor = CodeMirror(this.editorDiv[0], {
		value: code,
		mode:  "leekscript",
		tabSize: 4,
		indentUnit: 4,
		indentWithTabs: true,
		highlightSelectionMatches: true,
		matchBrackets: true,
		lineNumbers: true,
		lineWrapping: true,
		undoDepth: 200,
		autofocus: true,
		smartIndent: false,
		cursorHeight: 1,
		extraKeys: {
			"Shift-Tab": function(cm) {
				editors[id].indentCode();
			},
			"Ctrl-U": function(cm) {
				editors[id].indentCode(false);
			},
			"Ctrl-I": function(cm) {
				editors[id].indentCode(true);
			},
			"Ctrl-D": function(cm) {
				editors[id].duplicateLine();
			},
			"Ctrl-E": function(cm) {
				editors[id].commentCode();
			},
			"Ctrl-K": function(cm) {
				editors[id].removeLine();
			},
		}
	});
	this.editor.on('change', onEditorChange);
	this.editor.on('cursorActivity', onCursorChange);

	this.editorDiv.find('.CodeMirror-scroll').bind('mousewheel', function(e, d) {
		var zoom = screen.width / window.innerWidth
		if (d < 0 && Math.abs($(this).scrollTop() - (this.scrollHeight - $(this).innerHeight() + 15 / zoom)) < 1) {
			e.preventDefault()
		}
	})

	this.editor.on("mousedown", function(cm, e) {

        if (e.ctrlKey) {

        	var pos = {left: e.pageX, top: e.pageY };
        	var editorPos = editor.editor.coordsChar(pos, "page")
			var token = editor.editor.getTokenAtString(editorPos)

			var information = editor.getTokenInformation(token, editorPos)

			if (information && information[3] == 'user-function') {
				editor.detailDialog.hide()
				LW.pages.editor.jumpTo(information[6], information[7])
			}

			e.preventDefault()
		}
	})

	this.hasBeenModified = function() {

		editors[id].modified = true;

		editors[id].removeErrors();

		this.tabDiv.removeClass("modified").addClass("modified");
	}

	this.show = function() {

		// Tab
		$('#ai-list .item').removeClass('selected');
		this.tabDiv.addClass('selected');
		this.modified = false;

		// if (!_BASIC) {
			$('#line-count').text(this.editor.getDoc().lineCount());
			$('#char-count').text(this.editor.getDoc().getValue().length);
		// }

		if (!this.loaded && this.id > 0) {

			this.load(true);

			$('#select-msg').hide()
			LW.loader.show()
			$('#top').hide()

		} else {

			LW.loader.hide()
			$('#top').show()
			$('#ai-name').text(this.name)
			$('#select-msg').hide()

			$('#editors .editor').hide()
			$('#editors .folder-content').hide()
			this.editorDiv.show()

			// if (!_BASIC) {
				//this.editor.focus();
				this.editor.refresh()
			// }

			if (this.error) {
				this.showErrors()
			}

			localStorage["editor/last_code"] = this.id
		}
	}

	this.load = function(show) {

		var editor = this;

		_.get('ai/get/' + id + '/' + LW.token(), function(data) {

			if (data.success) {

				var ai = data.ai.code

				// if (_BASIC) {

					// editor.editorDiv.append("<textarea>" + ai + "</textarea>");
					// _editorResize();

				// } else {
					editor.editor.setValue(ai);
					editor.editor.getDoc().clearHistory();

					setTimeout(function() {
						editor.updateIncludes()
						editor.updateFunctions()
					}, 200)
			 	// }

				editor.loaded = true
				if (show) {
					editor.show()
				}
			}
		});
	}

	this.save = function() {

		if (_saving || !this.loaded) {
			return
		}
		_saving = true

		var editor = this

		this.tabDiv.removeClass("modified")

		$('#compiling').show()
		$('#results').empty().hide()

		var saveID = this.id > 0 ? this.id : 0

		// var content = _BASIC ? this.editorDiv.find('textarea').val() : this.editor.getValue();
		var content = this.editor.getValue()

		_.post('ai/save/', {ai_id: saveID, code: content}, function(data) {

			_saving = false;
			$('#results').empty().show();
			$('#compiling').hide();

			if (editor.v2 == false)
			if (!data.success || data.result.length == 0) {

				$('#results').append("<div class='error'>× <i>" + _.lang.get('editor', 'server_error') + "</i></div>");
				return;
			}

			if (editor.v2 == false)
			for (var r in data.result) {

				var res = data.result[r];
				var code = res[0];
				var ia = res[1];

				var iaEditor = editors[ia];
				if (!iaEditor) continue;
				var iaName = iaEditor.name;

				if (code == 2) {

					$('#results').append("<div class='good'>✓ " + _.lang.get('editor', 'valid_ai', _.protect(iaName)) + "</div><br>");
					$('#results .good').last().delay(800).fadeOut(function() {
						$('#results').hide();
					});

					iaEditor.error = false;
					iaEditor.tabDiv.removeClass("error");
					$('.line-error').removeClass("line-error");

				} else if (code == 1) {

					var info = res[2];

					$('#results').append("<div class='error'>× <b>" + _.protect(iaName) + "</b>&nbsp; ▶ " + info + "</div><br>");
					iaEditor.tabDiv.removeClass("error").addClass("error");
					iaEditor.error = true;

				} else if (code == 0) {

					var line = res[3]
					var pos = res[4]
					var info = res[5]

					if (res.length == 8) {
						info = _.lang.get('java_compilation', res[6], res[7])
					} else {
						info = _.lang.get('java_compilation', res[6])
					}
					info = '(' + res[5] + ') ' + info

					$('#results').append("<div class='error'>× " + _.lang.get('editor', 'ai_error', _.protect(iaName), line) + "&nbsp; ▶ " + info + "</div><br>");

					iaEditor.tabDiv.removeClass("error").addClass("error");

					iaEditor.error = true;
					iaEditor.errorLine = line;

					iaEditor.showErrors();
				}
			}

			editor.modified = false
			editor.updateFunctions()

			if (editor.needTest) {
				editor.needTest = false
				editor.test()
			}
		})
	}

	this.showErrors = function() {

		var lines = this.editorDiv.find('.CodeMirror-lines > div > div')[2]
		var line = $(lines).find('pre')[this.errorLine - 1]
		$(line).addClass('line-error')
	}

	this.removeErrors = function() {

		var lines = this.editorDiv.find('.CodeMirror-lines').find('div')[3]
		$(lines).find('pre').removeClass('line-error')

		$('#error').fadeOut()
		$('#good').fadeOut()
	}

	this.test = function() {

		// Save before
		if (this.modified) {

			this.needTest = true;
			this.save();
			return;
		}

		if (!this.v2) {
			// Sauvegardé et erreur, on teste pas ça !
			if (this.error) {
				return;
			}
			LW.pages.editor.test(_testEvent)
		} else {
			var content = this.editor.getValue()
			_.post('leekscript/execute', {code: content}, function(data) {
				if (data.success) {
					var result = JSON.parse(data.result)
					_.toast(result.res)
				} else {
					_.toast(data.error)
				}
			})
		}
	}

	this.cursorChange = function() {

		var cursor = this.editor.getCursor();

		if (!this.pos) {
			this.pos = cursor;
		} else if (this.pos.line != cursor.line) {
			this.close();
			this.pos = cursor;
		}

		if (this.hlLine) this.editor.removeLineClass(this.hlLine, "background", "activeline");
		this.hlLine = this.editor.addLineClass(cursor.line, "background", "activeline");
	}

	// Not used
	this.mergeLastTwoOperations = function() {
		var history = this.editor.getDoc().getHistory();
		var last = history.done.pop();
		history.done[history.done.length - 1].changes.push(last.changes[0]);
		this.editor.getDoc().setHistory(history);
	}

	this.change = function(changes) {

		var userChange = changes.origin == "+input" || changes.origin == "+delete";

		if (changes.origin != "setValue") {
			this.hasBeenModified();
		}

		if (changes.origin == "+input" || (this.hintDialog.is(":visible") && changes.origin == "+delete")) {
			this.autocomplete();
		}

		$('#line-count').text(this.editor.getDoc().lineCount());
		$('#char-count').text(this.editor.getDoc().getValue().length);

		if (userChange && _autoClosing) {

			var editor = this.editor;
			var chars = '{([\'"';
			var add = '})]\'"';

			var cursor = editor.getCursor();
			var nextChar = editor.getLine(cursor.line)[cursor.ch];

			// Enter
			if (changes.from.ch == changes.to.ch && changes.from.line == changes.to.line && changes.text.length == 2
				&& changes.text[0] == '' && changes.text[1] == '') {

				var prevLine = editor.getLine(cursor.line - 1);
				var prevChar = prevLine[prevLine.length - 1];

				if (prevChar == '{' && nextChar == '}') {

					var indent = this.getLineIndentation(cursor.line)
					editor.replaceSelection("\t\n" + indent)
					editor.setCursor({line: cursor.line, ch: cursor.ch + 1})
					// this.mergeLastTwoOperations();
				}
			}

			// Peut etre une insertion d'un délimiteur
			if (changes.from.ch == changes.to.ch) {

				var pos = chars.indexOf(changes.text[0])
				var pos2 = add.indexOf(changes.text[0])

				if (pos2 > -1 && nextChar == changes.text[0]) {

					editor.setSelection(cursor, {line: cursor.line, ch: cursor.ch + 1})
					editor.replaceSelection("")

				} else if (changes.text[0].length > 0 && pos > -1) { // Délimiteur ouvrant

					var start = editor.getCursor("from")
					var end = editor.getCursor("to")

					editor.replaceRange(add[pos], start, end)
					editor.setSelection(end, end)
					editor.matchBrackets()
					// this.mergeLastTwoOperations()
				}


			} else if (changes.text[0] == "" && changes.from.ch - changes.to.ch == -1) { // Delete

				var pos = chars.indexOf(changes.removed[0]);

				var cursor = editor.getCursor();
				var nextChar = editor.getLine(cursor.line)[cursor.ch];

				if (pos > -1 && add.indexOf(nextChar) == pos) { // Delete closing delimitor

					var pos2 = add[pos];

					var start = editor.getCursor("from");
					var end = editor.getCursor("to");
					end.ch++;

					editor.setSelection(start, end);
					editor.replaceSelection("");
					editor.setSelection(start, start);
					editor.matchBrackets();
				}

				editor.matchBrackets();
			}
		}
	}

	this.formatCode = function() {

		this.editor.setValue(js_beautify(this.editor.getValue(), {'indent_size': 1, 'indent_char': '\t'}));

		this.editor.matchBrackets();
	}

	this.commentCode = function() {

		var selection = this.editor.getSelection();
		var start = this.editor.getCursor(true).line;
		var end = this.editor.getCursor(false).line;

		for (i = 0; i < end - start + 1; i++) {

			var line = this.editor.getLine(start + i);

			var pos = 0;
			for (var j = 0; j < line.length; j++) {
				if (line.charAt(j) == ' ' || line.charAt(j) == '\t') {
					pos++;
				} else {
					break;
				}
			}

			var cuttedLine = line.slice(pos);
			if (cuttedLine.length > 0) {

				var from = {line: start + i, ch: 0}
				var to = {line: start + i, ch: line.length}

				if (line.charAt(pos) == "/" && line.charAt(pos + 1) == "/") {
					this.editor.replaceRange(line.slice(0, pos) + line.slice(pos + 2), from, to); // Dé-Comment
				} else {
					this.editor.replaceRange(line.slice(0, pos) + "//" + cuttedLine, from, to); // Comment
				}
			}
		}
		this.editor.matchBrackets();
	}

	this.getLineIndentation = function(line) {

		var line = this.editor.getLine(line);

		var indent = "";
		for (var j = 0; j < line.length; j++) {
			if (line[j] == ' ' || line[j] == '\t') {
				indent += line[j];
			} else {
				break;
			}
		}
		return indent;
	}

	this.indentCode = function() {

		var selection = this.editor.getSelection();
		var start = this.editor.getCursor(true).line;
		var end = this.editor.getCursor(false).line;

		for (i = 0; i < end - start + 1; i++) {

			var line = this.editor.getLine(start + i);

			if (line.length > 0) {
				this.editor.indentLine(start + i, false);
			}
		}
		this.editor.matchBrackets();
	}

	this.removeLine = function() {

		var pos = this.editor.getCursor(true).line;

		if (this.editor.somethingSelected()) {
			this.editor.replaceSelection("");
		} else {
			this.editor.removeLine(this.editor.getCursor(true).line);
		}

		this.editor.setCursor(pos);
	}

	this.duplicateLine = function() {

		var selection = this.editor.getSelection();

		if (this.editor.somethingSelected()) {

			var start = this.editor.getCursor(true);
			var end = this.editor.getCursor(false);

			var selection = this.editor.getSelection();
			this.editor.replaceSelection(selection + selection);

			this.editor.setSelection(start, end);

		} else {
			var start = this.editor.getCursor(true).line;
			var line = this.editor.getLine(start);
			this.editor.replaceRange(line + "\n" + line, {line: start, ch: 0}, {line: start, ch: line.length})
		}

		this.editor.matchBrackets();
	}

	this.getTokenInformation = function(token, pos) {

		for (var i in LW.keywords) {

			if (LW.keywords[i][0] == token) {

				if (LW.keywords[i][3] == 'function') {

					var line = editor.editor.getLine(pos.line)
					var after = line.substring(pos.ch)

					var start
					var par = 0
					for (var j = pos.ch; j < line.length; ++j) {
						var c = line[j]
						if (c == '(') if (par++ == 0) start = j + 1
						if (c == ')') if (--par == 0) break
					}

					var capture = line.substring(start, j)
					var argCount = $.trim(capture) === '' ? 0 : (capture.match(/\,/g) || []).length + 1

					if (argCount == LW.keywords[i][4]) {
						return LW.keywords[i]
					}
				} else {
					return LW.keywords[i]
				}
			}
		}

		var functions = this.functions
		for (var f in functions) {
			if (token == functions[f][0]) {
				return functions[f]
			}
		}
		for (var i in this.includes) {
			var functions = editors[this.includes[i]].functions
			for (var f in functions) {
				if (token == functions[f][0]) {
					return functions[f]
				}
			}
		}
	}

	this.mousemove = function(e) {

		if (!_popups) return null

		if (this.hintDialog.is(':visible')) return null

		var pos = {left: e.pageX, top: e.pageY };

		if (pos.left < editor.editorDiv.offset().left || pos.top < editor.editorDiv.offset().top) {
			clearTimeout(editor.detailTimer)
			editor.detailDialog.hide()
			return
		}

		var editorPos = editor.editor.coordsChar(pos, "page")
		var tokenString = editor.editor.getTokenAtString(editorPos)

		if (tokenString != this.hoverToken) {

			this.hoverToken = tokenString

			var information = this.getTokenInformation(tokenString, editorPos)

			if (information != null) {

				clearTimeout(editor.detailTimer)
				this.detailTimer = setTimeout(function() {

					if (current != id) {
						editor.detailDialog.hide()
						return
					}

					editor.detailDialog.html(information[2])

					var pos = editor.editor.cursorCoords(editorPos)
					var top = pos.bottom

					editor.detailDialog.css('top', top)
					editor.detailDialog.css('left', e.pageX)
					editor.detailDialog.show()

				}, 400)

			} else {
				clearTimeout(editor.detailTimer)
				editor.detailDialog.hide()
			}
		}
	}

	this.mouseleave = function() {
		clearTimeout(editor.detailTimer)
		editor.detailDialog.hide()
	}

	this.autocomplete = function(force) {

		if (!_autocomplete) return;

		// Mise à jour des includes avant
		this.updateIncludes()

		var editor = this.editor;
		var Pos = CodeMirror.Pos;

		var cur = editor.getCursor();
		var token = editor.getTokenAt(cur);
		var startPos = token.start

		// Trim token
		var previousLength = token.string.length
		token.string = $.trim(token.string);
		startPos += previousLength - token.string.length

		if (!force && token.string.length == 0) {
			this.close();
			return;
		}

		function forEach(arr, f) {
			for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
		}

		var tprop = token;
		token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

		var completions = new Array();
		var start = token.string;

		function maybeAdd(data) {
			if (typeof data == 'string') {
				if (data.toLowerCase().indexOf(start.toLowerCase()) == 0) {
					completions.push({text: data, details: _.lang.get('editor', 'keyword', data), type: 'keyword'});
				}
			} else {
				if (data[0].toLowerCase().indexOf(start.toLowerCase()) == 0) {
					completions.push({text: data[0], name: data[1], details: data[2], type: data[3]})
				}
			}
		}

		// Ajout des variables locales du code
		for (var v = token.state.localVars; v; v = v.next) {
			if (v.name.toLowerCase().indexOf(start.toLowerCase()) == 0) {
				completions.push({text: v.name, name: v.name, details: _.lang.get('editor', 'variable', v.name), type: 'keyword'});
			}
		}

		// Variables globales
		var vars = [];
		vars[this.id] = token.state.globalVars;

		for (var i in this.getGlobalVars(vars)) {
			var file = vars[i];
			for (var v = file; v; v = v.next) {
				if (v.name.toLowerCase().indexOf(start.toLowerCase()) == 0) {

					var information = this.getTokenInformation(v.name)
					if (!information) {
						var text = "Variable <b>" + v.name + "</b>"
						if (i != this.id) text += "<br><br>" + _.lang.get('editor', 'variable_defined_in_ai', editors[i].name)
						completions.push({text: v.name, name: v.name, details: text, type: 'keyword'})
					}
				}
			}
		}

		// File functions
		for (var f in this.functions) {
			if (this.functions[f][0].toLowerCase().indexOf(start.toLowerCase()) == 0) {
				completions.push({text: this.functions[f][0], name: this.functions[f][1], details: this.functions[f][2], type: this.functions[f][3]})
			}
		}

		// Include functions
		for (var i in this.includes) {
			var functions = editors[this.includes[i]].functions
			for (var f in functions) {
				if (functions[f][0].toLowerCase().indexOf(start.toLowerCase()) == 0) {
					completions.push({text: functions[f][0], name: functions[f][1], details: functions[f][2], type: functions[f][3]})
				}
			}
		}

		// Ajout des fonctions
		forEach(LW.keywords, maybeAdd)

		// Raccourcis
		for (var r in AUTO_SHORTCUTS) {
			if (AUTO_SHORTCUTS[r][0].indexOf(start.toLowerCase()) == 0) {
				completions.push(
					{text: AUTO_SHORTCUTS[r][0], name: AUTO_SHORTCUTS[r][0], details: AUTO_SHORTCUTS[r][3], type: 'shortcut', shortcut: r}
				);
			}
		}

		this.completions = completions
		this.completionFrom = {line: cur.line, ch: startPos}
		this.completionTo = {line: cur.line, ch: token.end}

		if (completions.length == 0) {

			this.close()

		} else {

			this.hintDialog.show()
			this.detailDialog.hide()

			var pos = editor.cursorCoords({line: cur.line, ch: cur.ch - token.string.length})
			var left = pos.left, top = pos.bottom;

			this.hintDialog.css('top', top)
			this.hintDialog.css('left', left)

			this.hintDialog.find('.hints').text("")
			this.hintDialog.find('.details').text("")
			for (var i in completions) {
				this.hintDialog.find('.hints').append("<div class='hint'>" + completions[i].name + "</div>")
				this.hintDialog.find('.details').append("<div class='detail'>" + completions[i].details + "</div>")
			}

			this.selectHint(0)

			var thisEditor = this
			this.hintDialog.find('.hint').click(function(e) {

				if ($(this).index() == thisEditor.selectedCompletion) {
					thisEditor.pick()
				} else {
					thisEditor.selectHint($(this).index())
				}

				thisEditor.editor.focus()

				e.stopPropagation()
				e.preventDefault()
				return false
			})

			$('html').click(function() {
				thisEditor.close()
			});

			this.keyMap = {
			  Up: thisEditor.up,
			  Down: thisEditor.down,
			  PageUp: thisEditor.up,
			  PageDown: thisEditor.down,
			  Home: thisEditor.top,
			  End: thisEditor.bottom,
			  Enter: thisEditor.pick,
			  Tab: thisEditor.pick,
			  Esc: thisEditor.close
			}

			this.editor.removeKeyMaps()
			this.editor.addKeyMap(this.keyMap)
		}
	}.bind(this)

	this.up = function() {
		var index = this.selectedCompletion == 0 ? (this.hintDialog.find('.hint').length - 1) : this.selectedCompletion - 1;
		this.selectHint(index);
	}.bind(this);

	this.down = function() {
		var index = (this.selectedCompletion + 1) % this.hintDialog.find('.hint').length;
		this.selectHint(index);
	}.bind(this);

	this.top = function() {
		this.selectHint(0);
	}.bind(this);

	this.bottom = function() {
		this.selectHint(this.hintDialog.find('.hint').length);
	}.bind(this);

	this.pick = function() {

		var completion = this.completions[this.selectedCompletion];

		if (completion.type == 'function' || completion.type == 'user-function') {

			var name = completion.name;
			if (name.indexOf(':') > -1) {
				name = name.substring(0, name.indexOf(':') - 1);
			}

			this.editor.replaceRange(name, this.completionFrom, this.completionTo);
			var pos = this.editor.getCursor();
			var argCount = name.split(',').length;
			if (argCount == 1) {
				if (name.indexOf(')') - name.indexOf('(') == 1) argCount = 0;
			}

			if (argCount > 0) {

				var firstArgLength = (argCount > 1 ? name.indexOf(',') : name.indexOf(')')) - name.indexOf('(') - 1;

				this.editor.setSelection({line: pos.line, ch: this.completionFrom.ch + completion.text.length + 1},
										 {line: pos.line, ch: this.completionFrom.ch + completion.text.length + 1 + firstArgLength});
			} else {

				this.editor.setCursor({line: pos.line, ch: this.completionFrom.ch + name.length});
			}

		} else if (completion.type == 'shortcut') {

			// Dirty : modify the history to avoid having the word selected after an undo.
			// Set head.ch = anchor.ch (no selection)
			var history = this.editor.getHistory()
			history.done[history.done.length - 1].ranges[0].head.ch = history.done[history.done.length - 1].ranges[0].anchor.ch
			this.editor.setHistory(history)

			var shortcut = AUTO_SHORTCUTS[completion.shortcut]
			var pos = this.editor.getCursor()
			var iniLine = pos.line
			var indent = this.getLineIndentation(iniLine)

			pos.ch = this.completionFrom.ch
			this.editor.replaceRange(shortcut[1].replace(/\n/g, '\n' + indent) + shortcut[2].replace(/\n/g, '\n' + indent),
				this.completionFrom, this.completionTo)

			pos = this.editor.getCursor()
			pos.line = iniLine + (shortcut[1].split("\n").length - 1)
			pos.ch = shortcut[1].length - shortcut[1].lastIndexOf("\n") - 1 + indent.length
			this.editor.setCursor(pos)

		} else {
			this.editor.replaceRange(completion.text, this.completionFrom, this.completionTo)
		}

		this.close()

	}.bind(this)

	this.close = function() {
		this.hintDialog.hide();
		this.editor.removeKeyMaps()
		this.editor.off("blur", this.onBlur);
	}.bind(this);

	this.selectHint = function(hint) {

		this.selectedCompletion = hint;

		this.hintDialog.find('.hint').removeClass('active');
		var elem = $(this.hintDialog.find('.hint')[hint]);
		elem.addClass('active');

		this.hintDialog.find('.details').children().hide();
		$(this.hintDialog.find('.details').children()[hint]).show();

		var posIndex = Math.round(hint - (this.hintDialog.find('.hints').height() / elem.height()) / 2 + 1);
		posIndex = Math.max(posIndex, 0);
		this.hintDialog.find('.hints').scrollTop(-2 + this.hintDialog.find('.hints').scrollTop() + $(this.hintDialog.find('.hint')[posIndex]).position().top);

	}.bind(this);

	this.onBlur = function() {
		this.close();
	}.bind(this);

	this.updateIncludes = function() {

		var editor = this
		this.includes = []

		this.editorDiv.find('.cm-lsfunc').each(function() {

			if ($(this).text() == 'include' && $(this).next().attr('class') == "cm-string") {

				var string = $(this).next().text();
				var ai = string.substring(1, string.length-1);

				$('#ai-list .ai').each(function() {
					if ($(this).text() == ai && ai != editor.name) {
						var id = parseInt($(this).attr('id'))
						editor.includes.push(id)
						if (!editors[id].loaded) editors[id].load()
					}
				})
			}
		})
	}

	this.updateFunctions = function() {

		var code = this.editor.getValue()
		this.functions = []

		var match
		var regex = /function\s+(\w+)\s*\(\s*([\s\S]*?)\s*\)/g

		while ((match = regex.exec(code)) != null) {

			var line = code.substring(0, match.index).split("\n").length
			var args = match[2].split(",")
			if (args.length == 1 && $.trim(args[0]) === '') args = []
			for (var i in args) args[i] = $.trim(args[i])

			var fullName = match[1] + "(" + args.join(", ") + ")"

			var description = "<h4>" + _.lang.get('editor', 'function_f', fullName) + "</h4><br>"
			description += _.lang.get('editor', 'defined_in', this.name, line)

		    this.functions.push([match[1], fullName, description, 'user-function', args.length, args, id, line])
		}
	}

	this.getGlobalVars = function(vars) {

		var vars = vars || [];

		if (!(this.id in vars)) {
			var lines = this.editor.getDoc().lineCount()
			var pos = {line: lines - 1, ch: this.editor.getLine(lines - 1).length}
			var token = this.editor.getTokenAt(pos)

			vars[this.id] = token.state.globalVars // variables du code lui-même
		}

		// variables des includes
		this.updateIncludes()

		for (var i in this.includes) {
			var include = this.includes[i];

			if (!(include in vars)) {

				var vars2 = editors[include].getGlobalVars(vars);
				for (var v in vars2) {
					vars[v] = vars2[v];
				}
			}
		}

		return vars;
	}
}
