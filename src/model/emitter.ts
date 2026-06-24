import mitt from 'mitt'
import { ComponentPublicInstance } from 'vue'
import { Folder, Item } from '@/component/editor/editor-item'
import { Farmer } from './farmer'
import { AI } from './ai'
import { i18n } from '@/model/i18n'
import { SchemeTemplate } from '@/model/scheme'

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
	'git-open-remote-dialog': void
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
	'editor-menu': unknown,
	'br-started': number,
	'reanalyze': void,
	'git-file-changed': void,
	'git-repos-changed': void,
	'git-history-refresh': void,
	'file-reloaded': string,
	'ai-path-changed': { oldPath: string, newPath: string | null },
	'close-diff': { folder: string, file: string },
	'close-file-tab': string,
	'close-merge-tabs': { folder: string },
	'open-merge': { folder: string, file: string },
	'clover-used': void,
	'craft': SchemeTemplate,
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
