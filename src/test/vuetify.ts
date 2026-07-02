import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Instance Vuetify pour les tests de composants utilisant des <v-*> / directives (v-ripple...).
// On enregistre TOUS les composants + directives explicitement : le vite-plugin-vuetify
// (auto-import/tree-shaking) n'est pas branché dans vitest.config.ts, donc sans ça les balises
// <v-tooltip>/<v-btn> ne se résolvent pas. Nécessite css:false dans vitest.config.ts (le runtime
// Vuetify importe des .css qui feraient planter vitest). happy-dom 20+ fournit déjà
// ResizeObserver/IntersectionObserver/matchMedia ; seul visualViewport manque pour les overlays.
export function createTestVuetify() {
	return createVuetify({ components, directives })
}
