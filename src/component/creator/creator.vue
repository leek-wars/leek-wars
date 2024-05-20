<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div class="content" slot="content">
				<div class="player-wrapper">
					<player v-if="map" ref="player" class="player" :map="map" :horizontal="false" :creator="true" @fight="playerLoaded" @resize="resize" @edited="edited" />
				</div>
				<div class="tools">

					<div v-if="game && game.selectedEntity" class="tools-entity">

						<v-icon class="back" @click="game.selectedEntity = null">mdi-arrow-left</v-icon>

						<div class="category image">
							<div class="title">{{ game.selectedEntity.translatedName }}</div>
							<!-- <leek-image v-if="game.selectedEntity.weapon" draggable="false" :leek="game.selectedEntity" :scale="0.6" /> -->
							<img draggable="false" :src="game.selectedEntity.bodyTexFront.path">
						</div>

						<div class="category">
							<div class="title">Informations</div>
							<div>IA <input class="stat" v-model.number="game.selectedEntity.ai" @keyup="edited('ai')" type="number"></div>
							<div>Niveau <input class="stat" v-model.number="game.selectedEntity.level" @keyup="edited('level')" type="number"></div>
							<div>Mort <input type="checkbox" v-model.boolean="game.selectedEntity.initially_dead" @change="edited('dead')"></div>
							<div class="orientation">
								<v-icon @click="setOrientation(EntityDirection.NORTH)" :class="{active: game.selectedEntity.orientation === EntityDirection.NORTH}">mdi-arrow-top-left</v-icon>
								<v-icon @click="setOrientation(EntityDirection.EAST)" :class="{active: game.selectedEntity.orientation === EntityDirection.EAST}">mdi-arrow-top-right</v-icon>
								<br>
								<v-icon @click="setOrientation(EntityDirection.WEST)" :class="{active: game.selectedEntity.orientation === EntityDirection.WEST}">mdi-arrow-bottom-left</v-icon>
								<v-icon @click="setOrientation(EntityDirection.SOUTH)" :class="{active: game.selectedEntity.orientation === EntityDirection.SOUTH}">mdi-arrow-bottom-right</v-icon>
							</div>
						</div>

						<div class="category">
							<div class="title">Caractéristiques</div>
							<div class="characteristics">
								<div v-for="c in LeekWars.characteristics_table" :key="c" class="characteristic" :class="c">
									<characteristic-tooltip v-slot="{ on }" :characteristic="c" :value="game.selectedEntity[c]" :total="game.selectedEntity[c]" :leek="game.selectedEntity" :test="true">
										<img v-on="on" :src="'/image/charac/' + c + '.png'">
									</characteristic-tooltip>
									<input class="stat" :class="'color-' + c" v-model.number="game.selectedEntity[c]" @keyup="edited('charac')" type="number">
								</div>
							</div>
						</div>

						<div class="category">
							<div class="title">Armes</div>
							<div class="container weapons">
								<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ on }" :item="LeekWars.items[weapon.item]" :bottom="true" :nodge="true" :leek="game.selectedEntity">
									<img :src="'/image/' + LeekWars.items[weapon.item].name.replace('_', '/') + '.png'" :class="{hidden: !hasWeaponEquipped(weapon.item)}" class="weapon" v-on="on" @click="removeLeekWeapon(weapon.item)" :width="WeaponsData[LeekWars.items[weapon.item].params].width">
								</rich-tooltip-item>
								<div v-if="game.selectedEntity.weapons.length < 4" class="add" @click="weaponsDialog = true">+</div>
							</div>
						</div>

						<div class="category">
							<div class="title">Puces</div>
							<div class="container chips">
								<rich-tooltip-item v-for="(chip, c) of game.selectedEntity.chips" :key="chip" v-slot="{ on }" :item="LeekWars.items[chip]" :nodge="true" :leek="game.selectEntity">
									<img :src="'/image/chip/' + LeekWars.items[chip].name.replace('chip_', '') + '.png'" :class="{disabled: c >= game.selectedEntity.ram}" class="chip" v-on="on" @click="removeLeekChip(chip)">
								</rich-tooltip-item>
								<div v-if="game.selectedEntity.chips.length < game.selectedEntity.ram" class="add" @click="chipsDialog = true">+</div>
							</div>
						</div>
					</div>
					<div v-show="!game || !game.selectedEntity" class="tools-map">
						<div class="category">
							<div class="title">Sols</div>
							<div class="assets">
								<tooltip v-for="ground of GROUNDS" :key="ground.id">
									<template v-slot:activator="{ on }">
										<div v-on="on" class="asset tile" @click="selectGround(ground)">
											<img :src="ground.texture.path">
											<v-icon v-if="game && game.groundPaint === ground">mdi-check</v-icon>
										</div>
									</template>
									{{ ground.texture.path }}
								</tooltip>
							</div>
							<div class="title">Décoration</div>
							<div class="assets">
								<div v-for="decoration of decorations" :key="decoration.id" class="asset">
									<img :src="'/image/map/' + decoration.texture">
								</div>
							</div>
						</div>
						<div class="category">
							<div class="title">Obstacles</div>
							<div class="assets">
								<div v-for="obstacle of OBSTACLES" :key="obstacle.id" class="asset" draggable="false" @mousedown="obstacleDragStart(obstacle)">
									<span class="size">{{ obstacle.geometry.name }}</span>
									<img :src="obstacle.texture.path" draggable="false">
									<span class="id">#{{ obstacle.id }}</span>
								</div>
							</div>
						</div>
						<div class="category">
							<div class="title">Ennemis</div>
							<div class="assets">
								<div v-for="mob of MOBS" :key="mob.id" class="asset" draggable="false" @mousedown="mobDragStart(mob)">
									<!-- <leek-image v-if="mob.hat || mob.weapon" draggable="false" :leek="mob" :scale="0.4" /> -->
									<img draggable="false" :src="'/image/mob/' + mob.name + '.png'">
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</panel>

		<popup v-if="game" v-model="chipsDialog" :width="767">
			<v-icon slot="icon">mdi-chip</v-icon>
			<span slot="title" v-if="game.selectedEntity">{{ $t('select_chips') }} [{{ game.selectedEntity.chips.length }}/{{ game.selectedEntity.ram }}]</span>
			<div v-if="game.selectedEntity" class="padding chips-dialog">
				<rich-tooltip-item v-for="chip of availableChips" :key="chip.id" v-slot="{ on }" :item="LeekWars.items[chip.id]" :bottom="true" :nodge="true" :leek="game.selectedEntity">
					<span :class="{disabled: game.selectedEntity.chips.indexOf(chip.id) !== -1}" v-on="on">
						<img :src="'/image/chip/' + chip.name + '.png'" class="chip" @click="addOrRemoveLeekChip(chip.id)">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>

		<popup v-if="game" v-model="weaponsDialog" :width="800">
			<img slot="icon" src="/image/icon/garden.png">
			<span slot="title" v-if="game.selectedEntity">{{ $t('select_weapons') }} [{{ game.selectedEntity.weapons.length }}/{{ 4 }}]</span>
			<div v-if="game.selectedEntity" class="padding weapons-dialog">
				<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ on }" :item="LeekWars.items[weapon.item]" :bottom="true" :nodge="true" :leek="game.selectedEntity">
					<span :class="{disabled: game.selectedEntity.weapons.indexOf(weapon.item) !== -1}" v-on="on">
						<img :src="'/image/weapon/' + weapon.name + '.png'" class="weapon" v-on="on" @click="addOrRemoveLeekWeapon(weapon.item)" :width="WeaponsData[LeekWars.items[weapon.item].params].width">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
