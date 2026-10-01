import { Game } from "@/component/player/game/game"
import { T } from './texture'

const round = 10
const arrowWidth = 10
const arrowHeight = 10
const padding = 11
const font = "10pt Roboto"
const maxWidth = 250
const lineHeight = 17
const lineRy = 16 // Demi-hauteur d'une bulle d'une ligne
const margin = 4

interface Piece {
	text: string // Avec ses espaces de tête
	word: string // Sans, en début de ligne
	width: number
	wordWidth: number
}

// Morceaux entre lesquels une ligne peut se couper : les mots, et les caractères
// d'un mot plus long qu'une ligne (texte sans espaces, lien)
function pieces(ctx: CanvasRenderingContext2D, message: string) {
	const result: Piece[] = []
	const push = (text: string, word: string, wordWidth: number) => {
		result.push({ text, word, width: text === word ? wordWidth : ctx.measureText(text).width, wordWidth })
	}
	for (const [text, spaces, word] of message.replace(/[\t\n\f\r]/g, ' ').matchAll(/( *)([^ ]+)/g)) {
		const wordWidth = ctx.measureText(word).width
		if (wordWidth <= maxWidth) {
			push(text, word, wordWidth)
		} else {
			for (const [i, char] of Array.from(word).entries()) {
				push(i === 0 ? spaces + char : char, char, ctx.measureText(char).width)
			}
		}
	}
	return result
}

function fill(pieces: Piece[], width: number) {
	const lines: string[] = []
	let line = ''
	let lineWidth = 0
	for (const piece of pieces) {
		if (line && lineWidth + piece.width <= width) {
			line += piece.text
			lineWidth += piece.width
		} else {
			if (line) { lines.push(line) }
			line = piece.word
			lineWidth = piece.wordWidth
		}
	}
	lines.push(line)
	return lines
}

// Lignes d'au plus maxWidth, aussi égales que possible : la largeur la plus
// étroite qui n'ajoute pas de ligne
function wrap(ctx: CanvasRenderingContext2D, message: string) {
	const all = pieces(ctx, message)
	const count = fill(all, maxWidth).length
	let narrow = 0
	let wide = maxWidth
	while (wide - narrow > 1) {
		const width = (narrow + wide) / 2
		if (fill(all, width).length > count) {
			narrow = width
		} else {
			wide = width
		}
	}
	return fill(all, wide)
}

class Bubble {
	public lines: string[] = []
	public lama!: boolean
	public bug!: boolean
	public rx: number
	public ry: number
	public grow = 0 // Demi-hauteur des lignes en plus
	public life: number
	public game: Game

	constructor(game: Game) {
		this.game = game
		// Position du centre
		this.rx = 0
		this.ry = 22
		// Durée de vie
		this.life = 0
	}

	public setMessage(ctx: CanvasRenderingContext2D, message: string) {
		this.lama = false
		this.bug = false

		// Measure text and compute bubble size
		ctx.font = font
		this.lines = wrap(ctx, message)
		this.rx = Math.max(...this.lines.map((line) => ctx.measureText(line).width)) / 2 + padding
		this.grow = (this.lines.length - 1) * lineHeight / 2
		this.ry = lineRy + this.grow
	}

	public setLama() {
		this.lama = true
		this.bug = false
		this.rx = 40 + padding
		this.ry = 40 + padding
		this.grow = 0
	}

	public setBug() {
		this.lama = false
		this.bug = true
		this.rx = 20 + padding
		this.ry = 25
		this.grow = 0
	}

	public show(duration: number) {
		this.life = duration
	}

	public update(dt: number) {
		if (this.life > 0) {
			this.life -= 0.1 * dt
			if (this.life < 0) {
				this.life = 0
			}
		}
	}

	public draw(ctx: CanvasRenderingContext2D, height: number, bottom: boolean) {
		if (this.life <= 0) { return }

		// La bulle reste dans la partie visible du canvas, sa flèche vise toujours le poireau
		const m = ctx.getTransform()
		bottom ||= -height - this.grow - this.ry < -m.f / m.d + margin
		const left = (this.game.ground.visibleLeft - m.e) / m.a + margin + this.rx
		const right = (ctx.canvas.width - m.e) / m.a - margin - this.rx
		const cx = Math.min(Math.max(0, left), right)
		const arrowMax = Math.max(0, this.rx - round - arrowWidth / 2)
		const arrow = Math.min(Math.max(-cx, -arrowMax), arrowMax)

		// Les lignes en plus éloignent la bulle du poireau, la flèche ne bouge pas
		ctx.save()
		ctx.translate(cx, bottom ? 60 + this.grow : -height - this.grow)
		ctx.beginPath()

		// Flèche en bas (s = 1) ou en haut (s = -1)
		const s = bottom ? -1 : 1
		ctx.moveTo(-this.rx + round, -s * this.ry)
		ctx.lineTo(this.rx - round, -s * this.ry)
		ctx.quadraticCurveTo(this.rx, -s * this.ry, this.rx, -s * (this.ry - round))
		ctx.lineTo(this.rx, s * (this.ry - round))
		ctx.quadraticCurveTo(this.rx, s * this.ry, this.rx - round, s * this.ry)
		ctx.lineTo(arrow + arrowWidth / 2, s * this.ry)
		ctx.lineTo(arrow, s * (this.ry + arrowHeight))
		ctx.lineTo(arrow - arrowWidth / 2, s * this.ry)
		ctx.lineTo(-this.rx + round, s * this.ry)
		ctx.quadraticCurveTo(-this.rx, s * this.ry, -this.rx, s * (this.ry - round))
		ctx.lineTo(-this.rx, -s * (this.ry - round))
		ctx.quadraticCurveTo(-this.rx, -s * this.ry, -this.rx + round, -s * this.ry)

		// Draw bubble
		ctx.globalAlpha = this.life
		ctx.fillStyle = 'rgba(255,255,255, 0.8)'
		ctx.strokeStyle = 'black'
		ctx.lineWidth = 2
		ctx.fill()
		ctx.stroke()
		ctx.closePath()

		// Draw message
		if (this.lama) {
			ctx.drawImage(T.lama.texture, -45, -45, 90, 90)
		} else if (this.bug) {
			ctx.imageSmoothingEnabled = false
			ctx.drawImage(T.bug.texture, -20, -20, 40, 40)
		} else {
			ctx.fillStyle = 'black'
			ctx.textBaseline = "middle"
			ctx.textAlign = "left"
			ctx.font = font
			for (let i = 0; i < this.lines.length; ++i) {
				ctx.fillText(this.lines[i], -this.rx + padding, 1 - this.grow + i * lineHeight)
			}
		}
		ctx.globalAlpha = 1
		ctx.restore()
	}
}

export { Bubble }
