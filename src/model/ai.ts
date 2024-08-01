import { Problem } from '@/component/editor/problem'
import { fileSystem } from './filesystem'
import { i18n } from './i18n'
import { Keyword, KeywordKind, LSClass } from './keyword'
import { LeekWars } from './leekwars'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

class AI {
	public id!: number
	public name!: string
	public code!: string
	public valid!: boolean
	public version!: number
	public strict!: boolean
	public timestamp: number = 0
	public modified: boolean = false
	public dragging: boolean = false
	public folder!: number
	public path!: string
	public folderpath!: string
	public includes: AI[] = []
	public includes_ids: number[] = []
	public functions: Keyword[] = []
	public globals: {[key: string]: Keyword} = {}
	public classes: {[key: string]: LSClass} = {}
	public total_lines!: number
	public total_chars!: number
	public included_lines!: number
	public included_chars!: number
	public selected: boolean = false
	public errors: number = 0
	public warnings: number = 0
	public todos: number = 0
	public equipped: boolean = false
	public entrypoint: boolean = false
	public entrypoints: number[] = []
	public comments: { [key: number]: string } = {}
	public scenario!: number | null
	public problems: { [key: number]: Problem[] } = {}
	public model!: monaco.editor.ITextModel

	constructor(data: any) {
		Object.assign(this, data)
	}

	public analyze() {

		// console.log("analyze", this.path)

		this.updateIncludes()

		// Search /* */ comments first
		let match
		const comments: {[key: number]: string} = {}
		const comment_regex = /\/\*([^]*?)\*\/\s*/gm
		while ((match = comment_regex.exec(this.code)) != null) {
			const content = match[1].trim().split("\n").map(line => line.replace(/^\s*\*\s?/, '')).join("\n").trim()
			comments[match.index + match[0].length] = content
		}
		this.comments = comments

		// console.log("Comments", comments)

		this.updateFunctions()
		this.updateClasses()
		this.updateGlobalVars()
	}

