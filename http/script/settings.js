var vapid_key = new Uint8Array([4,32,252,255,154,105,120,132,72,225,41,243,79,52,88,153,185,153,161,231,205,247,92,110,98,91,90,206,201,2,111,70,137,209,162,137,184,113,69,22,143,215,184,6,172,40,113,137,213,15,129,183,153,154,148,27,205,52,146,168,68,31,16,209,31])

LW.pages.settings.init = function(params, $scope, $page) {

	_.get('settings/get-settings/' + LW.token(), function(data) {

		var mails = {
			fight: ['solo', 'farmer', /* 'team',*/ 'solo_challenge', 'farmer_challenge'],
			tournament: ['solo_round_finished', 'farmer_round_finished'],
			forum: ['response'],
			changelog: ['changelog']
		}

		$scope.languages = _.lang.languages
		$scope.sfw_switch = {
			id: 'sfw-switch',
			checked: LW.sfw.active
		}
		$scope.mails = mails
		$scope.settings = data.settings
		$page.render()

		LW.setTitle(_.lang.get('settings', 'title'))

		LW.pages.settings.logout()
		LW.pages.settings.language()
		LW.pages.settings.sfw()
		LW.pages.settings.changePassword()
		LW.pages.settings.deleteAccount()
		LW.pages.settings.advanced()
		LW.pages.settings.clearLocalStorage()
		LW.pages.settings.mails(mails)

		$('#register-push').click(function() {

			if ('serviceWorker' in navigator) {

				navigator.serviceWorker.ready.then(function(reg) {
					reg.pushManager.subscribe({
						applicationServerKey: vapid_key,
						userVisibleOnly: true
					}).then(function(subscription) {
						_.post('push-endpoint/register', {subscription: JSON.stringify(subscription), token: LW.token()})
					});
				})
			}
		})
	})
}

LW.pages.settings.logout = function() {

	$('#logout').click(function() {

		LW.disconnect()
		LW.page('/')
	})
}

LW.pages.settings.language = function() {

	$('#languages .language').click(function() {

		_.lang.set($(this).attr('lang'))
	})
}

LW.pages.settings.sfw = function() {

	$('#sfw-button').click(function() {

		var sfw = !$('#sfw-switch').is(':checked')
		$('#sfw-switch').prop('checked', sfw)

		if (sfw) {
			LW.sfw.on()
		} else {
			LW.sfw.off()
		}
	})
}

LW.pages.settings.changePassword = function() {

	$('#change-password').submit(function() {

		var password = $('#change-password').get(0).password.value
		var newPassword1 = $('#change-password').get(0).new_password1.value
		var newPassword2 = $('#change-password').get(0).new_password2.value

		if (newPassword1 != newPassword2) {
			_.toast(_.lang.get('farmer', 'error_not_same_password'))
			return false
		}

		_.post('farmer/change-password', {password: password, new_password: newPassword1}, function(data) {

			if (data.success == true) {
				_.toast(_.lang.get('settings', 'password_changed'), _.reload)
			} else {
				_.toast(_.lang.get('farmer', 'error_' + data.error, data.params))
			}
		});

		return false
	})
}

LW.pages.settings.deleteAccount = function() {

	var deletePopup = new _.popup.new('settings.delete_popup')

	$('#delete-button').click(function(e) {

		deletePopup.show(e)
	})

	var deleteConfirmPopup = new _.popup.new('settings.delete_confirm_popup')

	deletePopup.find('#delete').click(function(e) {

		deletePopup.dismiss()

		deleteConfirmPopup.show(e)
	})

	var deleteSuccessPopup = new _.popup.new('settings.delete_success_popup')
	var deleteFailedPopup = new _.popup.new('settings.delete_failed_popup')

	deleteConfirmPopup.find('#delete-final').click(function(e) {

		var deleteForumMessages = deletePopup.find('#delete-forum-messages').is(':checked')

		_.post('farmer/unregister',
			{
				password: $('#delete-confirm-password').val(),
				delete_forum_messages: !!deleteForumMessages

			}, function(data) {

			deleteConfirmPopup.dismiss()

			if (data.success) {

				deleteSuccessPopup.show(e)

				setTimeout(function() {
					_.post('farmer/logout', function(data) {
						window.location.href = '/'
					})
				}, 3000)

			} else {

				deleteFailedPopup.show(e)

				$('#delete-error').text(data.error)
			}
		})
	})
}

LW.pages.settings.advanced = function() {

	var expanded = false

	$('.advanced-button').click(function() {
		if (expanded) {
			$(this).find('img').attr('src', LW.staticURL + 'image/expand.png')
		} else {
			$(this).find('img').attr('src', LW.staticURL + 'image/collapse.png')
		}
		expanded = !expanded
		$('.advanced').toggle()
	})
}

LW.pages.settings.clearLocalStorage = function() {

	$('.clear-localstorage').click(function() {

		localStorage.clear()
		_.toast("localstorage vidé !")
		setTimeout(function() {
			_.reload()
		}, 800)
	})
}

LW.pages.settings.mails = function(mails) {

	var updateCategory = function(category) {

		var categoryDiv = $('#notifications').find('.category[category=' + category + ']')

		var count = 0
		var inputs = categoryDiv.find('input').each(function() {
			count += $(this).is(':checked') ? 1 : 0
		})

		if (count == 0) {
			categoryDiv.addClass('off')
			categoryDiv.prev().prev().prop('checked', false)
		} else {
			categoryDiv.removeClass('off')
			categoryDiv.prev().prev().prop('checked', true)
		}
	}

	$('#notifications .category').each(function() {
		updateCategory($(this).attr('category'))
	})

	$('#settings-page #notifications [type="checkbox"]').change(function() {

		var checked = $(this).is(':checked')

		updateCategory($(this).attr('category'))

		_.post('settings/update-setting', {setting: $(this).attr('setting'), value: '' + checked}, function(data) {
			_.log(data)
		})
	})
}
