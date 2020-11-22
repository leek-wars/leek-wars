import packageJson from '@/../package.json'
import Analyzer from '@/component/editor/analyzer'
import { Item } from '@/component/editor/editor-item'
import { Keyword } from '@/component/editor/keywords'
import { env } from '@/env'
import { BattleRoyale } from '@/model/battle-royale'
import { ChipTemplate } from '@/model/chip'
import { Commands } from '@/model/commands'
import { CHIP_TEMPLATES, CHIPS, CONSTANTS, FUNCTIONS, HAT_TEMPLATES, HATS, ITEMS, POMPS, POTIONS, SUMMON_TEMPLATES, TROPHIES, TROPHY_CATEGORIES, WEAPONS } from '@/model/data'
import { Emojis } from '@/model/emojis'
import { Socket } from '@/model/socket'
import { Squares } from '@/model/squares'
import { store } from '@/model/store'
import { vueMain } from '@/model/vue'
import { WeaponTemplate } from '@/model/weapon'
import router from '@/router'
import { TranslateResult } from 'vue-i18n'
import { ChatType, ChatWindow } from './chat'
import { i18n, loadLanguageAsync } from './i18n'
import { ItemType } from './item'
import { PotionEffect, PotionTemplate } from './potion'

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
				reject(e.target.response)
			}
		}
		xhr.onerror = reject
		xhr.send(params)
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

enum EFFECT_TYPES {
	ATTACK = 1,
	HEAL = 2,
	BOOST = 3,
	SHIELD = 4,
	TACTIC = 5,
	DAMAGE_RETURN = 6,
	POISON = 7,
	BULB = 8,
	SHACKLE = 9,
}
const SKINS: { [key: number]: string } = {
	1: "green", 2: "blue", 3: "yellow", 4: "red", 5: "orange", 6: "magenta", 7: "cyan", 8: "purple",
	9: "multi", 10: "rasta", 11: "white", 12: "black", 13: "alpha", 14: "apple", 15: "gold", 16: "pink",
	17: "grey", 18: "turquoise", 19: "celestial_blue"
}

const LEEK_SIZES: { [key: number]: {width: number, height: number} } = {
	1: {width: 68, height: 136},
	2: {width: 97,  height: 143},
	3: {width: 103, height: 151},
	4: {width: 117, height: 159},
	5: {width: 129, height: 166},
	6: {width: 136, height: 174},
	7: {width: 138, height: 181},
	8: {width: 148, height: 189},
	9: {width: 145, height: 196},
	10: {width: 159, height: 204},
	11: {width: 161, height: 211}
}

const HAT_SIZES: { [key: number]: {width: number, height: number} } = {
	1: {width: 139, height: 84}, // christmas
	2: {width: 110, height: 72}, // panama
	3: {width: 139, height: 84}, // christmas
	4: {width: 139, height: 84}, // christmas
	5: {width: 100, height: 70}, // crown
	6: {width: 140, height: 135}, // harlequin
	7: {width: 130, height: 140}, // topper
	8: {width: 150, height: 80}, // chinese
	9: {width: 200, height: 169}, // wizard
	10: {width: 200, height: 115}, // mugiwara
	11: {width: 139, height: 84}, // christmas
	12: {width: 150, height: 80}, // chinese
	13: {width: 150, height: 80}, // chinese
	14: {width: 140, height: 135}, // harlequin
	15: {width: 140, height: 135}, // harlequin
	16: {width: 200, height: 169}, // wizard
	17: {width: 200, height: 169}, // wizard
	18: {width: 200, height: 169}, // wizard
	19: {width: 200, height: 169}, // wizard
	20: {width: 150, height: 80}, // chinese
}

const ORDERED_CHIPS = orderChips(CHIPS)
const ORDERED_WEAPONS = orderWeapons(WEAPONS)
const POTIONS_BY_SKIN = potionsBySkin(POTIONS)

class Language {
	public code!: string
	public name!: string
	public flag!: string
}

const DEV = window.location.port === '8080'
const LOCAL = window.location.port === '5000'