	public updateIncludes() {
		// console.log("Update includes", this.path, ('' + this.code).substring(0, 100))
		// console.time("inc")
		this.includes = []
		const regex = /include\s*\(\s*["'](.*?)["']\s*\)/gm
		let m
		while ((m = regex.exec(this.code))) {
			const path = m[1]
			// console.log(m)
			const included = fileSystem.find(path, this.folder)
			if (included) {
				// console.log("Found included", path, this.folder, included)
				this.includes.push(included)
			} else {
				// console.warn("Included not found", path, this.ai.folder, included)
			}
		}
		// console.timeEnd("inc")
	}

	public parseArguments(allArguments: string) {
		const args = [] as string[]
		const types = [] as string[]
		let chevron = 0
		let j = 0
		if (allArguments.trim().length === 0) return { args, types }
		for (let i = 0; i <= allArguments.length; ++i) {
			const c = i < allArguments.length ? allArguments[i] : ','
			if (c === '<') chevron++
			if (c === '>') chevron--
			if (chevron === 0 && c === ',') {
				let arg = allArguments.substring(j, i).trim()
				j = i + 1
				if (arg.startsWith('@')) {
					arg = arg.substring(1)
				}
				if (arg.includes(' ')) {
					const space = arg.lastIndexOf(' ')
					types.push(arg.substring(0, space))
					arg = arg.substring(space + 1)
				} else {
					types.push('any')
				}
				args.push(arg)
			}
		}
		return { args, types }
	}

	public updateFunctions() {

		this.functions = []
		let match

		const regex = /function\s+(\w+)\s*\(([^]*?)\)\s*(?:=>)?(?:->)?\s*(.*)\s{/gm
		// Match [ full_match, javadoc, nom, arguments ]

		while ((match = regex.exec(this.code)) != null) {

			// console.log(match)
			const line = this.code.substring(0, match.index).split("\n").length
			const return_type = match[3] ? match[3].trim() : 'any'

			const { args, types } = this.parseArguments(match[2])
			// console.log(args, types)

			let fullName = match[1] + "(" + args.join(", ") + ")"
			let description = "<h4>" + i18n.t('leekscript.function_f', [fullName]) + "</h4><br>"
			description += i18n.t('leekscript.defined_in', [this.name, line])

			const comment = this.comments[match.index]
			const javadoc = {
				name: match[1],
				description: "",
				items: [] as any[],
			}
			// console.log(javadoc)
			// Add arguments from signature
			let a = 0
			for (const arg of args) {
				javadoc.items.push({ type: 'param', name: arg, text: null, lstype: { name: types[a] } })
				a++
			}
			// console.log(javadoc.items)
			if (comment) {
				const javadoc_lines = comment.split("\n")
				const javadoc_regex = /^\s*@(\w+)(?:\s+([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)\s*:?\s*)?(?:\s*:\s*)?(.*)$/
				let match_javadoc
				for (const jline of javadoc_lines) {
					if ((match_javadoc = javadoc_regex.exec(jline))) {
						// console.log(match_javadoc)
						const type = match_javadoc[1]
						let name = match_javadoc[2]
						let text = match_javadoc[3]
						if (type === 'return') {
							fullName += ' : ' + name
						} else if (type === 'param') {
							if (name) {
								name = name.trim()
								if (name.startsWith('@')) {
									name = name.substring(1)
								}
							}
							text = text.trim()
							if (text.startsWith('@')) {
								text = text.trim().substring(1)
							}
							if (args.includes(name) || args.includes(text)) {
								// console.log('arg', name, text)
								const existing = javadoc.items.find(i => i.type === 'param' && ((name.length && i.name === name) || (text.length && i.name === text)))
								// console.log('existing', existing)
								// existing.name = existing.text
								existing.text = text
								continue
							}
						}
						javadoc.items.push({ type, name, text })
					} else {
						if (jline.length) {
							if (javadoc.description.length) {
								javadoc.description += "\n"
							}
							javadoc.description += jline
						}
					}
				}
				// console.log("javadoc", javadoc)
			}

			// Escape
			javadoc.description = LeekWars.protect(javadoc.description)
			for (const item of javadoc.items) {
				item.name = item.name ? LeekWars.protect(item.name) : item.name
				item.text = item.text ? LeekWars.protect(item.text) : item.text
			}

			const fun = {
				label: match[1],
				fullName,
				details: description,
				insertText: match[1] + "(" + args.map((a, i) => `\${${i + 1}:${a}}`).join(", ") + ")",
				kind: KeywordKind.Function,
				argumentCount: args.length,
				arguments: args,
				ai: this,
				line,
				javadoc,
				category: 4,
				return_type: { name: return_type }
			}
			// console.log(fun)
			this.functions.push(fun)
		}
	}

	public updateClasses() {

		// console.time('classes')

		this.classes = {}
		let match

		// Search classes
		const class_regex = /class\s+(\w+)\s*(extends|{)/gm
		while ((match = class_regex.exec(this.code)) != null) {
			const line = this.code.substring(0, match.index).split("\n").length
			const name = match[1]
			const comment = this.comments[match.index]
			const javadoc = { name, description: comment, items: [] }
			this.classes[name] = {
				label: name,
				fullName: name,
				details: "Classe <b>" + name + "</b>",
				kind: KeywordKind.Class,
				ai: this,
				line,
				category: 9,
				javadoc,
				documentation: javadoc.description,
				fields: [],
				static_fields: [

				],
				methods: [],
				static_methods: []
			}
			if (this.version >= 3) {
				this.classes[name].static_fields.push(
					{ label: "name", fullName: "name", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_name') },
					{ label: "super", fullName: "super", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_super') },
					{ label: "fields", fullName: "fields", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_fields') },
					{ label: "staticFields", fullName: "staticFields", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_staticFields') },
					{ label: "methods", fullName: "methods", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_methods') },
					{ label: "staticMethods", fullName: "staticMethods", kind: KeywordKind.Field, category: 1, details: i18n.t('leekscript.class_staticMethods') },
				)
			}
		}
		// console.log("Classes", this.ai.classes)
		// console.timeEnd('classes')

		// console.time('static_fields')

		// Search static fields
		const field_regex = /^\s*(?:public\s+)?(?:(static)\s+)?([\w ,<>]+[ \t]+)?(\w+)[ \t]*($|=|;)/gm
		while ((match = field_regex.exec(this.code)) != null) {

			const name = match[3]
			if (name === 'function' || name === 'for' || name === 'while' || name === 'if') continue

			// console.log(match[1], match[2], match[3])

			const is_static = !!match[1]
			const type = match[2]
			const line = this.code.substring(0, match.index).split("\n").length

			const fullName = name
			let description = "<h4>" + i18n.t('leekscript.function_f', [fullName]) + "</h4><br>"
			description += i18n.t('leekscript.defined_in', [this.name, line])

			const comment = this.comments[match.index] || this.comments[match.index + 1]
			// console.log("comment", comment)
			const javadoc = {
				name: fullName,
				description: "",
				items: [] as any[],
				lstype: { name: type }
			}
			// console.log(javadoc.items)
			if (comment) {
				const javadoc_lines = comment.split("\n")
				const javadoc_regex = /^\s*@(\w+)(?:\s+([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)\s*:?\s*)?(?:\s*:\s*)?(.*)$/
				let match_javadoc
				for (const jline of javadoc_lines) {
					if ((match_javadoc = javadoc_regex.exec(jline))) {
						// console.log(match_javadoc)
						const type = match_javadoc[1]
						const name = match_javadoc[2]
						const text = match_javadoc[3]
						javadoc.items.push({ type, name, text })
					} else {
						if (jline.length) {
							if (javadoc.description.length) {
								javadoc.description += "\n"
							}
							javadoc.description += jline
						}
					}
				}
				// console.log("javadoc", javadoc)
			}

			// Escape
			javadoc.description = LeekWars.protect(javadoc.description)
			for (const item of javadoc.items) {
				item.name = item.name ? LeekWars.protect(item.name) : item.name
				item.text = item.text ? LeekWars.protect(item.text) : item.text
			}

			// Find class
			let clazz = null
			for (const c in this.classes) {
				if (this.classes[c].line! > line) break
				clazz = this.classes[c]
			}
			if (clazz) {
				const field = {
					label: name,
					fullName,
					details: description,
					kind: KeywordKind.Field,
					ai: this,
					line,
					javadoc,
					category: 1,
					clazz
				}
				if (is_static) {
					clazz.static_fields.push(field)
				} else {
					clazz.fields.push(field)
				}
			}
		}

		// console.timeEnd('static_fields')

		// console.time('methods')

		// Search methods
		const method_regex = /^\s*(?:public\s+)?(?:(static)\s+)?(.*\s+?)?(\w+)\s*\(([\w\s,<>]*)\)\s*{/gm
		while ((match = method_regex.exec(this.code)) != null) {

			const name = match[3]
			if (name === 'function' || name === 'for' || name === 'while' || name === 'if') continue

			// console.log(match)
			if (!name) {
				console.error("No name", match)
			}
			const is_static = !!match[1]
			const return_type = match[2] ? match[2].trim() : 'any'
			const line = this.code.substring(0, match.index).split("\n").length

			const { args, types } = this.parseArguments(match[4])

			let fullName = name + "(" + args.join(", ") + ")"
			let description = "<h4>" + i18n.t('leekscript.function_f', [fullName]) + "</h4><br>"
			description += i18n.t('leekscript.defined_in', [this.name, line])

			const comment = this.comments[match.index] || this.comments[match.index + 1]
			// console.log("comment", comment, this.comments, match)
			const javadoc = {
				name,
				args,
				description: "",
				items: [] as any[],
			}
			// Add arguments from signature
			let a = 0
			for (const arg of args) {
				javadoc.items.push({ type: 'param', name: arg, text: null, lstype: { name: types[a] } })
				a++
			}
			// console.log(javadoc.items)
			if (comment) {
				const javadoc_lines = comment.split("\n")
				const javadoc_regex = /^\s*@(\w+)(?:\s+([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)\s*:?\s*)?(?:\s*:\s*)?(.*)$/
				let match_javadoc
				for (const jline of javadoc_lines) {
					if ((match_javadoc = javadoc_regex.exec(jline))) {
						// console.log(match_javadoc)
						const type = match_javadoc[1]
						let lstype = null
						let name = match_javadoc[2]
						let text = match_javadoc[3]
						if (type === 'return') {
							fullName += ' : ' + text
							lstype = {name: return_type}
						} else if (type === 'param') {
							if (name) {
								name = name.trim()
								if (name.startsWith('@')) {
									name = name.substring(1)
								}
							}
							text = text.trim()
							if (text.startsWith('@')) {
								text = text.trim().substring(1)
							}
							if (args.includes(name) || args.includes(text)) {
								// console.log('arg', name, text)
								const existing = javadoc.items.find(i => i.type === 'param' && ((name.length && i.name === name) || (text.length && i.name === text)))
								// console.log('existing', existing)
								// existing.name = existing.text
								existing.text = text
								continue
							}
						}
						javadoc.items.push({ type, name, text, lstype })
					} else {
						if (jline.length) {
							if (javadoc.description.length) {
								javadoc.description += "\n"
							}
							javadoc.description += jline
						}
					}
				}
				// console.log("javadoc", javadoc)
			}

			// Escape
			javadoc.description = LeekWars.protect(javadoc.description)
			for (const item of javadoc.items) {
				item.name = item.name ? LeekWars.protect(item.name) : item.name
				item.text = item.text ? LeekWars.protect(item.text) : item.text
			}

			// Find class
			let clazz = null
			for (const c in this.classes) {
				if (this.classes[c].line! > line) break
				clazz = this.classes[c]
			}
			if (clazz) {
				if (!match[3]) {
					console.error("No name", match)
				}
				const method = {
					label: match[3],
					fullName,
					insertText: name + "(" + args.map((a, i) => `\${${i + 1}:${a}}`).join(", ") + ")",
					details: description,
					kind: KeywordKind.Method,
					argumentCount: args.length,
					arguments: args,
					ai: this,
					line,
					javadoc,
					category: 4,
					clazz,
					return_type: { name: return_type }
				}
				// console.log(fun)
				if (is_static) {
					clazz.static_methods.push(method)
				} else {
					clazz.methods.push(method)
				}
			}
		}

		// console.log("classes " + this.name, this.classes)
		// console.timeEnd('methods')
		// console.trace()
	}

	public updateGlobalVars() {

		this.globals = {}
		let match

		// Search global vars
		const global_regex = /global\s+(?:.*\s+?)?(\w+)$/gm
		while ((match = global_regex.exec(this.code)) != null) {
			const line = this.code.substring(0, match.index).split("\n").length
			const name = match[1]
			const comment = this.comments[match.index]
			const javadoc = { name, description: comment, items: [] }
			this.globals[name] = {
				label: name,
				fullName: name,
				details: "Variable <b>" + name + "</b>",
				kind: KeywordKind.Variable,
				ai: this,
				line,
				category: 8,
				javadoc,
			}
		}
	}

	public isClassDefined(clazz: string): boolean {
		// console.log("isClassDefined", clazz, this)

		const visited = new Set<number>()

		const aux = (ai: AI): boolean => {
			if (visited.has(ai.id)) { return false }
			visited.add(ai.id)
			// console.log("aux", ai.path)

			if (ai.classes[clazz]) return true

			if (ai.includes) {
				for (const include of ai.includes) {
					if (visited.has(include.id)) { continue }
					const found = aux(include)
					if (found) {
						return found
					}
				}
			}
			return false
		}

		const result = aux(this)
		if (result) { return result }

		// console.log("entrypoints", startAI.entrypoints)
		for (const entrypoint_id of this.entrypoints) {
			const entrypoint = fileSystem.ais[entrypoint_id]
			if (entrypoint) {
				// console.log("entrypoints", entrypoint.path, entrypoint.includes)
				const result = aux(entrypoint)
				if (result) { return result }
			}
		}
		return false
	}

	public searchSymbol(symbol: string, previousToken: string | undefined): Keyword | null {

		// console.log("searchSymbolInAI", symbol)

		const visited = new Set<number>()

		const aux = (ai: AI): Keyword | null => {
			if (visited.has(ai.id)) { return null }
			visited.add(ai.id)
			// console.log("aux", ai.path)
			if (ai.functions) {
				for (const fun of ai.functions) {
					if (symbol === fun.label) {
						return fun
					}
				}
			}
			for (const g in ai.globals) {
				if (symbol === g) {
					return ai.globals[g]
				}
			}
			for (const s in ai.classes) {
				const clazz = ai.classes[s]
				if (symbol === s) {
					return clazz
				}
				if (previousToken === s && clazz.static_methods) {
					for (const method of clazz.static_methods) {
						if (symbol === method.label) {
							return method
						}
					}
				}
				if (previousToken === s && clazz.static_fields) {
					for (const field of clazz.static_fields) {
						if (symbol === field.label) {
							return field
						}
					}
				}
			}
			if (ai.includes) {
				for (const include of ai.includes) {
					if (visited.has(include.id)) { continue }
					const found = aux(include)
					if (found) {
						return found
					}
				}
			}
			return null
		}

		const result = aux(this)
		if (result) { return result }

		// console.log("entrypoints", startAI.entrypoints)
		for (const entrypoint_id of this.entrypoints) {
			const entrypoint = fileSystem.ais[entrypoint_id]
			if (entrypoint) {
				// console.log("entrypoints", entrypoint.path, entrypoint.includes)
				const result = aux(entrypoint)
				if (result) { return result }
			}
		}

		return null
	}
}
export { AI }
