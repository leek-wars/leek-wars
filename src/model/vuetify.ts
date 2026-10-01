import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { da, de, en, es, fi, fr, id, it, ja, ko, nl, no, pl, pt, ru, sv, zhHans } from 'vuetify/locale'
import { aliases as mdiSvgAliases } from 'vuetify/iconsets/mdi-svg'
import { watch } from 'vue'
import { locale as initialLocale } from '@/locale'
import { i18n } from '@/model/i18n'
import { mdiIconSet } from './icon-set'

const cspNonce = (document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null)?.content || undefined

// Vuetify nomme le chinois 'zhHans'.
export const toVuetifyLocale = (lang: string) => lang === 'zh' ? 'zhHans' : lang

export const vuetify = createVuetify({
	locale: {
		locale: toVuetifyLocale(initialLocale),
		fallback: 'en',
		messages: { da, de, en, es, fi, fr, id, it, ja, ko, nl, no, pl, pt, ru, sv, zhHans },
	},
	icons: {
		defaultSet: 'mdi',
		aliases: mdiSvgAliases,
		sets: { mdi: mdiIconSet },
	},
	theme: {
		cspNonce,
		// Vuetify ne lit pas les variables CSS : sa palette doit être doublée ici,
		// et suivre la même bascule que le thème (cf. app.vue). D'où quatre thèmes
		// et non deux. Vuetify déduit tout seul la couleur du texte posé sur
		// `primary` selon sa luminosité, ce qui donne du texte sombre sur le vert
		// néon du v3 et du blanc sur le vert du v2.
		themes: {
			dark: {
				colors: {
					primary: '#7CFF6B',
				},
			},
			light: {
				colors: {
					// Le vert foncé (--primary-strong) et non le vert de marque :
					// Vuetify pose du texte blanc sur ses boutons primaires, et sur
					// #1F8A3B ça donne 4.41 de contraste, sous le seuil de 4.5.
					// Sur #146128 on passe à 7.4.
					primary: '#146128',
				},
			},
			'dark-v2': {
				dark: true,
				colors: {
					primary: '#5fad1b',
				},
			},
			'light-v2': {
				dark: false,
				colors: {
					primary: '#5fad1b',
				},
			},
		},
	},
	defaults: {
		VTooltip: {
			location: 'bottom',
		},
		VList: {
			density: 'compact'
		},
		VListItem: {
			density: 'compact',
		},
	},
})

// Garde la locale des composants Vuetify (footer v-data-table, etc.) synchronisée
// quand la langue change à chaud, sans rechargement de page.
watch(() => i18n.locale, (lang) => {
	vuetify.locale.current.value = toVuetifyLocale(lang)
})
