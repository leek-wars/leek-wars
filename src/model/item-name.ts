import { ItemTemplate, ItemType, itemTranslationKey } from './item'
import { LeekWars } from './leekwars'

/**
 * Nom d'un item dans la langue du joueur. Un schéma porte le nom de ce qu'il fabrique
 * (« Schéma : Fraise ») ; chaîne vide si ce résultat est absent des données de jeu.
 *
 * Hors de item.ts, que leekwars.ts importe : lire LeekWars.schemes depuis item.ts
 * ferait un import circulaire.
 */
export function itemDisplayName(item: ItemTemplate, t: (key: string, ...args: unknown[]) => string): string {
	if (item.type === ItemType.SCHEME) {
		const scheme = LeekWars.schemes[item.params]
		const result = scheme ? LeekWars.items[scheme.result] : null
		return result ? t('main.scheme_x', [t(itemTranslationKey(result))]) : ''
	}
	return t(itemTranslationKey(item))
}
