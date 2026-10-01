<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<moderation-tabs active="images">
				<!-- Les deux files ne sont pas des pages : elles filtrent celle-ci, d'où
				     leur place avant la navigation, dans le slot prévu pour ça. -->
				<template #before>
					<div :class="{active: state === REVIEW}" class="tab action" @click="load(REVIEW)">
						<v-icon>mdi-image-search-outline</v-icon>
						<span>À vérifier</span>
					</div>
					<div :class="{active: state === BANNED}" class="tab action" @click="load(BANNED)">
						<v-icon>mdi-image-off-outline</v-icon>
						<span>Bannies</span>
					</div>
				</template>
			</moderation-tabs>
		</div>

		<panel :title="state === REVIEW ? 'Images à vérifier' : 'Images bannies'">
			<template #content>
				<div class="images">
					<loader v-if="!images" />
					<div v-else-if="images.length === 0" class="empty">
						<v-icon>mdi-check-outline</v-icon>
						<div>{{ state === REVIEW ? "Rien à vérifier" : "Aucune image bannie" }}</div>
					</div>
					<div v-else class="grid">
						<div v-for="image in images" :key="image.hash" class="image card">
							<div class="preview" @click="enlarged = image">
								<img :src="contentUrl(image.hash)" :alt="''">
							</div>
							<div class="meta">
								<div class="row">
									<router-link :to="'/farmer/' + image.owner">{{ image.owner_name || '?' }}</router-link>
									<span class="dim">{{ image.width }}×{{ image.height }}<template v-if="image.frames > 1"> · {{ image.frames }} img</template></span>
								</div>
								<div class="row">
									<span class="dim">{{ $filters.date(image.date) }}</span>
									<span class="dim">{{ Math.round(image.bytes / 1024) }} Ko · {{ image.context }}</span>
								</div>
								<div class="row">
									<span v-if="image.nsfw_score === null" class="score unknown">non jugée</span>
									<span v-else :class="scoreClass(image.nsfw_score)" class="score">{{ (image.nsfw_score * 100).toFixed(0) }} %</span>
									<span v-if="image.uses > 0" class="dim">{{ image.uses }} message(s)</span>
									<span v-else class="dim">jamais postée</span>
								</div>
							</div>
							<div class="actions">
								<v-btn v-if="state === REVIEW" :loading="busy === image.hash" color="primary" @click="decide(image, 'approve')">
									<v-icon>mdi-check</v-icon> Approuver
								</v-btn>
								<v-btn v-if="state === REVIEW" :loading="busy === image.hash" class="danger" @click="decide(image, 'ban')">
									<v-icon>mdi-gavel</v-icon> Bannir
								</v-btn>
								<v-btn v-else :loading="busy === image.hash" @click="decide(image, 'approve')">
									<v-icon>mdi-undo</v-icon> Rétablir
								</v-btn>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<popup v-model="enlargedOpen" :width="900" icon="mdi-image-search-outline" title="Image">
			<img v-if="enlarged" :src="contentUrl(enlarged.hash)" class="enlarged" :alt="''">
		</popup>
	</div>
</template>

<script setup lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { computed, ref } from 'vue'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import ModerationTabs from './moderation-tabs.vue'

	defineOptions({ name: "ModerationImages", i18n: {}, mixins: [...mixins] })

	// États de la file de modération.
	const REVIEW = 1
	const BANNED = 2

	interface ModerationImage {
		hash: string
		owner: number
		owner_name: string | null
		date: number
		context: string
		width: number
		height: number
		frames: number
		bytes: number
		uses: number
		state: number
		nsfw_score: number | null
	}

	const images = ref<ModerationImage[] | null>(null)
	const state = ref(REVIEW)
	const busy = ref<string | null>(null)
	const enlarged = ref<ModerationImage | null>(null)

	const enlargedOpen = computed({
		get: () => enlarged.value !== null,
		set: (open: boolean) => { if (!open) { enlarged.value = null } },
	})

	const breadcrumb_items = computed(() => [
		{name: "Modération", link: '/moderation'},
		{name: "Images", link: '/moderation/images'},
	])

	function contentUrl(hash: string) {
		return LeekWars.API + 'user-image/content/' + hash
	}

	function scoreClass(score: number) {
		return score >= 0.85 ? 'high' : (score >= 0.5 ? 'medium' : 'low')
	}

	function load(wanted: number) {
		state.value = wanted
		images.value = null
		LeekWars.get('user-image/get-queue/' + wanted).then((data) => {
			images.value = data.images
			LeekWars.setTitle("Images")
		}).error((error) => {
			images.value = []
			LeekWars.toast(error.error as string)
		})
	}

	function decide(image: ModerationImage, action: 'approve' | 'ban') {
		busy.value = image.hash
		LeekWars.post('user-image/' + action, {hash: image.hash}).then(() => {
			busy.value = null
			LeekWars.toast(action === 'approve' ? "Image approuvée" : "Image bannie")
			images.value = images.value!.filter(i => i.hash !== image.hash)
			if (enlarged.value?.hash === image.hash) { enlarged.value = null }
		}).error((error) => {
			busy.value = null
			LeekWars.toast(error.error as string)
		})
	}

	load(REVIEW)
</script>

<style lang="scss" scoped>
	.empty {
		text-align: center;
		padding: 20px;
		i {
			font-size: 100px;
			color: var(--grey-11);
		}
	}
	.images {
		padding: 10px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 10px;
	}
	.image {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
	.preview {
		// Hauteur fixe et `contain` : la vignette ne doit jamais décider de la hauteur
		// de sa carte, sinon une image très haute désaligne toute la grille.
		height: 160px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-secondary);
		border-radius: var(--radius);
		cursor: zoom-in;
		overflow: hidden;
		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	}
	.meta {
		padding: 6px 2px;
		font-size: 13px;
		flex: 1;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 6px;
		margin-bottom: 2px;
	}
	.dim {
		color: var(--text-color-secondary);
	}
	.score {
		padding: 1px 7px;
		border-radius: var(--radius-pill);
		font-size: 12px;
		color: var(--white);
		&.low { background: #7f8c8d; }
		&.medium { background: #e67e22; }
		&.high { background: #c0392b; }
		&.unknown {
			background: none;
			color: var(--text-color-secondary);
			font-style: italic;
		}
	}
	.actions {
		display: flex;
		gap: 6px;
		:deep(.v-btn) {
			flex: 1;
		}
	}
	.enlarged {
		display: block;
		max-width: 100%;
		max-height: 70vh;
		margin: 0 auto;
	}
	.tab.active {
		background: var(--background-header);
	}
</style>
