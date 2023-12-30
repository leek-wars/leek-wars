/** This file is auto-generated from script/generate_data.js **/
/* tslint:disable */
import { HatTemplate } from '@/model/hat'
import { ItemTemplate } from '@/model/item'
import { PompTemplate } from '@/model/pomp'
import { PotionTemplate } from '@/model/potion'
import { SummonTemplate } from '@/model/summon'

const HATS: {[key: string]: HatTemplate} = { '1': { id: 1, name: 'christmas_hat', level: 1, width: 0.7, height: 0.9, item: 69, crop: 0.05 }, '2': { id: 2, name: 'fedora', level: 1, width: 0.75, height: 0.95, item: 70, crop: 0.15 }, '3': { id: 3, name: 'green_christmas_hat', level: 1, width: 0.7, height: 0.9, item: 71, crop: 0.05 }, '4': { id: 4, name: 'cyan_christmas_hat', level: 1, width: 0.7, height: 0.9, item: 72, crop: 0.05 }, '5': { id: 5, name: 'crown', level: 1, width: 0.58, height: 0.8, item: 83, crop: 0.05 }, '6': { id: 6, name: 'harlequin', level: 1, width: 0.75, height: 0.95, item: 86, crop: 0.05 }, '7': { id: 7, name: 'topper', level: 1, width: 0.66, height: 0.6, item: 87, crop: 0.08 }, '8': { id: 8, name: 'chinese_hat', level: 1, width: 0.87, height: 1.1, item: 111, crop: 0.22 }, '9': { id: 9, name: 'wizard_hat', level: 1, width: 0.8, height: 0.65, item: 112, crop: 0.14 }, '10': { id: 10, name: 'mugiwara', level: 1, width: 0.85, height: 1.04, item: 113, crop: 0.22 }, '11': { id: 11, name: 'christmas_hat_black', level: 1, width: 0.7, height: 0.9, item: 127, crop: 0.05 }, '12': { id: 12, name: 'red_chinese_hat', level: 1, width: 0.87, height: 1.1, item: 128, crop: 0.22 }, '13': { id: 13, name: 'black_chinese_hat', level: 1, width: 0.87, height: 1.1, item: 129, crop: 0.22 }, '14': { id: 14, name: 'black_harlequin', level: 1, width: 0.75, height: 0.95, item: 130, crop: 0.05 }, '15': { id: 15, name: 'white_harlequin', level: 1, width: 0.75, height: 0.95, item: 131, crop: 0.05 }, '16': { id: 16, name: 'white_wizard_hat', level: 1, width: 0.8, height: 0.65, item: 132, crop: 0.14 }, '17': { id: 17, name: 'blue_wizard_hat', level: 1, width: 0.8, height: 0.65, item: 133, crop: 0.14 }, '18': { id: 18, name: 'green_wizard_hat', level: 1, width: 0.8, height: 0.65, item: 134, crop: 0.14 }, '19': { id: 19, name: 'red_wizard_hat', level: 1, width: 0.8, height: 0.65, item: 135, crop: 0.14 }, '20': { id: 20, name: 'white_chinese_hat', level: 1, width: 0.87, height: 1.1, item: 136, crop: 0.22 }, '21': { id: 21, name: 'crystal_crown', level: 1, width: 0.8, height: 0.95, item: 177, crop: 0.1 }, '22': { id: 22, name: 'crystal_crown_green', level: 1, width: 0.8, height: 0.95, item: 178, crop: 0.1 }, '23': { id: 23, name: 'crystal_crown_blue', level: 1, width: 0.8, height: 0.95, item: 179, crop: 0.1 }, '24': { id: 24, name: 'bicorn', level: 1, width: 0.9, height: 1, item: 219, crop: 0 }, '25': { id: 25, name: 'sombrero', level: 1, width: 0.88, height: 0.95, item: 220, crop: 0.2 }, '26': { id: 26, name: 'pirate_hat', level: 1, width: 0.8, height: 0.98, item: 221, crop: 0 }, '27': { id: 27, name: 'laurel_wreath', level: 1, width: 0.75, height: 0.98, item: 222, crop: 0 }, '28': { id: 28, name: 'napoleon_bicorn', level: 1, width: 0.94, height: 0.98, item: 223, crop: 0 }, '29': { id: 29, name: 'caesar_laurel_wreath', level: 1, width: 0.75, height: 0.98, item: 224, crop: 0 }, '30': { id: 30, name: 'grey_topper', level: 1, width: 0.66, height: 0.6, item: 227, crop: 0.08 }, '31': { id: 31, name: 'mortarboard', level: 1, width: 0.9, height: 0.8, item: 269, crop: 0 }, '32': { id: 32, name: 'saint_patrick', level: 1, width: 0.7, height: 0.65, item: 270, crop: 0.05 }, '33': { id: 33, name: 'red_sombrero', level: 1, width: 0.88, height: 0.95, item: 271, crop: 0.2 }, '34': { id: 34, name: 'space_hat', level: 1, width: 0.95, height: 1.1, item: 272, crop: 0.2 }, '35': { id: 35, name: 'black_fedora', level: 1, width: 0.75, height: 0.95, item: 279, crop: 0.15 }, '36': { id: 36, name: 'gold_fedora', level: 1, width: 0.75, height: 0.95, item: 280, crop: 0.15 }, '37': { id: 37, name: 'panama', level: 1, width: 0.75, height: 0.95, item: 283, crop: 0.15 }, '38': { id: 38, name: 'white_topper', level: 1, width: 0.66, height: 0.6, item: 284, crop: 0.08 }, '39': { id: 39, name: 'silver_crown', level: 1, width: 0.58, height: 0.8, item: 285, crop: 0 }, '40': { id: 40, name: 'cubic_hat', level: 1, width: 0.95, height: 0.9, item: 286, crop: 0.25 }, '41': { id: 41, name: 'cap', level: 1, width: 0.77, height: 0.92, item: 287, crop: 0.09 } }
export { HATS }

