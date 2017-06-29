'use strict';

self.addEventListener("install", function(event) {
	var pathToJson = new URL(location).searchParams.get('v')
	event.waitUntil(
		caches.open(pathToJson + 'fundamentals')
		.then(function(cache) {
			return cache.addAll([
				'/static/libs.min.js',
				'/static/libs.min.css'
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
	if (event.request.method !== 'GET' || event.request.url.indexOf('leekwars.min.') == -1) {
		return
	}
    event.respondWith(
      caches
        .match(event.request)
        .then(function(cached) {
          var networked = fetch(event.request)
            .then(fetchedFromNetwork, unableToResolve)
            .catch(unableToResolve);

          return cached || networked;

          function fetchedFromNetwork(response) {
			/*
            var cacheCopy = response.clone();
            caches
              // We open a cache to store the response for this request.
              .open(version + 'pages')
              .then(function add(cache) {
                cache.put(event.request, cacheCopy);
              })
              .then(function() {
                //console.log('WORKER: fetch response stored in cache.', event.request.url);
              });
			*/
            // Return the response so that the promise is settled in fulfillment.
            return response;
          }

          function unableToResolve () {
            return new Response('<h1>Service Unavailable</h1>', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          }
        })
    );
});

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
	);
});

self.addEventListener('notificationclick', function(event) {
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