const LeekWars = {
	version: packageJson.version,
	normal_version: packageJson.version.replace(/\.\d+$/, ''),
	smart_version: packageJson.version.replace(/\.0$/, ''),
	DEV,
	LOCAL,
	API: LOCAL ? 'http://localhost:5000/api/' : 'https://leekwars.com/api/',
	AVATAR: DEV ? 'https://leekwars.com/image/' : '/image/',
	STATIC: '/',
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
	dark: 0,
	title: '',
	subtitle: '',
	titleCounter: 0,
	titleTag: null,
	notifsResults: localStorage.getItem('options/notifs-results') === 'true',
	rankingActive: localStorage.getItem('options/ranking-active') === 'true',
	service_worker: null as ServiceWorkerRegistration | null,
	battleRoyale: new BattleRoyale(),
	squares: new Squares(),
	languages: Object.freeze({
		fr: { code: 'fr', name: 'Français', flag: '/image/flag/fr.png' } as Language,
		en: { code: 'en', name: 'English', flag: '/image/flag/gb.png' } as Language,
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
	setLocale(locale: string) {
		loadLanguageAsync(vueMain, locale)
		LeekWars.post('farmer/set-language', {language: locale})
	},
	getLeekAppearance: (level: number): number => {
		if (level < 10) { return 1 } else if (level < 20) { return 2 } else if (level < 50) { return 3 } else if (level < 80) { return 4 } else if (level < 100) { return 5 } else if (level < 150) { return 6 } else if (level < 200) { return 7 } else if (level < 250) { return 8 } else if (level < 300) { return 9 } else if (level < 301) { return 10 }
		return 11
	},
	skins: Object.freeze(SKINS),
	leekSizes: Object.freeze(LEEK_SIZES),
	hatSizes: Object.freeze(HAT_SIZES),
	analyzer: new Analyzer(),
	getLeekSkinName: (skin: number) => {
		if (!(skin in SKINS)) { return SKINS[1] }
		return SKINS[skin]
	},
	objectSize(obj: object): number {
		let size = 0, key
		for (key in obj) { if (obj.hasOwnProperty(key)) { size++ } }
		return size
	},
	first<T extends object>(obj: T) {
		for (const e in obj) {
			if (obj.hasOwnProperty(e)) {
				return obj[e]
			}
		}
		return null
	},
	firstKey(obj: any) {
		for (const e in obj) {
			if (obj.hasOwnProperty(e)) {
				return e
			}
		}
	},
	isEmptyObj(obj: any) {
		for (const e in obj) {
			if (obj.hasOwnProperty(e)) {
				return false
			}
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
	rgbArrayToHex(rgb: number[]) {
		return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)
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
	_countries: null as any,
	get countries() {
		if (LeekWars._countries === null) {
			LeekWars._countries = []
			get<any>('country/get-all').then((data) => {
				LeekWars._countries = Object.freeze(data.countries)
			})
		}
		return LeekWars._countries
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
		const types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp']
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
	popupWindow(url: string, title: string, w: number, h: number) {
		const dualScreenLeft = window.screenLeft
		const dualScreenTop = window.screenTop
		const width = window.innerWidth ? window.innerWidth : document.documentElement!.clientWidth ? document.documentElement!.clientWidth : screen.width
		const height = window.innerHeight ? window.innerHeight : document.documentElement!.clientHeight ? document.documentElement!.clientHeight : screen.height
		const left = ((width / 2) - (w / 2)) + dualScreenLeft
		const top = ((height / 2) - (h / 2)) + dualScreenTop
		const newWindow = window.open(url, title, 'scrollbars=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)
		// Puts focus on the newWindow
		if (window.focus && newWindow) {
			newWindow.focus()
		}
	},
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
	toast(message: string | TranslateResult, durationOrCallback: number | Function = 1800) {
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
	addChat(name: string, type: ChatType, title: string) {
		for (const window of LeekWars.chatWindows) {
			if (window.name === name) {
				window.expanded = true
				return
			}
		}
		LeekWars.chatWindows.push({name, type, title, expanded: true})
	},
	removeChat(i: number) {
		LeekWars.chatWindows.splice(i, 1)
	},
	get_cursor_position, set_cursor_position,
	formatDate, formatDateTime, formatDuration, formatTime, formatTimeSeconds, formatDayMonthShort, formatEmojis,
	setTitle, setSubTitle, setTitleCounter, setTitleTag,
	shadeColor,
	createCodeArea, createCodeAreaSimple,
	clover: false, cloverTop: 0, cloverLeft: 0, lucky,
	playSound, setFavicon,
	linkify, toChatLink,
	goToRanking,
	socket: new Socket(),
	EFFECT_TYPES: Object.freeze(EFFECT_TYPES),
	constants: Object.freeze(CONSTANTS),
	hats: Object.freeze(HATS),
	pomps: Object.freeze(POMPS),
	weapons: Object.freeze(WEAPONS),
	items: Object.freeze(ITEMS),
	chips: Object.freeze(CHIPS),
	trophies: Object.freeze(TROPHIES),
	chipTemplates: Object.freeze(CHIP_TEMPLATES),
	trophyCategories: Object.freeze(TROPHY_CATEGORIES),
	functions: Object.freeze(FUNCTIONS),
	summonTemplates: Object.freeze(SUMMON_TEMPLATES),
	potions: Object.freeze(POTIONS),
	hatTemplates: Object.freeze(HAT_TEMPLATES),
	orderedChips: Object.freeze(ORDERED_CHIPS),
	orderedWeapons: Object.freeze(ORDERED_WEAPONS),
	potionsBySkin: Object.freeze(POTIONS_BY_SKIN),
	keywords: [] as Keyword[],
	characteristics: Object.freeze(['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'mp', 'tp']),
	characteristics_table: Object.freeze(['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']),
	effectRawOpened: false,
	message: null as string | null,
	messagePopup: false,
	displayMessage: (message: any) => {
		if (message) {
			// console.log("Display message", message)
			LeekWars.message = message
			LeekWars.messagePopup = true
		}
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

function orderChips(chips: { [key: number]: ChipTemplate }): { [key: number]: number } {
	// Regroup chips by effects type
	const chipsByType: { [key: number]: ChipTemplate[] } = {}
	for (const i in chips) {
		const chip = chips[i]
		const type = chip.effects[0].type
		if (chipsByType[type] === undefined) { chipsByType[type] = [] }
		chipsByType[type].push(chip)
	}
	// Order chips by level and associates each chips with his position
	const orderedChips: { [key: number]: number } = {}
	let position = 0
	for (const type in EFFECT_TYPES) {
		if (chipsByType[type] !== undefined) {
			chipsByType[type]
				.sort((chipA, chipB) => {
					return chipA.level - chipB.level
				})
				.forEach((chip) => {
					orderedChips[chip.id] = position++
				})
		}
	}
	return orderedChips
}

function orderWeapons(weapons: { [key: number]: WeaponTemplate }) {
	// Order weapons by level
	const result: { [key: number]: number } = {}
	let position = 0
	for (const w in weapons) {
		result[weapons[w].id] = position++
	}
	return result
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

function formatDuration(timestamp: number, capital: boolean) {

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
		const num = element.innerHTML.split(/\n/).length
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

function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

function formatEmojis(data: any) {
	if (!data || typeof(data) !== 'string') { return data }
	// Custom smileys
	for (const i in Emojis.custom) {
		const smiley = Emojis.custom[i]
		data = data.replace(new RegExp("(^|\\s|\>)" + escapeRegExp(i) + "(?![^\\s<>])", "gi"), '$1<img class="emoji" image="' + smiley + '" alt="' + i + '" title="' + i + '" src="/image/emoji/' + smiley + '.png">')
	}
	if (LeekWars.nativeEmojis) {
		return data // nothing more to do
	} else {
		// Parse emojis
		const emoji_regex = /(\u00a9|[1-9]\u20E3|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g
		return data.replace(emoji_regex, "<span class='emoji emoji-font'>$&</span>")
	}
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

function weaponSound(id: number) {
	return ({
		1: ['double_gun'], 2: ['machine_gun'], 3: ['double_gun'], 4: ['shotgun'],
		5: ['double_gun'], 6: ['laser'], 7: ['grenade_shoot', 0.7, 'explosion'],
		8: ['flame_thrower'], 9: ['double_gun'], 10: ['gazor'], 11: ['electrisor'],
		12: ['laser'], 13: ['laser'], 14: ['sword'], 15: ['sword'], 16: ['sword'], 17: ['laser'],
		18: ['grenade_shoot', 0.7, 'explosion'], 19: ['electrisor'], 20: ['gazor', 1.2, 'explosion'], 21: ['laser', 0.1, 'poison'],
		22: ['rifle.wav', 0.15, 'rifle.wav', 0.15, 'rifle.wav'],
		23: ['double_gun'],
	} as {[key: number]: any})[id]
}
function chipSound(id: number) {
	return ({
		1: ['heal'], 2: ['heal'], 3: ['heal'], 4: ['heal'], 5: ['heal'], 6: ['lightning'],
		7: ['lightning'], 8: ['lightning'], 9: ['fire'], 10: ['fire'],
		11: ['meteorite', 1.8, 'explosion', 0.3, 'explosion', 0.3, 'explosion'],
		12: ['rock'], 13: ['rock'], 14: ['rockfall'], 15: ['ice'], 16: ['ice'], 17: ['ice'],
		18: ['shield'], 19: ['shield'], 20: ['shield'], 21: ['shield'], 22: ['shield'],
		23: ['shield'], 24: ['shield'], 25: ['buff'], 26: ['buff'], 27: ['buff'], 28: ['buff'],
		29: ['buff'], 30: ['buff'], 31: ['buff'], 32: ['buff'], 33: ['buff'], 34: ['buff'],
		35: ['buff'], 36: ['liberation'], 37: ['teleportation'], 38: ['heal'], 39: ['teleportation'],
		40: ['bulb'], 41: ['bulb'], 42: ['bulb'], 43: ['bulb'], 44: ['bulb'], 45: ['bulb'], 46: ['bulb'],
		47: ['heal'], 48: ['shield'], 49: ['heal'], 50: ['fire', 0, 'rock', 0.25, 'rock', 0.2, 'rock', 0.3, 'rock', 0.2, 'rock'],
		51: ['buff'], 52: ['heal'], 53: ['heal'], 54: ['buff'], 55: ['debuff'], 56: ['debuff'], 57: ['debuff'],
		58: ['debuff'], 59: ['debuff'], 60: ['buff'], 61: ['poison'], 62: ['poison'], 63: ['poison'],
		64: ['buff'], 65: ['buff'], 66: ['buff'], 67: ['buff'], 68: ['buff'], 69: ['fire'], 70: ['liberation'],
		71: ['sword'], 72: ['buff'], 73: ['heal'], 74: ['buff'], 75: ['alteration.wav'], 76: ['lightning', 0, 'electrisor'], 77: ['bulb'], 78: ['move']
	} as {[key: number]: any})[id]
}
function playSound(item: any, type: string) {
	const play = (sounds: any) => {
		if (sounds.length === 0) { return }
		const sound = sounds[0]
		const sound_ext = sound.includes('.') ? sound : sound + '.mp3'
		const audio = new Audio('/sound/' + sound_ext)
		audio.volume = 0.5
		audio.play()
		if (sounds.length > 1) {
			setTimeout(() => {
				play(sounds.slice(2))
			}, parseFloat(sounds[1]) * 1000)
		}
	}
	play((type === 'weapon') ? weaponSound(item.template) : chipSound(item.template))
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

	while (match = url_regex.exec(html)) {
		let i = match.index + match[0].length
		let par = 0, curly = 0, square = 0
		if (html[i] === '/') {
			while (i < html.length) {
				const c = html[i]
				if (c === ' ' || c === '\n') { break }
				if (c === '(') { par++ }
				if (c === '[') { square++ }
				if (c === '{') { curly++ }
				if (c === ')' && --par < 0) { break }
				if (c === ']' && --square < 0) { break }
				if (c === '}' && --curly < 0) { break }
				i++
			}
			let last = html[i - 1]
			while (/[\.,!?:]/.test(last)) {
				last = html[--i - 1]
			}
		}
		const url = html.substring(match.index, i).replace(/\$/g, '%24')
		const real_url = (url.indexOf('http') === -1) ? 'http://' + url : url
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
	const activeRanking = localStorage.getItem('options/ranking-active') === 'true'
	let url = ''
	const active = activeRanking ? '-active' : ''
	if (type === 'leek') {
		url = 'ranking/get-leek-rank' + active + '/' + id + '/' + order
	} else if (type === 'farmer') {
		url = 'ranking/get-farmer-rank' + active + '/' + id + '/' + order
	} else if (type === 'team') {
		url = 'ranking/get-team-rank' + active + '/' + id + '/' + order
	}
	LeekWars.get(url).then(data => {
		const page = 1 + Math.floor((data.rank - 1) / 50)
		const active_url = activeRanking && data.active ? '/active' : ''
		const newRoute = '/ranking/' + type + '/' + order + active_url + '/page-' + page + '#rank-' + data.rank
		if (router.currentRoute.fullPath !== newRoute) {
			router.push(newRoute)
		}
	})
}

Commands.addDocumentationCommands()
Commands.addMarketCommands()

export { LeekWars, Language }
