const fs = require('fs')
const request = require('request-promise')
const util = require('util')

const values = [
	['chips', 'chips', 'chip/get-all', '{[key: string]: ChipTemplate}'],
	['constants', 'constants', 'constant/get-all', 'Constant[]'],
	['functions', 'functions', 'function/get-all', 'Function[]'],
	['hats', 'hats', 'hat/get-all', '{[key: string]: HatTemplate}'],
	['weapons', 'weapons', 'weapon/get-all', '{[key: string]: WeaponTemplate}'],
	['potions', 'potions', 'potion/get-all', '{[key: string]: PotionTemplate}'],
	['hatTemplates', 'hat_templates', 'hat/get-templates', '{[key: string]: {id: number, item: number}}'],
	['weaponTemplates', 'weapon_templates', 'weapon/get-templates', '{[key: string]: {id: number, item: number}}'],
	['chipTemplates', 'chip_templates', 'chip/get-templates', '{[key: string]: {id: number, item: number}}'],
	['summonTemplates', "summon_templates", 'summon/get-templates', '{[key: string]: SummonTemplate}'],
	['trophies', 'trophies', 'trophy/get-all'],
	['trophyCategories', 'trophy_categories', 'trophy/get-categories']
]
const promises = []

for (const value of values) {
	const p = request('https://leekwars.com/api/' + value[2])
	promises.push(p.then((data) => {
		console.log('received', value[0])
		return "const " + value[1].toUpperCase()
			+ (value[3] ? ': ' + value[3] : '')
			+ " = " + util.inspect(JSON.parse(data)[value[1]], {depth: Infinity, breakLength: Infinity, maxArrayLength: Infinity})
			+ "\nexport { " + value[1].toUpperCase() + " }"
	}))
	p.catch((err) => {
		console.log("ERROR request failed for", value[0])
		process.exit()
	})
}
Promise.all(promises).then((result) => {
	let data = `/** This file is auto-generated from script/generate_data.js **/
import { WeaponTemplate } from '@/model/weapon'
import { ChipTemplate } from '@/model/chip'
import { PotionTemplate } from '@/model/potion'
import { HatTemplate } from '@/model/hat'
import { SummonTemplate } from '@/model/summon'
import { Function } from '@/model/function'
import { Constant } from '@/model/constant'
\n`
	for (const v of result) {
		data += v + "\n\n"
	}
	const file = 'src/model/data.ts'
	fs.writeFileSync(file, data)
	console.log(file + ' created successfully!')
})
