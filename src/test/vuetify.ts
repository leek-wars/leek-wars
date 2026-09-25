import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Instance Vuetify pour les tests de composants utilisant des <v-*> / directives (v-ripple...).
// On enregistre TOUS les composants + directives explicitement : le vite-plugin-vuetify
// (auto-import/tree-shaking) n'est pas branché dans vitest.config.ts, donc sans ça les balises
// <v-tooltip>/<v-btn> ne se résolvent pas. Nécessite css:false dans vitest.config.ts (le runtime
// Vuetify importe des .css qui feraient planter vitest). happy-dom 20+ fournit déjà
// ResizeObserver/IntersectionObserver/matchMedia ; visualViewport manque et les stratégies de
// position des VOverlay (v-menu/v-dialog/v-tooltip) le lisent au cleanup → shim ci-dessous,
// sinon le DÉMONTAGE d'un overlay throw et interrompt le patch en plein vol.
const g = globalThis as { visualViewport?: unknown }
if (!g.visualViewport) {
	g.visualViewport = {
		addEventListener() { /* noop */ }, removeEventListener() { /* noop */ },
		width: 1280, height: 720, offsetLeft: 0, offsetTop: 0, scale: 1,
	}
}

export function createTestVuetify() {
	return createVuetify({ components, directives })
}
