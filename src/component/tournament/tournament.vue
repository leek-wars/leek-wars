<template>
	<div class="tournament-page page">
		<div class="page-header page-bar">
			<h1>{{ tournament ? title : '...' }}</h1>
			<div v-if="!LeekWars.mobile && tournament && !tournament.finished" class="tabs">
				<div v-if="generating && ($store.getters.admin || (tournament?.group && tournament?.group == $store.state.farmer?.supervised_group))" class="tab disabled"><loader class="small-loader" :size="25" /> {{ $t('generating') }}</div>
				<div v-else-if="!generating && tournament?.group && ($store.getters.admin || tournament?.group == $store.state.farmer?.supervised_group)" class="tab green" @click="generateTournament"><v-icon>mdi-play</v-icon> {{ $t('generate') }}</div>
				<div v-else-if="!tournament.finished" class="tab disabled">{{ timerText }}</div>
			</div>
		</div>
		<panel class="first">
			<template #content>
				<div ref="sizer" :class="{zoomed: zoomed}" class="content tournament">

					<loader v-if="!tournament" />
					<tournament-graph v-else :tournament="tournament" :class="{zoomed: zoomed}" :style="{maxHeight: zoomed ? height : 'auto', minWidth: zoomed && LeekWars.mobile ? '950px' : ''}" />

					<pre class="info" v-if="$store.getters.admin && tournament">
Min power: {{ $filters.number(tournament.min_power || 0) }}
Max power: {{ $filters.number(tournament.max_power || 0) }}</pre>
				</div>
			</template>
		</panel>

		<div v-show="tooltip" :style="{left: tooltipX + 'px', top: tooltipY + 'px'}" class="tooltip v-tooltip__content">{{ tooltipText }}</div>

		<panel :title="$t('comments')" icon="mdi-comment-multiple-outline">
			<comments :comments="tournament ? tournament.comments : null" @comment="comment" />
		</panel>

	</div>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import TournamentBlock from '@/component/tournament/tournament-block.vue'
import TournamentFight from '@/component/tournament/tournament-fight.vue'
import type { Comment } from '@/model/comment'
import { LeekWars } from '@/model/leekwars'
import type { Tournament } from '@/model/tournament'
import Comments from '@/component/comment/comments.vue'
import { SocketMessage } from '@/model/socket'
import { mixins, useNamespacedT } from '@/model/i18n'
import TournamentGraph from './tournament-graph.vue'
import { emitter } from '@/model/vue'

defineOptions({ name: 'tournament', i18n: {}, mixins: [...mixins], components: {
	'tournament-block': TournamentBlock,
	'tournament-fight': TournamentFight,
} })

const t = useNamespacedT('tournament')
const route = useRoute()

const tournament = ref<Tournament | null>(null)
const sixteenths = ref<any>(null)
const eighths = ref<any>(null)
const quarters = ref<any>(null)
const semifinals = ref<any>(null)
const finals = ref<any>(null)
const title = ref('')
const tooltip = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipText = ref('')
const zoomed = ref(false)
const height = ref(0)
const timerText = ref('')
let timer: any
const generating = ref(false)
const sizer = useTemplateRef<HTMLElement>('sizer')

const actions: any[] = [{ icon: 'mdi-magnify-plus-outline', click: () => zoom() }]

emitter.on('tournament-update', (data: any) => {
	if (tournament.value && data[0] === tournament.value.id) {
		LeekWars.get<Tournament>('tournament/get/' + route.params.id).then(t => {
			tournament.value = t
			generating.value = false
		})
	}
})

function update() {
	tournament.value = null
	LeekWars.get<Tournament>('tournament/get/' + route.params.id).then(tour => {
		tournament.value = tour
		if (!tournament.value) return

		sixteenths.value = tournament.value.rounds.sixteenths
		eighths.value = tournament.value.rounds.eighths
		quarters.value = tournament.value.rounds.quarters
		semifinals.value = tournament.value.rounds.semifinals
		finals.value = tournament.value.rounds.finals

		title.value = t('' + tournament.value.type, [LeekWars.formatDateTime(tournament.value.date)]) as string
		LeekWars.large = tour.size === 64
		LeekWars.setTitle(title.value)
		LeekWars.setActions(actions)
		if (tournament.value.group) {
			timerText.value = t('next_round_supervisor') as string
		} else {
			setupTimer()
		}
		LeekWars.socket.send([SocketMessage.TOURNAMENT_LISTEN, tournament.value.id])
		emitter.emit('loaded')
	})
}

watch(() => route.params, update, { immediate: true })

emitter.on('tooltip', tooltipOpen)
emitter.on('tooltip-close', tooltipClose)

onBeforeUnmount(() => {
	clearTimeout(timer)
	LeekWars.large = false
	emitter.off('tooltip', tooltipOpen)
	emitter.off('tooltip-close', tooltipClose)
	if (tournament.value) {
		LeekWars.socket.send([SocketMessage.TOURNAMENT_UNLISTEN, tournament.value.id])
	}
})

function tooltipOpen(data: { x: number, y: number, content: string }) {
	if (!tournament.value || !sizer.value) return
	tooltip.value = true
	const width = sizer.value.offsetWidth - 30
	const tournamentWidth = tournament.value.size === 64 ? 1224 : 944
	const ratio = width / tournamentWidth
	tooltipX.value = 15 + (tournamentWidth / 2 + data.x) * ratio
	tooltipY.value = 60 + (400 + data.y) * ratio
	tooltipText.value = data.content
}

function tooltipClose() {
	tooltip.value = false
}

function comment(c: Comment) {
	if (!tournament.value) return
	LeekWars.post('tournament/comment', { tournament_id: tournament.value.id, comment: c.comment }).then(() => {
		if (tournament.value) tournament.value.comments.push(c)
	})
}

function zoom() {
	if (zoomed.value) {
		zoomed.value = false
		actions[0].icon = 'mdi-magnify-plus-outline'
	} else {
		zoomed.value = true
		height.value = window.innerHeight - 86
		actions[0].icon = 'mdi-magnify-minus-outline'
	}
}

function setupTimer() {
	if (!tournament.value) return
	const updateTimer = () => {
		if (!tournament.value) return
		const time = tournament.value.next_round - LeekWars.timeSeconds
		if (time < 0) {
			timerText.value = t('next_round_in', [t('few_seconds')]) as string
			LeekWars.setSubTitle(timerText.value)
		} else {
			timerText.value = t('next_round_in', [LeekWars.formatTimeSeconds(time)]) as string
			LeekWars.setSubTitle(timerText.value)
			timer = setTimeout(updateTimer, 1000)
		}
	}
	if (!tournament.value.finished && tournament.value.next_round > 0) {
		updateTimer()
	}
}

function generateTournament() {
	if (!tournament.value) return
	generating.value = true
	LeekWars.post('tournament/generate', { tournament_id: tournament.value.id }).then(() => {}).catch((err: any) => LeekWars.toast(t(err.error, err.params)))
}
</script>

<style lang="scss" scoped>
	.tournament-page {
		position: relative;
	}
	.tooltip {
		position: absolute;
		transform: translate(-50%, 0px);
		opacity: 0.9;
		z-index: 10;
		white-space: nowrap;
	}
	.tournament.zoomed {
		overflow-x: auto;
    	overflow-y: hidden;
		height: calc(100vh - 56px);
	}
	#app.app .tournament.zoomed {
		width: auto;
	}
	.line {
		stroke: #aaa;
		stroke-width: 3;
		fill: none;
	}
.info {
	text-align: center;
	margin-top: -36px;
}
.small-loader {
	padding: 0;
}
</style>