const POMPS: {[key: string]: PompTemplate} = { '123': { id: 123, name: 'hold_weapon', template: 1 }, '124': { id: 124, name: 'ai_lines', template: 2 }, '125': { id: 125, name: 'leek_title', template: 3 }, '126': { id: 126, name: 'farmer_title', template: 4 }, '240': { id: 240, name: 'angry', template: 6 }, '241': { id: 241, name: 'happy', template: 5 }, '242': { id: 242, name: 'metal', template: 7 } }
export { POMPS }

const POTIONS: {[key: string]: PotionTemplate} = {
  '49': { id: 49, name: 'restat', level: 1, consumable: true, effects: [ { type: 1, params: [] } ], duration: 0 },
  '50': {
    id: 50,
    name: 'skin_green',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '1' ] } ],
    duration: 0
  },
  '51': {
    id: 51,
    name: 'skin_blue',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '2' ] } ],
    duration: 0
  },
  '52': {
    id: 52,
    name: 'skin_yellow',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '3' ] } ],
    duration: 0
  },
  '53': {
    id: 53,
    name: 'skin_red',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '4' ] } ],
    duration: 0
  },
  '54': {
    id: 54,
    name: 'skin_orange',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '5' ] } ],
    duration: 0
  },
  '55': {
    id: 55,
    name: 'skin_magenta',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '6' ] } ],
    duration: 0
  },
  '56': {
    id: 56,
    name: 'skin_cyan',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '7' ] } ],
    duration: 0
  },
  '57': {
    id: 57,
    name: 'skin_purple',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '8' ] } ],
    duration: 0
  },
  '58': { id: 58, name: 'restat_admin', level: 1, consumable: true, effects: [ { type: 1, params: [] } ], duration: 0 },
  '61': {
    id: 61,
    name: 'skin_multi',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '9' ] } ],
    duration: 0
  },
  '62': {
    id: 62,
    name: 'skin_rasta',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '10' ] } ],
    duration: 0
  },
  '63': {
    id: 63,
    name: 'skin_black',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '12' ] } ],
    duration: 0
  },
  '64': {
    id: 64,
    name: 'skin_white',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '11' ] } ],
    duration: 0
  },
  '65': {
    id: 65,
    name: 'skin_alpha',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '13' ] } ],
    duration: 0
  },
  '66': {
    id: 66,
    name: 'skin_apple',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '14' ] } ],
    duration: 0
  },
  '82': {
    id: 82,
    name: 'skin_gold',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '15' ] } ],
    duration: 0
  },
  '137': {
    id: 137,
    name: 'skin_pink',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '16' ] } ],
    duration: 0
  },
  '138': {
    id: 138,
    name: 'skin_grey',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '17' ] } ],
    duration: 0
  },
  '139': {
    id: 139,
    name: 'skin_turquoise',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '18' ] } ],
    duration: 0
  },
  '140': {
    id: 140,
    name: 'skin_celestial_blue',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '19' ] } ],
    duration: 0
  },
  '176': {
    id: 176,
    name: 'strength',
    level: 1,
    consumable: true,
    effects: [ { type: 3, params: [ '2', '200' ] } ],
    duration: 10
  },
  '243': {
    id: 243,
    name: 'skin_marine',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '20' ] } ],
    duration: 0
  },
  '244': {
    id: 244,
    name: 'skin_greenfluo',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '21' ] } ],
    duration: 0
  },
  '245': {
    id: 245,
    name: 'skin_brown',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '22' ] } ],
    duration: 0
  },
  '246': {
    id: 246,
    name: 'skin_blackandwhite',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '23' ] } ],
    duration: 0
  },
  '247': {
    id: 247,
    name: 'skin_whiteandblack',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '24' ] } ],
    duration: 0
  },
  '248': {
    id: 248,
    name: 'skin_ghost',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '25' ] } ],
    duration: 0
  },
  '249': {
    id: 249,
    name: 'skin_salmon',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '26' ] } ],
    duration: 0
  },
  '250': {
    id: 250,
    name: 'skin_radioactive',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '27' ] } ],
    duration: 0
  },
  '251': {
    id: 251,
    name: 'skin_sand',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '28' ] } ],
    duration: 0
  },
  '252': {
    id: 252,
    name: 'skin_teal',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '29' ] } ],
    duration: 0
  },
  '253': {
    id: 253,
    name: 'skin_matcha',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '30' ] } ],
    duration: 0
  },
  '254': {
    id: 254,
    name: 'skin_peach',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '31' ] } ],
    duration: 0
  },
  '255': {
    id: 255,
    name: 'skin_fire',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '32' ] } ],
    duration: 0
  },
  '256': {
    id: 256,
    name: 'skin_venimous',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '33' ] } ],
    duration: 0
  },
  '257': {
    id: 257,
    name: 'skin_greyscale',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '34' ] } ],
    duration: 0
  },
  '258': {
    id: 258,
    name: 'skin_frozen',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '35' ] } ],
    duration: 0
  },
  '259': {
    id: 259,
    name: 'skin_dalton',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '36' ] } ],
    duration: 0
  },
  '260': {
    id: 260,
    name: 'skin_charlie',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '37' ] } ],
    duration: 0
  },
  '261': {
    id: 261,
    name: 'skin_mariniere',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '38' ] } ],
    duration: 0
  },
  '262': {
    id: 262,
    name: 'skin_france',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '39' ] } ],
    duration: 0
  },
  '263': {
    id: 263,
    name: 'skin_iron',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '40' ] } ],
    duration: 0
  },
  '264': {
    id: 264,
    name: 'skin_diamond',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '41' ] } ],
    duration: 0
  },
  '281': {
    id: 281,
    name: 'skin_bordeaux',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '43' ] } ],
    duration: 0
  },
  '282': {
    id: 282,
    name: 'skin_mafia',
    level: 1,
    consumable: false,
    effects: [ { type: 2, params: [ '42' ] } ],
    duration: 0
  }
}
export { POTIONS }

