import { i18n } from '@/model/i18n'

// Logique d'accord en genre et d'ordre des mots des titres de poireau/éleveur,
// partagée entre le rendu (title.vue) et l'éditeur (title-picker.vue) pour qu'ils
// ne divergent jamais.

// Langues où l'adjectif se place APRÈS le nom (langues romanes + indonésien) ;
// les autres placent l'adjectif avant le nom (en, de, ...).
export const NOUN_FIRST_LOCALES = new Set(['fr', 'it', 'es', 'pt', 'id'])
// Langues où le second mot du titre passe en minuscule. L'allemand en est exclu
// car les noms y gardent toujours leur majuscule.
export const LOWERCASE_SECOND_LOCALES = new Set(['fr', 'it', 'es', 'pt', 'id', 'en'])
// Langues où l'adjectif s'accorde grammaticalement avec le genre du nom. Dans
// celles-ci, un nom au genre fixe (« Bourrasque ») impose son genre à l'adjectif.
// Ailleurs (en, de, ...) la forme `_f` désigne le sexe du porteur, pas un accord :
// on s'en tient alors au genre choisi pour le titre.
export const GRAMMATICAL_AGREEMENT_LOCALES = new Set(['fr', 'it', 'es', 'pt'])
// Noms dont le genre grammatical diffère du français (`noun_gender` est dérivé du
// français). Ex. « Caparazón » est masculin en espagnol alors que « Carapace » est
// féminin : ces couples (langue:code) imposent le masculin malgré `noun_gender === 2`.
export const MASCULINE_NOUN_OVERRIDES = new Set(['es:carapace'])

interface TitleNoun {
	code: string
	noun_gender: number
}

// Genre grammatical avec lequel les mots du titre doivent s'accorder. Un nom au
// genre fixe (sans forme masculine alternative, ex. « Bourrasque » = féminin)
// impose son genre, même si le genre stocké dans le titre est masculin (souvent
// laissé par défaut, le français étant indifférent). Sinon on suit le genre choisi.
export function titleAgreementGender(nounTrophy: TitleNoun | null | undefined, gender: number, locale: string): number {
	if (GRAMMATICAL_AGREEMENT_LOCALES.has(locale) && nounTrophy && nounTrophy.noun_gender === 2) {
		return MASCULINE_NOUN_OVERRIDES.has(locale + ':' + nounTrophy.code) ? 1 : 2
	}
	// Genre choisi pour le titre : masculin uniquement si explicitement 1, sinon
	// féminin (préserve le comportement historique pour un genre absent/nul).
	return gender === 1 ? 1 : 2
}

// Clé i18n de la forme accordée d'un mot : clé féminine `_f` si l'accord est au
// féminin ET qu'une traduction féminine existe dans la langue courante, sinon la
// clé de base. L'accord est ainsi piloté par l'existence réelle de la clé `_f`, ce
// qui le rend correct par langue (ex. it « Strana ») sans régresser celles où le mot
// est épicène (ex. fr « Bizarre », où aucune clé `_f` n'existe). Renvoie la clé pour
// que l'appelant la traduise avec son propre `t()` réactif.
export function agreedTrophyKey(code: string, agreementGender: number): string {
	if (agreementGender === 2) {
		const femKey = 'trophy.' + code + '_f'
		if (i18n.global.te(femKey)) {
			return femKey
		}
	}
	return 'trophy.' + code
}
