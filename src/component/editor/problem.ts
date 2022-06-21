class Problem {

	start_line: number
	start_column: number
	end_line: number
	end_column: number
	level: number
	info: string

	constructor(start_line: number, start_column: number, end_line: number, end_column: number, level: number, info: string) {
		this.start_line = start_line
		this.start_column = start_column
		this.end_line = end_line
		this.end_column = end_column
		this.level = level
		this.info = info
	}

}

export { Problem }