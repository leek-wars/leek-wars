// Forme d'erreur que `LeekWars.get/post/...().error(cb)` garantit à ses appelants.
export interface ApiError {
	error: string
	params?: unknown[]
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
	const body = response && typeof response === 'object' ? response as Record<string, unknown> : {}
	if (typeof body.error === 'string' && body.error) {
		return body as ApiError
	}
	return { ...body, error: 'unknown_error' }
}
