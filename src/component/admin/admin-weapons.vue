<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Armes', link: '/admin/weapons'}]" :raw="true" /></h1>
		</div>
		<panel v-for="weapon in weapons" :key="weapon.id">
			<div class="head">
				<h4>{{ $t('weapon.' + weapon.name) }} ({{ weapon.id }})</h4>
				<v-icon class="copy" title="Copier la ligne pour weapon.ts" @click="copy(weapon.id)">mdi-content-copy</v-icon>
				<label v-for="field in FIELDS" :key="field">{{ field }} <input v-model.number="WeaponsData[weapon.id][field]" type="number" @input="bump(weapon.id)"></label>
				<label>white <input v-model="WeaponsData[weapon.id].white" type="checkbox" @change="bump(weapon.id)"></label>
			</div>
			<div :key="versions[weapon.id] || 0" class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 100, 200, 301]" :key="level" :leek="{level, weapon: weapon.item, skin: skin(weapon.id, level)}" :scale="0.8" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { WeaponsData } from '@/model/weapon'
import { store } from '@/model/store'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

const router = useRouter()
// Au F5 le farmer arrive en asynchrone : attendre qu'il soit chargé avant de juger
watchEffect(() => {
	if (store.state.farmer && !store.state.farmer.admin) router.replace('/')
})

// Les plus récentes (id les plus hauts) en premier
const weapons = computed(() => Object.values(LeekWars.weapons).filter(w => WeaponsData[w.id]).sort((a, b) => b.id - a.id))

// Champs de WeaponsData utilisés par l'aperçu SVG (leek-image) ; les autres
// (sx, sz, cart*, recoilForce, angleForce) ne servent qu'aux animations de combat
const FIELDS = ['width', 'height', 'centerX', 'centerZ', 'x', 'z', 'hand1x', 'hand1z', 'hand2x', 'hand2z', 'top', 'bottom', 'right'] as const

// WeaponsData n'est pas réactif : une clé de version par arme force le re-render
// de ses seuls aperçus, les champs restant montés (le focus est conservé)
const versions = reactive<{[key: number]: number}>({})
function bump(id: number) {
	versions[id] = (versions[id] || 0) + 1
}

function random_skin() {
	return 1 + Math.random() * Object.values(LeekWars.skins).length | 0
}

// Tirage figé par (arme, niveau) : sinon chaque re-render retirerait les skins
const skins: {[key: string]: number} = {}
function skin(weapon: number, level: number) {
	const key = weapon + '_' + level
	if (!(key in skins)) skins[key] = random_skin()
	return skins[key]
}

// Ordre des clés du fichier weapon.ts, pour une ligne collable telle quelle
const ORDER = ['width', 'height', 'centerX', 'centerZ', 'x', 'z', 'hand1x', 'hand1z', 'hand2x', 'hand2z', 'sx', 'sz', 'cartX', 'cartZ', 'cartAngle', 'recoilForce', 'angleForce', 'top', 'bottom', 'right', 'white'] as const

function copy(id: number) {
	const data = WeaponsData[id] as unknown as {[key: string]: number | boolean | undefined}
	const parts = ORDER.filter(k => data[k] !== undefined)
		.map(k => k + ': ' + (data[k] === Math.PI / 2 ? 'Math.PI / 2' : data[k]))
	navigator.clipboard.writeText('\t' + id + ': { ' + parts.join(', ') + ' },')
	LeekWars.toast('Ligne copiée !')
}
</script>

<style lang="scss" scoped>
	.panel {
		:deep(.content) {
			padding: 10px;
		}
	}
	.head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 10px;
		margin-bottom: 8px;
		h4 {
			margin-right: 4px;
		}
		.copy {
			font-size: 17px;
			cursor: pointer;
			color: var(--text-color-secondary);
			margin-right: 10px;
		}
		label {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			color: var(--text-color-secondary);
		}
		input[type=number] {
			width: 62px;
			padding: 2px 5px;
			border: 1px solid var(--border);
			border-radius: 4px;
			background: var(--background);
			color: var(--text-color);
		}
	}
	.leeks {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: nowrap;
		width: 100%;
	}
</style>
