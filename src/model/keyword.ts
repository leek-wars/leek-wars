import { AI } from "./ai"
import { Constant } from "./constant"
import { LSFunction } from "./function"

class Keyword {
	name!: string
	fullName!: string
	type!: string
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