// Polyfill Array.at() for older browsers (Chrome < 92)
if (!Array.prototype.at) {
	Array.prototype.at = function (n: number) {
		n = Math.trunc(n) || 0
		if (n < 0) n += this.length
		if (n < 0 || n >= this.length) return undefined
		return this[n]
	}
}