import { locale } from '@/locale'
import { FightMap } from '@/model/fight'
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { Component, Vue } from 'vue-property-decorator'
const Player = () => import(/* webpackChunkName: "[request]" */ `@/component/player/player.${locale}.i18n`)
import { Game, WEAPONS } from '@/component/player/game/game'
import { Obstacle } from '@/component/player/game/obstacle'
import { GROUNDS, GroundTexture, OBSTACLES, ObstacleInfo } from '@/component/player/game/ground'
import { T, Texture } from '../player/game/texture'
import { MOBS, Mob, MobTemplate } from '../player/game/mob'
import { EntityDirection } from '../player/game/entity'
import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
import { CHIPS } from '@/model/chips'
import { ORDERED_CHIPS } from '@/model/sorted_chips'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
import { WeaponsData } from '@/model/weapon'

@Component({ name: 'creator', i18n: {}, mixins: [...mixins], components: {
	Player,
	CharacteristicTooltip,
	RichTooltipItem
} })
export default class Creator extends Vue {

	map: FightMap | null = null

	EntityDirection = EntityDirection
	GROUNDS = GROUNDS
	OBSTACLES = OBSTACLES
	MOBS = MOBS
	chipsDialog: boolean = false
	weaponsDialog: boolean = false
	WeaponsData = WeaponsData

