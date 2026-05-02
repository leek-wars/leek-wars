// Service Worker for leekwars.com
// - Navigation requests: Network-First with NavigationPreload + cache fallback (offline)
// - Same-origin GET assets (non-/api/): Stale-while-revalidate with throttled background refresh
// - Push notifications + click handling

const CACHE_VERSION = 'v2';
const NAV_CACHE = 'nav-' + CACHE_VERSION;
const ASSET_CACHE = 'assets-' + CACHE_VERSION;
const ALL_CACHES = [NAV_CACHE, ASSET_CACHE];

// Throttle background SWR refreshes to avoid hammering the network when the user
// triggers many cache-eligible fetches in quick succession.
const BG_REFRESH_TTL = 30_000;
const lastRefreshed = new Map();

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
	event.waitUntil((async () => {
		// NavigationPreload: HTML fetch starts in parallel with SW boot.
		if (self.registration.navigationPreload) {
			await self.registration.navigationPreload.enable();
		}
		// Purge caches from previous SW versions to avoid unbounded storage growth.
		const keys = await caches.keys();
		await Promise.all(
			keys.filter(key => !ALL_CACHES.includes(key)).map(key => caches.delete(key))
		);
		await self.clients.claim();
	})());
});

self.addEventListener('fetch', event => {
	const req = event.request;

	if (req.method !== 'GET') return;

	const url = new URL(req.url);
	// Same-origin only: avoid CSP issues and the responsibility of cross-origin caching.
	if (url.origin !== self.location.origin) return;
	// API requests bypass: custom headers get stripped on cache replay, error responses get cached.
	if (url.pathname.startsWith('/api/')) return;
	// Devtools "only-if-cached" oddity for non-same-origin (defensive).
	if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;

	if (req.mode === 'navigate') {
		event.respondWith(handleNavigation(event));
		return;
	}
	event.respondWith(handleAsset(event));
});

async function handleNavigation(event) {
	const cache = await caches.open(NAV_CACHE);
	try {
		// Prefer the preloaded response (already in flight since SW boot).
		const preload = await event.preloadResponse;
		const response = preload || await fetch(event.request);
		if (response && response.ok) {
			event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}));
		}
		return response;
	} catch (e) {
		// Offline: serve last cached HTML if any.
		const cached = await cache.match(event.request);
		if (cached) return cached;
		return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
	}
}

async function handleAsset(event) {
	const cache = await caches.open(ASSET_CACHE);
	try {
		const cached = await cache.match(event.request);
		if (cached) {
			// Stale-while-revalidate, throttled per-URL.
			const url = event.request.url;
			const now = Date.now();
			if (now - (lastRefreshed.get(url) || 0) > BG_REFRESH_TTL) {
				lastRefreshed.set(url, now);
				event.waitUntil(refreshCache(cache, url).catch(() => {}));
			}
			return cached;
		}
		const response = await fetch(event.request);
		if (response && response.ok) {
			event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}));
		}
		return response;
	} catch (e) {
		return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
	}
}

async function refreshCache(cache, url) {
	const fresh = await fetch(new Request(url, { credentials: 'same-origin' }));
	if (fresh && fresh.ok) {
		await cache.put(url, fresh);
	}
}

// Inter-window communication used by the editor to detect duplicate tabs.
const broadcast = new BroadcastChannel('channel');
broadcast.onmessage = (event) => {
	if (event.data && event.data.type === 'editor-opened') {
		self.clients.matchAll({ type: 'window' }).then(clients => {
			const opened = clients.filter(c => c.url.includes('/editor/')).length >= 2;
			broadcast.postMessage({ opened });
		});
	}
};

self.addEventListener('push', event => {
	let icon = '/image/icon192.png';
	let title = 'Notification de Leek Wars';
	let message = 'Cliquer pour voir la notification';
	let data = null;
	if (event.data) {
		try {
			const payload = event.data.json();
			icon = payload.image || icon;
			title = payload.title || title;
			message = payload.message || message;
			data = payload;
		} catch (e) { /* malformed payload, fall back to defaults */ }
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

self.addEventListener('notificationclick', event => {
	event.notification.close();
	let url = self.location.origin;
	if (event.notification.data && event.notification.data.url) {
		url = event.notification.data.url;
	}
	event.waitUntil((async () => {
		const windowClients = await clients.matchAll({ type: 'window' });
		for (const client of windowClients) {
			if (client.url === url && 'focus' in client) return client.focus();
		}
		if (clients.openWindow) return clients.openWindow(url);
	})());
});
