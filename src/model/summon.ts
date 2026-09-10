class SummonTemplate {
	public id!: number
	public name!: string
	public characteristics!: Record<string, number>
	public chips!: number[]
}

// v2.50 — les plantes (Maïs, Piment, Prototaxite) ont leur propre dossier `image/plant/` et un
// seul visuel : enracinées, elles ne se retournent jamais, donc pas de `_back`. Le fichier du
// Prototaxite est au SINGULIER comme sa constante (CHIP_PROTOTAXITE), alors que son template
// d'invocation, lui, est au pluriel. Source unique du chemin : la fiche du marché, le HUD, le
// panneau d'entité et le rendu du combat passent tous par ici.
const PLANT_IMAGES: {[name: string]: string} = {
	corn: 'corn',
	chilli_pepper: 'chilli_pepper',
	prototaxites: 'prototaxite',
}

/** Chemin de l'image d'une invocation, SANS `/` initial (le rendu du combat le veut relatif). */
function summonImage(name: string, back = false): string {
	const plant = PLANT_IMAGES[name]
	if (plant) { return 'image/plant/' + plant + '_front.png' }
	return 'image/bulb/' + name + (back ? '_back' : '_front') + '.png'
}

export { SummonTemplate, summonImage }