	decorations = [
		{ id: 1, texture: "arrows.png" },
		{ id: 2, texture: "branch.png" },
		{ id: 3, texture: "cracks.png" },
		{ id: 4, texture: "factory_bolt.png" },
		{ id: 5, texture: "snowflake.png" },
		{ id: 6, texture: "starfish.png" },
		{ id: 7, texture: "wrench.png" },
		{ id: 8, texture: "skull.png" },
	]

	game: Game | null = null
	saveTimeout: any = null

	get id() {
		return this.$route.params.id
	}

	created() {
		LeekWars.setTitle(this.$t('title'))

		LeekWars.get("map/get/" + this.id).then(map => {
			this.map = map
		})
	}

	mounted() {
		LeekWars.large = true
		LeekWars.footer = false
	}

	destroyed() {
		LeekWars.large = false
		LeekWars.footer = true
	}

	resize() {
		// console.log("resize")
	}

	playerLoaded() {
		// console.log("loaded")
		Vue.nextTick(() => {
			this.game = (this.$refs.player as any).game as Game
			for (const ground of GROUNDS) {
				ground.texture.load(this.game)
			}
			for (const obstacle in OBSTACLES) {
				OBSTACLES[obstacle].texture.load(this.game)
			}
			for (const entity of this.map!.players) {
				this.addEntity(entity)
			}
		})
	}

	selectGround(ground: GroundTexture) {
		// console.log("select ground", ground)
		const game = (this.$refs.player as any).game as Game
		game.groundPaint = ground
	}

	obstacleDragStart(obstacle: ObstacleInfo) {
		// console.log("obstacleDragStart")
		const game = (this.$refs.player as any).game as Game
		const info = OBSTACLES[obstacle.id]
		const o = new Obstacle(game, obstacle.geometry, game.ground.field.cells[570], info)
		o.resize()
		game.addObstacle(o)
		game.draggedObstacle = o
		game.groundPaint = null
	}

	mobDragStart(mob: any) {
		if (this.game) {
			const entity = this.addEntity(mob)
			this.game.draggedEntity = entity
			this.game.groundPaint = null
		}
	}

	addEntity(mob: any) {
		const entity = new Mob(this.game!, mob.name === 'leek' ? 1 : 2, 100, mob.name)
		entity.setHat(mob.hat)
		if (mob.weapon) {
			const template = WEAPONS[parseInt(LeekWars.items[mob.weapon].params) - 1]
			if (template) {
				for (const texture of template.textures) {
					texture.load(this.game!)
				}
				entity.setWeapon(new template(this.game!))
			}
		}
		entity.setCell(this.game!.ground.field.cells[mob.cell || 570])
		entity.setOrientation(mob.orientation)
		entity.ai = mob.ai
		entity.level = mob.level
		entity.life = mob.life
		entity.initially_dead = mob.dead
		entity.maxLife = mob.life
		entity.initialMaxLife = mob.life
		entity.strength = mob.strength
		entity.wisdom = mob.wisdom
		entity.agility = mob.agility
		entity.resistance = mob.resistance
		entity.science = mob.science
		entity.magic = mob.magic
		entity.frequency = mob.frequency
		entity.cores = mob.cores
		entity.ram = mob.ram
		entity.mp = mob.mp
		entity.tp = mob.tp
		entity.weapons = mob.weapons || []
		entity.chips = mob.chips || []
		this.game!.addEntity(entity)
		return entity
	}

