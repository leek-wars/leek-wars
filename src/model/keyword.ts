import { AI } from "./ai"
import { Constant } from "./constant"
import { LSFunction } from "./function"

export enum KeywordKind {
	Method = 0,
	Function = 1,
	Constructor = 2,
	Field = 3,
	Variable = 4,
	Class = 5,
	Struct = 6,
	Interface = 7,
	Module = 8,
	Property = 9,
	Event = 10,
	Operator = 11,
	Unit = 12,
	Value = 13,
	Constant = 14,
	Enum = 15,
	EnumMember = 16,
	Keyword = 17,
	Text = 18,
	Color = 19,
	File = 20,
	Reference = 21,
	Customcolor = 22,
	Folder = 23,
	TypeParameter = 24,
	User = 25,
	Issue = 26,
	Snippet = 27
}

class Keyword {
	label!: string
	fullName!: string
	insertText?: string
	kind!: KeywordKind
	details!: any
	argumentCount?: number
	arguments?: string[]
	ai?: AI
	line?: number
	shortcut?: number
	function?: LSFunction
	constant?: Constant
	lstype?: any
	location?: any
	category!: number
	javadoc?: any
	documentation?: string
	tags?: number[]
}

class LSClass extends Keyword {
	fields!: LSField[]
	static_fields!: LSField[]
	methods!: LSMethod[]
	static_methods!: LSStaticMethod[]
}

class LSField extends Keyword {}
class LSMethod extends Keyword {}
class LSStaticMethod extends Keyword {}

export { Keyword, LSClass }