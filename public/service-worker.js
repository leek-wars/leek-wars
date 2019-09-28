self.addEventListener('fetch', event => {
	// Let the browser do its default thing
	// for non-GET requests.
	if (event.request.method != 'GET') return;
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
		return;
	}
	// Prevent the default, and handle the request ourselves.
	event.respondWith(async function() {
		// Try to get the response from a cache.
		const cache = await caches.open('dynamic-v1');
		const cachedResponse = await cache.match(event.request);
		if (cachedResponse) {
			// If we found a match in the cache, return it, but also
			// update the entry in the cache in the background.
			event.waitUntil(cache.add(new Request(event.request.url, {credentials: 'same-origin'})));
			return cachedResponse;
		}
		// If we didn't find a match in the cache, use the network.
		return fetch(event.request);
	}())
})

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
