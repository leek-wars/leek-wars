import mitt from 'mitt'
import { i18n } from '@/model/i18n'
// Imports de TYPE uniquement : ce module est importé par ~50 composants, il doit rester
// une feuille du graphe. Un import de valeur y tirerait farmer/ai/editor-item et
// recréerait des cycles (cf. model/vue.test.ts).
import type { ComponentPublicInstance } from 'vue'
import type { Folder, Item } from '@/component/editor/editor-item'
import type { Farmer, InventoryItem } from './farmer'
import type { AI } from './ai'
import type { SchemeTemplate } from '@/model/scheme'

type Events = {
	keydown: KeyboardEvent
	ctrlShiftS: void
	ctrlS: void
	ctrlQ: void
	ctrlF: KeyboardEvent
	escape: void
	previous: KeyboardEvent
	next: KeyboardEvent
	ctrlP: KeyboardEvent
	ctrlShiftP: KeyboardEvent
	'palette-test': void
	'palette-toggle-theme': void
	keyup: KeyboardEvent
	resize: void
	focus: void
	visible: void
	htmlclick: void
	loaded: void
	connected: Farmer
	back: void
	chat: number[]
	'chat-history': number
	wsconnected: void
	tooltip: { x: number, y: number, content: string }
	'tooltip-close': void
	'editor-drag': Item
	'editor-drop': Folder
	'git-open-remote-dialog': string | undefined
	'tournament-update': unknown
	trophy: unknown
	fight_notification: unknown
	wsmessage: { type: number, data: unknown, id: number | null },
	mousemove: MouseEvent,
	mouseup: MouseEvent,
	jump: { ai: AI, line: number, column: number },
	navigate: void,
	'doc-navigate': string,
	'garden-queue': number,
	'fight-progress': [number, number],
	'history-update': [number],
	'update-leek-xp': unknown,
	'update-leek-talent': unknown,
	'update-team-talent': { composition: number; talent: number },
	'console': unknown,
	'console-error': unknown,
	'console-log': unknown,
	/** Ouvre la fenetre de console LeekScript. Le bouton vit dans la barre du
	 *  haut, la fenetre appartient a l'application : l'emetteur evite de faire
	 *  traverser un drapeau a toute la coquille. */
	'open-console': void,
	'editor-menu': unknown,
	'br-started': number,
	'reanalyze': void,
	// L'analyseur a appliqué un nouveau résultat : ce qu'il sait des symboles a changé. Émis par
	// Analyzer lui-même (monaco.ts l'importe déjà, l'inverse ferait un cycle), écouté par monaco.ts
	// pour rafraîchir les compteurs de références des CodeLens.
	'analyzer-updated': void,
	'git-file-changed': void,
	'git-repos-changed': void,
	'git-history-refresh': void,
	'file-reloaded': string,
	'ai-path-changed': { oldPath: string, newPath: string | null },
	'ai-created': string,
	'ai-deleted': string,
	'close-diff': { folder: string, file: string },
	'close-file-tab': string,
	'close-merge-tabs': { folder: string },
	'open-merge': { folder: string, file: string },
	'clover-used': void,
	'craft': SchemeTemplate,
	/** Un composant part de l'inventaire vers la forge, pour etre altere (#622). */
	'alter': InventoryItem,
	/** Une alteration part de l'inventaire vers la forge (#622). */
	'add-alteration': InventoryItem,
	/** Une tentative de l'historique est rejouee : sa recette est reposee telle quelle
	 *  dans la forge (#622). `recipe` est au format journalise par le serveur,
	 *  [id d'alteration => quantite] ; `item` est la piece sur laquelle la tentative
	 *  avait eu lieu, que la forge repose si elle est vide. */
	'replay-recipe': { recipe: { [id: number]: number }, item: number | null },
	/** L'onglet actif de l'atelier a change (#622). */
	'workshop-mode': string,
	/** Une action d'atelier vient d'avoir lieu (1 craft, 2 alteration, 3 destruction) :
	 *  l'historique du type concerne se recharge pour la montrer aussitot (#622). */
	'workshop-action': number,
}

const emitter = mitt<Events>()

export let vueMain: ComponentPublicInstance | null = null
export function setVueMain(vm: ComponentPublicInstance | null) { vueMain = vm }

export function displayWarningMessage() {
	const style = "color: black; font-size: 13px; font-weight: bold;"
	const styleRed = "color: red; font-size: 14px; font-weight: bold;"
	console.log("%c" + i18n.t('main.console_alert_1'), style)
	console.log("%c" + i18n.t('main.console_alert_2'), styleRed)
	console.log("%c" + i18n.t('main.console_alert_3'), style)
	console.log("")
	console.log("%c✔️ " + i18n.t('main.console_github'), style)
	console.log("")
}

export { emitter }
