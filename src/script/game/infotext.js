var InfoText = {}

InfoText.LIFE = 70

InfoText = Class.extend(InfoText, function() {
	
	this.text
	this.color
	this.life
	this.x
	this.y
	this.bottom
})

InfoText.prototype.init = function(text, color, y, bottom) {

	this.text = text.split("").join(String.fromCharCode(8202))

	this.color = color
	var hex = hexToRgb(color)
	this.darkColor = rgbToHex(Math.round(hex[0] * 0.7), Math.round(hex[1] * 0.7), Math.round(hex[2] * 0.7))

	this.life = InfoText.LIFE
	this.x = Math.random() * 20 - 10
	this.y = bottom ? 20 : y
	this.bottom = bottom ? -1 : 1
}

InfoText.prototype.draw = function(dt) {  

	ctx.fillStyle = this.color
	ctx.strokeStyle = this.darkColor
	var alpha = this.life / 20
	if (alpha > 1) alpha = 1
	ctx.globalAlpha = alpha
	ctx.strokeText(this.text, this.x, this.y)
	ctx.fillText(this.text, this.x, this.y) 
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}