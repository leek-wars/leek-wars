var OFFSET_TOP = 95;

$(document).ready(function() {
	
	// Click item
	$('#inventory .item').click(function() {
		
		$('#items').children().removeClass('selected');
		$(this).addClass('selected');
		
		$('#preview').children().hide();
		$('#preview #' + $(this).attr('id')).show();
	});

	$('#inventory .item').first().click();
	
	$(window).scroll(function() {
		var scroll = $(window).scrollTop();
		
		if (scroll < 97) {
			$('#preview').css('position', 'absolute');
			$('#preview').css('top', 55);
		} else {
			$('#preview').css('position', 'fixed');
			$('#preview').css('top', 20);
			$('#preview').css('right', 'auto');
			$('#preview').css('margin-top', 0);   
		}
	});
});
