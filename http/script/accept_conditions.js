$(document).ready(function() {
		
	$('#accept-button').click(function() {
	
		ajax('accept_update', null, function(data) {
			
			console.log(data);
			document.location.href = "/";
		});
	});
});
