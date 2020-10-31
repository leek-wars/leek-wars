const fs = require('fs')
const request = require('request-promise')
const util = require('util')

const values = [
	['chips', 'chips', 'chip/get-all', '{[key: string]: ChipTemplate}'],
	['constants', 'constants', 'constant/get-all', 'Constant[]'],
	['functions', 'functions', 'function/get-all', 'Function[]'],
	['hats', 'hats', 'hat/get-all', '{[key: string]: HatTemplate}'],
	['weapons', 'weapons', 'weapon/get-all', '{[key: string]: WeaponTemplate}'],
	['pomps', 'pomps', 'pomp/get-all', '{[key: string]: PompTemplate}'],
	['potions', 'potions', 'potion/get-all', '{[key: string]: PotionTemplate}'],
	['hat_templates', 'hat_templates', 'hat/get-templates', '{[key: string]: {id: number, item: number}}'],
	['chip_templates', 'chip_templates', 'chip/get-templates', '{[key: string]: {id: number, item: number}}'],
	['summon_templates', "summon_templates", 'summon/get-templates', '{[key: string]: SummonTemplate}'],
	['trophies', 'trophies', 'trophy/get-all'],
	['trophy_categories', 'trophy_categories', 'trophy/get-categories'],
	['items', null, 'item/get-all', '{[key: string]: ItemTemplate}'],
]
const promises = []

for (const value of values) {
	// const host = 'http://localhost:5000/'
	const host = 'https://leekwars.com/'
	const p = request(host + 'api/' + value[2])
	promises.push(p.then((data) => {
		const json = JSON.parse(data)
		console.log('received', value[0])
		return "const " + value[0].toUpperCase()
			+ (value[3] ? ': ' + value[3] : '')
			+ " = " + util.inspect(value[1] ? json[value[1]] : json, {depth: Infinity, breakLength: Infinity, maxArrayLength: Infinity})
			+ "\nexport { " + value[0].toUpperCase() + " }"
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
import { ItemTemplate } from '@/model/item'
import { PompTemplate } from '@/model/pomp'
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
