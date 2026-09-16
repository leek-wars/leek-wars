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
		themes: {
			dark: {
				colors: {
					primary: '#5fad1b',
				},
			},
			light: {
				colors: {
					primary: '#5fad1b',

				},
			},
		},
	},
	defaults: {
		VSwitch: {
			color: 'primary',
		},
		VRadio: {
			color: 'primary',
		},
		VRadioGroup: {
			color: 'primary',
		},
		VCheckbox: {
			color: 'primary',
		},
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