	edited(info: any) {
		// console.log("edited", info)
		if (this.saveTimeout) clearTimeout(this.saveTimeout)
		this.saveTimeout = setTimeout(() => {
			console.log("save...")
			if (!this.map) return

			const game = (this.$refs.player as any).game as Game
			const obstacles = {} as {[key: number]: number}
			for (const obstacle of game.ground.obstacles) {
				obstacles[obstacle.cell.id] = obstacle.info.id
			}
			const pattern = []
			for (const cell of game.ground.field.cells) {
				pattern.push(cell.color)
			}
			const entities = []
			for (const entity of game.leeks) {
				entities.push({
					name: entity.name,
					cell: entity.cell!.id,
					level: entity.level,
					ai: entity.ai,
					dead: entity.initially_dead,
					orientation: entity.orientation,
					weapon: entity.weapon ? entity.weapon.id : null,
					hat: entity.hat,
					life: entity.life,
					strength: entity.strength,
					wisdom: entity.wisdom,
					agility: entity.agility,
					resistance: entity.resistance,
					science: entity.science,
					magic: entity.magic,
					frequency: entity.frequency,
					cores: entity.cores,
					ram: entity.ram,
					mp: entity.mp,
					tp: entity.tp,
					weapons: entity.weapons,
					chips: entity.chips,
				})
			}

			LeekWars.put("map/save", {
				map_id: this.map.id,
				obstacles: obstacles,
				players: entities,
				pattern: pattern,
			})
		}, 500)
	}

	setOrientation(orientation: EntityDirection) {
		if (this.game && this.game.selectedEntity) {
			this.game.selectedEntity.setOrientation(orientation)
			this.game.draw()
		}
		this.edited('orient')
	}

	get availableWeapons() {
		if (!this.game || !this.game.selectedEntity) { return [] }
		return Object.values(LeekWars.weapons)
	}
	get availableChips() {
		if (!this.game || !this.game.selectedEntity) { return [] }
		return Object.values(CHIPS)
			.sort((chipA, chipB) => {
				return ORDERED_CHIPS[chipA.id] - ORDERED_CHIPS[chipB.id]
			})
	}

	hasChipEquipped(chip: any) {
		if (!this.game || !this.game.selectedEntity) { return false }
		return (this.game.selectedEntity.chips as any).indexOf(chip) !== -1
	}

	hasWeaponEquipped(weapon: any) {
		if (!this.game || !this.game.selectedEntity) { return false }
		return (this.game.selectedEntity.weapons as any).indexOf(weapon) !== -1
	}
	removeLeekChip(chip: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		this.game.selectedEntity.chips.splice(this.game.selectedEntity.chips.indexOf(chip), 1)
		this.edited('chip')
	}
	removeLeekWeapon(weapon: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		this.game.selectedEntity.weapons.splice(this.game.selectedEntity.weapons.indexOf(weapon), 1)
		this.edited('weapon')
	}
	addLeekChip(chip: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		this.game.selectedEntity.chips.push(chip)
		if (this.game.selectedEntity.chips.length === this.game.selectedEntity.ram) {
			this.chipsDialog = false
		}
		this.edited('chip')
	}
	addLeekWeapon(weapon: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		this.game.selectedEntity.weapons.push(weapon)
		if (this.game.selectedEntity.weapons.length === 4) {
			this.weaponsDialog = false
		}
		this.edited('weapon')
	}
	addOrRemoveLeekChip(chip: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		if (!this.hasChipEquipped(chip)) {
			if (this.game.selectedEntity!.chips.length < this.game.selectedEntity.ram) {
				this.addLeekChip(chip)
			}
		} else {
			this.removeLeekChip(chip)
		}
	}