const HAT_TEMPLATES: {[key: string]: {id: number, item: number}} = { '1': { id: 1, item: 69 }, '2': { id: 2, item: 70 }, '3': { id: 3, item: 71 }, '4': { id: 4, item: 72 }, '5': { id: 5, item: 83 }, '6': { id: 6, item: 86 }, '7': { id: 7, item: 87 }, '8': { id: 8, item: 111 }, '9': { id: 9, item: 112 }, '10': { id: 10, item: 113 }, '11': { id: 11, item: 127 }, '12': { id: 12, item: 128 }, '13': { id: 13, item: 129 }, '14': { id: 14, item: 130 }, '15': { id: 15, item: 131 }, '16': { id: 16, item: 132 }, '17': { id: 17, item: 133 }, '18': { id: 18, item: 134 }, '19': { id: 19, item: 135 }, '20': { id: 20, item: 136 }, '21': { id: 21, item: 177 }, '22': { id: 22, item: 178 }, '23': { id: 23, item: 179 }, '24': { id: 24, item: 219 }, '25': { id: 25, item: 220 }, '26': { id: 26, item: 221 }, '27': { id: 27, item: 222 }, '28': { id: 28, item: 223 }, '29': { id: 29, item: 224 }, '30': { id: 30, item: 227 }, '31': { id: 31, item: 269 }, '32': { id: 32, item: 270 }, '33': { id: 33, item: 271 }, '34': { id: 34, item: 272 }, '35': { id: 35, item: 279 }, '36': { id: 36, item: 280 }, '37': { id: 37, item: 283 }, '38': { id: 38, item: 284 }, '39': { id: 39, item: 285 }, '40': { id: 40, item: 286 }, '41': { id: 41, item: 287 } }
export { HAT_TEMPLATES }

