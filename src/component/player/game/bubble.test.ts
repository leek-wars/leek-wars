import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))

import { Bubble } from '@/component/player/game/bubble'
import type { Game } from '@/component/player/game/game'

const PHRASE = "Vous entendez ce bruit ? C'est le déclic de mon réveil calqué sur vos promenades. - Alors on est deu"
const HAUTEUR = 144 // Hauteur passée par drawBubble : poireau + 30

// Police à chasse fixe : 6 par caractère latin, 13 par idéogramme
function largeur(text: string) {
	return Array.from(text).reduce((w, c) => w + (c.codePointAt(0)! >= 0x2e80 ? 13 : 6), 0)
}

// Contexte qui relève, en coordonnées du canvas, les points du contour de la bulle
// et les lignes de texte, pour un poireau posé en (x, y) d'un canvas de 1000 × 600
function contexte(x: number, y: number) {
	let tx = 0
	let ty = 0
	const points: [number, number][] = []
	const textes: { text: string, x: number, y: number }[] = []
	const point = (px: number, py: number) => { points.push([x + tx + px, y + ty + py]) }
	const ctx = {
		canvas: { width: 1000, height: 600 },
		measureText: (text: string) => ({ width: largeur(text) }),
		getTransform: () => ({ a: 1, d: 1, e: x, f: y }),
		save() {},
		restore() {},
		translate(dx: number, dy: number) { tx += dx; ty += dy },
		beginPath() {},
		closePath() {},
		fill() {},
		stroke() {},
		moveTo: point,
		lineTo: point,
		quadraticCurveTo(_cx: number, _cy: number, px: number, py: number) { point(px, py) },
		fillText(text: string, px: number, py: number) { textes.push({ text, x: x + tx + px, y: y + ty + py }) },
		drawImage() {},
	}
	return { ctx: ctx as unknown as CanvasRenderingContext2D, points, textes }
}

function bulle(message: string, visibleLeft = 0) {
	const bubble = new Bubble({ ground: { visibleLeft } } as unknown as Game)
	bubble.setMessage(contexte(0, 0).ctx, message)
	bubble.show(10)
	return bubble
}

function dessin(bubble: Bubble, x: number, y: number, bottom = false) {
	const { ctx, points, textes } = contexte(x, y)
	bubble.draw(ctx, HAUTEUR, bottom)
	const xs = points.map((p) => p[0])
	const ys = points.map((p) => p[1])
	const haut = Math.min(...ys)
	const bas = Math.max(...ys)
	// La pointe de la flèche est le point de la bulle le plus proche du poireau
	const pointe = points[ys.indexOf(haut > y ? haut : bas)]
	return { points, textes, pointe, gauche: Math.min(...xs), droite: Math.max(...xs), haut, bas }
}

describe('Bubble, découpe des say()', () => {

	it('une phrase courte tient sur une ligne, dans la bulle d\'avant', () => {
		const bubble = bulle('Bonjour !')
		expect(bubble.lines).toEqual(['Bonjour !'])
		expect(bubble.rx).toBe(largeur('Bonjour !') / 2 + 11)
		expect(bubble.ry).toBe(16)
	})

	it('un say() de 100 caractères passe sur des lignes égales, sans rien perdre', () => {
		const bubble = bulle(PHRASE)
		expect(bubble.lines.length).toBe(3)
		expect(bubble.lines.join(' ')).toBe(PHRASE)
		const largeurs = bubble.lines.map(largeur)
		expect(Math.max(...largeurs)).toBeLessThanOrEqual(250)
		// Pas de dernière ligne orpheline : l'écart tient dans un mot
		expect(Math.max(...largeurs) - Math.min(...largeurs)).toBeLessThan(largeur(' promenades.'))
		expect(bubble.ry).toBe(16 + 17)
	})

	it('un texte sans espaces se coupe entre les caractères', () => {
		const message = '我是一根非常厉害的韭菜今天我要打败所有的对手然后成为全服第一名的战士大家小心我的武器和芯片'
		const bubble = bulle(message)
		expect(bubble.lines.length).toBe(3)
		expect(bubble.lines.join('')).toBe(message)
		expect(Math.max(...bubble.lines.map(largeur))).toBeLessThanOrEqual(250)
	})

	it('un lien trop long se coupe aussi, les mots d\'avant restent entiers', () => {
		const lien = 'https://leekwars.com/encyclopedia/fr/Fonctions_de_combat_avancées_et_leurs_usages'
		const bubble = bulle('Regardez ' + lien)
		expect(bubble.lines[0].startsWith('Regardez h')).toBe(true)
		expect(bubble.lines.join('')).toBe('Regardez ' + lien)
	})

	it('retours à la ligne et tabulations comptent comme des espaces', () => {
		expect(bulle('un\ndeux\ttrois').lines).toEqual(['un deux trois'])
	})

	it('un message vide garde une bulle d\'une ligne', () => {
		const bubble = bulle('')
		expect(bubble.lines).toEqual([''])
		expect(bubble.ry).toBe(16)
	})
})

