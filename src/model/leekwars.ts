import packageJson from '@/../package.json'
import { env } from '@/env'
import { locale } from '@/locale'
import { BattleRoyale } from '@/model/battle-royale'
import { CHIP_TEMPLATES, HAT_TEMPLATES, HATS, ITEMS, POMPS, POTIONS, SUMMON_TEMPLATES, TROPHY_CATEGORIES, WEAPONS, COMPLEXITIES } from '@/model/data'
import { Socket } from '@/model/socket'
import { Squares } from '@/model/squares'
import { store } from '@/model/store'
import { vueMain } from '@/model/vue'
import { WeaponTemplate } from '@/model/weapon'
import router from '@/router'
import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { Chat, ChatWindow } from './chat'
import { i18n, loadLanguageAsync } from './i18n'
import { ItemType } from './item'
import { PotionEffect, PotionTemplate } from './potion'

const DEV = window.location.port === '8080'
const LOCAL = window.location.port === '8500' || window.location.port === '5100'

const MONTHS: { [key: string]: string[] } = {
	fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
	en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
}
const MONTHS_SHORT: { [key: string]: string[] } = {
	fr: ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
	en: ['janu.', 'febr.', 'march', 'april', 'may', 'june', 'july', 'augu.', 'sept.', 'oct.', 'nov.', 'dec.'],
}
function ucfirst(str: any) {
	str += ''
	const f = str.charAt(0).toUpperCase()
	return f + str.substr(1)
}

function request<T = any>(method: string, url: string, params?: any) {
	const xhr = new XMLHttpRequest()
	const promise = new Promise<T>((resolve, reject) => {
		xhr.open(method, url)
		xhr.responseType = 'json'
		if (store.state.connected) {
			xhr.setRequestHeader('Authorization', 'Bearer ' + store.state.token)
		}
		if (!(params instanceof FormData)) {
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
		}
		xhr.onload = (e: any) => {
			if (e.target.status === 200) {
				resolve(e.target.response)
			} else {
				if (store.getters.admin || LOCAL || DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
					const message = "[" + e.target.status + "] " + method + " " + url
					console.error(message)
					// LeekWars.toast(message, 5000)
				}
				reject(e.target.response)
			}
		}
		xhr.onerror = reject
		xhr.send(params)
		LeekWars.requests++
	})
	return {
		abort: () => xhr.abort(),
		error: (e: (e: T) => void) => promise.catch(e),
		then: (p: (p: T) => void) => {
			promise.then(p)
			return { error: (e: (e: T) => void) => promise.catch(e) }
		}
	}
}

function post<T = any>(url: any, form: any = {}) {
	if (!(form instanceof FormData)) {
		const f = []
		for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		form = f.join('&')
	}
	return request<T>('POST', LeekWars.API + url, form)
}
function put<T = any>(url: any, form: any = {}) {
	if (!(form instanceof FormData)) {
		const f = []
		for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		form = f.join('&')
	}
	return request<T>('PUT', LeekWars.API + url, form)
}
function del<T = any>(url: any, form: any = {}) {
	if (!(form instanceof FormData)) {
		const f = []
		for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		form = f.join('&')
	}
	return request<T>('DELETE', LeekWars.API + url, form)
}
function get<T = any>(url: any) {
	return request<T>('GET', LeekWars.API + url)
}

const SKINS: { [key: number]: string } = {
	1: "green", 2: "blue", 3: "yellow", 4: "red", 5: "orange", 6: "magenta", 7: "cyan", 8: "purple",
	9: "multi", 10: "rasta", 11: "white", 12: "black", 13: "alpha", 14: "apple", 15: "gold", 16: "pink",
	17: "grey", 18: "turquoise", 19: "celestialblue", 20: "marine", 21: "greenfluo", 22: "brown", 23: "blackandwhite",
	24: "whiteandblack", 25: "ghost", 26: "salmon", 27: "radioactive", 28: "sand", 29: "teal", 30: "matcha", 31: "peach",
	32: "fire", 33: "venimous", 34: "greyscale", 35: "frozen", 36: "dalton", 37: "charlie", 38: "mariniere", 39: "france",
	40: "iron", 41: "diamond"
}

