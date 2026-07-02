import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TurretImage from '@/component/turret-image.vue'

// turret-image empile des <image> SVG selon TURRET_DATA[floor(level/10)] et calcule
// largeur/hauteur/offset par arithmétique cumulée. On assère sur la structure rendue :
// nombre de pièces (= palier de niveau), skin (_blue/_red) et largeur (max des pièces, entière).
describe('turret-image.vue', () => {
	it('empile les pièces du palier de niveau 0 avec le skin bleu', () => {
		const w = mount(TurretImage, { props: { level: 0, skin: 1, scale: 2 } })
		const images = w.findAll('image')
		expect(images).toHaveLength(2) // palier 0 = [pyramid_up, core]
		const html = w.html()
		expect(html).toContain('/image/turret/pyramid_up_blue.png')
		expect(html).toContain('/image/turret/core_blue.png')
		// width = max des largeurs de pièces (pyramid_up=222, core=212) = 222 ; attr = width*scale
		expect(w.find('svg').attributes('width')).toBe('444')
		expect(w.find('svg').attributes('viewBox')).toMatch(/^0 0 222 /)
	})

	it('utilise le skin rouge pour skin !== 1', () => {
		const w = mount(TurretImage, { props: { level: 0, skin: 2, scale: 1 } })
		expect(w.html()).toContain('/image/turret/pyramid_up_red.png')
		expect(w.html()).not.toContain('_blue')
	})

	it('le palier dépend de floor(level/10)', () => {
		// niveau 15 → palier 1 = 3 pièces ; niveau 100 → dernier palier (10) = 7 pièces
		expect(mount(TurretImage, { props: { level: 15, skin: 1, scale: 1 } }).findAll('image')).toHaveLength(3)
		expect(mount(TurretImage, { props: { level: 100, skin: 1, scale: 1 } }).findAll('image')).toHaveLength(7)
	})
})