describe('Bubble, placement', () => {

	it('les lignes en plus poussent la bulle vers le haut, la flèche ne bouge pas', () => {
		const walter = bulle(PHRASE)
		const une = dessin(bulle('Bonjour !'), 500, 400)
		const trois = dessin(walter, 500, 400)
		expect(trois.pointe).toEqual(une.pointe)
		expect(trois.haut).toBe(une.haut - 2 * 17)
		expect(trois.textes.map((t) => t.text)).toEqual(walter.lines)
		// La ligne du milieu est au centre de la bulle
		expect(trois.textes[1].y).toBe((trois.haut + trois.bas - 10) / 2 + 1)
	})

	it('sous le poireau, la bulle grandit vers le bas', () => {
		const une = dessin(bulle('Bonjour !'), 500, 100, true)
		const trois = dessin(bulle(PHRASE), 500, 100, true)
		expect(trois.pointe).toEqual(une.pointe)
		expect(trois.bas).toBe(une.bas + 2 * 17)
	})

	it('au bord du canvas, la bulle reste dedans et sa flèche vise le poireau', () => {
		const gauche = dessin(bulle(PHRASE), 20, 400)
		expect(gauche.gauche).toBeGreaterThanOrEqual(0)
		expect(gauche.pointe[0]).toBe(20)
		const droite = dessin(bulle(PHRASE), 975, 400)
		expect(droite.droite).toBeLessThanOrEqual(1000)
		expect(droite.pointe[0]).toBe(975)
		// Au milieu, rien ne bouge
		expect(dessin(bulle(PHRASE), 500, 400).pointe[0]).toBe(500)
	})

	it('collée au bord, la flèche s\'arrête avant l\'arrondi du coin', () => {
		const bord = dessin(bulle(PHRASE), 0, 400)
		expect(bord.gauche).toBeGreaterThanOrEqual(0)
		expect(bord.pointe[0]).toBe(bord.gauche + 10 + 5)
	})

	it('le journal large recouvre la gauche du canvas : la bulle reste à sa droite', () => {
		const bord = dessin(bulle(PHRASE, 300), 320, 400)
		expect(bord.gauche).toBeGreaterThanOrEqual(300)
		expect(bord.pointe[0]).toBe(320)
	})

	it('une bulle qui sortirait par le haut passe sous le poireau', () => {
		// Une ligne tient au-dessus...
		expect(dessin(bulle('Bonjour !'), 500, 180).bas).toBeLessThan(180)
		// ...trois lignes non : la bulle est dessinée comme sous un poireau du haut de la carte
		const trois = dessin(bulle(PHRASE), 500, 180)
		expect(trois.points).toEqual(dessin(bulle(PHRASE), 500, 180, true).points)
		expect(trois.haut).toBeGreaterThan(180)
	})

	it('une bulle éteinte ne dessine rien', () => {
		const bubble = bulle(PHRASE)
		bubble.life = 0
		const { points, textes } = dessin(bubble, 500, 400)
		expect(points).toEqual([])
		expect(textes).toEqual([])
	})
})