const LEEK_SIZES: { [key: number]: {width: number, height: number} } = {
	1: {width: 86, height: 136},
	2: {width: 116,  height: 143},
	3: {width: 115, height: 151},
	4: {width: 133, height: 159},
	5: {width: 144, height: 166},
	6: {width: 149, height: 174},
	7: {width: 144, height: 181},
	8: {width: 156, height: 189},
	9: {width: 160, height: 196},
	10: {width: 174, height: 204},
	11: {width: 180, height: 211},
}

const POTIONS_BY_SKIN = potionsBySkin(POTIONS)
const POTION_BY_NAME = potionByName(POTIONS)
const WEAPON_BY_NAME = weaponByName(WEAPONS)

class Language {
	public code!: string
	public name!: string
	public flag!: string
}

const LOCAL_DATE = new Date()
const invdate = new Date(LOCAL_DATE.toLocaleString('en-US', {
    timeZone: 'Europe/Paris'
}))
const DATE = new Date(invdate.getTime())

const LeekWars = {
	version: packageJson.version,
	normal_version: packageJson.version.replace(/\.\d+$/, ''),
	smart_version: packageJson.version.replace(/\.0$/, ''),
	DEV,
	LOCAL,
	API: LOCAL ? window.location.origin + '/api/' : 'https://leekwars.com/api/',
	SERVER: LOCAL ? window.location.origin + '/' : 'https://leekwars.com/',
	AVATAR: DEV ? 'https://leekwars.com/' : 'https://leekwars.com/',
	STATIC: '/',
	POWER_FACTOR: 4.2,
	post,
	get,
	put,
	delete: del,
	cgu_version: 1,
	mobile: false,
	socialCollapsed: false,
	menuCollapsed: false,
	menuExpanded: false,
	splitBack: false,
	actions: [],
	lightBar: false,
	dark: 0,
	title: '',
	subtitle: '',
	titleCounter: 0,
	titleTag: null,
	requests: 0,
	notifsResults: localStorage.getItem('options/notifs-results') === 'true',
	rankingActive: localStorage.getItem('options/ranking-active') !== 'false',
	service_worker: null as ServiceWorkerRegistration | null,
	battleRoyale: new BattleRoyale(),
	squares: new Squares(),
	languages: Object.freeze({
		fr: { code: 'fr', name: 'Français', flag: '/image/flag/fr.png', chat: 1 } as Language,
		en: { code: 'en', name: 'English', flag: '/image/flag/gb.png', chat: 2 } as Language,
	} as { [key: string]: Language }),
	timeDelta: 0, // (Date.now() / 1000 | 0) - __SERVER_TIME,
	time: (Date.now() / 1000) | 0,
	timeSeconds: (Date.now() / 1000) | 0,
	large: false,
	flex: false,
	header: true,
	footer: true,
	box: false,
	nativeEmojis: detectNativeEmojis(),
	leekTheme: localStorage.getItem('leek-theme') === 'true',
	keepConnected: null as NodeJS.Timeout | null,
	setLocale(locale: string) {
		loadLanguageAsync(vueMain, locale)
		LeekWars.put('farmer/set-language', {language: locale})
	},
	getLeekAppearance: (level: number): number => {
		if (level < 10) { return 1 } else if (level < 20) { return 2 } else if (level < 50) { return 3 } else if (level < 80) { return 4 } else if (level < 100) { return 5 } else if (level < 150) { return 6 } else if (level < 200) { return 7 } else if (level < 250) { return 8 } else if (level < 300) { return 9 } else if (level < 301) { return 10 }
		return 11
	},
	skins: Object.freeze(SKINS),
	leekSizes: Object.freeze(LEEK_SIZES),
	isPublicChat: (id: number) => id === 1 || id === 2 || id === 32506 || id === 32507 || id === 32508 || id === 32509,
	chatNames: {
		1: 'Général',
		32506: 'Aide',
		32507: 'Programmation',
		2: 'General',
		32508: 'Help',
		32509: 'Programming',
	} as {[key: number]: string},
	getLeekSkinName: (skin: number) => {
		if (!(skin in SKINS)) { return SKINS[1] }
		return SKINS[skin]
	},
	objectSize(obj: Record<string, unknown>): number {
		let size = 0, key
		for (key in obj) {
			// if (obj.hasOwnProperty(key)) {
				size++
			// }
		}
		return size
	},
	first<T extends Record<string, unknown>>(obj: T) {
		for (const e in obj) {
			// if (obj.hasOwnProperty(e)) {
				return obj[e]
			// }
		}
		return null
	},
	isEmptyObj(obj: any) {
		for (const e in obj) {
			// if (obj.hasOwnProperty(e)) {
				return false
			// }
		}
		return true
	},
	selectWhere(array: any, key: string, value: any) {
		for (const e of array) {
			if (e && e[key] === value) { return e }
		}
		return null
	},
	removeOneWhere(array: any, attr: string, condition: any) {
		for (let i = 0; i < array.length; ++i) {
			if (array[i] && array[i][attr] === condition) {
				array.splice(i, 1)
				return
			}
		}
	},
	clone(obj: any) {
		return JSON.parse(JSON.stringify(obj))
	},
	selectText(element: any) {
		LeekWars.removeTextSelections()
		if (window.getSelection) {
			const range = document.createRange()
			range.selectNode(element)
			window.getSelection()!.addRange(range)
		}
	},
	removeTextSelections() {
		if (window.getSelection) {
			window.getSelection()!.removeAllRanges()
		}
	},
	colorToHex(color: number) {
		return "#" + ((1 << 24) + color).toString(16).slice(1)
	},
	rgbToHex(r: number, g: number, b: number) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
	},
	hexToRgb(hex: string): number[] {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
		if (!result) { return [0, 0, 0] }
		return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
	},
	protect(string: any) {
		return ('' + string).replace(/&/g, "&amp;")
			.replace(/>/g, "&gt;").replace(/</g, "&lt;")
			.replace(/"/g, "&quot;").replace(/'/g, "&#39;")
	},
	decodehtmlentities(string: any) {
		return ('' + string).replace(/&amp;/g, "&")
			.replace(/&gt;/g, ">").replace(/&lt;/g, "<")
			.replace(/&nbsp;/g, "\t")
	},
	formatNumber(n: number) {
		return ("" + n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
	},
	numberPrecision(number: number, precision: number) {
		return number.toPrecision(precision)
	},
	isMobile() {
		return /Mobi/i.test(window.navigator.userAgent)
		/*
		// console.log(window.innerWidth, window.innerHeight, window.screen.orientation)
		const type = (screen.orientation || {}).type || (screen as any).mozOrientation || (screen as any).msOrientation;
		const angle = (screen.orientation || {}).type || (screen as any).mozOrientation || (screen as any).msOrientation;

		let width = window.innerWidth
		if (orientation.angle === 90 && (orientation === "landscape-primary" || orientation === "landscape-secondary")) {
			width = window.innerHeight
		}
		return width < 900
		*/
	},
	contenteditable_paste_protect(element: HTMLElement) {
		// Paste : keep the pure text of the element
		element.addEventListener('paste', (e: any) => {
			e.preventDefault()
			const text = (e.originalEvent || e).clipboardData.getData('text/plain')
			document.execCommand('insertText', false, text)
		})
		// Drop : take the string data in the event and append it to the element
		element.addEventListener('drop', (e: any) => {
			e.preventDefault()
			e.originalEvent.dataTransfer.items[0].getAsString((str: any) => {
				element.textContent = element.innerText + str
			})
		})
	},
	toggleMenu() {
		if (LeekWars.menuExpanded) {
			LeekWars.menuExpanded = false
			LeekWars.dark = 0
		} else if (LeekWars.splitBack) {
			// if ('back' in LW.pages[LW.currentPage]) LW.pages[LW.currentPage].back()
			LeekWars.splitShowList()
		} else {
			LeekWars.menuExpanded = true
			LeekWars.dark = 0.6
		}
	},
	closeMenu() {
		if (LeekWars.menuExpanded) {
			LeekWars.menuExpanded = false
			LeekWars.dark = 0
		}
	},
	splitShowList() {
		if (!LeekWars.isMobile()) { return }
		LeekWars.splitBack = false
	},
	splitShowContent() {
		if (!LeekWars.isMobile()) { return }
		LeekWars.splitBack = true
	},
	setActions(actions: any) {
		LeekWars.actions = actions
	},
	getAvatar(farmerID: number, avatarChanged: number) {
		return avatarChanged === 0 ? '/image/no_avatar.png' : LeekWars.AVATAR + 'avatar/' + farmerID + '.png'
	},
	_documentation: {} as any,
	_documentationPromises: {} as any,
	documentation(locale: string): Promise<any> {
		if (!(locale in LeekWars._documentationPromises)) {
			const promise = get<any>('function/doc/' + locale)
			Vue.set(LeekWars._documentationPromises, locale, promise)
			promise.then((data) => {
				Vue.set(LeekWars._documentation, locale, data)
			})
			return promise as any
		}
		return LeekWars._documentationPromises[locale]
	},
	itemTypes: {
		[ItemType.WEAPON]: 'weapon',
		[ItemType.HAT]: 'hat',
		[ItemType.POTION]: 'potion',
	},
	uploadCheck(file: File) {
		if (!file) {
			return false
		}
		const types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp']
		if (types.indexOf(file.type) === -1) {
			return false
		}
		if (file.size > 10485760) {
			return false
		}
		return true
	},
	fileToImage(file: File, imageElem: Element) {
		const reader = new FileReader()
		reader.onloadend = (e: any) => {
			imageElem.setAttribute('src', e.target.result)
		}
		reader.readAsDataURL(file)
	},
	favicon(image: string) {
		const favicon = document.querySelector("link[rel*='icon'")
		if (favicon) { favicon.setAttribute("href", image) }
	},
	/*
	popupWindow(url: string, title: string, w: number, h: number) {
		const dualScreenLeft = window.screenLeft
		const dualScreenTop = window.screenTop
		const width = window.innerWidth ? window.innerWidth : document.documentElement!.clientWidth ? document.documentElement!.clientWidth : screen.width
		const height = window.innerHeight ? window.innerHeight : document.documentElement!.clientHeight ? document.documentElement!.clientHeight : screen.height
		const left = ((width / 2) - (w / 2)) + dualScreenLeft
		const top = ((height / 2) - (h / 2)) + dualScreenTop
		const newWindow = window.open(url, title, 'scrollbars=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)
		// Puts focus on the newWindow
		if (newWindow && newWindow.focus) {
			newWindow.focus()
		}
	},
	*/
	fullscreen: false,
	fullscreenEnter(element: HTMLElement, callback: (f: boolean) => void) {
		const fullscreenCallback = () => {
			LeekWars.fullscreen = !LeekWars.fullscreen
			vueMain.$emit('resize')
			callback(LeekWars.fullscreen)
		}
		if (element.requestFullscreen) {
			document.onfullscreenchange = fullscreenCallback
			element.requestFullscreen()
		} else if (element.webkitRequestFullscreen) {
			document.onwebkitfullscreenchange = fullscreenCallback
			element.webkitRequestFullscreen()
		} else if (element.mozRequestFullScreen) {
			document.onmozfullscreenchange = fullscreenCallback
			element.mozRequestFullScreen()
		} else if (element.msRequestFullscreen) {
			document.MSFullscreenChange = fullscreenCallback
			element.msRequestFullscreen()
		}
	},
	fullscreenExit() {
		if (document.exitFullscreen) {
			document.exitFullscreen()
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen()
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen()
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen()
		}
	},
	sfw: false,
	sfwTitle: "#3735931646 Documentation index",
	sfwInit() {
		if (localStorage.getItem('sfw') === 'true') {
			LeekWars.sfwOn()
		} else {
			LeekWars.sfwOff()
		}
	},
	sfwOn() {
		if (localStorage.getItem('connected') === 'true' && localStorage.getItem('sfw') === 'true') {
			LeekWars.sfw = true
			LeekWars.favicon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oFFAADATTAuQQAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAEklEQVQ4y2NgGAWjYBSMAggAAAQQAAGFP6pyAAAAAElFTkSuQmCC")
		}
	},
	sfwOff() {
		LeekWars.sfw = false
		LeekWars.setFavicon(true)
	},
	toast(message: string | TranslateResult, durationOrCallback: number | any = 1800) {
		const d = typeof(durationOrCallback) === "number" ? durationOrCallback : 1800
		const callback = typeof(durationOrCallback) === "function" ? durationOrCallback : null

		const toast = document.createElement("div")
		toast.innerHTML = "<div class='toast'>" + LeekWars.protect(message) + "</div>"
		toast.classList.add("toast-wrapper")
		const toasts = document.querySelector('#app .toasts')
		if (toasts) { toasts.appendChild(toast) }

		setTimeout(() => {
			toast.classList.add('visible')
			setTimeout(() => {
				toast.classList.remove('visible')
				setTimeout(() => {
					toast.remove()
					if (callback != null) { callback() }
				}, 600)
			}, d + 600)
		}, 100)
	},
	getHatTemplate: (item: number) => {
		for (const t in LeekWars.hatTemplates) {
			if (item === LeekWars.hatTemplates[t].item) { return parseInt(t, 10) }
		}
		return 0
	},
	chatWindows: [] as ChatWindow[],
	initChats() {
		LeekWars.chatWindows = JSON.parse(localStorage.getItem('chats') || '[]')
	},
	addChat(chat: Chat) {
		for (const window of LeekWars.chatWindows) {
			if (window.id === chat.id) {
				window.expanded = true
				return
			}
		}
		LeekWars.chatWindows.push({ id: chat.id, type: chat.type, title: chat.name, expanded: true})
	},
	removeChat(i: number) {
		LeekWars.chatWindows.splice(i, 1)
	},
	get_cursor_position, set_cursor_position,
	formatDate, formatDateTime, formatDuration, formatTime, formatTimeSeconds, formatDayMonthShort,
	setTitle, setSubTitle, setTitleCounter, setTitleTag,
	shadeColor,
	createCodeArea, createCodeAreaSimple,
	clover: false, cloverTop: 0, cloverLeft: 0, lucky,
	setFavicon,
	linkify, toChatLink,
	goToRanking,
	socket: new Socket(),
	hats: Object.freeze(HATS),
	pomps: Object.freeze(POMPS),
	weapons: Object.freeze(WEAPONS),
	weaponByName: Object.freeze(WEAPON_BY_NAME),
	items: Object.freeze(ITEMS),
	chipTemplates: Object.freeze(CHIP_TEMPLATES),
	trophyCategories: Object.freeze(TROPHY_CATEGORIES),
	trophyCategoriesById: Object.freeze([...TROPHY_CATEGORIES].sort((a, b) => a.id - b.id)),
	trophyCategoriesIcons: Object.freeze([
		'mdi-trophy-variant-outline',
		'mdi-sword-cross',
		'mdi-trophy-outline',
		'mdi-emoticon-outline',
		'mdi-chat-outline',
		'mdi-star-outline',
		'mdi-code-braces',
		'mdi-basket-outline',
	]),
	summonTemplates: Object.freeze(SUMMON_TEMPLATES),
	potions: Object.freeze(POTIONS),
	potionByName: Object.freeze(POTION_BY_NAME),
	hatTemplates: Object.freeze(HAT_TEMPLATES),
	potionsBySkin: Object.freeze(POTIONS_BY_SKIN),
	complexities: Object.freeze(COMPLEXITIES),
	characteristics: Object.freeze(['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'mp', 'tp']),
	characteristics_table: Object.freeze(['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']),
	effectRawOpened: false,
	message: null as string | null,
	messagePopup: false,
	displayMessage: (message: string | null) => {
		if (message) {
			// console.log("Display message", message)
			LeekWars.message = message
			LeekWars.messagePopup = true
		}
	},
	encyclopedia: {} as {[key: string]: any},
	encyclopediaById: {} as {[key: number]: any},
	encyclopediaLoaded: false,
	loadEncyclopedia: () => {
		if (!LeekWars.encyclopediaLoaded) {
			LeekWars.encyclopediaLoaded = true
			LeekWars.get('encyclopedia/get-all').then(pages => {
				LeekWars.encyclopedia = pages
				for (const page in pages) {
					Vue.set(LeekWars.encyclopediaById, pages[page].id, pages[page])
				}
			})
		}
	},
	christmasPresents: DATE.getMonth() === 11 && DATE.getDate() >= 25 && DATE.getDate() <= 31,
	LATEST_LEEKSCRIPT_VERSION: 4,
	logClass: (log: any[]) => {
		if (log[1] === 2 || log[1] === 7 || log[1] === 11) { return "warning" }
		else if (log[1] === 3 || log[1] === 8) { return "error" }
		else if (log[1] === 5) { return "pause" }
		return null
	},
	logColor: (log: any[]) => {
		return log[1] === 1 && log.length > 3 && log[3] ? LeekWars.colorToHex(log[3]) : ''
	},
	logText: (log: any[]) => {
		if (log[1] === 5) { return "pause()" }
		if (log[1] === 11) { return i18n.t('leekscript.too_much_debug') }
		if (log[1] >= 6 && log[1] <= 8) {
			if (log[3] === 113) { // HELP_PAGE_LINK
				const helpPage = LeekWars.logHelpPage(log)
				return helpPage
			}
			return i18n.t('leekscript.error_' + log[3], log[4]) + "\n" + log[2]
		}
		return log[2]
	},
	logHelpPage: (log: any[]) => {
		const helpPages = {
			fr: {
				too_much_ops: "Comprendre les Erreurs d'exécution",
				summons: "Bulbes"
			},
			en: {
				too_much_ops: "Operations",
				summons: "Bulbs"
			}
		} as any
		return helpPages[locale][log[4]]
	}
}

function setTitle(title: string | TranslateResult | null, subtitle: string | TranslateResult | null = null) {
	if (LeekWars.sfw) {
		LeekWars.title = LeekWars.sfwTitle
	} else {
		LeekWars.title = title as string
	}
	updateTitle()
	setSubTitle(subtitle)
}
function setTitleCounter(counter: number) {
	LeekWars.titleCounter = counter
	updateTitle()
}
function setTitleTag(tag: any) {
	LeekWars.titleTag = tag
	updateTitle()
}
function setSubTitle(subtitle: any) {
	LeekWars.subtitle = subtitle
}

function updateTitle() {
	let title = LeekWars.title
	if (!LeekWars.sfw) {
		if (!title) {
			title = 'Leek Wars'
		} else {
			title = title + ' - Leek Wars'
		}
	}
	if (LeekWars.titleCounter > 0) {
		title = '(' + LeekWars.titleCounter + ') ' + title
	}
	if (LeekWars.titleTag !== null) {
		title = '[' + LeekWars.titleTag + '] ' + title
	}
	document.title = title
}

function setFavicon(reset: boolean = false) {
	if (env.BETA) {
		LeekWars.favicon('/image/favicon_beta.png')
	} else if (LeekWars.DEV) {
		LeekWars.favicon('/image/favicon_dev.png')
	} else if (LeekWars.LOCAL) {
		LeekWars.favicon('/image/favicon_local.png')
	} else if (reset) {
		LeekWars.favicon('/image/favicon.png')
	}
}

function potionsBySkin(potions: {[key: string]: PotionTemplate}) {
	const result: { [key: number]: PotionTemplate } = {}
	for (const p in potions) {
		const potion = potions[p]
		if (potion.effects.length && potion.effects[0].type === PotionEffect.CHANGE_SKIN) {
			result[potion.effects[0].params[0]] = potion
		}
	}
	return result
}

function potionByName(potions: {[key: string]: PotionTemplate}) {
	const result: { [key: string]: PotionTemplate } = {}
	for (const w in potions) {
		const potion = potions[w]
		result[potion.name] = potion
	}
	return result
}

function weaponByName(weapons: {[key: string]: WeaponTemplate}) {
	const result: { [key: string]: WeaponTemplate } = {}
	for (const w in weapons) {
		const weapon = weapons[w]
		result[weapon.name] = weapon
	}
	return result
}


function formatDuration(timestamp: number, capital: boolean = false) {

	if (timestamp === 0 || timestamp == null) { return "-" }

	const seconds = LeekWars.time - timestamp

	let text: any = ""

	if (seconds < 60) { // en dessous d'une minute
		text = i18n.t("main.time_just_now")
	} else if (seconds < 3600) { // en dessous d'une heure
		const minuts = Math.floor(seconds / 60)
		if (minuts === 1) {
			text = i18n.t("main.time_1_minute_ago")
		} else {
			text = i18n.t("main.time_x_minutes_ago", [minuts])
		}
	} else if (seconds < 24 * 3600) { // en dessous d'un jour
		const hours = Math.floor(seconds / 3600)
		if (hours === 1) {
			text = i18n.t("main.time_1_hour_ago")
		} else {
			text = i18n.t("main.time_x_hours_ago", [hours])
		}
	} else if (seconds < 30 * 24 * 3600) { // en dessous d'un mois
		const days = Math.floor(seconds / (24 * 3600))
		if (days === 1) {
			text = i18n.t("main.time_1_day_ago")
		} else {
			text = i18n.t("main.time_x_days_ago", [days])
		}
	} else if (seconds < 12 * 30 * 24 * 3600) { // en dessous d'un an
		const months = Math.floor(seconds / (30 * 24 * 3600))
		if (months === 1) {
			text = i18n.t("main.time_1_month_ago")
		} else {
			text = i18n.t("main.time_x_months_ago", [months])
		}
	} else { // au dessus d'un an
		const years = Math.floor(seconds / (12 * 30 * 24 * 3600))
		if (years === 1) {
			text = i18n.t("main.time_1_year_ago")
		} else {
			text = i18n.t("main.time_x_years_ago", [years])
		}
	}
	if (capital === true) {
		text = ucfirst(text)
	}
	return text
}

function formatDate(timestamp: number) {
	const date = new Date(timestamp * 1000)
	const day = date.getDate()
	const month = date.getMonth()
	const year = date.getFullYear()
	if (i18n.locale === 'fr') {
		return day + ' ' + MONTHS[i18n.locale][month] + ' ' + year
	} else {
		return ucfirst(MONTHS[i18n.locale][month]) + ' ' + day + ', ' + year
	}
}

function formatDayMonthShort(timestamp: number) {
	const date = new Date(timestamp * 1000)
	const day = date.getDate()
	const month = date.getMonth()
	return day + ' ' + MONTHS_SHORT[i18n.locale][month]
}

function formatDateTime(timestamp: number) {
	const date = new Date(timestamp * 1000)
	const day = date.getDate()
	const month = date.getMonth()
	const year = date.getFullYear()
	const hour = date.getHours()
	let minuts: any = date.getMinutes()
	if (minuts < 10) { minuts = '0' + minuts }
	if (i18n.locale === 'fr') {
		return day + ' ' + MONTHS[i18n.locale][month] + ' ' + year + " à " + hour + ":" + minuts
	} else /* if (i18n.locale == 'en') */ {
		return ucfirst(MONTHS[i18n.locale][month]) + ' ' + day + ', ' + year + " at " + hour + ":" + minuts
	}
}

function formatTimeSeconds(time: number) {
	const hours = Math.floor(time / 3600)
	const minuts = Math.floor((time % 3600) / 60)
	const seconds = time - hours * 3600 - minuts * 60
	let res = ""
	if (hours > 0) { res += hours + "h " }
	if (minuts > 0) { res += ("0" + minuts + "m ").substr(-4) }
	if (seconds !== 0) { res += ("0" + seconds + "s").substr(-3) }
	return res
}

function formatTime(time: number) {
	const date = new Date(time * 1000)
	const minuts = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
	return date.getHours() + ":" + minuts
}

function createCodeArea(code: string, element: HTMLElement) {
	import(/* webpackChunkName: "codemirror" */ "@/codemirror-wrapper").then(wrapper => {
		wrapper.CodeMirror.runMode(code, "leekscript", element)
		element.innerHTML = '<span class="line-number"></span><pre>' + element.innerHTML + '</pre>'

		const num = code.split(/\n/).length
		for (let j = 0; j < num; j++) {
			const line_num = element.getElementsByTagName('span')[0]
			line_num.innerHTML += '<span>' + (j + 1) + '</span>'
		}
		element.classList.add('formatted')
	})
}
function createCodeAreaSimple(code: string, element: HTMLElement) {
	import(/* webpackChunkName: "codemirror" */ "@/codemirror-wrapper").then(wrapper => {
		wrapper.CodeMirror.runMode(code, "leekscript", element)
		element.innerHTML = '<pre>' + element.innerHTML + '</pre>'
		element.classList.add('single')
	})
}


function get_cursor_position(editableDiv: any) {
	if (window.getSelection) {
		const sel = window.getSelection()
		if (sel && sel.rangeCount) {
			const range = sel.getRangeAt(0)
			if (range.commonAncestorContainer.parentNode === editableDiv) {
				return range.endOffset
			}
		}
	}
	return 0
}

function set_cursor_position(el: any, pos: number) {
	const range = document.createRange()
	const sel = window.getSelection()
	range.setStart(el.firstChild, pos)
	range.collapse(true)
	if (sel) {
		sel.removeAllRanges()
		sel.addRange(range)
	}
}

function toChatLink(url: string, text: string, blank: string) {
	blank = blank ? blank : ""
	return '<a ' + blank + ' href="' + url + '">' + text + '</a>'
}

function linkify(html: string) {
	const make_blank = (url: string) => {
		return (url.indexOf("http://www.leekwars.com") !== 0
			&& url.indexOf("http://leekwars.com") !== 0
			&& url.indexOf("https://leekwars.com") !== 0
			&& url.indexOf("https://www.leekwars.com") !== 0) ? "target='_blank' rel='noopener'" : ""
	}
	const email_pattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim
	const url_regex = /((?:https?):\/\/[\w-]+\.[\w-]+(?:\.\w+)*)|((?:www\.)?leekwars\.com)/gim
	let match

	// eslint-disable-next-line no-cond-assign
	while (match = url_regex.exec(html)) {
		let i = match.index + match[0].length
		let par = 0, curly = 0, square = 0
		if (html[i] === '/') {
			while (i < html.length) {
				const c = html[i]
				if (c === ' ' || c === ' ' || c === '\n') { break }
				if (c === '(') { par++ }
				if (c === '[') { square++ }
				if (c === '{') { curly++ }
				if (c === ')' && --par < 0) { break }
				if (c === ']' && --square < 0) { break }
				if (c === '}' && --curly < 0) { break }
				i++
			}
			let last = html[i - 1]
			while (/[.,!?:]/.test(last)) {
				last = html[--i - 1]
			}
		}
		const url = html.substring(match.index, i).replace(/\$/g, '%24')
		const real_url = (url.indexOf('http') === -1) ? 'http://' + url : url
		const blank = make_blank(real_url)

		html = html.substring(0, match.index) + toChatLink(real_url, url, blank) + html.substring(i)
		url_regex.lastIndex += real_url.length + blank.length + '<a href=""  ></a>'.length
	}
	return html.replace(email_pattern, '<a target="_blank" rel="noopener" href="mailto:$&">$&</a>')
}

function lucky() {
	LeekWars.clover = true
	LeekWars.cloverTop = 20 + Math.random() * 200
	LeekWars.cloverLeft = 20 + Math.random() * (window.innerWidth - 80)
	setTimeout(() => LeekWars.clover = false, 5000)
	if (!LeekWars.sfw) {
		const audio = new Audio('/sound/move.mp3')
		audio.volume = 0.4
		audio.play()
	}
}

function detectNativeEmojis() {
	const ctx = document.createElement("canvas").getContext("2d")
	if (ctx) {
		ctx.fillText("😗", -2, 4)
		return ctx.getImageData(0, 0, 1, 1).data[0] > 0
	}
	return false
}

function shadeColor(color: string, amount: number) {
	return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2))
}

function goToRanking(type: string, order: string, id: number = 0) {
	// console.log("goToRanking", type, order, id)
	let url = ''
	const active = LeekWars.rankingActive ? '-active' : ''
	if (type === 'leek') {
		url = 'ranking/get-leek-rank' + active + '/' + id + '/' + order
	} else if (type === 'farmer') {
		url = 'ranking/get-farmer-rank' + active + '/' + id + '/' + order
	} else if (type === 'team') {
		url = 'ranking/get-team-rank' + active + '/' + id + '/' + order
	}
	LeekWars.get(url).then(data => {
		const page = 1 + Math.floor((data.rank - 1) / 50)
		const active_url = LeekWars.rankingActive && data.active ? '/active' : ''
		const newRoute = '/ranking/' + type + '/' + order + active_url + '/page-' + page + '#rank-' + data.rank
		if (router.currentRoute.fullPath !== newRoute) {
			router.push(newRoute)
		}
	})
}

export { LeekWars, Language }
