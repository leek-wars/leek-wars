LW.pages.bank_validate.init = function($params, $scope, $page) {

	if ('state' in $params) {

		$scope.success = $params.state == 'success'
		$scope.reason = 'reason' in $params ? $params.reason : ''
		$scope.crystals = 'crystals' in $params ? $params.crystals : ''
		$scope.vendor = 'vendor' in $params ? $params.vendor : ''

		$page.render()

		return 
	}

	var url = document.location.search

	var match = url.match(/\?paymentId=(.*?)&token=(.*?)&PayerID=(.*?)$/)

	if (match) {

		var payment_id = match[1]
		var token = match[2]
		var payer_id = match[3]

		_.post('bank/execute-paypal-payment', {payment_id: payment_id, paypal_token: token, payer_id: payer_id}, function(data) {

			if (data.success) {

				LW.page('/bank/validate/success/' + data.crystals + '/PayPal')

			} else {

				LW.page('/bank/validate/failed/PayPal/' + data.error)
			}
		})

	} else {

		LW.page('/bank/validate/failed/PayPal/cancelled')
	}
}