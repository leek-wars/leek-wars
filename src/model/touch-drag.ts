// Glisser-déposer au doigt.
//
// Les événements HTML5 (dragstart/dragover/drop) n'existent pas au tactile : un
// `draggable="true"` y est complètement inerte, et un appui long sur l'élément
// ouvre le menu natif du navigateur (« Enregistrer l'image ») au lieu de
// l'attraper. On rejoue donc le geste à la main sur les événements tactiles :
//
//  - appui long (LONG_PRESS) avant d'attraper l'élément : en dessous de ce
//    délai le doigt sert à faire défiler la page, comme partout ailleurs ;
//  - un mouvement pendant ce délai annule tout : c'est un défilement, pas un
//    glisser. `start` et `end` ne sont alors jamais appelés, le geste suit son
//    cours normal (tap, scroll) ;
//  - une fois l'élément attrapé, un fantôme suit le doigt, le défilement est
//    bloqué, et la page défile toute seule quand le doigt approche d'un bord ;
//  - la zone de dépôt est celle qui se trouve sous le doigt au relâchement.

const LONG_PRESS = 250 // ms d'appui avant d'attraper l'élément
const TOLERANCE = 10 // px de mouvement tolérés pendant l'appui
const EDGE = 70 // px de marge, en haut et en bas, où la page défile toute seule
const EDGE_SPEED = 15 // px par frame au maximum, à ras du bord

// Classe posée sur la zone de dépôt survolée par le doigt, à styler par l'appelant.
export const DROP_HOVER = 'drop-hover'

export interface TouchDragOptions {
	/** Sélecteur CSS des zones de dépôt. */
	drop: string
	/** Zone de dépôt acceptée ou non (surlignage et dépôt) ; toutes acceptées par défaut. */
	accept?: (zone: HTMLElement) => boolean
	/** L'appui long est validé : le glisser commence. */
	start: () => void
	/** Le glisser se termine, sur une zone de dépôt ou dans le vide (null). */
	end: (zone: HTMLElement | null) => void
}

// Après un glisser, le navigateur peut encore envoyer le clic simulé du geste :
// il ne doit pas déclencher le @click de l'élément déplacé (une navigation, le
// plus souvent). On avale donc le premier clic qui suit, s'il arrive.
function swallowClick(e: MouseEvent) {
	e.stopPropagation()
	e.preventDefault()
	document.removeEventListener('click', swallowClick, true)
}

/**
 * À brancher sur le `touchstart` de l'élément à déplacer, en complément du
 * glisser-déposer HTML5 qui reste utilisé à la souris.
 */
export function startTouchDrag(event: TouchEvent, options: TouchDragOptions) {
	if (event.touches.length !== 1) return // deux doigts : zoom, pas un glisser
	const element = event.currentTarget as HTMLElement
	const finger = event.touches[0].identifier
	const startX = event.touches[0].clientX
	const startY = event.touches[0].clientY
	let x = startX
	let y = startY
	let offsetX = 0
	let offsetY = 0
	let ghost: HTMLElement | null = null
	let zone: HTMLElement | null = null
	let scroll = 0

	const press = window.setTimeout(grab, LONG_PRESS)
	document.addEventListener('touchmove', move, { passive: false })
	document.addEventListener('touchend', release)
	document.addEventListener('touchcancel', release)
	// Android ouvre son menu contextuel sur l'appui long (iOS son menu d'image,
	// désamorcé en CSS par -webkit-touch-callout) : il ne doit pas s'interposer.
	document.addEventListener('contextmenu', preventDefault)
	// Certains tactiles (iPad) déclenchent le vrai glisser-déposer HTML5 sur
	// l'appui long : il fait déjà le travail, on s'efface sans rien déposer.
	document.addEventListener('dragstart', stop)

	function grab() {
		const box = element.getBoundingClientRect()
		// Décalage entre le doigt et le coin de l'élément, pour que le fantôme
		// ne saute pas au moment où on l'attrape.
		offsetX = startX - box.left
		offsetY = startY - box.top
		ghost = element.cloneNode(true) as HTMLElement
		ghost.style.position = 'fixed'
		ghost.style.left = '0'
		ghost.style.top = '0'
		ghost.style.width = box.width + 'px'
		ghost.style.height = box.height + 'px'
		ghost.style.margin = '0'
		ghost.style.opacity = '0.9'
		ghost.style.zIndex = '1000'
		ghost.style.transition = 'none'
		// Sans ça le fantôme masque la zone de dépôt sous le doigt.
		ghost.style.pointerEvents = 'none'
		document.body.appendChild(ghost)
		update()
		if (navigator.vibrate) navigator.vibrate(15) // l'élément est attrapé
		options.start()
		scroll = requestAnimationFrame(edgeScroll)
	}

	function move(e: TouchEvent) {
		const touch = Array.from(e.touches).find(t => t.identifier === finger)
		if (!touch) return
		x = touch.clientX
		y = touch.clientY
		if (!ghost) {
			// Pas encore attrapé : un vrai mouvement = un défilement de la page.
			if (Math.abs(x - startX) > TOLERANCE || Math.abs(y - startY) > TOLERANCE) stop()
			return
		}
		e.preventDefault() // la page ne défile pas pendant le glisser
		update()
	}

	function update() {
		ghost!.style.transform = 'translate(' + (x - offsetX) + 'px, ' + (y - offsetY) + 'px)'
		const under = document.elementFromPoint(x, y)
		const target = under ? under.closest<HTMLElement>(options.drop) : null
		const accepted = target && (!options.accept || options.accept(target)) ? target : null
		if (accepted !== zone) {
			if (zone) zone.classList.remove(DROP_HOVER)
			zone = accepted
			if (zone) zone.classList.add(DROP_HOVER)
		}
	}

	// La cible visée est souvent hors de l'écran (compositions empilées sur
	// mobile) : la page défile toute seule quand le doigt approche d'un bord.
	function edgeScroll() {
		scroll = requestAnimationFrame(edgeScroll)
		const bottom = window.innerHeight - EDGE
		const delta = y < EDGE ? y - EDGE : (y > bottom ? y - bottom : 0)
		if (delta) {
			window.scrollBy(0, delta / EDGE * EDGE_SPEED)
			update() // le doigt n'a pas bougé, mais la zone en dessous, si
		}
	}

	function release(e: TouchEvent) {
		if (!Array.from(e.changedTouches).some(t => t.identifier === finger)) return
		const dropped = e.type === 'touchend' ? zone : null
		const dragged = ghost !== null
		stop()
		if (!dragged) return
		e.preventDefault() // pas de clic de navigation après un glisser
		document.addEventListener('click', swallowClick, true)
		window.setTimeout(() => document.removeEventListener('click', swallowClick, true), 300)
		options.end(dropped)
	}

	function stop() {
		clearTimeout(press)
		cancelAnimationFrame(scroll)
		document.removeEventListener('touchmove', move)
		document.removeEventListener('touchend', release)
		document.removeEventListener('touchcancel', release)
		document.removeEventListener('contextmenu', preventDefault)
		document.removeEventListener('dragstart', stop)
		if (zone) zone.classList.remove(DROP_HOVER)
		if (ghost) ghost.remove()
		ghost = null
	}

	function preventDefault(e: Event) {
		e.preventDefault()
	}
}
