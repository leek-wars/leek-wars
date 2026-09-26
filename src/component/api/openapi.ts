// Génération d'une spec OpenAPI 3.0.3 de l'API Leek Wars, à partir du catalogue
// renvoyé par `service/get-all` et des descriptions traduites de la page de doc.
//
// Générée côté CLIENT et non côté serveur : le serveur possède bien la structure des
// endpoints (méthode, paramètres, types, rôle), mais les descriptions vivent dans les
// fichiers i18n du client (src/component/api/api.*.i18n). Les produire ici donne une
// spec entièrement documentée, dans la langue de l'utilisateur.

import { API_BASE } from './code-examples'

export interface OpenApiService {
	module: string
	function: string
	method: string
	auth: boolean
	parameters: string[]
	parameters_types: string[]
	returns: string[]
	returns_types: string[]
	deprecated?: boolean
	scope?: string
}

type Schema = { type?: string, items?: Schema, format?: string, description?: string }

/** Type déclaré par le registre serveur -> schéma JSON. */
function schema(type: string): Schema {
	switch (type) {
		case 'number': return { type: 'number' }
		case 'boolean': return { type: 'boolean' }
		// Le registre serveur dit seulement « array », jamais le type des éléments : la
		// plupart de ces listes contiennent des objets (function/get-all, fight/get-logs…).
		// `items` est obligatoire en OpenAPI 3.0.3, on met donc le schéma vide (= n'importe
		// quel type) plutôt que d'inventer un tableau de chaînes que l'API ne renvoie pas.
		case 'array': return { type: 'array', items: {} }
		// `json` = un corps JSON libre : objet pour les uns (characteristics, filters),
		// tableau pour les autres (weapons, obstacles). Le schéma vide couvre les deux.
		case 'json': return {}
		case 'object': return { type: 'object' }
		// Un paramètre `file` est un vrai upload multipart, pas une chaîne.
		case 'file': return { type: 'string', format: 'binary' }
		default: return { type: 'string' }
	}
}

function isGet(service: OpenApiService): boolean {
	// Le registre peut déclarer plusieurs méthodes ("get, post") : la première fait foi.
	return service.method.toLowerCase().split(',')[0].trim() === 'get'
}

function firstMethod(service: OpenApiService): string {
	return service.method.toLowerCase().split(',')[0].trim()
}

/**
 * Chemin OpenAPI de l'endpoint. Les paramètres d'un GET sont positionnels dans le
 * chemin (même convention que les exemples d'appel), les autres passent par le corps.
 */
export function openApiPath(service: OpenApiService): string {
	const base = '/' + service.module + '/' + service.function
	if (isGet(service) && service.parameters.length) {
		return base + '/' + service.parameters.map(p => '{' + p + '}').join('/')
	}
	return base
}

/**
 * Construit le document OpenAPI. `describe` renvoie la description traduite d'un
 * endpoint (chaîne vide si absente), pour ne pas coupler ce module à i18n.
 */
export function buildOpenApi(services: OpenApiService[], describe: (service: OpenApiService) => string): object {
	const paths: Record<string, Record<string, unknown>> = {}

	for (const service of services) {
		const path = openApiPath(service)
		const method = firstMethod(service)
		const description = describe(service)

		const operation: Record<string, unknown> = {
			operationId: service.module + '_' + service.function,
			summary: service.module + '/' + service.function,
			tags: [service.module],
		}
		if (description) { operation.description = description }
		if (service.deprecated) { operation.deprecated = true }

		if (isGet(service) && service.parameters.length) {
			operation.parameters = service.parameters.map((name, i) => ({
				name,
				in: 'path',
				required: true,
				schema: schema(service.parameters_types[i]),
			}))
		} else if (service.parameters.length) {
			const properties: Record<string, Schema> = {}
			for (let i = 0; i < service.parameters.length; i++) {
				properties[service.parameters[i]] = schema(service.parameters_types[i])
			}
			// Un endpoint qui prend un fichier (avatar, emblème) attend un envoi multipart,
			// pas du JSON : le corps entier change de type de contenu.
			const contentType = service.parameters_types.includes('file') ? 'multipart/form-data' : 'application/json'
			operation.requestBody = {
				required: true,
				content: { [contentType]: { schema: { type: 'object', properties, required: [...service.parameters] } } },
			}
		}

		// `session` = accessible uniquement avec une session connectée, jamais par clé API :
		// on ne déclare donc pas la sécurité par clé sur ces endpoints.
		// `security: []` explicite sur les endpoints publics : distingue « aucune auth
		// requise » de « non renseigné », et évite que Swagger UI réclame une clé.
		operation.security = (service.auth && service.scope !== 'session') ? [{ apiKey: [] }] : []

		const properties: Record<string, Schema> = {}
		for (let i = 0; i < service.returns.length; i++) {
			properties[service.returns[i]] = schema(service.returns_types[i])
		}
		operation.responses = {
			'200': {
				description: 'OK',
				content: { 'application/json': { schema: { type: 'object', properties } } },
			},
		}

		if (!paths[path]) { paths[path] = {} }
		paths[path][method] = operation
	}

	return {
		openapi: '3.0.3',
		info: {
			title: 'Leek Wars API',
			version: '1.0.0',
			description: 'API publique de Leek Wars. Les endpoints authentifiés acceptent une clé API '
				+ '(en-tête `Authorization: Bearer lwk_…`), à l\'exception de ceux qui exigent une session connectée.',
		},
		servers: [{ url: API_BASE }],
		components: {
			securitySchemes: {
				apiKey: { type: 'http', scheme: 'bearer', description: 'Clé API Leek Wars (préfixe lwk_).' },
			},
		},
		tags: [...new Set(services.map(s => s.module))].sort().map(name => ({ name })),
		paths,
	}
}
