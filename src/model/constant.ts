import { LeekScriptItem } from '@/model/function'

class Constant extends LeekScriptItem {
	public id!: number
	public name!: string
	public value!: string
	public type!: number
	public category!: number
	public deprecated!: boolean
	public replacement!: number | null
	public lower_name?: string
	public data?: string
	public replacer?: Constant
}

export { Constant }