const CHIP_TEMPLATES: {[key: string]: {id: number, item: number}} = { '1': { id: 1, item: 3 }, '2': { id: 2, item: 4 }, '3': { id: 3, item: 10 }, '4': { id: 4, item: 35 }, '5': { id: 5, item: 11 }, '6': { id: 6, item: 1 }, '7': { id: 7, item: 6 }, '8': { id: 8, item: 33 }, '9': { id: 9, item: 18 }, '10': { id: 10, item: 5 }, '11': { id: 11, item: 36 }, '12': { id: 12, item: 19 }, '13': { id: 13, item: 7 }, '14': { id: 14, item: 32 }, '15': { id: 15, item: 2 }, '16': { id: 16, item: 30 }, '17': { id: 17, item: 31 }, '18': { id: 18, item: 20 }, '19': { id: 19, item: 21 }, '20': { id: 20, item: 22 }, '21': { id: 21, item: 23 }, '22': { id: 22, item: 24 }, '23': { id: 23, item: 29 }, '24': { id: 24, item: 8 }, '25': { id: 25, item: 25 }, '26': { id: 26, item: 26 }, '27': { id: 27, item: 9 }, '28': { id: 28, item: 28 }, '29': { id: 29, item: 27 }, '30': { id: 30, item: 14 }, '31': { id: 31, item: 13 }, '32': { id: 32, item: 12 }, '33': { id: 33, item: 15 }, '34': { id: 34, item: 16 }, '35': { id: 35, item: 17 }, '36': { id: 36, item: 34 }, '37': { id: 37, item: 59 }, '38': { id: 38, item: 67 }, '39': { id: 39, item: 68 }, '40': { id: 40, item: 73 }, '41': { id: 41, item: 74 }, '42': { id: 42, item: 75 }, '43': { id: 43, item: 76 }, '44': { id: 44, item: 77 }, '45': { id: 45, item: 78 }, '46': { id: 46, item: 79 }, '47': { id: 47, item: 80 }, '48': { id: 48, item: 81 }, '49': { id: 49, item: 84 }, '50': { id: 50, item: 85 }, '51': { id: 51, item: 88 }, '52': { id: 52, item: 89 }, '53': { id: 53, item: 90 }, '54': { id: 54, item: 91 }, '55': { id: 55, item: 92 }, '56': { id: 56, item: 93 }, '57': { id: 57, item: 94 }, '58': { id: 58, item: 95 }, '59': { id: 59, item: 106 }, '60': { id: 60, item: 96 }, '61': { id: 61, item: 97 }, '62': { id: 62, item: 98 }, '63': { id: 63, item: 99 }, '64': { id: 64, item: 100 }, '65': { id: 65, item: 101 }, '66': { id: 66, item: 102 }, '67': { id: 67, item: 103 }, '68': { id: 68, item: 104 }, '69': { id: 69, item: 105 }, '70': { id: 70, item: 110 }, '71': { id: 71, item: 114 }, '72': { id: 72, item: 120 }, '73': { id: 73, item: 121 }, '74': { id: 74, item: 122 }, '75': { id: 75, item: 141 }, '76': { id: 76, item: 143 }, '77': { id: 77, item: 142 }, '78': { id: 78, item: 144 }, '79': { id: 79, item: 152 }, '80': { id: 80, item: 154 }, '81': { id: 81, item: 155 }, '82': { id: 82, item: 156 }, '83': { id: 83, item: 157 }, '84': { id: 84, item: 158 }, '85': { id: 85, item: 159 }, '86': { id: 86, item: 160 }, '87': { id: 87, item: 161 }, '88': { id: 88, item: 162 }, '89': { id: 89, item: 163 }, '92': { id: 92, item: 166 }, '93': { id: 93, item: 167 }, '94': { id: 94, item: 168 }, '95': { id: 95, item: 169 }, '96': { id: 96, item: 170 }, '97': { id: 97, item: 171 }, '98': { id: 98, item: 172 }, '99': { id: 99, item: 173 }, '100': { id: 100, item: 174 }, '104': { id: 104, item: 276 }, '105': { id: 105, item: 411 }, '106': { id: 106, item: 412 }, '107': { id: 107, item: 413 }, '108': { id: 108, item: 414 }, '109': { id: 109, item: 415 }, '110': { id: 110, item: 416 }, '111': { id: 111, item: 417 }, '112': { id: 112, item: 418 }, '113': { id: 113, item: 419 }, '114': { id: 114, item: 425 } }
export { CHIP_TEMPLATES }

