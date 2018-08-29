import { LeekWars } from '@/model/leekwars'

const LIFE = 70

class InfoText {
	public text!: string
	public color!: string
	public life!: number
	public x!: number
	public y!: number
	public bottom!: number
	public darkColor!: string

	public init(text: string, color: string, y: number, bottom: boolean) {
		this.text = text.split("").join(String.fromCharCode(8202))

		this.color = color
		const hex = LeekWars.hexToRgb(color)
		this.darkColor = LeekWars.rgbToHex(Math.round(hex[0] * 0.7), Math.round(hex[1] * 0.7), Math.round(hex[2] * 0.7))

		this.life = LIFE
		this.x = Math.random() * 20 - 10
		this.y = bottom ? 20 : y
		this.bottom = bottom ? -1 : 1
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.color
		ctx.strokeStyle = this.darkColor
		let alpha = this.life / 20
		if (alpha > 1) { alpha = 1 }
		ctx.globalAlpha = alpha
		ctx.strokeText(this.text, this.x, this.y)
		ctx.fillText(this.text, this.x, this.y)
	}
}

export { InfoText }
