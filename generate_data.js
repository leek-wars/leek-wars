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
	// const host = 'http://localhost:5000/'
	const host = 'https://leekwars.com/'
	const p = request(host + 'api/' + value[2])
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
/* tslint:disable */
import { ChipTemplate } from '@/model/chip'
import { Constant } from '@/model/constant'
import { Function } from '@/model/function'
import { HatTemplate } from '@/model/hat'
import { PotionTemplate } from '@/model/potion'
import { SummonTemplate } from '@/model/summon'
import { WeaponTemplate } from '@/model/weapon'
\n`
	for (const v of result) {
		data += v + "\n\n"
	}
	const file = 'src/model/data.ts'
	fs.writeFileSync(file, data)
	console.log(file + ' created successfully!')
})
