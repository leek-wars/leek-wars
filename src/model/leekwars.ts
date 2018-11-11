import packageJson from '@/../package.json'
import '@/component/editor/codemirror/runmode.js'
import { Keyword } from '@/component/editor/keywords'
import { BattleRoyale } from '@/model/battle-royale'
import { ChipTemplate } from '@/model/chip'
import { Commands } from '@/model/commands'
import { CHIP_TEMPLATES, CHIPS, CONSTANTS, FUNCTIONS, HAT_TEMPLATES, HATS, POTIONS, SUMMON_TEMPLATES, TROPHIES, TROPHY_CATEGORIES, WEAPON_TEMPLATES, WEAPONS } from '@/model/data'
import { Emojis } from '@/model/emojis'
import { Socket } from '@/model/socket'
import { Squares } from '@/model/squares'
import { store } from '@/model/store'
import { vueMain } from '@/model/vue'
import { WeaponTemplate } from '@/model/weapon'
import CodeMirror from 'codemirror'
import twemoji from 'twemoji'
import { TranslateResult } from 'vue-i18n'
import { i18n, loadLanguageAsync } from './i18n'

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
	return new Promise<T>((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open(method, url)
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
		xhr.onload = (e: any) => resolve(JSON.parse(e.target.response))
		xhr.onerror = reject
		xhr.send(params)
	})
}

function post(url: any, form: any = {}) {
	if (form instanceof FormData) {
		form.append('token', store.state.token as string)
	} else {
		if (!form.token) { form.token = store.state.token }
		const f = []
		for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		form = f.join('&')
	}
	return request('POST', 'https://leekwars.com/api/' + url, form)
}
function get<T>(url: any) {
	return request<T>('GET', 'https://leekwars.com/api/' + url)
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
	1: "green", 2: "blue", 3: "yellow", 4: "red", 5: "orange", 6: "pink", 7: "cyan", 8: "purple",
	9: "multi", 10: "rasta", 11: "white", 12: "black", 13: "alpha", 14: "apple", 15: "gold",
}

const ORDERED_CHIPS = orderChips(CHIPS)
const ORDERED_WEAPONS = orderWeapons(WEAPONS)

for (const emoji in Emojis.emojis) {
	Emojis.textToEmoji[Emojis.emojis[emoji].text] = emoji
}
Emojis.categories_formatted = Emojis.categories.map(category => {
	return {icon: Emojis.url + category.icon + '.svg', emojis: category.emojis.map(emoji => {
		const e = Emojis.emojis[emoji]
		return {emoji, text: e.image ? (':' + e.text + ':') : emoji, image: e.image ? Emojis.url + e.image + '.svg' : '/image/emoji/' + e.text + '.png', classic: !e.image}
	})}
})

class Language {
	public code!: string
	public name!: string
	public flag!: string
}

