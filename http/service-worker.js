'use strict';

self.addEventListener('push', event => {

	console.log(event)
	var icon = null
	var title = "Notification de Leek Wars"
	var message = "Cliquer pour voir la notification"

	if (event.data) {
		var data = event.data.json()
		console.log(data)
		icon = data.image
		title = data.title
		message = data.message
	}

	event.waitUntil(
		self.registration.showNotification(title, {
			body: message,
			icon: icon,
			tag: 'request'
		})
	);
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click: tag ', event.notification.tag);
    event.notification.close();
    var url = 'https://leekwars.com';
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
