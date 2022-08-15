import { ItemTemplate } from "./item"

class SchemeIngredient {
	item!: ItemTemplate
	quantity!: number
}

class SchemeTemplate {
	public id!: number
	public items!: ([number, number] | null)[]
	public result!: number
	public quantity!: number
}
export { SchemeTemplate }
