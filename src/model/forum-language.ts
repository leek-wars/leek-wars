import { reactive } from 'vue'
import { i18n } from '@/model/i18n'

// Les intitulés des catégories suivent la langue DU FORUM consulté, pas celle de
// l'éleveur : avec le drapeau anglais sélectionné, les titres restaient en français
// et on postait dans la mauvaise section sans s'en rendre compte.
//
// Le dictionnaire d'une autre langue n'est pas dans le bundle de la locale active :
// on le charge à la demande (une vingtaine de clés) et on le verse dans vue-i18n sous
// sa propre locale — les valeurs sont des fonctions de message pré-compilées par le
// plugin Vite (cf. i18nJsonPlugin), pas des chaînes : c'est vue-i18n qui les rend.
// La query `?forum-lang` (absente des clés du glob) n'a qu'un rôle : donner un id de
// module distinct de celui qu'importe `src/lang/locale/<lang>.ts`. Sans elle, Rollup voit
// le même module dans le graphe statique et dans ce glob, l'extrait dans un chunk partagé,
// et le bundle de langue chargé par index.html tire une requête de plus au démarrage.
const dictionaries = import.meta.glob('/src/lang/*/forum-category.json', { query: '?forum-lang' }) as Record<string, () => Promise<{ default: Record<string, unknown> }>>

// Sert aussi de signal réactif : l'affichage se corrige tout seul quand le dico arrive.
const loaded = reactive<{ [lang: string]: boolean }>({})
const pending: { [lang: string]: Promise<void> } = {}

function loadForumCategoryNames(lang: string | null | undefined): Promise<void> {
	if (!lang || loaded[lang]) { return Promise.resolve() }
	if (lang in pending) { return pending[lang] }
	const loader = dictionaries[`/src/lang/${lang}/forum-category.json`]
	if (!loader) { return Promise.resolve() }
	pending[lang] = loader().then(module => {
		i18n.global.mergeLocaleMessage(lang, { 'forum-category': module.default })
		loaded[lang] = true
	}).catch(() => { /* on retombe sur la langue de l'éleveur */ })
	return pending[lang]
}

// Langue à afficher pour une rangée qui couvre plusieurs langues (catégories de même
// nom regroupées quand plusieurs drapeaux sont cochés) : celle de l'éleveur si
// son forum fait partie du lot, sinon la première du lot — jamais une langue dont le
// forum n'existe pas, ce que donnait la langue de l'éleveur toute seule.
function forumDisplayLanguage(languages: (string | null | undefined)[]): string | null {
	const langs = [...new Set(languages.filter(l => l))] as string[]
	if (!langs.length) { return null }
	return langs.includes(i18n.locale) ? i18n.locale : langs[0]
}

// `key` est le nom brut de la catégorie (`bug_reports`) ou sa description
// (`bug_reports_desc`). Retombe sur la langue de l'éleveur si la langue du forum est
// inconnue (catégorie d'équipe, plusieurs langues affichées) ou pas encore chargée.
function forumCategoryName(key: string | null | undefined, lang?: string | null): string {
	if (!key) { return '' }
	const path = 'forum-category.' + key
	if (lang && lang !== i18n.locale) {
		loadForumCategoryNames(lang)
		// Même cast que dans i18n.ts : `t` est typé en union (legacy / composition) et
		// la surcharge à trois arguments n'est pas exposée.
		if (loaded[lang] && (i18n.global.te as (key: string, locale: string) => boolean)(path, lang)) {
			return String((i18n.global.t as (...a: unknown[]) => unknown)(path, {}, { locale: lang }))
		}
	}
	return i18n.t(path)
}

export { forumCategoryName, forumDisplayLanguage, loadForumCategoryNames }
