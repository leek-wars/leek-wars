// Fenêtre de mesure, profondeur de l'historique tracé (60 fenêtres d'une
// demi-seconde = les 30 dernières secondes) et nombre de durées d'image gardées
// pour le centile.
const FPS_WINDOW = 500
const FPS_HISTORY = 60
const FRAME_HISTORY = 900

/**
 * Compteur d'images du lecteur de combat.
 *
 * On COMPTE les images d'une fenêtre de temps, on ne moyenne pas des
 * `1 / durée` image par image : la moyenne des inverses est flatteuse — une
 * image à 10 ms et une à 50 ms donnent 33 images par seconde en vrai, mais 60 en
 * moyennant — et c'est précisément quand ça saccade qu'on regarde le compteur.
 * Une demi-seconde de fenêtre : assez court pour voir un à-coup, assez long pour
 * que le nombre reste lisible.
 *
 * Le compteur ne doit pas coûter le temps qu'il mesure : par image, une
 * soustraction et une écriture dans un tampon circulaire. Tout le reste (le
 * centile, les extrema, la courbe) se calcule à la demande, donc seulement quand
 * quelqu'un regarde.
 */
class FrameMeter {

	/** Images par seconde de la dernière fenêtre close. */
	public fps = 0
	/** Une valeur par fenêtre écoulée, la plus récente en dernier. */
	public history: number[] = []
	/** Nombre de fenêtres que garde l'historique, pour qui veut tracer la courbe. */
	public readonly capacity = FPS_HISTORY
	/** Incrémenté à chaque fenêtre close : l'interface ne redessine que là. */
	public version = 0

	private frames = 0
	private since = 0
	private last = 0
	private count = 0
	// Durées des dernières images, en tampon circulaire, et le tampon de travail
	// du centile — gardé d'un appel à l'autre pour ne rien allouer en cours de jeu.
	private times = new Float64Array(FRAME_HISTORY)
	private scratch = new Float64Array(FRAME_HISTORY)

	/** À appeler une fois par image dessinée. */
	public frame(now: number) {
		const elapsed = now - this.last
		this.last = now
		// Démarrage, reprise après une pause, retour sur l'onglet : la fenêtre en
		// cours ne décrit plus rien. On la jette, et on laisse passer une fenêtre de
		// chauffe — celle du chargement des textures, à quelques images par seconde,
		// qui plomberait le minimum pendant trente secondes.
		if (elapsed > 4 * FPS_WINDOW) {
			this.since = now + FPS_WINDOW
			this.frames = 0
			return
		}
		if (now < this.since) { return }
		this.frames++
		this.times[this.count++ % FRAME_HISTORY] = elapsed
		const window = now - this.since
		if (window >= FPS_WINDOW) {
			this.fps = Math.round(1000 * this.frames / window)
			this.history.push(this.fps)
			if (this.history.length > FPS_HISTORY) { this.history.shift() }
			this.version++
			this.frames = 0
			this.since = now
		}
	}

	/**
	 * Durée sous laquelle tombent `ratio` images sur une, en millisecondes : la
	 * mesure des à-coups. La PIRE image ne vaut rien comme indicateur — une seule
	 * image lente au démarrage la fige pour toute la durée de l'historique — alors
	 * qu'un centile ne bouge que si les à-coups sont réguliers. Rend 0 tant qu'il
	 * n'y a pas cent images, en dessous desquelles un centile ne veut rien dire.
	 */
	public percentile(ratio: number): number {
		const count = Math.min(this.count, FRAME_HISTORY)
		if (count < 100) { return 0 }
		const sorted = this.scratch.subarray(0, count)
		sorted.set(this.times.subarray(0, count))
		sorted.sort()
		return Math.round(sorted[Math.floor(count * ratio)])
	}

	/** Plus aucune image n'est produite : laisser le dernier chiffre mentirait. */
	public idle() {
		this.fps = 0
	}

	/**
	 * Repart de zéro. Les mesures d'avant et d'après n'ont rien à voir — une
	 * moyenne qui mélange deux régimes ne décrit ni l'un ni l'autre.
	 */
	public reset() {
		this.fps = 0
		this.history = []
		this.count = 0
		this.frames = 0
		this.last = performance.now()
		this.since = this.last + FPS_WINDOW
		this.version++
	}
}

export { FrameMeter }
