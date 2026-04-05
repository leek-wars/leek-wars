/** Game data is now loaded dynamically via DataController + IndexedDB */
import { HatTemplate } from '@/model/hat'
import { PompTemplate } from '@/model/pomp'
import { PotionTemplate } from '@/model/potion'
import { SummonTemplate } from '@/model/summon'

const HATS: {[key: string]: HatTemplate} = {}
export { HATS }

const POMPS: {[key: string]: PompTemplate} = {}
export { POMPS }

const POTIONS: {[key: string]: PotionTemplate} = {}
export { POTIONS }

const HAT_TEMPLATES: {[key: string]: {id: number, item: number}} = {}
export { HAT_TEMPLATES }

const CHIP_TEMPLATES: {[key: string]: {id: number, item: number}} = {}
export { CHIP_TEMPLATES }

const SUMMON_TEMPLATES: {[key: string]: SummonTemplate} = {}
export { SUMMON_TEMPLATES }

const TROPHY_CATEGORIES: any[] = []
export { TROPHY_CATEGORIES }

const COMPLEXITIES: {[key: string]: string} = {}
export { COMPLEXITIES }
