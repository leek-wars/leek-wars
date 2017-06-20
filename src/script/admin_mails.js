LW.pages.admin_mails.init = function(params, $scope, $page) {

	_.get('farmer/get-waiting-farmers/$/$', function(data) {

		$scope.farmers = data.farmers
		$page.render()

		$('.farmer .send').click(function() {

			var id = $(this).attr('farmer')

			_.post('farmer/resend-activation-mail', {farmer_id: id, supertoken: '$'})

			$(this).off().addClass('disabled')
		})
	})
	
	LW.setTitle("Admin activation mails")
}