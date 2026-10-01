import { describe, expect, it, vi } from 'vitest'
import { mountComponent } from '@/test/harness'

// chat-exec-result rend le résultat d'un `/exec` posté dans le chat. Le composant ne
// calcule rien : le serveur exécute une fois et envoie soit un `result`, soit une erreur. Ce qui
// se teste ici, c'est le choix de la branche affichée et le fait que l'erreur LeekScript passe
// bien par la traduction (`leekscript.error_<code>` avec ses paramètres), comme dans la console.

// lw-code fait appel au coloriseur maison (DOM + Monaco) : on le remplace par son texte brut.
vi.mock('@/component/app/code.vue', () => ({
	default: { name: 'LwCode', props: ['code', 'single', 'language'], template: '<code class="value">{{ code }}</code>' },
}))
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		formatNumber: (n: number) => String(n),
		logClass: (log: unknown[]) => (log[1] === 3 ? 'error' : null),
		logColor: () => '',
		logText: (log: unknown[]) => log[2] as string,
	},
}))

import ChatExecResult from '@/component/chat/chat-exec-result.vue'

const MESSAGES = { leekscript: { error_12: "Variable inconnue « {0} »" } }

const mountExec = (exec: Record<string, unknown>) => mountComponent(ChatExecResult, {
	props: { exec },
	global: { stubs: { 'v-progress-circular': { template: '<div class="spinner" />' }, 'v-icon': { template: '<i />' } } },
}, { messages: MESSAGES })

describe('chat-exec-result.vue', () => {

	it('affiche la valeur de retour et le coût en opérations', () => {
		const w = mountExec({ lang: 'leekscript', result: '4', ops: 12 })
		expect(w.find('.value').text()).toBe('4')
		expect(w.text()).toContain('12 ops')
		expect(w.find('.error').exists()).toBe(false)
	})

	it('un résultat vide reste un résultat (chaîne vide, pas « rien »)', () => {
		const w = mountExec({ lang: 'leekscript', result: '""', ops: 3 })
		expect(w.find('.value').text()).toBe('""')
	})

	it('traduit l\'erreur LeekScript avec ses paramètres', () => {
		const w = mountExec({ lang: 'leekscript', error: 12, params: ['x'], ops: 0 })
		expect(w.find('.error').text()).toBe("Variable inconnue « x »")
		expect(w.find('.value').exists()).toBe(false)
	})

	it('affiche telle quelle une erreur déjà formatée (polyglot, refus du serveur)', () => {
		const w = mountExec({ lang: 'python', message: 'SyntaxError: invalid syntax' })
		expect(w.find('.error').text()).toBe('SyntaxError: invalid syntax')
	})

	it('affiche les lignes de debug() au-dessus du résultat', () => {
		const w = mountExec({ lang: 'leekscript', logs: [[0, 1, 'hello'], [0, 3, 'oups']], result: 'null', ops: 5 })
		const logs = w.findAll('.log')
		expect(logs).toHaveLength(2)
		expect(logs[0].text()).toBe('hello')
		expect(logs[1].classes()).toContain('error')
	})

	it('exécution en cours : un indicateur, pas de résultat', () => {
		const w = mountExec({ pending: true })
		expect(w.find('.spinner').exists()).toBe(true)
		expect(w.find('.value').exists()).toBe(false)
		expect(w.find('.error').exists()).toBe(false)
	})

	// Le serveur n'envoie `ops` que s'il a compté quelque chose ; 0 op ne mérite pas une mention.
	it('pas de mention « ops » quand le serveur n\'en a pas compté', () => {
		const w = mountExec({ lang: 'leekscript', message: 'Execution refused' })
		expect(w.text()).not.toContain('ops')
	})
})
