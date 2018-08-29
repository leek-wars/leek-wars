import { Game } from "@/component/player/game/game"

const round = 10
const arrowWidth = 10
const arrowHeight = 10
const padding = 15
const font = "12pt Roboto"

class Bubble {
	public message!: string
	public lama!: boolean
	public bug!: boolean
	public rx: number
	public ry: number
	public arrow: number
	public life: number
	public game: Game

	constructor(game: Game) {
		this.game = game
		// Position du centre
		this.rx = 0
		this.ry = 22
		// Position de la petite flêche
		this.arrow = 0
		// Durée de vie
		this.life = 0
	}

	public setMessage(ctx: CanvasRenderingContext2D, message: string) {
		this.message = message
		this.lama = false
		this.bug = false

		// Measure text and compute bubble width
		ctx.font = font
		const metrics =  ctx.measureText(this.message)
		this.rx = metrics.width / 2 + padding
		this.ry = 22
	}

	public setLama() {
		this.lama = true
		this.bug = false
		this.rx = 40 + padding
		this.ry = 40 + padding
	}

	public setBug() {
		this.lama = false
		this.bug = true
		this.rx = 20 + padding
		this.ry = 25
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

	public draw(ctx: CanvasRenderingContext2D, x: number, height: number, bottom: boolean) {

		ctx.save()
		ctx.translate(x, bottom ? 60 : -height)
		ctx.beginPath()

		if (bottom) {
			ctx.moveTo(-this.rx + round, this.ry)
			ctx.lineTo(this.rx - round, this.ry)
			ctx.quadraticCurveTo(this.rx, this.ry, this.rx, this.ry - round)
			ctx.lineTo(this.rx, -this.ry + round)
			ctx.quadraticCurveTo(this.rx, -this.ry, this.rx - round, -this.ry)
			ctx.lineTo(this.arrow + arrowWidth / 2, -this.ry)
			ctx.lineTo(this.arrow, -this.ry - arrowHeight)
			ctx.lineTo(this.arrow - arrowWidth / 2, -this.ry)
			ctx.lineTo(-this.rx + round, -this.ry)
			ctx.quadraticCurveTo(-this.rx, -this.ry, -this.rx, -this.ry + round)
			ctx.lineTo(-this.rx, this.ry - round)
			ctx.quadraticCurveTo(-this.rx, this.ry, -this.rx + round, this.ry)
		} else {
			ctx.moveTo(-this.rx + round, -this.ry)
			ctx.lineTo(this.rx - round, -this.ry)
			ctx.quadraticCurveTo(this.rx, -this.ry, this.rx, -this.ry + round)
			ctx.lineTo(this.rx, this.ry - round)
			ctx.quadraticCurveTo(this.rx, this.ry, this.rx - round, this.ry)
			ctx.lineTo(this.arrow + arrowWidth / 2, this.ry)
			ctx.lineTo(this.arrow, this.ry + arrowHeight)
			ctx.lineTo(this.arrow - arrowWidth / 2, this.ry)
			ctx.lineTo(-this.rx + round, this.ry)
			ctx.quadraticCurveTo(-this.rx, this.ry, -this.rx, this.ry - round)
			ctx.lineTo(-this.rx, -this.ry + round)
			ctx.quadraticCurveTo(-this.rx, -this.ry, -this.rx + round, -this.ry)
		}

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
			ctx.drawImage(this.game.T.lama.texture, -45, -45, 90, 90)
		} else if (this.bug) {
			ctx.drawImage(this.game.T.bug.texture, -20, -20, 40, 40)
		} else {
			ctx.fillStyle = 'black'
			ctx.textBaseline = "middle"
			ctx.textAlign = "left"
			ctx.font = font
			ctx.fillText(this.message, -this.rx + padding, 0)
		}
		ctx.globalAlpha = 1
		ctx.restore()
	}
}

export { Bubble }
