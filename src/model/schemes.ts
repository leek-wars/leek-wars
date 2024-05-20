import { SchemeTemplate } from '@/model/scheme'

export const SCHEMES: {[key: string]: SchemeTemplate} = Object.freeze({
  '1': {
    id: 1,
    result: 290,
    items: [
      [ 215, 1 ],  null,
      [ 193, 12 ], null,
      null,        [ 233, 6 ],
      null,        [ 203, 3 ],
      null
    ],
    comment: 'core',
    quantity: 1
  },
  '2': {
    id: 2,
    result: 291,
    items: [
      [ 216, 1 ],  [ 186, 4 ],
      [ 189, 3 ],  [ 290, 1 ],
      [ 204, 30 ], null,
      [ 233, 27 ], [ 276, 1 ],
      null
    ],
    comment: 'core2',
    quantity: 1
  },
  '3': {
    id: 3,
    result: 292,
    items: [
      [ 201, 8 ],  [ 214, 2 ],
      null,        [ 291, 1 ],
      [ 204, 70 ], null,
      [ 217, 2 ],  [ 193, 10 ],
      null
    ],
    comment: 'core3',
    quantity: 1
  },
  '4': {
    id: 4,
    result: 293,
    items: [
      [ 237, 1 ], [ 148, 100 ],
      null,       [ 204, 10 ],
      [ 192, 1 ], null,
      [ 203, 8 ], [ 196, 10 ],
      null
    ],
    comment: 'battery',
    quantity: 1
  },
  '5': {
    id: 5,
    result: 294,
    items: [
      null,        [ 194, 30 ],
      null,        [ 196, 50 ],
      [ 195, 20 ], null,
      [ 204, 40 ], null,
      null
    ],
    comment: 'iron_plate',
    quantity: 1
  },
  '6': {
    id: 6,
    result: 295,
    items: [
      null,       [ 294, 1 ],
      null,       [ 186, 3 ],
      null,       [ 204, 10 ],
      [ 232, 2 ], [ 202, 1 ],
      null
    ],
    comment: 'amazonite_plate',
    quantity: 1
  },
  '7': {
    id: 7,
    result: 296,
    items: [
      [ 188, 3 ], [ 217, 2 ],
      [ 214, 1 ], [ 294, 4 ],
      [ 295, 1 ], [ 379, 90 ],
      [ 213, 3 ], [ 288, 1 ],
      null
    ],
    comment: 'obsidian_plate',
    quantity: 1
  },
  '8': {
    id: 8,
    result: 297,
    items: [
      null,       [ 195, 1 ],
      null,       [ 232, 1 ],
      [ 204, 4 ], null,
      [ 194, 1 ], null,
      null
    ],
    comment: 'spring',
    quantity: 1
  },
  '9': {
    id: 9,
    result: 298,
    items: [
      null,       [ 214, 1 ],
      null,       [ 297, 2 ],
      [ 188, 1 ], null,
      [ 199, 3 ], null,
      null
    ],
    comment: 'copper_spring',
    quantity: 1
  },
  '10': {
    id: 10,
    result: 299,
    items: [
      null,       [ 213, 4 ],
      [ 185, 1 ], [ 298, 2 ],
      [ 188, 5 ], [ 214, 2 ],
      [ 288, 1 ], [ 390, 2 ],
      null
    ],
    comment: 'elinvar_spring',
    quantity: 1
  },
  '11': {
    id: 11,
    result: 300,
    items: [
      [ 216, 1 ],  [ 293, 1 ],
      [ 202, 2 ],  [ 298, 1 ],
      [ 204, 28 ], [ 183, 1 ],
      [ 291, 1 ],  [ 189, 1 ],
      null
    ],
    comment: 'ssd',
    quantity: 1
  },
  '12': {
    id: 12,
    result: 301,
    items: [
      [ 289, 1 ], [ 380, 7 ],
      [ 213, 2 ], [ 387, 1 ],
      [ 307, 1 ], [ 186, 4 ],
      [ 297, 5 ], [ 200, 4 ],
      null
    ],
    comment: 'nuclear_core',
    quantity: 1
  },
  '13': {
    id: 13,
    result: 302,
    items: [
      null,       [ 193, 9 ],
      null,       null,
      [ 232, 1 ], null,
      [ 204, 2 ], null,
      null
    ],
    comment: 'fan',
    quantity: 1
  },
  '14': {
    id: 14,
    result: 303,
    items: [
      [ 235, 5 ],  [ 304, 2 ],
      [ 231, 25 ], [ 186, 1 ],
      null,        [ 215, 3 ],
      [ 196, 15 ], [ 203, 20 ],
      null
    ],
    comment: 'sdcard',
    quantity: 1
  },
  '15': {
    id: 15,
    result: 304,
    items: [
      null,       [ 203, 3 ],
      null,       [ 191, 16 ],
      [ 233, 4 ], null,
      [ 236, 2 ], null,
      null
    ],
    comment: 'cd',
    quantity: 1
  },
  '16': {
    id: 16,
    result: 305,
    items: [
      [ 191, 50 ], [ 215, 3 ],
      [ 159, 1 ],  [ 200, 4 ],
      null,        [ 60, 1 ],
      [ 196, 8 ],  [ 186, 1 ],
      null
    ],
    comment: 'neural_core',
    quantity: 1
  },
  '17': {
    id: 17,
    result: 306,
    items: [
      null,       [ 200, 16 ],
      null,       [ 213, 1 ],
      [ 305, 1 ], null,
      [ 230, 1 ], null,
      null
    ],
    comment: 'neural_core_pro',
    quantity: 1
  },
  '18': {
    id: 18,
    result: 307,
    items: [
      [ 183, 2 ],  [ 324, 1 ],
      [ 232, 25 ], [ 293, 3 ],
      [ 229, 1 ],  [ 368, 1 ],
      [ 297, 1 ],  [ 290, 1 ],
      null
    ],
    comment: 'power_supply',
    quantity: 1
  },
  '19': {
    id: 19,
    result: 308,
    items: [
      [ 319, 1 ], [ 309, 1 ],
      null,       [ 238, 38 ],
      [ 200, 1 ], [ 203, 5 ],
      [ 216, 1 ], [ 99, 1 ],
      null
    ],
    comment: 'chiyembekezo',
    quantity: 1
  },
  '20': {
    id: 20,
    result: 309,
    items: [
      [ 218, 1 ],  [ 319, 3 ],
      [ 190, 22 ], [ 98, 1 ],
      [ 321, 5 ],  [ 377, 70 ],
      [ 236, 80 ], [ 235, 5 ],
      null
    ],
    comment: 'uzoma',
    quantity: 1
  },
  '21': {
    id: 21,
    result: 310,
    items: [
      null,        [ 234, 2 ],
      null,        [ 188, 1 ],
      [ 203, 1 ],  null,
      [ 233, 10 ], null,
      null
    ],
    comment: 'kirabo',
    quantity: 1
  },
  '22': {
    id: 22,
    result: 311,
    items: [
      [ 205, 18 ], [ 231, 2 ],
      null,        [ 239, 9 ],
      [ 198, 2 ],  null,
      [ 202, 1 ],  [ 321, 1 ],
      null
    ],
    comment: 'limbani',
    quantity: 1
  },
  '23': {
    id: 23,
    result: 312,
    items: [
      [ 192, 40 ], [ 218, 3 ],
      [ 323, 1 ],  [ 207, 3 ],
      [ 216, 2 ],  [ 217, 1 ],
      [ 49, 4 ],   [ 200, 5 ],
      null
    ],
    comment: 'thokozani',
    quantity: 1
  },
  '24': {
    id: 24,
    result: 313,
    items: [
      null,       [ 238, 1 ],
      null,       [ 204, 4 ],
      [ 196, 4 ], null,
      null,       null,
      null
    ],
    comment: 'ram',
    quantity: 1
  },
  '25': {
    id: 25,
    result: 314,
    items: [
      null,       [ 200, 3 ],
      [ 232, 2 ], [ 313, 1 ],
      [ 186, 2 ], null,
      [ 188, 3 ], [ 228, 1 ],
      null
    ],
    comment: 'ram2',
    quantity: 1
  },
  '26': {
    id: 26,
    result: 315,
    items: [
      [ 213, 2 ], null,
      [ 314, 2 ], [ 313, 1 ],
      [ 289, 1 ], null,
      [ 214, 2 ], null,
      null
    ],
    comment: 'ram3',
    quantity: 1
  },
  '27': {
    id: 27,
    result: 316,
    items: [
      [ 196, 5 ],  [ 181, 1 ],
      [ 235, 1 ],  [ 232, 2 ],
      [ 204, 10 ], [ 236, 1 ],
      [ 239, 1 ],  [ 203, 1 ],
      null
    ],
    comment: 'motherboard',
    quantity: 1
  },
  '28': {
    id: 28,
    result: 317,
    items: [
      null,       [ 204, 10 ],
      null,       [ 192, 1 ],
      [ 232, 1 ], null,
      [ 215, 1 ], null,
      null
    ],
    comment: 'propulsor',
    quantity: 1
  },
  '29': {
    id: 29,
    result: 318,
    items: [
      [ 204, 40 ], [ 288, 1 ],
      [ 215, 5 ],  [ 317, 1 ],
      null,        [ 297, 1 ],
      [ 213, 2 ],  [ 379, 80 ],
      null
    ],
    comment: 'propulsor2',
    quantity: 1
  },
  '30': {
    id: 30,
    result: 319,
    items: [
      null,       [ 231, 4 ],
      null,       [ 206, 2 ],
      [ 203, 2 ], null,
      [ 377, 4 ], null,
      null
    ],
    comment: 'morus',
    quantity: 1
  },
  '31': {
    id: 31,
    result: 320,
    items: [
      [ 199, 7 ],  [ 216, 1 ],
      [ 386, 30 ], [ 365, 1 ],
      [ 310, 1 ],  [ 201, 2 ],
      [ 309, 1 ],  [ 202, 7 ],
      null
    ],
    comment: 'hylocereus',
    quantity: 1
  },
  '32': {
    id: 32,
    result: 321,
    items: [
      null,       [ 231, 1 ],
      null,       [ 193, 5 ],
      [ 191, 4 ], null,
      null,       null,
      null
    ],
    comment: 'apple',
    quantity: 1
  },
  '33': {
    id: 33,
    result: 322,
    items: [
      [ 199, 5 ],  [ 202, 3 ],
      [ 198, 1 ],  [ 239, 5 ],
      [ 203, 20 ], [ 188, 1 ],
      null,        null,
      null
    ],
    comment: 'nephelium',
    quantity: 1
  },
  '34': {
    id: 34,
    result: 323,
    items: [
      [ 186, 3 ],  [ 203, 89 ],
      [ 197, 2 ],  [ 231, 83 ],
      [ 236, 97 ], [ 198, 5 ],
      [ 238, 79 ], [ 200, 7 ],
      null
    ],
    comment: 'blue_mango',
    quantity: 1
  },
  '35': {
    id: 35,
    result: 324,
    items: [
      null,        [ 302, 1 ],
      null,        [ 200, 2 ],
      [ 197, 1 ],  [ 297, 1 ],
      [ 236, 35 ], [ 215, 5 ],
      null
    ],
    comment: 'watercooling',
    quantity: 1
  },
  '36': {
    id: 36,
    result: 49,
    items: [
      [ 201, 1 ],  [ 188, 1 ],
      [ 233, 50 ], null,
      [ 203, 5 ],  [ 236, 5 ],
      [ 200, 1 ],  [ 186, 1 ],
      null
    ],
    comment: 'restart_potion',
    quantity: 1
  },
  '37': {
    id: 37,
    result: 248,
    items: [
      null,         [ 229, 50 ],
      [ 197, 300 ], [ 263, 5 ],
      [ 246, 1 ],   [ 288, 10 ],
      [ 247, 1 ],   [ 390, 20 ],
      null
    ],
    comment: 'potion_skin_ghost',
    quantity: 1
  },
  '38': {
    id: 38,
    result: 256,
    items: [
      [ 213, 60 ], [ 309, 6 ],
      [ 201, 60 ], [ 171, 20 ],
      [ 99, 20 ],  [ 320, 6 ],
      [ 308, 6 ],  [ 217, 60 ],
      null
    ],
    comment: 'potion_skin_venimous',
    quantity: 1
  },
  '39': {
    id: 39,
    result: 255,
    items: [
      [ 185, 25 ],  [ 387, 50 ],
      [ 217, 50 ],  [ 214, 50 ],
      [ 201, 400 ], [ 188, 400 ],
      [ 378, 280 ], [ 289, 10 ],
      null
    ],
    comment: 'potion_skin_fire',
    quantity: 1
  },
  '40': { id: 40, result: 250, items: [ [ 264, 1 ], [ 186, 80 ], [ 200, 80 ], [ 230, 10 ], [ 301, 10 ], [ 203, 9999 ], [ 323, 10 ], [ 49, 40 ], null ], comment: 'potion_skin_radioactive', quantity: 1 },
  '41': { id: 41, result: 237, items: [ null, null, null, [ 236, 9 ], null, null, null, null, null ], comment: 'salt', quantity: 1 },
  '42': {
    id: 42,
    result: 366,
    items: [
      [ 207, 1 ],  [ 198, 1 ],
      [ 388, 22 ], [ 322, 1 ],
      [ 228, 1 ],  [ 234, 10 ],
      [ 239, 8 ],  [ 193, 5 ],
      null
    ],
    comment: 'chestnut',
    quantity: 1
  },
  '43': {
    id: 43,
    result: 365,
    items: [
      [ 190, 12 ], [ 234, 18 ],
      null,        [ 206, 35 ],
      [ 198, 1 ],  null,
      [ 201, 1 ],  [ 321, 1 ],
      null
    ],
    comment: 'strawberry',
    quantity: 1
  },
  '44': {
    id: 44,
    result: 289,
    items: [
      null,       null,
      null,       [ 216, 5 ],
      null,       null,
      [ 378, 1 ], null,
      null
    ],
    comment: 'gold_lingot',
    quantity: 1
  },
  '45': {
    id: 45,
    result: 288,
    items: [
      null,       null,
      null,       [ 368, 5 ],
      null,       null,
      [ 378, 1 ], null,
      null
    ],
    comment: 'silver_lingot',
    quantity: 1
  },
  '46': {
    id: 46,
    result: 369,
    items: [
      [ 238, 80 ], [ 370, 2 ],
      [ 236, 50 ], [ 323, 1 ],
      [ 368, 1 ],  [ 200, 6 ],
      [ 390, 3 ],  [ 380, 16 ],
      null
    ],
    comment: 'blue_plum',
    quantity: 1
  },
  '47': {
    id: 47,
    result: 370,
    items: [
      null,        [ 238, 8 ],
      [ 191, 6 ],  [ 203, 20 ],
      [ 233, 10 ], [ 206, 1 ],
      [ 205, 6 ],  null,
      null
    ],
    comment: 'kiwi',
    quantity: 1
  },
  '48': {
    id: 48,
    result: 371,
    items: [
      null,        [ 310, 1 ],
      [ 238, 30 ], [ 373, 1 ],
      [ 188, 6 ],  [ 233, 37 ],
      [ 389, 36 ], [ 216, 1 ],
      null
    ],
    comment: 'quince',
    quantity: 1
  },
  '49': {
    id: 49,
    result: 372,
    items: [
      [ 386, 20 ], [ 377, 30 ],
      null,        [ 319, 1 ],
      [ 311, 1 ],  null,
      [ 198, 2 ],  [ 203, 10 ],
      null
    ],
    comment: 'onion',
    quantity: 1
  },
  '50': {
    id: 50,
    result: 373,
    items: [
      [ 231, 8 ], null,
      [ 205, 9 ], null,
      null,       [ 206, 4 ],
      null,       [ 321, 2 ],
      null
    ],
    comment: 'orange',
    quantity: 1
  },
  '51': {
    id: 51,
    result: 374,
    items: [
      [ 198, 9 ],  [ 386, 30 ],
      [ 192, 60 ], [ 231, 50 ],
      [ 186, 6 ],  [ 207, 2 ],
      [ 203, 40 ], [ 239, 36 ],
      null
    ],
    comment: 'soursop',
    quantity: 1
  },
  '52': {
    id: 52,
    result: 375,
    items: [
      [ 371, 1 ], [ 192, 20 ],
      [ 200, 1 ], [ 214, 2 ],
      null,       [ 239, 5 ],
      [ 372, 1 ], [ 388, 20 ],
      null
    ],
    comment: 'hokajin',
    quantity: 1
  },
  '53': {
    id: 53,
    result: 376,
    items: [
      [ 188, 1 ], null,
      null,       [ 231, 1 ],
      [ 202, 1 ], null,
      null,       [ 233, 20 ],
      null
    ],
    comment: 'pear',
    quantity: 1
  },
  '54': {
    id: 54,
    result: 381,
    items: [
      [ 316, 1 ],  null,
      null,        [ 200, 2 ],
      [ 215, 8 ],  [ 201, 2 ],
      [ 232, 10 ], [ 204, 10 ],
      null
    ],
    comment: 'motherboard2',
    quantity: 1
  },
  '55': {
    id: 55,
    result: 382,
    items: [
      [ 232, 20 ], [ 200, 2 ],
      [ 229, 1 ],  null,
      [ 213, 1 ],  [ 388, 16 ],
      [ 215, 40 ], [ 381, 1 ],
      null
    ],
    comment: 'motherboard3',
    quantity: 1
  },
  '56': {
    id: 56,
    result: 383,
    items: [
      null,        [ 232, 5 ],
      [ 196, 40 ], [ 313, 1 ],
      [ 204, 20 ], [ 200, 1 ],
      [ 236, 15 ], null,
      null
    ],
    comment: 'switch',
    quantity: 1
  },
  '57': {
    id: 57,
    result: 384,
    items: [
      [ 291, 1 ], [ 314, 1 ],
      [ 189, 1 ], [ 213, 1 ],
      [ 288, 2 ], [ 186, 2 ],
      [ 390, 1 ], [ 216, 1 ],
      null
    ],
    comment: 'switch pro',
    quantity: 1
  },
  '58': {
    id: 58,
    result: 385,
    items: [
      [ 186, 1 ],  [ 203, 10 ],
      [ 233, 50 ], [ 200, 1 ],
      [ 205, 40 ], [ 236, 20 ],
      [ 377, 10 ], [ 321, 2 ],
      null
    ],
    comment: 'rgb',
    quantity: 1
  },
  '59': {
    id: 59,
    result: 236,
    items: [
      null,       [ 191, 10 ],
      null,       null,
      [ 237, 1 ], null,
      null,       null,
      null
    ],
    comment: 'sea_water',
    quantity: 12
  },
  '60': {
    id: 60,
    result: 233,
    items: [
      [ 194, 4 ], null,
      null,       null,
      null,       null,
      null,       [ 195, 4 ],
      null
    ],
    comment: 'sand',
    quantity: 1
  }
})