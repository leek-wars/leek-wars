import { LeekWars } from '@/model/leekwars'
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
	register(`${process.env.BASE_URL}service-worker.js`, {
		registered(registration) {
			LeekWars.service_worker = registration
		},
		ready(registration) {
			LeekWars.service_worker = registration
		},
		cached(registration) {
			LeekWars.service_worker = registration
		},
		updated() {
			// updated
		},
		offline() {
			// offline
		},
		error(error) {
			console.error("Service worker error", error)
		},
	})
}