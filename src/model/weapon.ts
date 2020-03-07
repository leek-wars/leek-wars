import { Effect } from './effect'

class Weapon {
	public id!: number
	public template!: number
}

class WeaponTemplate {
	public id!: number
	public name!: string
	public level!: number
	public min_range!: number
	public max_range!: number
	public launch_type!: number
	public effects!: Effect[]
	public cost!: number
	public area!: number
	public los!: number
	public template!: number
	public passive_effects!: Effect[]
	public forgotten!: boolean
}

class WeaponData {
	w!: number
	h!: number
	cx!: number
	cz!: number
	ocx!: number
	x!: number
	z!: number
	mx1!: number
	mz1!: number
	mx2!: number
	mz2!: number
	sx?: number
	sz?: number
	cartX?: number
	cartZ?: number
	cartAngle?: number
	recoilForce?: number
	top!: number
	bottom!: number
	white!: boolean
}

const WeaponsData = {
	// Pistol
	1: { w: 70, h: 42, cx: 12, cz: 40, ocx: 0, x: 15, z: -15, mx1: 10, mz1: 26, mx2: 19, mz2: 18, sx: 90, sz: 22, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 3, bottom: 15, white: false },
	// Machine gun
	2: { w: 140, h: 57, cx: 15, cz: 45, ocx: 0, x: -35, z: -15, mx1: 20, mz1: 40, mx2: 63, mz2: 40, sx: 160, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 7, bottom: 32, white: false },
	// DoubleGun
	3: { w: 140, h: 52, cx: 15, cz: 35, ocx: 0, x: -10, z: -15, mx1: 11, mz1: 30, mx2: 32, mz2: 31, sx: 160, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 7, bottom: 35, white: false },
	// Shotgun
	4: { w: 160, h: 52, cx: 15, cz: 45, ocx: 0, x: -35, z: -15, mx1: 17, mz1: 30, mx2: 63, mz2: 30, sx: 160, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 9, bottom: 23, white: false },
	// Magnum
	5: { w: 80, h: 38, cx: 12, cz: 40, ocx: 0, x: 15, z: -15, mx1: 22, mz1: 32, mx2: 25, mz2: 23, sx: 94, sz: 22, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 2, bottom: 20, white: false },
	// Laser
	6: { w: 160, h: 53, cx: 15, cz: 42, ocx: 0, x: -50, z: -15, mx1: 30, mz1: 34, mx2: 79, mz2: 39, sx: 106, sz: 15, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 8, bottom: 31, white: false },
	// GrenadeLauncher
	7: { w: 130, h: 45, cx: 0, cz: 40, ocx: 0, x: -35, z: -15, mx1: 38, mz1: 28, mx2: 66, mz2: 29, sx: 150, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 7, bottom: 27, white: false },
	// FlameThrower
	8: { w: 174, h: 71, cx: 25, cz: 60, ocx: 0, x: -60, z: -15, mx1: 31, mz1: 51, mx2: 80, mz2: 50, top: 24, bottom: 39, white: false },
	// Destroyer
	9: { w: 150, h: 61, cx: 15, cz: 38, ocx: 0, x: -50, z: -15, mx1: 47, mz1: 39, mx2: 88, mz2: 42, sx: 182, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 11, bottom: 35, white: false },
	// Gazor
	10: { w: 160, h: 77, cx: 15, cz: 60, ocx: 0, x: -43, z: -12, mx1: 28, mz1: 52, mx2: 74, mz2: 50, top: 22, bottom: 40, white: false },
	// Electrisor
	11: { w: 149, h: 53, cx: 5, cz: 52, ocx: 0, x: -30, z: 0, mx1: 42, mz1: 31, mx2: 72, mz2: 34, top: 3, bottom: 33, white: false },
	// MLaser
	12: { w: 190, h: 52, cx: 15, cz: 38, ocx: 0, x: -70, z: -20, mx1: 69, mz1: 33, mx2: 114, mz2: 33, sx: 126, sz: 25, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 3, bottom: 33, white: false },
	// BLaser
	13: { w: 170, h: 45, cx: 15, cz: 38, ocx: 0, x: -70, z: -20, mx1: 33, mz1: 33, mx2: 80, mz2: 33, sx: 123, sz: 25, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 3, bottom: 35, white: false },
	// Katana
	14: { w: 250, h: 26, cx: 5, cz: 30, ocx: 10, x: 15, z: -15, mx1: 30, mz1: 12, mx2: 42, mz2: 12, top: 0, bottom: 20, white: true },
	// Broadsword
	15: { w: 160, h: 29, cx: 5, cz: 40, ocx: 15, x: 15, z: -16, mx1: 14, mz1: 14, mx2: 30, mz2: 14, top: 0, bottom: 20, white: true },
	// Axe
	16: { w: 170, h: 64, cx: 5, cz: 40, ocx: 25, x: 15, z: -35, mx1: 32, mz1: 32, mx2: 55, mz2: 32, top: 0, bottom: 20, white: true },
	// JLaser
	17: { w: 180, h: 41, cx: 15, cz: 35, ocx: 0, x: -70, z: -20, mx1: 49, mz1: 29, mx2: 75, mz2: 33, sx: 126, sz: 25, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 0, bottom: 37, white: false },
	// IllicitGrenadeLauncher
	18: { w: 134, h: 49, cx: 0, cz: 40, ocx: 0, x: -35, z: -15, mx1: 38, mz1: 28, mx2: 66, mz2: 29, sx: 150, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 7, bottom: 31, white: false },
	// MysteriousElectrisor
	19: { w: 153, h: 57, cx: 5, cz: 52, ocx: 0, x: -30, z: 0, mx1: 42, mz1: 31, mx2: 72, mz2: 34, top: 9, bottom: 33, white: false },
	// UnbridledGazor
	20: { w: 164, h: 81, cx: 15, cz: 60, ocx: 0, x: -43, z: -12, mx1: 28, mz1: 52, mx2: 74, mz2: 50, top: 17, bottom: 45, white: false },
	// RevokedMLaser
	21: { w: 194, h: 56, cx: 15, cz: 38, ocx: 0, x: -70, z: -20, mx1: 70, mz1: 34, mx2: 115, mz2: 34, sx: 126, sz: 25, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 4, bottom: 34, white: false },
} as {[key: number]: WeaponData}

export { Weapon, WeaponsData, WeaponTemplate }