	addOrRemoveLeekWeapon(weapon: any) {
		if (!this.game || !this.game.selectedEntity) { return }
		if (!this.hasWeaponEquipped(weapon)) {
			if (this.game.selectedEntity!.weapons.length < 4) {
				this.addLeekWeapon(weapon)
			}
		} else {
			this.removeLeekWeapon(weapon)
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	display: flex;
	flex-direction: column;
	min-height: calc(100vh - 105px);
}
.tools-map, .tools-entity {
	flex-basis: 250px;
	padding: 10px;
	display: flex;
	gap: 20px;
	height: 250px;
}
.panel {
	flex: 1;
	display: flex;
	height: 100%;
	min-height: 0;
	.content {
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}
}
.player-wrapper {
	display: flex;
	flex: 1;
	.player {
		width: 100%;
		height: 100%;
	}
}
.category {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;
	align-items: flex-start;
}
.title {
	font-weight: 500;
}
.assets {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 8px;
	overflow-y: scroll;
}
.asset {
	position: relative;
	cursor: pointer;
	img {
		width: 60px;
		height: 60px;
		object-fit: contain;
		// transform: scale(1, 0.5) rotate(45deg);
		vertical-align: bottom;
	}
	svg {
		user-select: none;
	}
	&.tile img {
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.25), 0px 1px 1px 0px rgba(0,0,0,0.18), 0px 1px 3px 0px rgba(0,0,0,0.16);
	}
	&[draggable] {
		cursor: move;
	}
	.id, .size {
		position: absolute;
		background: #fff7;
		border-radius: 4px;
		padding: 1.5px 4.5px;
		font-size: 12px;
		color: #000;
		font-weight: 500;
	}
	.id {
		bottom: -5px;
		right: -5px;
	}
	.size {
		top: -5px;
		left: -5px;
	}
	.v-icon {
		position: absolute;
		top: calc(50% - 15px);
		left: calc(50% - 15px);
		width: 30px;
		height: 30px;
		background: white;
		padding: 5px;
		border-radius: 50%;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.25), 0px 1px 1px 0px rgba(0,0,0,0.18), 0px 1px 3px 0px rgba(0,0,0,0.16);
	}
}
.tools-entity {
	padding: 10px;
	.image img {
		max-height: 200px;
	}
	.characteristics {
		min-width: 370px;
		.characteristic {
			width: 50%;
			padding: 3px;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			img {
				vertical-align: top;
				width: 24px;
			}
			.stat {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				font-weight: bold;
				padding: 2px 4px;
				border-radius: 4px;
				min-width: 120px;
				margin-right: 10px;
				&[contenteditable="true"] {
					border: 1px solid var(--border);
				&:hover {
					border: 1px solid #777;
				}
				}
			}
		}
		.characteristic:nth-child(4n+3),
		.characteristic:nth-child(4n+4) {
			background: var(--background-secondary);
		}
	}

	.add {
		background: var(--pure-white);
		font-size: 40px;
		border-radius: 50%;
		font-weight: 300;
		padding: 2px 14px;
		cursor: pointer;
		display: inline-block;
		vertical-align: top;
		&:hover {
			background: var(--border);
		}
	}
}
.chips.container, .weapons.container {
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 3px;
}
.chip, .chips-dialog .chip {
	width: 50px;
	cursor: pointer;
	margin: 0 2px;
	&.disabled {
		opacity: 0.4;
	}
}
.chips-dialog .disabled, .weapons-dialog .disabled {
	opacity: 0.4;
}
.weapon, .weapons-dialog .weapon {
	cursor: pointer;
	margin: 5px;
	&.hidden {
		display: none;
	}
}
.chip, .leek-column .weapon {
	margin: 2px;
}
.orientation {
	.v-icon {
		font-size: 50px;
		border-radius: 50%;
		color: #ccc;
		&.active {
			color: black;
		}
	}
}
.back {
	margin: 50px;
	font-size: 40px;
	align-self: center;
	background: white;
	border-radius: 50%;
	padding: 10px;
	box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.25), 0px 1px 1px 0px rgba(0,0,0,0.18), 0px 1px 3px 0px rgba(0,0,0,0.16);
}

</style>