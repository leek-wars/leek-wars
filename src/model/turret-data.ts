const TURRET_DATA = [
	[{t: "pyramid_up", z: 25}, {t: "core", z: 48}],
	[{t: "pyramid_up", z: 25}, {t: "core", z: 48}, {t: "plane", z: 6}],
	[{t: "pyramid_down", z: 28}, {t: "pyramid_up", z: 13}, {t: "core", z: 48}, {t: "plane", z: 6}],
	[{t: "pyramid_down", z: 28}, {t: "pyramid_up", z: 13}, {t: "block", z: 16}, {t: "core", z: 47}, {t: "plane", z: 6}],
	[{t: "pyramid_down", z: 28}, {t: "pyramid_up", z: 13}, {t: "block", z: 16}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "plane", z: 10}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "block", z: 14}, {t: "plane", z: 12}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "pyramid_down", z: 20}, {t: "pyramid_up", z: 13}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "pyramid_down", z: 20}, {t: "pyramid_up", z: 13}, {t: "plane", z: 12}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "pyramid_down", z: 20}, {t: "pyramid_up", z: 13}, {t: "block", z: 16}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}],
	[{t: "base", z: 56}, {t: "pyramid_down", z: 20}, {t: "pyramid_up", z: 13}, {t: "block", z: 16}, {t: "core", z: 47}, {t: "pyramid_up", z: 13}, {t: "plane", z: 11}],
]
const TURRET_PIECE_SIZE = {
	"base": [282, 249], "block": [162, 115], "core": [212, 220], "plane": [163, 103], "pyramid_down": [222, 136], "pyramid_up": [222, 137]
} as {[key: string]: number[]}

export { TURRET_DATA, TURRET_PIECE_SIZE }