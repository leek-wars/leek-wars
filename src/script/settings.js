var vapid_key = new Uint8Array([4, 92, 237, 40, 114, 162, 99, 215, 179, 242, 70, 151, 236, 60, 216, 10, 167, 186, 77, 27, 233, 193, 117, 111, 78, 20, 121, 201, 142, 186, 91, 13, 111, 26, 241, 126, 12, 216, 94, 160, 38, 110, 214, 161, 249, 147, 233, 133, 128, 210, 170, 161, 158, 57, 24, 54, 194, 103, 195, 94, 49, 182, 20, 62, 184])

LW.pages.settings.init = function(params, $scope, $page) {

	_.get('settings/get-settings/' + LW.token(), function(data) {

		var mails = {
			fight: ['solo', 'farmer', /* 'team',*/ 'solo_challenge', 'farmer_challenge'],
			tournament: ['solo_round_finished', 'farmer_round_finished'],
			forum: ['response'],
			changelog: ['changelog'],
			private_message: ['private_message']
		}
		$scope.mobile = _.is_mobile()
		$scope.languages = _.lang.languages
		$scope.sfw_switch = {
			id: 'sfw-switch',
			checked: localStorage['sfw'] == 'true'
		}
		$scope.notifs_results_switch = {
			id: 'notifs-results-switch',
			checked: localStorage['options/notifs-results'] == 'true'
		}
		$scope.chat_first_switch = {
			id: 'chat-first-switch',
			checked: localStorage['options/chat-first'] == 'true'
		}
		$scope.mails = mails
		$scope.settings = data.settings
		$page.render()

		LW.setTitle(_.lang.get('settings', 'title'), LW.farmer.name)

		LW.pages.settings.logout()
		LW.pages.settings.language()
		LW.pages.settings.sfw()
		LW.pages.settings.notifs_results()
		LW.pages.settings.chat_first()
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
			localStorage['sfw'] = true
			LW.sfw.on()
		} else {
			localStorage['sfw'] = false
			LW.sfw.off()
		}
	})
}

LW.pages.settings.notifs_results = function() {
	$('#notifs-results-button').click(function() {
		var enabled = !$('#notifs-results-switch').is(':checked')
		$('#notifs-results-switch').prop('checked', enabled)
		if (enabled) {
			localStorage['options/notifs-results'] = true
			$('body').addClass('notifs-results')
		} else {
			localStorage['options/notifs-results'] = false
			$('body').removeClass('notifs-results')
		}
	})
}

LW.pages.settings.chat_first = function() {
	$('#chat-first-button').click(function() {
		var enabled = !$('#chat-first-switch').is(':checked')
		$('#chat-first-switch').prop('checked', enabled)
		if (enabled) {
			localStorage['options/chat-first'] = true
		} else {
			localStorage['options/chat-first'] = false
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
					LW.disconnect()
					deleteSuccessPopup.dismiss()
					LW.page('/')
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

		_.post('settings/update-setting', {setting: $(this).attr('setting'), value: '' + checked}, function(data) {})
	})
}
