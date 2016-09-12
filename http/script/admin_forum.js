$(document).ready(function() {
	
	$("#categories").tableDnD({
		dragHandle: ".arrows",
		onDrop: function(table, row) {
			
			_log("drop");

			var order = [];
			
			$('#categories .category').each(function() {
				order.push($(this).attr('id'));
			});
			order = JSON.stringify(order);
			
			ajax('forum_update', {edit_order: true, order: order});
		}
	});
		
	$('#admin .name').focusout(function() {
		
		var id = $(this).closest('.category').attr('id');
		var name = $(this).text();
			 
		ajax('forum_update', {rename:true, id: id, name: name});
	});
	
	$('#admin .description').focusout(function() {
		
		var id = $(this).closest('.category').attr('id');
		var text = $(this).text();
			 
		ajax('forum_update', {description:true, id: id, text: text});
	});
	
	$('#admin .admin input').change(function() {
		
		var id = $(this).closest('.category').attr('id');
		var level = $(this).is(':checked') ? 2 : 1;
			
		ajax('forum_update', {edit_level:true, id: id, level: level});
	});
});
