import packageJson from '@/../package.json'
import { env } from '@/env'
import { locale } from '@/locale'
import { BattleRoyale } from '@/model/battle-royale'
import { CHIP_TEMPLATES, HAT_TEMPLATES, HATS, POMPS, POTIONS, SUMMON_TEMPLATES, TROPHY_CATEGORIES, COMPLEXITIES } from '@/model/data'
import { Socket } from '@/model/socket'
import { Squares } from '@/model/squares'
import { store } from '@/model/store'
import { emitter, vueMain } from '@/model/vue'
import { WeaponTemplate } from '@/model/weapon'
import router from '@/router'

import { TranslateResult } from 'vue-i18n'
import { Chat, ChatWindow } from './chat'
import { i18n, loadLanguageAsync } from './i18n'
import { ItemTemplate, ItemType } from './item'
import { PotionEffect, PotionTemplate } from './potion'
import { ITEMS } from './items'
import { SCHEMES } from './schemes'
import { COMPONENTS } from './components'
import { WEAPONS } from './weapons'
import { BossSquads } from './boss-squads'
import { nextTick, reactive } from 'vue'

const DEV = window.location.port === '8080'
const LOCAL = window.location.port === '8500' || window.location.port === '5100'

// Helper functions to avoid TypeScript "excessively deep" errors with vue-i18n
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const $t = (key: string, args?: any): string => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const t = (i18n.global as any).t
	return t(key, args)
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const $tc = (key: string, choice: number): string => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tc = (i18n.global as any).tc
	return tc(key, choice)
}
const $locale = (): string => i18n.global.locale as string

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
			// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
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
		// const f = []
		// for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		// form = f.join('&')
		form = JSON.stringify(form)
	}
	return request<T>('POST', LeekWars.API + url, form)
}
function put<T = any>(url: any, form: any = {}) {
	if (!(form instanceof FormData)) {
		// const f = []
		// for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		// form = f.join('&')
		form = JSON.stringify(form)
	}
	return request<T>('PUT', LeekWars.API + url, form)
}
function del<T = any>(url: any, form: any = {}) {
	if (!(form instanceof FormData)) {
		// const f = []
		// for (const k in form) { f.push(k + '=' + encodeURIComponent(form[k])) }
		// form = f.join('&')
		form = JSON.stringify(form)
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
	40: "iron", 41: "diamond", 42: "mafia", 43: "bordeaux",
	// 44: "ventura"
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

// ITEMS[500] = { id: 500, name: "gold_lingot", type: 7, rarity: 4, level: 72, price: 5_677_000, params: 1 } as ItemTemplate
// ITEMS[501] = { id: 501, name: "silver_lingot", type: 7, rarity: 4, level: 72, price: 5_677_000, params: 1 } as ItemTemplate

// ITEMS[1000] = { id: 1000, name: "core", type: 8, rarity: 1, level: 41, price: 155_662, params: 1 } as unknown as ItemTemplate
// ITEMS[1001] = { id: 1001, name: "core2", type: 8, rarity: 3, level: 164, price: 201_250, params: 2 } as unknown as ItemTemplate
// ITEMS[1002] = { id: 1002, name: "core3", type: 8, rarity: 4, level: 235, price: 3_332_210, params: 3 } as unknown as ItemTemplate
// ITEMS[1003] = { id: 1003, name: "battery", type: 8, rarity: 2, level: 47, price: 335_568, params: 4 } as unknown as ItemTemplate
// ITEMS[1004] = { id: 1004, name: "metal_plate", type: 8, rarity: 2, level: 37, price: 280_640, params: 5 } as unknown as ItemTemplate
// ITEMS[1005] = { id: 1005, name: "amazonite_plate", type: 8, rarity: 3, level: 103, price: 810_251, params: 6 } as unknown as ItemTemplate
// ITEMS[1006] = { id: 1006, name: "obsidian_plate", type: 8, rarity: 4, level: 263, price: 8_669_562, params: 7 } as unknown as ItemTemplate
// ITEMS[1007] = { id: 1007, name: "spring", type: 8, rarity: 2, level: 7, price: 32_030, params: 8 } as unknown as ItemTemplate
// ITEMS[1008] = { id: 1008, name: "copper_spring", type: 8, rarity: 3, level: 91, price: 1_938_878, params: 9 } as unknown as ItemTemplate
// ITEMS[1009] = { id: 1009, name: "elinvar_spring", type: 8, rarity: 4, level: 293, price: 9_793_202, params: 10 } as unknown as ItemTemplate
// ITEMS[1010] = { id: 1010, name: "ssd", type: 8, rarity: 4, level: 218, price: 6_942_436, params: 11 } as unknown as ItemTemplate
// ITEMS[1011] = { id: 1011, name: "nuclear_core", type: 8, rarity: 4, level: 283, price: 6_942_436, params: 12 } as unknown as ItemTemplate
// ITEMS[1012] = { id: 1012, name: "fan", type: 8, rarity: 2, level: 21, price: 6_942_436, params: 13 } as unknown as ItemTemplate
// ITEMS[1013] = { id: 1013, name: "sdcard", type: 8, rarity: 3, level: 88, price: 6_942_436, params: 14 } as unknown as ItemTemplate
// ITEMS[1014] = { id: 1014, name: "cd", type: 8, rarity: 2, level: 33, price: 6_942_436, params: 15 } as unknown as ItemTemplate
// ITEMS[1015] = { id: 1015, name: "neural_core", type: 8, rarity: 2, level: 112, price: 6_942_436, params: 16 } as unknown as ItemTemplate
// ITEMS[1016] = { id: 1016, name: "neural_core_pro", type: 8, rarity: 2, level: 248, price: 6_942_436, params: 17 } as unknown as ItemTemplate
// ITEMS[1017] = { id: 1017, name: "power_supply", type: 8, rarity: 2, level: 154, price: 6_942_436, params: 18 } as unknown as ItemTemplate
// ITEMS[1018] = { id: 1018, name: "chiyembekezo", type: 8, rarity: 2, level: 224, price: 6_942_436, params: 20 } as unknown as ItemTemplate
// ITEMS[1019] = { id: 1019, name: "uzoma", type: 8, rarity: 2, level: 189, price: 6_942_436, params: 19 } as unknown as ItemTemplate
// ITEMS[1020] = { id: 1020, name: "kirabo", type: 8, rarity: 2, level: 72, price: 640_710, params: 21 } as unknown as ItemTemplate
// ITEMS[1021] = { id: 1021, name: "limbani", type: 8, rarity: 2, level: 101, price: 640_710, params: 22 } as unknown as ItemTemplate
// ITEMS[1022] = { id: 1022, name: "thokozani", type: 8, rarity: 2, level: 295, price: 3_069_805, params: 23 } as unknown as ItemTemplate
// ITEMS[1023] = { id: 1023, name: "ram", type: 8, rarity: 2, level: 11, price: 640_710, params: 24 } as unknown as ItemTemplate
// ITEMS[1024] = { id: 1024, name: "ram2", type: 8, rarity: 2, level: 123, price: 640_710, params: 25 } as unknown as ItemTemplate
// ITEMS[1025] = { id: 1025, name: "ram3", type: 8, rarity: 2, level: 274, price: 640_710, params: 26 } as unknown as ItemTemplate
// ITEMS[1026] = { id: 1026, name: "motherboard", type: 8, rarity: 2, level: 49, price: 640_710, params: 27 } as unknown as ItemTemplate
// ITEMS[1027] = { id: 1027, name: "propulsor", type: 8, rarity: 2, level: 44, price: 640_710, params: 28 } as unknown as ItemTemplate
// ITEMS[1028] = { id: 1028, name: "propulsor2", type: 8, rarity: 2, level: 216, price: 640_710, params: 29 } as unknown as ItemTemplate
// ITEMS[1029] = { id: 1029, name: "morus", type: 8, rarity: 2, level: 46, price: 640_710, params: 30 } as unknown as ItemTemplate
// ITEMS[1030] = { id: 1030, name: "hylocereus", type: 8, rarity: 2, level: 255, price: 640_710, params: 31 } as unknown as ItemTemplate
// ITEMS[1031] = { id: 1031, name: "apple", type: 8, rarity: 2, level: 5, price: 640_710, params: 32 } as unknown as ItemTemplate
// ITEMS[1032] = { id: 1032, name: "nephelium", type: 8, rarity: 2, level: 138, price: 640_710, params: 33 } as unknown as ItemTemplate
// ITEMS[1033] = { id: 1033, name: "pear", type: 8, rarity: 2, level: 201, price: 640_710, params: 34 } as unknown as ItemTemplate
// ITEMS[1034] = { id: 1034, name: "blue_mango", type: 8, rarity: 2, level: 152, price: 640_710, params: 35 } as unknown as ItemTemplate
// ITEMS[1035] = { id: 1035, name: "watercooling", type: 8, rarity: 2, level: 97, price: 640_710, params: 36 } as unknown as ItemTemplate

// const SCHEMES_2 = [
	// {result: 129, items: [ null, null, null, [[111, 1]], [[63, 1]] ]},
	// {result: 131, items: [ [[86, 1]], [[64, 1]] ]},
	// {result: 290, items: [ [[215, 1]], [[193, 10]], [[204, 13]], [[203, 22]]  ]},
	// {result: 291, items: [ [[200, 1]], [[191, 25]], [[204, 45]], [[1000, 1]]  ]},
	// {result: 292, items: [ [[217, 1]], [[214, 2]], [[201, 2]], [[193, 10]], [[204, 70]], [[1001, 1]] ]},
	// {result: 293, items: [ [[198, 1]], [[148, 100]], [[192, 2]], [[204, 10]], [[203, 45]],  ]},
	// {result: 294, items: [ [[196, 20]], [[194, 30]],  [[195, 40]], [[204, 50]],  ]},
	// {result: 295, items: [ [[186, 3]], [[294, 1]],  ]},
	// {result: 296, items: [ [[213, 1]], [[217, 1]], [[295, 2]], [[294, 6]] ]},
	// {result: 297, items: [ [[215, 1]], [[204, 7]],  ]},
	// {result: 298, items: [ [[214, 1]],  [[1007, 4]] , [[199, 4]], ]},
	// {result: 299, items: [ [[213, 1]], [[188, 9]], [[298, 4]], [[501,1]] ]},
	// {result: 300, items: [ [[500, 1]], [[1003, 12]], [[202,5]], [[1008, 2]], [[204, 28]], [[183, 1]], [[291, 1]], [[189, 1]] ]},
	// {result: 301, items: [ [[216, 1]], [[214, 1]], [[213, 1]], [[188, 1]], [[294, 2]], [[186, 8]], [[297, 5]], [[200, 7]] ]},
	// {result: 302, items: [  ]},
	// {result: 303, items: [  ]},
	// {result: 304, items: [  ]},
	// {result: 305, items: [ null, [[200, 16]], null, [[213, 1]], [[1015, 1]], null, [[230, 1]] ]},
	// {result: 308, items: [ [[216, 1]], [[218, 1]], [[190, 7]], [[200, 8]], [[238, 41]], [[234, 17]] ]},
	// {result: 309, items: [ [[216, 1]], [[218, 1]], [[190, 7]], [[200, 8]], [[238, 41]], [[234, 17]] ]},
	// {result: 310, items: [ [[207, 1]], [[218, 1]], [[190, 7]], [[236, 60]], [[231, 11]], [[233, 24]] ]},
	// {result: 312, items: [ [[207, 1]], [[218, 1]], [[190, 7]], [[236, 60]], [[231, 11]], [[233, 24]] ]},
	// {result: 500, items: [ [[216, 5]] ]},
	// {result: 307, items: [ ]},
	// {result: 320, items: [ [[207, 1]], [[218, 1]], [[190, 7]], [[236, 60]], [[231, 11]], [[233, 24]] ]},
	// {result: 322, items: [ [[207, 1]], [[218, 1]], [[190, 7]], [[236, 60]], [[231, 11]], [[233, 24]] ]},
	// {result: 324, items: [ [[207, 1]], [[218, 1]], [[190, 7]], [[236, 60]], [[231, 11]], [[233, 24]] ]},
// ]

class Language {
	public code!: string
	public name!: string
	public flag!: string
	public chat!: number
	public encyclopedia!: string
	public currency!: string
	public forum!: boolean
	public beta!: boolean
}
const LANGUAGES = Object.freeze({
	fr: { code: 'fr', name: 'Français', country: 'fr', flag: '/image/flag/fr.png', chat: 1, encyclopedia: 'Encyclopédie', chats: [1, 32506, 32507], currency: 'EUR', beta: false, forum: true } as Language,
	en: { code: 'en', name: 'English', country: 'gb', flag: '/image/flag/gb.png', chat: 2, encyclopedia: 'Encyclopedia', chats: [2, 32508, 32509], currency: 'USD', beta: false, forum: true } as Language,
	es: { code: 'es', name: 'Español', country: 'es', flag: '/image/flag/es.png', chat: 2, encyclopedia: 'Enciclopedia', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	de: { code: 'de', name: 'Deutsch', country: 'de', flag: '/image/flag/de.png', chat: 2, encyclopedia: 'Enzyklopädie', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	it: { code: 'it', name: 'Italiano', country: 'it', flag: '/image/flag/it.png', chat: 2, encyclopedia: 'Enciclopedia', chats: null, currency: 'EUR', beta: false, forum: false } as Language,
	pt: { code: 'pt', name: 'Portugais', country: 'pt', flag: '/image/flag/pt.png', chat: 2, encyclopedia: 'Enciclopédia', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	da: { code: 'da', name: 'Dansk', country: 'dk', flag: '/image/flag/da.png', chat: 2, encyclopedia: 'Encyklopædi', chats: null, currency: 'DKK', beta: true, forum: false } as Language,
	fi: { code: 'fi', name: 'Suomi', country: 'fi', flag: '/image/flag/fi.png', chat: 2, encyclopedia: 'Tietosanakirja', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	nl: { code: 'nl', name: 'Nederlands', country: 'nl', flag: '/image/flag/nl.png', chat: 2, encyclopedia: 'Encyclopedie', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	no: { code: 'no', name: 'Norsk', country: 'no', flag: '/image/flag/no.png', chat: 2, encyclopedia: 'Encyclopedia', chats: null, currency: 'NOK', beta: true, forum: false } as Language,
	pl: { code: 'pl', name: 'Polska', country: 'pl', flag: '/image/flag/pl.png', chat: 2, encyclopedia: 'Encyklopedia', chats: null, currency: 'EUR', beta: true, forum: false } as Language,
	sv: { code: 'sv', name: 'Svenska', country: 'se', flag: '/image/flag/sv.png', chat: 2, encyclopedia: 'Encyklopedi', chats: null, currency: 'SEK', beta: true, forum: false } as Language,
	ru: { code: 'ru', name: 'Русский', country: 'ru', flag: '/image/flag/ru.png', chat: 2, encyclopedia: 'Энциклопедия', chats: null, currency: 'RUB', beta: true, forum: false } as Language,
	zh: { code: 'zh', name: '中文', country: 'cn', flag: '/image/flag/cn.png', chat: 2, encyclopedia: '百科全书', chats: null, currency: 'RUB', beta: true, forum: false } as Language,
	hi: { code: 'hi', name: 'भारतीय', country: 'in', flag: '/image/flag/in.png', chat: 2, encyclopedia: 'विश्वकोश', chats: null, currency: 'USD', beta: true, forum: false } as Language,
	id: { code: 'id', name: 'Bahasa', country: 'id', flag: '/image/flag/id.png', chat: 2, encyclopedia: 'Ensiklopedia', chats: null, currency: 'USD', beta: true, forum: false } as Language,
	ja: { code: 'ja', name: '日本', country: 'jp', flag: '/image/flag/jp.png', chat: 2, encyclopedia: '百科事典', chats: null, currency: 'JPY', beta: true, forum: false } as Language,
	ko: { code: 'ko', name: '한국인', country: 'kr', flag: '/image/flag/kr.png', chat: 2, encyclopedia: '백과 사전', chats: null, currency: 'USD', beta: true, forum: false } as Language,
} as { [key: string]: Language })

const LOCAL_DATE = new Date()
const invdate = new Date(LOCAL_DATE.toLocaleString('en-US', {
    timeZone: 'Europe/Paris'
}))
const DATE = new Date(invdate.getTime())

const LeekWars = reactive({
	version: packageJson.version,
	normal_version: packageJson.version.replace(/\.\d+$/, ''),
	smart_version: packageJson.version.replace(/\.0$/, ''),
	DEV,
	LOCAL,
	API: LOCAL ? window.location.origin + '/api/' : (DEV ? 'https://leekwars.com/api/' : 'http://' + window.location.host + '/api/'),
	SERVER: LOCAL ? window.location.origin + '/' : (DEV ? 'https://leekwars.com/' : 'http://' + window.location.host + '/'),
	AVATAR: LOCAL ? window.location.origin + '/' : (DEV ? 'https://leekwars.com/' : 'http://' + window.location.host + '/'),
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
	rankingInactive: localStorage.getItem('options/ranking-inactive') === 'true',
	service_worker: null as ServiceWorkerRegistration | null,
	battleRoyale: new BattleRoyale(),
	bossSquads: new BossSquads(),
	squares: new Squares(),
	languages: LANGUAGES,
	currencies: Object.freeze({
		AUD: {symbol: 'A$', flag: 'au', prefix: true},
		CAD: {symbol: 'C$', flag: 'ca', prefix: true},
		CHF: {symbol: 'CHF', flag: 'ch' },
		CNY: {symbol: '¥', flag: 'cn' },
		EUR: {symbol: '€', flag: 'eu'},
		DKK: {symbol: 'kr', flag: 'dk'},
		GBP: {symbol: '£', flag: 'gb', prefix: true},
		HKD: {symbol: 'HK$', flag: 'hk', prefix: true},
		JPY: {symbol: '¥', flag: 'jp'},
		NOK: {symbol: 'kr', flag: 'no'},
		NZD: {symbol: 'NZ$', flag: 'nz', prefix: true},
		SEK: {symbol: 'kr', flag: 'se'},
		SGD: {symbol: 'S$', flag: 'sg', prefix: true},
		USD: {symbol: '$', flag: 'us', prefix: true},
	}),
	currency: localStorage.getItem('currency') || LANGUAGES[locale].currency,
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
	keepConnected: null as any,
	startIntervals: () => {
		if (LeekWars.keepConnected || !store.state.connected) { return }
		LeekWars.keepConnected = setInterval(() => {
			store.commit('last-connection', LeekWars.time)
			LeekWars.post('farmer/update').then(data => {
				store.commit('connected-count', data.farmers)
			})
		}, 59 * 1000)
	},
	clearIntervals: () => {
		if (LeekWars.keepConnected) {
			clearInterval(LeekWars.keepConnected)
			LeekWars.keepConnected = null
		}
	},
	setLocale(locale: string) {
		loadLanguageAsync(vueMain, locale)
		LeekWars.put('farmer/set-language', {language: locale})
		if (DEV || LOCAL) {
			localStorage.setItem('locale', locale)
		}
	},
	getLeekAppearance: (level: number): number => {
		if (level < 10) { return 1 } else if (level < 20) { return 2 } else if (level < 50) { return 3 } else if (level < 80) { return 4 } else if (level < 100) { return 5 } else if (level < 150) { return 6 } else if (level < 200) { return 7 } else if (level < 250) { return 8 } else if (level < 300) { return 9 } else if (level < 301) { return 10 }
		return 11
	},
	skins: Object.freeze(SKINS),
	leekSizes: Object.freeze(LEEK_SIZES),
	isPublicChat: (id: number) => id in LeekWars.publicChats,
	publicChats: {
		1: { id: 1, name: 'Général', language: 'fr', icon: 'mdi-chat-outline' },
		32506: { id: 32506, name: 'Aide', language: 'fr', icon: 'mdi-help-circle-outline' },
		32507: { id: 32507, name: 'Programmation', language: 'fr', icon: 'mdi-code-braces' },
		2: { id: 2, name: 'General', language: 'en', icon: 'mdi-chat-outline' },
		32508: { id: 32508, name: 'Help', language: 'en', icon: 'mdi-help-circle-outline' },
		32509: { id: 32509, name: 'Programming', language: 'en', icon: 'mdi-code-braces' },
		3: { id: 3, name: 'General', language: 'es', icon: 'mdi-chat-outline' },
		// 33187: { id: 33187, name: 'Ayuda', language: 'es', icon: 'mdi-help-circle-outline' },
		// 33188: { id: 33188, name: 'Programación', language: 'es', icon: 'mdi-code-braces' },
		4: { id: 4, name: 'General', language: 'de', icon: 'mdi-chat-outline' },
		5: { id: 5, name: 'Generale', language: 'it', icon: 'mdi-chat-outline' },
		6: { id: 6, name: 'Geral', language: 'pt', icon: 'mdi-chat-outline' },
		7: { id: 7, name: 'Generelt', language: 'da', icon: 'mdi-chat-outline' },
		8: { id: 8, name: 'Yleistä', language: 'fi', icon: 'mdi-chat-outline' },
		9: { id: 9, name: 'General', language: 'nl', icon: 'mdi-chat-outline' },
		10: { id: 10, name: 'General', language: 'no', icon: 'mdi-chat-outline' },
		11: { id: 11, name: 'General', language: 'pl', icon: 'mdi-chat-outline' },
		12: { id: 12, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		13: { id: 13, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		14: { id: 14, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		15: { id: 15, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		16: { id: 16, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		17: { id: 17, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
		18: { id: 18, name: 'General', language: 'sv', icon: 'mdi-chat-outline' },
	} as {[key: number]: { name: string, language: string }},
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
	formatTurns(turns: number) {
		return turns === -1 ? '∞' : turns
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
			LeekWars._documentationPromises[locale] = promise
			promise.then((data) => {
				LeekWars._documentation[locale] = data
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
		reader.onloadend = e => {
			imageElem.setAttribute('src', e.target!.result as string)
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
		if (newWindow && newWindow.focus) {
			newWindow.focus()
		}
	},
	fullscreen: false,
	fullscreenEnter(element: HTMLElement, callback: (f: boolean) => void) {
		const fullscreenCallback = () => {
			LeekWars.fullscreen = !LeekWars.fullscreen
			emitter.emit('resize')
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
	themeSetting: localStorage.getItem('theme') || 'auto',
	darkMode: localStorage.getItem('theme') !== null && localStorage.getItem('theme') !== 'auto' ? localStorage.getItem('theme') === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches,
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
	formatDate, formatDateTime, formatDuration, formatTime, formatTimeSeconds, formatDayMonthShort, formatLongDuration,
	setTitle, setSubTitle, setTitleCounter, setTitleTag,
	shadeColor,
	createCodeArea, createCodeAreaSimple,
	clover: false, cloverTop: 0, cloverLeft: 0, cloverDX: 0, cloverDY: 0, cloverDDX: 0, cloverDDY: 0, cloverFake: false, cloverTimeout: null as any, lucky,
	setFavicon,
	linkify, toChatLink,
	goToRanking,
	track: (event: string) => {
		if (typeof umami !== 'undefined') {
			umami.track(event)
		}
	},
	didactitial: false,
	didactitial_step: 0,
	didactitial_visible: false,
	show_didactitiel: () => {
		LeekWars.didactitial = true
		LeekWars.didactitial_step = 1
		nextTick(() => {
			LeekWars.didactitial_visible = true
		})
	},
	didactitial_next: () => {
		LeekWars.didactitial_step++
		LeekWars.didactitial_visible = false
		nextTick(() => LeekWars.didactitial_visible = true)
	},
	socket: new Socket(),
	hats: Object.freeze(HATS),
	pomps: Object.freeze(POMPS),
	schemes: Object.freeze(SCHEMES),
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
		'mdi-crown-outline'
	]),
	summonTemplates: Object.freeze(SUMMON_TEMPLATES),
	potions: Object.freeze(POTIONS),
	potionByName: Object.freeze(POTION_BY_NAME),
	hatTemplates: Object.freeze(HAT_TEMPLATES),
	potionsBySkin: Object.freeze(POTIONS_BY_SKIN),
	complexities: Object.freeze(COMPLEXITIES),
	components: Object.freeze(COMPONENTS),
	characteristics: Object.freeze(['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'cores', 'ram', 'mp', 'tp']),
	// characteristics_table: Object.freeze(['life', 'magic', 'strength', 'frequency', 'wisdom', 'ram', 'agility', 'cores', 'resistance', 'mp', 'science', 'tp']),
	characteristics_table: Object.freeze(['life', 'magic', 'strength', 'frequency', 'wisdom', 'cores', 'agility', 'ram', 'resistance', 'mp', 'science', 'tp']),
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
	encyclopedia: {} as {[key: string]: {[key: string]: any}},
	encyclopediaById: {} as {[key: string]: {[key: number]: any}},
	encyclopediaLoaded: {} as {[key: string]: boolean},
	loadEncyclopedia: (locale: string) => {
		// console.log("load encyclopedia", locale)
		if (!LeekWars.encyclopediaLoaded[locale]) {
			LeekWars.encyclopediaLoaded[locale] = true
			LeekWars.get('encyclopedia/get-all-locale/' + locale).then(pages => {
				LeekWars.encyclopedia[locale] = pages
				LeekWars.encyclopediaById[locale] = {}
				for (const page in pages) {
					LeekWars.encyclopediaById[locale][pages[page].id] = pages[page]
				}
			})
		}
	},
	countries: [] as readonly string[],
	loadCountries: () => {
		// console.log("load countries")
		if (!LeekWars.countries.length) {
			LeekWars.get<string[]>('country/get-all').then((data) => {
				LeekWars.countries = Object.freeze(data)
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
		if (log[1] === 11) { return $t('leekscript.too_much_debug') }
		if (log[1] >= 6 && log[1] <= 8) {
			if (log[3] === 113) { // HELP_PAGE_LINK
				const helpPage = LeekWars.logHelpPage(log)
				return helpPage
			}
			return $t('leekscript.error_' + log[3], log[4]) + "\n" + log[2]
		}
		return log[2]
	},
	logHelpPage: (log: any[]) => {
		const helpPages = {
			fr: { too_much_ops: "Comprendre les Erreurs d'exécution", summons: "Bulbes" },
			en: { too_much_ops: "Understanding Runtime Errors",	summons: "Bulbs" },
			es: { too_much_ops: "Comprender los errores de tiempo de ejecución", summons: "Bulbos" }
		} as any
		if (locale in helpPages) {
			return helpPages[locale][log[4]]
		}
		return helpPages.en[log[4]]
	},
	completionsProvider: null as any,
	unload: () => {
		// console.log("Leek Wars unload")
		// if (LeekWars.completionsProvider) {
		// 	LeekWars.completionsProvider.dispose()
		// }
	}
})

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
		text = $t("main.time_just_now")
	} else if (seconds < 3600) { // en dessous d'une heure
		const minuts = Math.floor(seconds / 60)
		if (minuts === 1) {
			text = $t("main.time_1_minute_ago")
		} else {
			text = $t("main.time_x_minutes_ago", [minuts])
		}
	} else if (seconds < 24 * 3600) { // en dessous d'un jour
		const hours = Math.floor(seconds / 3600)
		if (hours === 1) {
			text = $t("main.time_1_hour_ago")
		} else {
			text = $t("main.time_x_hours_ago", [hours])
		}
	} else if (seconds < 30 * 24 * 3600) { // en dessous d'un mois
		const days = Math.floor(seconds / (24 * 3600))
		if (days === 1) {
			text = $t("main.time_1_day_ago")
		} else {
			text = $t("main.time_x_days_ago", [days])
		}
	} else if (seconds < 12 * 30 * 24 * 3600) { // en dessous d'un an
		const months = Math.floor(seconds / (30 * 24 * 3600))
		if (months === 1) {
			text = $t("main.time_1_month_ago")
		} else {
			text = $t("main.time_x_months_ago", [months])
		}
	} else { // au dessus d'un an
		const years = Math.floor(seconds / (12 * 30 * 24 * 3600))
		if (years === 1) {
			text = $t("main.time_1_year_ago")
		} else {
			text = $t("main.time_x_years_ago", [years])
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
	if ($locale() === 'en') {
		return ucfirst($t('main.month_' + month)) + ' ' + day + ', ' + year
	} else {
		return day + ' ' + $t('main.month_' + month) + ' ' + year
	}
}

function getMonthShort(month: number) {
	const month_str = $t('main.month_' + month) as string
	const month_short = month_str.length > 5 ? month_str.substring(0, 4) + '.' : month_str
	return month_short
}

function formatDayMonthShort(timestamp: number) {
	const date = new Date(timestamp * 1000)
	const day = date.getDate()
	const month = date.getMonth()
	return day + ' ' + getMonthShort(month)
}

function formatDateTime(timestamp: number) {
	const date = new Date(timestamp * 1000)
	const hour = date.getHours()
	let minuts: any = date.getMinutes()
	if (minuts < 10) { minuts = '0' + minuts }
	return ucfirst($t('main.time_at', [ formatDate(timestamp), hour + ":" + minuts]))
}

function formatTimeSeconds(time: number) {
	const hours = Math.floor(time / 3600)
	const minuts = Math.floor((time % 3600) / 60)
	const seconds = time - hours * 3600 - minuts * 60
	let res = ""
	if (hours > 0) { res += hours + "h " }
	if (minuts > 0) { res += ("0" + minuts + "m ").slice(-4) }
	if (seconds !== 0) { res += ("0" + seconds + "s").slice(-3) }
	return res
}

function formatLongDuration(seconds: number) {
	const sign = Math.sign(seconds)
	seconds = Math.abs(seconds)
	const y = Math.floor(seconds / 31536000);
	const mo = Math.floor((seconds % 31536000) / 2628000);
	const d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
	const h = Math.floor((seconds % (3600 * 24)) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	const yDisplay = y > 0 ? $tc('main.n_year', y) : "";
	const moDisplay = mo > 0 ? $tc('main.n_month', mo) : "";
	const dDisplay = d > 0 ? $tc('main.n_day', d) : "";
	const hDisplay = h > 0 ? $tc('main.n_hour', h) : "";
	const mDisplay = m > 0 ? $tc('main.n_minute', m) : "";
	const sDisplay = s >= 0 ? $tc('main.n_second', s) : "";
	return (sign < 0 ? '-' : '') + [yDisplay, moDisplay, dDisplay, hDisplay, mDisplay, sDisplay].filter(p => p).slice(0, 3).join(', ')
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

function toChatLink(url: string, text: string, blank: string, clazz: string = '') {
	blank = blank ? blank : ""
	return '<a ' + blank + ' class="' + clazz + '" href="' + url + '">' + text + '</a>'
}

function linkify(html: string) {
	const indexOf_leekwars = (url: string) => {
		const i1 = url.indexOf("http://leekwars.com")
		if (i1 !== -1) return {index: i1, length: 19}
		const i2 = url.indexOf("http://www.leekwars.com")
		if (i2 !== -1) return {index: i2, length: 23}
		const i3 = url.indexOf("https://leekwars.com")
		if (i3 !== -1) return {index: i3, length: 20}
		const i4 = url.indexOf("https://www.leekwars.com")
		if (i4 !== -1) return {index: i4, length: 24}
		return {index: -1, length: 0}
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
		let url = html.substring(match.index, i).replace(/\$/g, '%24')
		let real_url = url.indexOf('http') === -1 ? 'http://' + url : url
		const lw_index = indexOf_leekwars(real_url)
		const blank = lw_index.index === 0 ? "" : "target='_blank' rel='noopener'"
		if (lw_index.index === 0) {
			real_url = decodeURIComponent(real_url).substring(lw_index.length)
			if (real_url.length === 0) real_url = '/'
			url = real_url
		}
		const clazz = lw_index.index === 0 ? 'lw' : ''

		html = html.substring(0, match.index) + toChatLink(real_url, url, blank, clazz) + html.substring(i)
		url_regex.lastIndex += real_url.length + blank.length + '<a href=""  ></a>'.length
	}
	return html.replace(email_pattern, '<a target="_blank" rel="noopener" href="mailto:$&">$&</a>')
}

function lucky(isFake: boolean = false) {
	LeekWars.clover = true
	LeekWars.cloverTop = 20 + Math.random() * 200
	LeekWars.cloverLeft = 20 + Math.random() * (window.innerWidth - 80)
	LeekWars.cloverDX = LeekWars.cloverDDX = LeekWars.cloverLeft
	LeekWars.cloverDY = LeekWars.cloverDDY = LeekWars.cloverTop
	LeekWars.cloverFake = isFake
	if (LeekWars.cloverTimeout) { clearTimeout(LeekWars.cloverTimeout) }
	LeekWars.cloverTimeout = setTimeout(() => LeekWars.clover = false, 5000)
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
	const active = LeekWars.rankingInactive ? '' : '-active'
	if (type === 'leek') {
		url = 'ranking/get-leek-rank' + active + '/' + id + '/' + order
	} else if (type === 'farmer') {
		url = 'ranking/get-farmer-rank' + active + '/' + id + '/' + order
	} else if (type === 'team') {
		url = 'ranking/get-team-rank' + active + '/' + id + '/' + order
	}
	LeekWars.get(url).then(data => {
		const page = 1 + Math.floor((data.rank - 1) / 50)
		const active_url = data.active ? '' : '?inactive'
		const newRoute = '/ranking/' + type + '/' + order + '/page-' + page + active_url + '#rank-' + data.rank
		if (router.currentRoute.fullPath !== newRoute) {
			router.push(newRoute)
		}
	})
}

export { LeekWars, Language }
