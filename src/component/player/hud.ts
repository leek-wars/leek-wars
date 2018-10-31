class Hud {

	public addLog(log: string[]) {
		let div = "<div class='action'>"
		for (let i = 0; i < log.length; i += 2) {
			const text = log[i]
			const color = log[i + 1]
			div += "<span style='color: " + color + ";'>" + text + "</span>"
		}
		div += "</div>"
	}

	public addPersonalLog(log: any) {
	// 	var leek = game.leeks[log[0]];
	// 	var color = (new Array("black", "orange", "red"))[log[1] - 1];
	// 	if (log.length > 3) color = _.colorToHex(log[3])
	// 	var message = log[2];

	// 	var div = "<div class='action log'>"
	//     div += "<pre style='color: " + color + ";'>" + "[" + leek.name + "] " + message + "</pre>";
	// 	div += "</div>"
	}

	public draw() {
		/// Bottom part
		// if (game.speed > 1 && !game.paused) {
		// 	this.speedButtonFrame += dt;
		// 	if (this.speedButtonFrame > 50) {
		// 		this.speedButtonFrame = 0;
		// 		this.speedButtonVisible = !this.speedButtonVisible * 1.0;
		// 		$('#speed-button').css('opacity', this.speedButtonVisible);
		// 	}
		// }
	}
}
