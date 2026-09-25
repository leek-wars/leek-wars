// Erreur de champ de formulaire renvoyée par farmer/register* et farmer/verify* :
// [index du champ, code d'erreur, paramètres de traduction].
export type ApiFieldError = [number, string, (string | number)[]?]

// Champs de formulaire dans l'ordre des constantes FIELD_* de FarmerController (serveur).
// 'login' par défaut : le serveur connaît des index (skin, hat) sans champ correspondant côté client.
const FORM_FIELDS = ['login', 'leek', 'email', 'password1', 'password2', 'godfather']

// Forme d'erreur que `LeekWars.get/post/...().error(cb)` garantit à ses appelants.
export interface ApiError {
	error: string
	params?: unknown[]
	// Renseigné quand le corps est un tableau d'erreurs de formulaire (inscription, validation).
	fields?: ApiFieldError[]
	[key: string]: unknown
}

// Le corps d'erreur renvoyé par l'API ne respecte pas toujours cette forme : les endpoints
// garden/start-*-fight répondent `Response::fail($code, 'error_fight_x')`, soit une string JSON
// nue, et une réponse non-JSON (502, timeout Traefik) donne un `xhr.response` null. Sans
// normalisation les appelants lisent `error.error === undefined` puis appellent `t(undefined)`,
// qui lève un SyntaxError vue-i18n (INVALID_ARGUMENT) depuis un `.catch()`, donc en
// unhandledrejection non rattrapée qui casse la page. Erreur #11810483.
export function normalizeApiError(response: unknown): ApiError {
	if (typeof response === 'string' && response) {
		return { error: response }
	}
	// farmer/register* et farmer/verify* répondent un TABLEAU d'erreurs de formulaire : sans ce cas
	// il finissait étalé en objet ({"0": [...]}), et les appelants qui l'itéraient plantaient sur un
	// « X is not iterable » (erreur #11811619). La première erreur remonte en `error`/`params` pour
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
export function apiErrorKey(error: ApiError): string {
	return error.error === 'unknown_error' ? 'error_unknown' : 'error_' + error.error
}