const LeekWars = {
	version: packageJson.version,
	local: false,
	beta: location.host.indexOf("beta.leekwars.com") === 0,
	dev: location.host.indexOf("localhost") === 0,
	staticURL: '/',
	avatar: 'https://leekwars.com/static/image/',
	post,
	get,
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
	service_worker: null as any,
	battleRoyale: new BattleRoyale(),
	squares: new Squares(),
	languages: {
		fr: { code: 'fr', name: 'Français', flag: '/image/flag/fr.png' } as Language,
		en: { code: 'en', name: 'English', flag: '/image/flag/gb.png' } as Language,
	} as { [key: string]: Language },
	timeDelta: 0, // (Date.now() / 1000 | 0) - __SERVER_TIME,
	time: (Date.now() / 1000) | 0, 
	timeSeconds: (Date.now() / 1000) | 0,
	large: false,
	setLocale(locale: string) {
		document.cookie = "lang=" + locale
		loadLanguageAsync(vueMain, locale)
	},
	getLeekAppearence: (level: number): number => {
		if (level < 10) { return 1 } else if (level < 20) { return 2 } else if (level < 50) { return 3 } else if (level < 80) { return 4 } else if (level < 100) { return 5 } else if (level < 150) { return 6 } else if (level < 200) { return 7 } else if (level < 250) { return 8 } else if (level < 300) { return 9 } else if (level < 301) { return 10 }
		return 11
	},
	skins: SKINS,
	getLeekSkinName: (skin: number) => {
		if (!(skin in SKINS)) { return SKINS[1] }
		return SKINS[skin]
	},
	getImageSize(image: string, callback: (r: any) => void) {
		const cached = localStorage.getItem('imagesize/' + image)
		if (cached) {
			const data = cached.split(',')
			return callback({ width: parseInt(data[0], 10), height: parseInt(data[1], 10) })
		}
		this.post('util/get-image-size', { image }).then((data: any) => {
			if (data.success) {
				localStorage.setItem('imagesize/' + image, data.width + ',' + data.height)
				callback({ width: data.width, height: data.height })
			} else {
				callback(null)
			}
		})
	},
	objectSize(obj: object): number {
		let size = 0, key
		for (key in obj) { if (obj.hasOwnProperty(key)) { size++ } }
		return size
	},
	first(obj: any) {
		for (const e in obj) {
			if (obj.hasOwnProperty(e)) {
				return obj[e]
			}
		}
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
			window.getSelection().addRange(range)
		}
	},
	removeTextSelections() {
		if (window.getSelection) {
			window.getSelection().removeAllRanges()
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
		return /Android|webOS|iPhone||iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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
		return avatarChanged === 0 ? '/image/no_avatar.png' : LeekWars.avatar + 'avatar/' + farmerID + '.png'
	},
	_countries: null as any,
	get countries() {
		if (LeekWars._countries === null) {
			LeekWars._countries = []
			get<any>('country/get-all').then((data) => {
				LeekWars._countries = data.countries
			})
		}
		return LeekWars._countries
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
		LeekWars.setFavicon()
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
	get_cursor_position, set_cursor_position,
	formatDate, formatDateTime, formatDuration, formatTime, formatTimeSeconds, formatDayMonthShort, formatEmojis,
	setTitle, setSubTitle, setTitleCounter, setTitleTag,
	createCodeArea,
	clover: false, cloverTop: 0, cloverLeft: 0, lucky,
	playSound, setFavicon,
	linkify, toChatLink,
	EFFECT_TYPES,
	socket: new Socket(),
	constants: CONSTANTS, hats: HATS, weapons: WEAPONS, chips: CHIPS, trophies: TROPHIES, chipTemplates: CHIP_TEMPLATES, trophyCategories: TROPHY_CATEGORIES, weaponTemplates: WEAPON_TEMPLATES, functions: FUNCTIONS, summonTemplates: SUMMON_TEMPLATES, potions: POTIONS, hatTemplates: HAT_TEMPLATES, orderedChips: ORDERED_CHIPS, orderedWeapons: ORDERED_WEAPONS, keywords: [] as Keyword[]
}

function setTitle(title: string | TranslateResult | null, subtitle: string | TranslateResult | null = null) {
	LeekWars.title = title as string
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
	if (!title) {
		title = 'Leek Wars'
	} else {
		title = title + ' - Leek Wars'
	}
	if (LeekWars.titleCounter > 0) {
		title = '(' + LeekWars.titleCounter + ') ' + title
	}
	if (LeekWars.titleTag !== null) {
		title = '[' + LeekWars.titleTag + '] ' + title
	}
	document.title = title
}
function setFavicon() {
	if (LeekWars.dev) {
		LeekWars.favicon('/image/favicon_dev.png')
	} else if (LeekWars.local) {
		LeekWars.favicon('/image/favicon_local.png')
	} else if (LeekWars.beta) {
		LeekWars.favicon('/image/favicon_beta.png')
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
	CodeMirror.runMode(code, "leekscript", element)
	element.innerHTML = '<pre class="code"><span class="line-number"></span>' + element.innerHTML + '<span class="cl"></span></pre>'
	const num = element.innerHTML.split(/\n/).length
	for (let j = 0; j < num; j++) {
		const line_num = element.getElementsByTagName('span')[0]
		line_num.innerHTML += '<span>' + (j + 1) + '</span>'
	}
}

function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

function formatEmojis(data: any, useShortcuts: boolean = true) {
	if (!data || typeof(data) !== 'string') { return data }
	if (useShortcuts) {
		for (const i in Emojis.shorcuts) {
			data = data.replace(new RegExp("(^|\\s|\>)" + escapeRegExp(i) + "(?![^\\s<>])", "g"), '$1' + Emojis.shorcuts[i])
		}
		data = data.replace(/:(\w+):/gi, (_: any, text: any) => {
			if (text in Emojis.textToEmoji) {
				return Emojis.textToEmoji[text]
			}
			return _
		})
	}
	// Custom smileys
	for (const i in Emojis.custom) {
		const smiley = Emojis.custom[i]
		data = data.replace(new RegExp("(^|\\s|\>)" + escapeRegExp(i) + "(?![^\\s<>])", "g"), '$1<img class="smiley" image="' + smiley + '" alt="' + i + '" title="' + i + '" src="/image/emoji/' + smiley + '.png">')
	}
	// Emoji to image
	return twemoji.parse(data, {
		callback: (icon: string, options: any) => {
			return Emojis.url + icon + '.svg'
		},
		attributes: (rawText: string, iconId: string) => {
			if (rawText in Emojis.emojis) {
				return { title: ':' + Emojis.emojis[rawText].text + ':' }
			} else {
				return {}
			}
		},
		className: 'smiley'
	})
}

function get_cursor_position(editableDiv: any) {
	if (window.getSelection) {
		const sel = window.getSelection()
		if (sel.rangeCount) {
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
	sel.removeAllRanges()
	sel.addRange(range)
}

function weaponSound(id: number) {
	return ({
		1: ['double_gun'], 2: ['machine_gun'], 3: ['double_gun'], 4: ['shotgun'],
		5: ['double_gun'], 6: ['laser'], 7: ['grenade_shoot', 0.7, 'explosion'],
		8: ['flame_thrower'], 9: ['double_gun'], 10: ['gazor'], 11: ['electrisor'],
		12: ['laser'], 13: ['laser'], 14: ['sword'], 15: ['sword'], 16: ['sword']
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
		64: ['buff'], 65: ['buff'], 66: ['buff'], 67: ['buff'], 68: ['buff'], 69: ['fire'], 70: ['liberation']
	} as {[key: number]: any})[id]
}
function playSound(item: any, type: string) {
	const play = (sounds: any) => {
		if (sounds.length === 0) { return }
		const sound = sounds[0]
		const audio = new Audio('/sound/' + sound + '.mp3')
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
			&& url.indexOf("https://www.leekwars.com") !== 0) ? "target='_blank' rel='nofollow'" : ""
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
		const url = html.substring(match.index, i)
		const real_url = (url.indexOf('http') === -1) ? 'http://' + url : url
		const blank = make_blank(real_url)

		html = html.substring(0, match.index) + toChatLink(real_url, url, blank) + html.substring(i)
		url_regex.lastIndex += real_url.length + blank.length + '<a href=""  ></a>'.length
	}
	return html.replace(email_pattern, '<a target="_blank" rel="nofollow" href="mailto:$&">$&</a>')
}

function lucky() {
	LeekWars.clover = true
	LeekWars.cloverTop = 20 + Math.random() * 200
	LeekWars.cloverLeft = 20 + Math.random() * (window.innerWidth - 80)
	setTimeout(() => LeekWars.clover = false, 5000)
}

Commands.addDocumentationCommands()
Commands.addMarketCommands()

export { LeekWars, Language }
