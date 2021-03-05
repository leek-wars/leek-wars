import { LeekScriptItem } from '@/model/function'

class Constant extends LeekScriptItem {
	public id!: number
	public name!: string
	public value!: string
	public type!: number
	public category!: number
	public deprecated!: number
	public replacement!: number | null
}
export { Constant }
