// Erreur de champ de formulaire renvoyée par farmer/register* et farmer/verify* :
// [index du champ, code d'erreur, paramètres de traduction].
export type ApiFieldError = [number, string, (string | number)[]?]

// Champs de formulaire, dans l'ordre des index renvoyés par l'API.
// 'login' par défaut : certains index (skin, hat) n'ont pas de champ correspondant côté client.
const FORM_FIELDS = ['login', 'leek', 'email', 'password1', 'password2', 'godfather']

// Forme d'erreur que `LeekWars.get/post/...().error(cb)` garantit à ses appelants.
export interface ApiError {
	error: string
	params?: unknown[]
	// Renseigné quand le corps est un tableau d'erreurs de formulaire (inscription, validation).
	fields?: ApiFieldError[]
	[key: string]: unknown
}

// Le corps d'erreur renvoyé par l'API ne respecte pas toujours cette forme : certains endpoints
// (garden/start-*-fight) répondent une string JSON nue, et un corps vide (502, timeout) arrive
// ici en `null` — un corps illisible, lui, est enveloppé par `request()` dans `{invalid_response}`.
// Sans normalisation les appelants lisent `error.error === undefined` puis appellent `t(undefined)`,
// qui lève un SyntaxError vue-i18n (INVALID_ARGUMENT) depuis un `.catch()`, donc en
// unhandledrejection non rattrapée qui casse la page.
export function normalizeApiError(response: unknown): ApiError {
	if (typeof response === 'string' && response) {
		return { error: response }
	}
	// farmer/register* et farmer/verify* répondent un TABLEAU d'erreurs de formulaire : sans ce cas
	// il finirait étalé en objet ({"0": [...]}), et les appelants qui l'itèrent planteraient sur un
	// « X is not iterable ». La première erreur remonte en `error`/`params` pour
	// les appelants qui n'affichent qu'un message.
	if (Array.isArray(response)) {
		const [first] = response
		if (Array.isArray(first) && typeof first[1] === 'string') {
			return { error: first[1], params: first[2], fields: response as ApiFieldError[] }
		}
		return { error: 'unknown_error' }
	}
	const body = response && typeof response === 'object' ? response as Record<string, unknown> : {}
	if (typeof body.error === 'string' && body.error) {
		return body as ApiError
	}
	return { ...body, error: 'unknown_error' }
}

// Messages traduits des erreurs de formulaire, par champ, à passer au `t` du composant : les clés
// (error_login_length…) sont définies dans son propre fichier .i18n.
export function apiFieldMessages(error: ApiError, t: (key: string, params?: unknown[]) => string): [string, string][] {
	return (error.fields ?? []).map(([index, code, params]) => [FORM_FIELDS[index] ?? 'login', t('error_' + code, params ?? [])])
}

// Clé i18n du message d'échec, pour les composants qui préfixent les codes serveur par error_.
// Le code de repli de normalizeApiError ('unknown_error') garde sa clé historique error_unknown.
// 'network_error' n'est pas un code du serveur mais de la couche requête : son libellé est commun
// à tout le site, dans main.json, plutôt que recopié dans le .i18n de chaque appelant.
// Le `t` des composants (useNamespacedT) résout un `main.` préfixé.
export function apiErrorKey(error: ApiError): string {
	if (error.error === 'unknown_error') return 'error_unknown'
	if (error.error === 'network_error') return 'main.network_error'
	return 'error_' + error.error
}

// Vrai pour les erreurs que la couche requête a DÉJÀ signalées au joueur (cf. le toast de
// `xhr.onerror` dans model/leekwars.ts) : l'appelant qui en affiche un second le fait en double.
// Les 59 sites qui construisent leur clé en `'error_' + code` n'ont pas de traduction pour ces
// codes-là — ils afficheraient la clé brute par-dessus le message correct.
export function isReportedByTransport(error: ApiError): boolean {
	return error.error === 'network_error'
}
