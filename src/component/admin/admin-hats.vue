<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Chapeaux', link: '/admin/hats'}]" :raw="true" /></h1>
		</div>
		<panel v-for="hat in hats" :key="hat.id">
			<div class="head">
				<h4>{{ $t('hat.' + hat.name) }} ({{ hat.id }})</h4>
				<label>width <input v-model.number="hat.width" type="number" step="0.05"></label>
				<label>height <input v-model.number="hat.height" type="number" step="0.05"></label>
				<label>crop <input v-model.number="hat.crop" type="number" step="0.05"></label>
			</div>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 100, 200, 301]" :key="level" :leek="{level, hat: hat.id, ...look(hat.id, level)}" :scale="0.8" />
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

const router = useRouter()
// Au F5 le farmer arrive en asynchrone : attendre qu'il soit chargé avant de juger
watchEffect(() => {
	if (store.state.farmer && !store.state.farmer.admin) router.replace('/')
})

// LeekWars.hats est gelé au chargement (Object.freeze, donc non réactif) :
// copie mutable pour que les champs width/height/crop pilotent le rendu en direct
if (Object.isFrozen(LeekWars.hats)) {
	LeekWars.hats = Object.fromEntries(Object.values(LeekWars.hats).map(h => [h.id, { ...h }]))
}

// Les plus récents (id les plus hauts) en premier
const hats = computed(() => Object.values(LeekWars.hats).sort((a, b) => b.id - a.id))

const all_weapons = computed(() => Object.values(LeekWars.weapons))

function random_weapon(level: number) {
	// Armes qu'un vrai poireau de ce niveau peut porter : niveau suffisant, et pas
	// une arme de boss (elles seules ne sont ni achetables ni craftables : prix null)
	const weapons = all_weapons.value.filter(w => {
		const item = LeekWars.items[w.item]
		return w.level <= level && (item.buyable || item.price !== null)
	})
	return weapons[Math.random() * weapons.length | 0].item
}
function random_skin() {
	return 1 + Math.random() * Object.values(LeekWars.skins).length | 0
}

// Tirage figé par (chapeau, niveau) : sinon chaque re-render (édition d'un param) retire armes et skins
const looks: { [key: string]: { weapon: number, skin: number } } = {}
function look(hat: number, level: number) {
	const key = hat + '_' + level
	if (!(key in looks)) looks[key] = { weapon: random_weapon(level), skin: random_skin() }
	return looks[key]
}
</script>

<style lang="scss" scoped>
	.panel {
		position: relative;
		:deep(.content) {
			padding: 10px;
		}
	}
	.head {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		label {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			color: var(--text-color-secondary);
		}
		input {
			width: 70px;
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