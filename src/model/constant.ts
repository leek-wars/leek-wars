import { LeekScriptItem } from '@/model/function'

class Constant extends LeekScriptItem {
	public name!: string
	public value!: string
	public type!: number
	public category!: number
	public deprecated!: number
}
export { Constant }
