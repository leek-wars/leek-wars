import { LeekWars } from '@/model/leekwars'
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
	console.log("Register service worker...")
	register(`${process.env.BASE_URL}service-worker.js`, {
		registered(registration) {
			console.log('Registered!')
			console.log("Registration", registration)
			LeekWars.service_worker = registration
		},
		ready(registration) {
			console.log('App is being served from cache by a service worker. For more details, visit https://goo.gl/AFskqB')
			console.log("Registration", registration)
			LeekWars.service_worker = registration
		},
		cached(registration) {
			console.log('Content has been cached for offline use.')
			console.log("Registration", registration)
			LeekWars.service_worker = registration
		},
		updated() {
			console.log('New content is available; please refresh.')
		},
		offline() {
			console.log('No internet connection found. App is running in offline mode.')
		},
		error(error) {
			console.error('Error during service worker registration:', error)
		},
	})
}