var _DELAY = 115;

$(document).ready(function() {

	$("value").each(function() {
		
		var elem = this;
		var speed = parseFloat($(this).attr('speed')) * (_DELAY / 1000);
		var realValue = parseInt($(this).text().replace(/ /g, ""));
		
		if (!isNaN(speed)) {
			
			setInterval(function() {
				
				realValue += speed;
				$(elem).html(_spaceThousands(Math.floor(realValue)));
				
			}, _DELAY);
		}
	});
});
