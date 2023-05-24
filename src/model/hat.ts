class Hat {
	public id!: number
	public template!: number
	public hat_template!: number
	public name!: string
	public level!: number
	public quantity!: number
}

class HatTemplate {
	public id!: number
	public name!: string
	public level!: number
	public width!: number
	public height!: number
	public item!: number
	public crop!: number
}
export { Hat, HatTemplate }
