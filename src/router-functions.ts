import { Route } from "vue-router"
import { LeekWars } from "./model/leekwars"

function scroll_to_hash(hash: string, route: Route) {
	const id = decodeURIComponent(hash).replace(/'/g, '~').substring(1)
	const element = document.getElementById(id)
	// console.log("scroll element", id, element, route)
	if (element) {
		const offset = (LeekWars.mobile ? 56 : 0) + route.meta?.scrollOffset || 0
		setTimeout(() => {
			window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - offset)
		})
	}
}

export { scroll_to_hash }