const SUMMON_TEMPLATES: {[key: string]: SummonTemplate} = { '1': { id: 1, name: 'puny_bulb', characteristics: { life: [ 50, 300 ], strength: [ 0, 100 ], wisdom: [ 0, 100 ], agility: [ 0, 100 ], resistance: [ 0, 100 ], science: [ 0, 100 ], magic: [ 0, 0 ], tp: [ 4, 7 ], mp: [ 3, 5 ] }, chips: [ 21, 19, 3, 8 ] }, '2': { id: 2, name: 'fire_bulb', characteristics: { life: [ 300, 500 ], strength: [ 0, 300 ], wisdom: [ 0, 200 ], agility: [ 0, 100 ], resistance: [ 0, 0 ], science: [ 0, 0 ], magic: [ 0, 0 ], tp: [ 4, 9 ], mp: [ 3, 5 ] }, chips: [ 18, 5, 36, 85 ] }, '3': { id: 3, name: 'healer_bulb', characteristics: { life: [ 300, 400 ], strength: [ 0, 0 ], wisdom: [ 0, 300 ], agility: [ 0, 100 ], resistance: [ 0, 0 ], science: [ 0, 0 ], magic: [ 0, 0 ], tp: [ 4, 8 ], mp: [ 3, 6 ] }, chips: [ 3, 10, 4, 11 ] }, '4': { id: 4, name: 'rocky_bulb', characteristics: { life: [ 400, 600 ], strength: [ 0, 200 ], wisdom: [ 0, 0 ], agility: [ 0, 100 ], resistance: [ 0, 200 ], science: [ 0, 0 ], magic: [ 0, 0 ], tp: [ 4, 8 ], mp: [ 2, 3 ] }, chips: [ 19, 7, 32, 21 ] }, '5': { id: 5, name: 'iced_bulb', characteristics: { life: [ 300, 500 ], strength: [ 0, 300 ], wisdom: [ 0, 0 ], agility: [ 0, 100 ], resistance: [ 0, 0 ], science: [ 0, 200 ], magic: [ 0, 0 ], tp: [ 5, 8 ], mp: [ 3, 4 ] }, chips: [ 2, 30, 31, 28 ] }, '6': { id: 6, name: 'lightning_bulb', characteristics: { life: [ 400, 600 ], strength: [ 0, 400 ], wisdom: [ 0, 0 ], agility: [ 0, 100 ], resistance: [ 0, 0 ], science: [ 0, 200 ], magic: [ 0, 0 ], tp: [ 6, 10 ], mp: [ 4, 6 ] }, chips: [ 1, 6, 33, 25 ] }, '7': { id: 7, name: 'metallic_bulb', characteristics: { life: [ 800, 1100 ], strength: [ 0, 0 ], wisdom: [ 0, 0 ], agility: [ 0, 100 ], resistance: [ 0, 300 ], science: [ 0, 200 ], magic: [ 0, 0 ], tp: [ 5, 9 ], mp: [ 1, 2 ] }, chips: [ 20, 22, 23, 13 ] }, '8': { id: 8, name: 'wizard_bulb', characteristics: { life: [ 300, 600 ], strength: [ 0, 0 ], wisdom: [ 0, 0 ], agility: [ 0, 100 ], resistance: [ 0, 0 ], science: [ 0, 0 ], magic: [ 0, 240 ], tp: [ 5, 8 ], mp: [ 4, 7 ] }, chips: [ 97, 98, 94, 92 ] }, '11': { id: 11, name: 'tactician_bulb', characteristics: { life: [ 500, 700 ], strength: [ 0, 0 ], wisdom: [ 0, 0 ], agility: [ 0, 200 ], resistance: [ 0, 0 ], science: [ 0, 0 ], magic: [ 0, 0 ], tp: [ 6, 6 ], mp: [ 6, 6 ] }, chips: [ 59, 68, 144, 120, 162, 163 ] }, '12': { id: 12, name: 'savant_bulb', characteristics: { life: [ 400, 600 ], strength: [ 0, 0 ], wisdom: [ 0, 0 ], agility: [ 0, 200 ], resistance: [ 0, 0 ], science: [ 0, 300 ], magic: [ 0, 0 ], tp: [ 6, 8 ], mp: [ 4, 6 ] }, chips: [ 141, 159, 16, 100 ] } }
export { SUMMON_TEMPLATES }

const TROPHY_CATEGORIES = [ { id: 1, name: 'general' }, { id: 2, name: 'fight' }, { id: 3, name: 'tournament' }, { id: 7, name: 'code' }, { id: 4, name: 'fun' }, { id: 9, name: 'boss' }, { id: 8, name: 'shopping' }, { id: 5, name: 'social' }, { id: 6, name: 'bonus' } ]
export { TROPHY_CATEGORIES }

const COMPLEXITIES: {[key: string]: string} = { '1': 'O(1)', '2': 'O(log(n))', '3': 'O(√n)', '4': 'O(n)', '5': 'O(nlog*(n))', '6': 'O(nlog(n))', '7': 'O(n²)', '8': 'O(n³)', '9': '2^poly(log(n))', '10': '2^poly(n)', '11': 'O(n!)', '12': '2^2^poly(n)', '13': '∞' }
export { COMPLEXITIES }

