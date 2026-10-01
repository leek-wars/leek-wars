import { LeekWars } from './leekwars'
import { i18n } from './i18n'
import type { ApiError } from './api-error'

// Envoi d'une image par un joueur.
//
// Séparé de user-image.ts, qui ne porte QUE les règles de forme des URLs : celles-ci
// sont des expressions régulières pures, testées sans navigateur ni application, et
// importer LeekWars les aurait fait dépendre du localStorage au chargement du module.
// Ici on parle au serveur, donc la dépendance est légitime.

/**
 * Envoie une image et rend l'URL à écrire dans le texte.
 *
 * Aucune vérification de format ici : le client ne décide de rien, c'est le serveur
 * qui tranche. `context` lui dit quelle surface est visée.
 *
 * `noRetry` : un refus de cet endpoint est définitif ; le rejouer renverrait l'image
 * entière trois fois et retarderait de plusieurs secondes un refus déjà acquis.
 */
export function uploadUserImage(file: File, context: string): Promise<string> {
	const formdata = new FormData()
	formdata.append('image', file)
	formdata.append('context', context)
	return LeekWars.post<{url: string}>('user-image/upload', formdata, true).then(data => data.url)
}

/**
 * Le message à montrer quand un envoi échoue. Même convention de clés que partout
 * ailleurs — `main.error_<code>` — et repli sur un message générique pour les codes
 * qu'on ne traduit pas : `te()` est l'API prévue pour poser la question, comparer la
 * traduction à la clé dépendrait du réglage `missingWarn`.
 */
export function userImageErrorMessage(error: ApiError): string {
	const key = 'main.error_' + (error.error || 'user_image_failed')
	const known = i18n.global.te(key)
	return (known ? i18n.t(key, error.params ?? []) : i18n.t('main.error_user_image_failed')) as string
}
