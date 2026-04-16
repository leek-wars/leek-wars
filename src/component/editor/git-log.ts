import { reactive } from 'vue'
import { LeekWars } from '@/model/leekwars'

export interface GitLogEntry {
	id: number
	timestamp: number
	command: string    // commande git exécutée côté serveur (ex: "git push -u origin HEAD")
	success: boolean   // exit code === 0
	output: string     // sortie git
	durationMs: number
}

const MAX_ENTRIES = 500
const MAX_OUTPUT_LEN = 8000 // évite de gonfler le store avec de gros stdout

const state = reactive<{ entries: GitLogEntry[], nextId: number }>({
	entries: [],
	nextId: 1,
})

function add(entry: Omit<GitLogEntry, 'id'>) {
	const trimmed = entry.output.length > MAX_OUTPUT_LEN
		? entry.output.slice(0, MAX_OUTPUT_LEN) + '\n… (truncated)'
		: entry.output
	state.entries.push({ ...entry, output: trimmed, id: state.nextId++ })
	if (state.entries.length > MAX_ENTRIES) {
		state.entries.splice(0, state.entries.length - MAX_ENTRIES)
	}
}

/**
 * Wrapper autour de LeekWars.post qui récupère les commandes git
 * réellement exécutées côté serveur via le champ _git_commands.
 */
export async function gitCall<T = any>(endpoint: string, params?: any): Promise<T> {
	const start = Date.now()
	try {
		const data = await LeekWars.post<T>(endpoint, params ?? {})
		ingestServerCommands(start, (data as any)?._git_commands)
		return data
	} catch (e: any) {
		ingestServerCommands(start, e?._git_commands)
		throw e
	}
}

function ingestServerCommands(timestamp: number, cmds: any[] | undefined) {
	if (!Array.isArray(cmds)) return
	for (const c of cmds) {
		add({
			timestamp,
			command: c.command || '',
			success: c.exit_code === 0,
			output: c.output || '',
			durationMs: c.duration_ms || 0,
		})
	}
}

export function clearLog() {
	state.entries = []
}

export const gitLog = state
