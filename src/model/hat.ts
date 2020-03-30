class Hat {
	public id!: number
	public template!: number
	public hat_template!: number
	public name!: string
	public level!: number
}

class HatTemplate {
	public id!: number
	public name!: string
	public level!: number
	public width!: number
	public height!: number
	public template!: number
}
export { Hat, HatTemplate }
