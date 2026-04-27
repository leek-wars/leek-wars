<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Skins', link: '/admin/skins'}]" :raw="true" /></h1>
			<div class="tabs">
				<div class="tab action" @click="front = !front">
					<span>{{ front ? 'Face' : 'Dos' }}</span>
				</div>
			</div>
		</div>
		<panel v-for="(skin, s) in LeekWars.skins" :key="s">
			<h4>{{ skin }} ({{ s }})</h4>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: !front, face: Math.random() * 3 | 0, metal: Math.random() > 0.5}" :scale="1.2" />
			</div>
			<!-- <div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: s == 1 && !front, face: 'happy'}" :scale="1.2" />
			</div>
			<div class="leeks">
				<leek-image v-for="level in [1, 10, 25, 50, 80, 100, 150, 200, 250, 300, 301]" :key="level" :leek="{level, skin: s, back: s == 1 && !front, face: 'angry', metal: true}" :scale="1.2" />
			</div> -->
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

const router = useRouter()
if (!store.getters.admin) router.replace('/')

const front = ref(true)

onMounted(() => { LeekWars.large = true })
onBeforeUnmount(() => { LeekWars.large = false })
</script>

<style lang="scss" scoped>
	.panel {
		position: relative;
		:deep(.content) {
			padding: 10px;
		}
	}
	h4 {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.leeks {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: nowrap;
		width: 100%;
	}
</style>