import { Effect } from './effect'

class Weapon {
	public id!: number
	public template!: number
	public quantity!: number
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
	public los!: boolean
	public template!: number
	public passive_effects!: Effect[]
	public forgotten!: boolean
	public item!: number
}

class WeaponData {
	width!: number
	height!: number
	centerX!: number
	centerZ!: number
	x!: number
	z!: number
	hand1x!: number
	hand1z!: number
	hand2x!: number
	hand2z!: number
	sx?: number
	sz?: number
	cartX?: number
	cartZ?: number
	cartAngle?: number
	recoilForce?: number
	angleForce?: number
	top!: number
	bottom!: number
	white!: boolean
	right?: number
}

const WeaponsData = {
	// Pistol
	1: { width: 70, height: 42, centerX: 15, centerZ: 40, x: 15, z: -15, hand1x: 10, hand1z: 26, hand2x: 19, hand2z: 18, sx: 90, sz: 22, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 3, bottom: 15, white: false },
	// Machine gun
	2: { width: 140, height: 57, centerX: 15, centerZ: 45, x: -35, z: -15, hand1x: 20, hand1z: 40, hand2x: 63, hand2z: 40, sx: 165, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 10, top: 7, bottom: 32, white: false },
	// DoubleGun
	3: { width: 140, height: 52, centerX: 15, centerZ: 35, x: 0, z: -20, hand1x: 11, hand1z: 30, hand2x: 32, hand2z: 31, sx: 165, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 20, angleForce: 15, top: 7, bottom: 35, white: false },
	// Shotgun
	4: { width: 160, height: 52, centerX: 15, centerZ: 45, x: -35, z: -15, hand1x: 17, hand1z: 30, hand2x: 63, hand2z: 30, sx: 170, sz: 13, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 9, bottom: 23, white: false },
	// Magnum
	5: { width: 80, height: 38, centerX: 12, centerZ: 40, x: 15, z: -15, hand1x: 22, hand1z: 32, hand2x: 25, hand2z: 23, sx: 94, sz: 18, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 2, bottom: 20, white: false },
	// Laser
	6: { width: 160, height: 53, centerX: 15, centerZ: 42, x: -40, z: -20, hand1x: 30, hand1z: 34, hand2x: 79, hand2z: 39, sx: 160, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 0, top: 8, bottom: 31, white: false },
	// GrenadeLauncher
	7: { width: 130, height: 45, centerX: 10, centerZ: 30, x: -20, z: -25, hand1x: 38, hand1z: 28, hand2x: 66, hand2z: 29, sx: 140, sz: 15, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 7, bottom: 27, white: false },
	// FlameThrower
	8: { width: 174, height: 71, centerX: 25, centerZ: 60, x: -40, z: -15, hand1x: 31, hand1z: 51, hand2x: 80, hand2z: 50, sx: 185, sz: 30, top: 24, bottom: 39, white: false },
	// Destroyer
	9: { width: 150, height: 61, centerX: 15, centerZ: 38, x: -30, z: -30, hand1x: 47, hand1z: 39, hand2x: 88, hand2z: 42, sx: 170, sz: 18, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 11, bottom: 35, white: false },
	// Gazor
	10: { width: 160, height: 77, centerX: 15, centerZ: 40, x: -30, z: -35, hand1x: 28, hand1z: 52, hand2x: 74, hand2z: 50, sx: 170, sz: 30, top: 22, bottom: 40, white: false },
	// Electrisor
	11: { width: 149, height: 53, centerX: 5, centerZ: 52, x: -22, z: -15, hand1x: 42, hand1z: 31, hand2x: 72, hand2z: 34, sx: 128, sz: 17.5, top: 3, bottom: 33, white: false },
	// MLaser
	12: { width: 190, height: 52, centerX: 15, centerZ: 40, x: -65, z: -20, hand1x: 69, hand1z: 33, hand2x: 114, hand2z: 33, sx: 185, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 0, top: 3, bottom: 30, white: false },
	// BLaser
	13: { width: 170, height: 45, centerX: 15, centerZ: 38, x: -50, z: -20, hand1x: 33, hand1z: 33, hand2x: 80, hand2z: 33, sx: 170, sz: 22, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 0, top: 3, bottom: 35, white: false },
	// Katana
	14: { width: 250, height: 26, centerX: 40, centerZ: 30, x: -40, z: -15, hand1x: 30, hand1z: 12, hand2x: 42, hand2z: 12, top: 5, bottom: 8, right: 82, white: true },
	// Broadsword
	15: { width: 160, height: 29, centerX: 25, centerZ: -5, x: 15, z: -16, hand1x: 14, hand1z: 14, hand2x: 30, hand2z: 14, top: 0, bottom: 0, right: 72, white: true },
	// Axe
	16: { width: 170, height: 64, centerX: 20, centerZ: -20, x: 15, z: -35, hand1x: 32, hand1z: 32, hand2x: 55, hand2z: 32, top: 10, bottom: 5, right: 100, white: true },
	// JLaser
	17: { width: 180, height: 41, centerX: 15, centerZ: 35, x: -50, z: -20, hand1x: 49, hand1z: 29, hand2x: 75, hand2z: 33, sx: 180, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 0, top: 0, bottom: 37, white: false },
	// IllicitGrenadeLauncher
	18: { width: 134, height: 49, centerX: 0, centerZ: 40, x: -35, z: -15, hand1x: 38, hand1z: 28, hand2x: 66, hand2z: 29, sx: 150, sz: 14, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 7, bottom: 31, white: false },
	// MysteriousElectrisor
	19: { width: 153, height: 57, centerX: 5, centerZ: 52, x: -22, z: -15, hand1x: 42, hand1z: 31, hand2x: 72, hand2z: 34, sx: 170, sz: 30, top: 9, bottom: 33, white: false },
	// UnbridledGazor
	20: { width: 164, height: 81, centerX: 15, centerZ: 40, x: -30, z: -35, hand1x: 28, hand1z: 52, hand2x: 74, hand2z: 50, sx: 170, sz: 30, top: 17, bottom: 45, white: false },
	// RevokedMLaser
	21: { width: 194, height: 56, centerX: 15, centerZ: 38, x: -70, z: -20, hand1x: 70, hand1z: 34, hand2x: 115, hand2z: 34, sx: 194, sz: 25, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 0, top: 4, bottom: 34, white: false },
	// Rifle
	22: { width: 180, height: 51, centerX: 15, centerZ: 30, x: -45, z: -20, hand1x: 36, hand1z: 34, hand2x: 74, hand2z: 32, sx: 208, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 12, top: 4, bottom: 25, white: false },
	// Rhino
	23: { width: 90, height: 51, centerX: 12, centerZ: 40, x: 15, z: -15, hand1x: 24, hand1z: 27, hand2x: 11, hand2z: 35, sx: 95, sz: 15, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 3, bottom: 30, white: false },
	// Explorer's Rifle
	24: { width: 184, height: 55, centerX: 15, centerZ: 30, x: -50, z: -20, hand1x: 37, hand1z: 35, hand2x: 75, hand2z: 33, sx: 210, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 12, top: 4, bottom: 27, white: false },
	// Foudroyeur
	25: { width: 175, height: 65, centerX: 15, centerZ: 35, x: -40, z: -35, hand1x: 29, hand1z: 46, hand2x: 64, hand2z: 46, sx: 165, sz: 26, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 15, angleForce: 12, top: 4, bottom: 40, white: false },
	// Neutrino
	27: { width: 100, height: 50, centerX: 5, centerZ: 25, x: 10, z: -35, hand1x: 25, hand1z: 33, hand2x: 18, hand2z: 40, sx: 105, sz: 20, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 4, bottom: 40, white: false },
	// Bazooka
	29: { width: 190, height: 81, centerX: 15, centerZ: 50, x: -50, z: -40, hand1x: 37, hand1z: 65, hand2x: 70, hand2z: 68, sx: 190, sz: 40, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 30, top: 0, bottom: 59, white: false },
	// Katana sombre
	32: { width: 256, height: 31, centerX: 40, centerZ: 30, x: -40, z: -15, hand1x: 32, hand1z: 14, hand2x: 44, hand2z: 14, top: 5, bottom: 10, right: 86, white: true },
	// Foudroyeur amélioré
	33: { width: 179, height: 69, centerX: 15, centerZ: 35, x: -40, z: -35, hand1x: 31, hand1z: 48, hand2x: 66, hand2z: 48, sx: 167, sz: 28, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 15, angleForce: 12, top: 4, bottom: 40, white: false },
	// Destroyer instable
	34: { width: 154, height: 65, centerX: 15, centerZ: 38, x: -30, z: -30, hand1x: 49, hand1z: 41, hand2x: 90, hand2z: 44, sx: 172, sz: 18, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, angleForce: 20, top: 11, bottom: 39, white: false },
	// Épée
	35: { width: 240, height: 61, centerX: 32, centerZ: 45, x: -40, z: -15, hand1x: 22, hand1z: 30, hand2x: 36, hand2z: 30, top: -5, bottom: 2, right: 115, white: true },
	// Épée lourde
	36: { width: 320, height: 61, centerX: 35, centerZ: 45, x: -50, z: -15, hand1x: 62, hand1z: 30, hand2x: 32, hand2z: 30, top: -5, bottom: 8, right: 124, white: true },
} as {[key: number]: WeaponData}

const FishData = { width: 150, height: 65, centerX: 25, centerZ: 45, x: -35, z: -15, hand1x: 12, hand1z: 44, hand2x: 53, hand2z: 57, sx: 110, sz: 10, cartX: 60, cartZ: 20, cartAngle: Math.PI / 2, recoilForce: 18, top: 7, bottom: 50, white: false } as WeaponData

export { FishData, Weapon, WeaponsData, WeaponTemplate }
