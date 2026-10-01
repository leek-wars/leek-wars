// Ce qu'une URL du site peut porter de privé : le jeton d'un lien de connexion (un JWT),
// celui d'un changement d'e-mail, le code d'un mot de passe oublié et l'adresse saisie.
// Un rapport d'erreur n'en transporte rien.

// Un JWT commence par son en-tête `{"` encodé, `eyJ`, suivi d'un point : on prend toute la
// suite, points compris, pour qu'un jeton coupé en cours de route reste masqué.
const JWT = /(^|[^\w-])eyJ[\w-]+\.[\w.-]*/g
const PRIVATE_SEGMENT = /(\/(?:change-email|forgot-password)\/[^/?#\s]+\/)[^/?#\s]+/g

export function redactReport(text: string): string {
	return text.replace(JWT, '$1…').replace(PRIVATE_SEGMENT, '$1…')
}
