self.addEventListener('push', event => {

	var icon = null
	var title = "Notification de Leek Wars"
	var message = "Cliquer pour voir la notification"
	var data = null

	if (event.data) {
		var data = event.data.json()
		icon = data.image
		title = data.title
		message = data.message
		data = data
	}

	event.waitUntil(
		self.registration.showNotification(title, {
			body: message,
			icon: icon,
			tag: 'request',
			data: data
		})
	)
})

self.addEventListener('notificationclick', function(event) {
    event.notification.close()
	var url = 'https://leekwars.com'
	if (event.notification.data) {
		url = event.notification.data.url
	}
	event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i]
                if (client.url === url && 'focus' in client) {
                    return client.focus()
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url)
            }
        })
    )
})
