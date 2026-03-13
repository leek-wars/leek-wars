import mitt from 'mitt'
import { Farmer } from './farmer'
import { i18n } from '@/model/i18n'

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
	keyup: KeyboardEvent
	resize: void
	focus: void
	htmlclick: void
	loaded: void
	connected: Farmer
	back: void
	chat: any
	'chat-history': any
	wsconnected: void
	tooltip: { x: number, y: number, content: string }
	'tooltip-close': void
	'editor-drag': any
	'tournament-update': any
	trophy: any
	fight_notification: any
	wsmessage: { type: number, data: any, id: number | null },
	mousemove: any,
	mouseup: any,
	jump: { ai: any, line: number, column: number },
	navigate: void,
	'doc-navigate': any,
	'garden-queue': any,
	'fight-progress': any,
	'update-leek-xp': any,
	'update-leek-talent': any,
	'update-team-talent': any,
	'console': any,
	'console-error': any,
	'console-log': any,
	'editor-menu': any,
	'br-started': number,
}

const emitter = mitt<Events>()

export let vueMain: any = null
export function setVueMain(vm: any) { vueMain = vm }

export function displayWarningMessage() {
	const style = "color: black; font-size: 13px; font-weight: bold;"
	const styleRed = "color: red; font-size: 14px; font-weight: bold;"
	console.log("%c" + i18n.global.t('main.console_alert_1'), style)
	console.log("%c" + i18n.global.t('main.console_alert_2'), styleRed)
	console.log("%c" + i18n.global.t('main.console_alert_3'), style)
	console.log("")
	console.log("%c✔️ " + i18n.global.t('main.console_github'), style)
	console.log("")
}

export { emitter }
export type { Events }
