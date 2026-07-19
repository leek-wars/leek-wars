// Position dans un document : ligne (0-based) et colonne (0-based), comme l'ancien
// type CodeMirror.Position (CodeMirror a été retiré au profit de Monaco).
interface Position {
	line: number
	ch: number
}

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

	public contains(position: Position) {
		const line = position.line + 1
		if (line >= this.start_line && line <= this.end_line) {
			return position.ch >= (line === this.start_line ? this.start_column : 0) && position.ch <= (line === this.end_line ? this.end_column : Infinity)
		}
		return false
	}
}

export { Problem }