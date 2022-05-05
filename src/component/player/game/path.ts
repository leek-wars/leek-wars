

class Path extends Path2D {

	public ix1: number = 0
	public iy1: number = 0
	public ix2: number = 0
	public iy2: number = 0

	public x1: number = 0
	public y1: number = 0
	public x2: number = 0
	public y2: number = 0

	public constructor(x1: number, y1: number, x2: number, y2: number) {
		super()
		this.ix1 = x1
		this.ix2 = x2
		this.iy1 = y1
		this.iy2 = y2
	}

	public moveTo(x: number, y: number) {
		super.moveTo(x, y)
		this.update_bounds(x, y)
	}

	public lineTo(x: number, y: number) {
		super.lineTo(x, y)
		this.update_bounds(x, y)
	}

	public update_bounds(x: number, y: number) {
		x = Math.max(this.ix1, Math.min(this.ix2, x))
		y = Math.max(this.iy1, Math.min(this.iy2, y))
		if (x < this.x1) this.x1 = x
		if (x > this.x2) this.x2 = x
		if (y < this.y1) this.y1 = y
		if (y > this.y2) this.y2 = y
	}
}

export { Path }