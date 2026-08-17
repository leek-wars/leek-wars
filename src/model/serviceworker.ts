import { register } from 'register-service-worker'
import { logger } from '@/utils/logger'

// Only register service worker in production. Consumers read the active registration via
// navigator.serviceWorker.ready, so there is no need to stash it here.
if (import.meta.env.PROD) {
	register(`${import.meta.env.BASE_URL}service-worker.js`, {
		error(error) {
			logger.error("Service worker error", error)
		},
	})
}