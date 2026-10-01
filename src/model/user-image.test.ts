import { describe, it, expect } from 'vitest'
import { containsUserImage, isBannedImageUrl, isUserImageUrl, userImageHashes, userImageScanner, userImageTag } from '@/model/user-image'

// Ces tests décrivent le CONTRAT partagé par toutes les surfaces qui afficheront des
// images uploadées (chat aujourd'hui, forum et encyclopédie ensuite).

const hash = 'ab'.repeat(32)
const url = '/user-image/ab/ab/' + hash + '.webp'

describe('isUserImageUrl', () => {
	it('accepte la forme canonique', () => {
		expect(isUserImageUrl(url)).toBe(true)
	})

	it('exige que le chemin dérive du hash', () => {
		// Sans cette règle, la même image serait atteignable par une infinité d'URLs,
		// toutes mises en cache un an chez chaque lecteur.
		expect(isUserImageUrl('/user-image/00/00/' + hash + '.webp')).toBe(false)
		expect(isUserImageUrl('/user-image/ab/00/' + hash + '.webp')).toBe(false)
	})

	it('refuse tout ce qui sort de la forme canonique', () => {
		const refusees = [
			'/user-image/ab/ab/' + hash + '.png',
			'/user-image/ab/ab/' + hash.toUpperCase() + '.webp',
			'/user-image/ab/ab/' + hash.substring(0, 63) + '.webp',
			'/user-image/ab/' + hash + '.webp',
			'/user-image/ab/ab/../../etc/passwd.webp',
			'https://evil.tld/user-image/ab/ab/' + hash + '.webp',
			'/image/' + hash + '.webp',
		]
		for (const u of refusees) { expect(isUserImageUrl(u), u).toBe(false) }
	})
})

describe('userImageTag', () => {
	it('la classe CSS appartient à la surface appelante', () => {
		// Le chat et le forum n'ont pas les mêmes contraintes de taille : la balise est
		// commune, son habillage ne l'est pas.
		expect(userImageTag(url, 'chat-image')).toContain('class="chat-image"')
		expect(userImageTag(url, 'forum-image')).toContain('class="forum-image"')
	})

	it('une URL non canonique reste du texte', () => {
		const bad = '/user-image/00/00/' + hash + '.webp'
		expect(userImageTag(bad, 'chat-image')).toBe(bad)
	})
})

describe('userImageScanner', () => {
	it('rend un scanner neuf à chaque appel', () => {
		// Une regex globale porte un `lastIndex` mutable : une instance partagée entre
		// deux messages sauterait le début du second.
		const a = userImageScanner()
		a.exec('x ' + url)
		expect(a.lastIndex).toBeGreaterThan(0)
		expect(userImageScanner().lastIndex).toBe(0)
	})

	it('trouve les images au milieu d\'un texte', () => {
		const texte = 'regarde ' + url + ' et ' + url + ' !'
		expect(texte.match(userImageScanner())).toHaveLength(2)
	})
})

describe('marqueur de bannissement', () => {
	const hash = 'ab'.repeat(32)
	const marqueur = '/user-image/banned/' + hash + '.webp'

	it('est reconnu, et n\'est jamais une image affichable', () => {
		expect(isBannedImageUrl(marqueur)).toBe(true)
		expect(isUserImageUrl(marqueur)).toBe(false)
		expect(isBannedImageUrl('/user-image/ab/ab/' + hash + '.webp')).toBe(false)
	})

	it('ne se confond pas avec une contrefaçon approchante', () => {
		expect(isBannedImageUrl('/user-image/banned/pas-un-hash.webp')).toBe(false)
		expect(isBannedImageUrl('/user-image/banned/' + hash + '.png')).toBe(false)
		expect(isBannedImageUrl('/user-image/banned/' + hash.toUpperCase() + '.webp')).toBe(false)
	})

	it('est masqué par le scanner comme une image, pour ne pas finir en lien', () => {
		// Le scanner sert au formatage, qui doit soustraire les deux formes à linkify.
		const texte = 'avant ' + marqueur + ' et /user-image/ab/ab/' + hash + '.webp fin'
		expect(texte.match(userImageScanner())).toHaveLength(2)
	})

	it('ne compte pas parmi les images d\'un texte', () => {
		// Sinon la boîte de censure proposerait de bannir une image déjà bannie.
		expect(containsUserImage('texte ' + marqueur)).toBe(false)
		expect(userImageHashes('texte ' + marqueur)).toEqual([])
	})
})
