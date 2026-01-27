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
					<tournament-graph v-else :tournament="tournament" :class="{zoomed: zoomed}" :style="{maxHeight: zoomed ? height : 'auto'}" />

					<pre class="info" v-if="$store.getters.admin && tournament">
Min power: {{ $filters.number(tournament.min_power) }}
Max power: {{ $filters.number(tournament.max_power) }}</pre>
				</div>
			</template>
		</panel>

		<div v-show="tooltip" :style="{left: tooltipX + 'px', top: tooltipY + 'px'}" class="tooltip v-tooltip__content">{{ tooltipText }}</div>

		<panel :title="$t('comments')" icon="mdi-comment-multiple-outline">
			<comments :comments="tournament ? tournament.comments : null" @comment="comment" />
		</panel>

	</div>
</template>

<script lang="ts">
	import TournamentBlock from '@/component/tournament/tournament-block.vue'
	import TournamentFight from '@/component/tournament/tournament-fight.vue'
	import { Comment } from '@/model/comment'
	import { LeekWars } from '@/model/leekwars'
	import { Tournament } from '@/model/tournament'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Comments from '@/component/comment/comments.vue'
	import { SocketMessage } from '@/model/socket'
	import { mixins } from '@/model/i18n'
	import TournamentGraph from './tournament-graph.vue'
	import { emitter } from '@/model/vue'

	@Options({ name: 'tournament', i18n: {}, mixins: [...mixins], components: {
		'tournament-block': TournamentBlock,
		'tournament-fight': TournamentFight,
		TournamentGraph,
		Comments
	} })
	export default class TournamentPage extends Vue {
		tournament: Tournament | null = null
		sixteenths: any = null
		eighths: any = null
		quarters: any = null
		semifinals: any = null
		finals: any = null
		title: string = ''
		tooltip: boolean = false
		tooltipX: number = 0
		tooltipY: number = 0
		tooltipText: string = ''
		zoomed: boolean = false
		height: number = 0
		timerText: string = ''
		timer: any
		actions = [{icon: 'mdi-magnify-plus-outline', click: () => this.zoom()}]
		generating: boolean = false

		created() {
			emitter.on('tournament-update', (data: any) => {
				if (this.tournament && data[0] === this.tournament.id) {
					LeekWars.get<Tournament>('tournament/get/' + this.$route.params.id).then(tournament => {
						this.tournament = tournament
						this.generating = false
					})
				}
			})
		}

		@Watch('$route.params', {immediate: true})
		update() {
			this.tournament = null
			LeekWars.get<Tournament>('tournament/get/' + this.$route.params.id).then(tournament => {
				this.tournament = tournament
				if (!this.tournament) { return }

				this.sixteenths = this.tournament.rounds.sixteenths
				this.eighths = this.tournament.rounds.eighths
				this.quarters = this.tournament.rounds.quarters
				this.semifinals = this.tournament.rounds.semifinals
				this.finals = this.tournament.rounds.finals

				this.title = this.$t('' + this.tournament.type, [LeekWars.formatDateTime(this.tournament.date)]) as string
				LeekWars.large = tournament.size === 64
				LeekWars.setTitle(this.title)
				LeekWars.setActions(this.actions)
				if (this.tournament.group) {
					this.timerText = this.$t('next_round_supervisor') as string
				} else {
					this.setupTimer()
				}
				LeekWars.socket.send([SocketMessage.TOURNAMENT_LISTEN, this.tournament.id])
				emitter.emit('loaded')
			})
			emitter.on('tooltip', this.tooltipOpen)
			emitter.on('tooltip-close', this.tooltipClose)
		}

		beforeUnmount() {
			clearTimeout(this.timer)
			LeekWars.large = false
			emitter.off('tooltip', this.tooltipOpen)
			emitter.off('tooltip-close', this.tooltipClose)
			if (this.tournament) {
				LeekWars.socket.send([SocketMessage.TOURNAMENT_UNLISTEN, this.tournament.id])
			}
		}

		tooltipOpen(data: { x: number, y: number, content: string }) {
			if (!this.tournament) { return }
			this.tooltip = true
			const width = (this.$refs.sizer as any).offsetWidth - 30
			const tournamentWidth = this.tournament!.size === 64 ? 1224 : 944
			const ratio = width / tournamentWidth
			this.tooltipX = 15 + (tournamentWidth / 2 + data.x) * ratio
			this.tooltipY = 60 + (400 + data.y) * ratio
			this.tooltipText = data.content
		}

		tooltipClose() {
			this.tooltip = false
		}

		comment(comment: Comment) {
			if (!this.tournament) { return }
			LeekWars.post('tournament/comment', {tournament_id: this.tournament.id, comment: comment.comment}).then(data => {
				if (this.tournament) {
					this.tournament.comments.push(comment)
				}
			})
		}

		zoom() {
			if (this.zoomed) {
				this.zoomed = false
				this.actions[0].icon = 'mdi-magnify-plus-outline'
			} else {
				this.zoomed = true
				this.height = window.innerHeight - 86
				this.actions[0].icon = 'mdi-magnify-minus-outline'
			}
		}

		setupTimer() {
			if (!this.tournament) { return }
			const update = () => {
				if (!this.tournament) { return }
				const time = this.tournament.next_round - LeekWars.timeSeconds
				if (time < 0) {
					this.timerText = this.$t('next_round_in', [this.$t('few_seconds')]) as string
					LeekWars.setSubTitle(this.timerText)
				} else {
					this.timerText = this.$t('next_round_in', [LeekWars.formatTimeSeconds(time)]) as string
					LeekWars.setSubTitle(this.timerText)
					this.timer = setTimeout(update, 1000)
				}
			}
			if (!this.tournament.finished && this.tournament.next_round > 0) {
				update()
			}
		}

		generateTournament() {
			if (!this.tournament) { return }
			this.generating = true
			LeekWars.post('tournament/generate', { tournament_id: this.tournament.id }).then(() => {

			}).error(error => LeekWars.toast(this.$t(error.error, error.params)))
		}
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
