LW.pages.bank_buy.init = function(params, $scope, $page) {

	var packID = params.packID
	var offerID = params.offerID

	_.get('bank/get-packs', function(data) {

		var pack = data.packs[packID]
		var offer = pack.offers[offerID]
		var vendor = offer.vendor
		var crystalCount = pack.crystals

		var obj = {
			vendor: vendor,
			crystalCount: crystalCount,
			packID: packID,
			offerID: offerID
		}

		if (vendor == 'StarPass') {

			obj['id'] = LW.local ? offer.id[1] : LW.beta ? offer.id[2] : offer.id[0]

			_.post('bank/begin-starpass-payment', {pack_id: packID, offer_id: offerID}, function() {
				if (data.success) {
					$scope.data = obj
					$page.render()
				} else {
					LW.error()
				}
			})

		} else {

			$scope.data = obj
			$page.render()

			$('#paypal-button').click(function() {
				_.post('bank/begin-paypal-payment', {pack_id: packID, offer_id: offerID}, function(data) {
					if (data.success) {
						window.location.href = data.url
					}
				})
			})
		}
	})
}
