'use strict';

self.addEventListener("install", function(event) {
	var pathToJson = new URL(location).searchParams.get('v')
	event.waitUntil(
		caches.open(pathToJson + 'fundamentals')
		.then(function(cache) {
			return cache.addAll([
				'/static/leekwars.min.js',
				'/static/leekwars.min.css'
			]);
		})
		.then(function() {
			self.skipWaiting()
		})
	)
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('push', event => {

	console.log("Push event", event)

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
	);
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click', event.notification);
    event.notification.close();
	var url = 'https://leekwars.com';
	if (event.notification.data) {
		url = event.notification.data.url
	}
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
