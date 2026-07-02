import { createI18n } from 'vue-i18n'

// Instance vue-i18n minimale pour les tests de composants, calquée sur la config réelle de
// l'app (src/model/i18n.ts) : mode composition, globalInjection, escapeParameter, PAS de
// fallbackLocale (une clé absente rend la clé brute — comportement prod exploitable dans les
// assertions). Le build complet de vue-i18n compile les messages string au runtime : on peut
// donc passer des messages bruts sans la machinerie de locales pré-compilées.
//
// La vraie app merge les messages de chaque composant sous un NAMESPACE = nom normalisé du
// composant ({ [nom]: {...} }). Pour tester une clé lue via useNamespacedT('bank') ou le $t
// namespacé, seeder sous ce namespace ({ bank: { pay: '...' } }). Les <i18n-t keypath="fight.x">
// et $t('fight.x') pleinement qualifiés se résolvent directement dans le scope global.
export function createTestI18n(messages: Record<string, unknown> = {}, locale = 'en') {
	return createI18n({
		legacy: false,
		globalInjection: true,
		locale,
		// as any : idem src/model/i18n.ts — un arbre de messages arbitraire (valeurs unknown)
		// ne satisfait pas le type LocaleMessage de vue-i18n, mais est compilé au runtime.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		messages: { [locale]: messages } as any,
		escapeParameter: true,
		missingWarn: false,
		fallbackWarn: false,
		warnHtmlMessage: false,
	})
}
