class Square {
	id?: number
	message!: string
	image!: string
	title!: string
	link!: string | null
	padding!: boolean
}

class Squares {
	squares: Square[] = []
	id: number = 0
	add(square: Square) {
		square.id = this.id++
		this.squares.push(square)
		setTimeout(() => this.squares.shift(), 5000)
	}
}

export { Squares }