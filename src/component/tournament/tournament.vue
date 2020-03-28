<template>
	<div class="tournament-page">
		<div class="page-header page-bar">
			<h1>{{ tournament ? title : '...' }}</h1>
			<div v-if="!LeekWars.mobile" class="tabs">
				<div v-if="tournament && !tournament.finished" class="tab disabled">{{ timerText }}</div>
			</div>
		</div>
		<panel class="first">
			<div slot="content" ref="sizer" :class="{zoomed: zoomed}" class="content tournament">

				<loader v-if="!tournament" />
				<svg v-else :class="{zoomed: zoomed}" :style="{height: zoomed ? height : 'auto'}" class="tournament" viewBox="-485 -400 970 800">

					<tournament-block :item="sixteenths[0].contestants[0]" :x="-470" :y="-350" :size="50" />
					<tournament-fight :fight="sixteenths[0].fight" :x="-420" :y="-340" />
					<tournament-block :item="sixteenths[0].contestants[1]" :x="-390" :y="-350" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[1].contestants[0]" :x="-470" :y="-280" :size="50" />
					<tournament-fight :fight="sixteenths[1].fight" :x="-420" :y="-270" />
					<tournament-block :item="sixteenths[1].contestants[1]" :x="-390" :y="-280" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[2].contestants[0]" :x="-470" :y="-150" :size="50" />
					<tournament-fight :fight="sixteenths[2].fight" :x="-420" :y="-140" />
					<tournament-block :item="sixteenths[2].contestants[1]" :x="-390" :y="-150" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[3].contestants[0]" :x="-470" :y="-80" :size="50" />
					<tournament-fight :fight="sixteenths[3].fight" :x="-420" :y="-70" />
					<tournament-block :item="sixteenths[3].contestants[1]" :x="-390" :y="-80" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[4].contestants[0]" :x="-470" :y="30" :size="50" />
					<tournament-fight :fight="sixteenths[4].fight" :x="-420" :y="40" />
					<tournament-block :item="sixteenths[4].contestants[1]" :x="-390" :y="30" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[5].contestants[0]" :x="-470" :y="100" :size="50" />
					<tournament-fight :fight="sixteenths[5].fight" :x="-420" :y="110" />
					<tournament-block :item="sixteenths[5].contestants[1]" :x="-390" :y="100" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[6].contestants[0]" :x="-470" :y="230" :size="50" />
					<tournament-fight :fight="sixteenths[6].fight" :x="-420" :y="240" />
					<tournament-block :item="sixteenths[6].contestants[1]" :x="-390" :y="230" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[7].contestants[0]" :x="-470" :y="300" :size="50" />
					<tournament-fight :fight="sixteenths[7].fight" :x="-420" :y="310" />
					<tournament-block :item="sixteenths[7].contestants[1]" :x="-390" :y="300" :size="50" :invert="true" />

					<polyline class="line" points="-405 -340, -405 -370, -320 -370, -320 -335, -300 -335" />
					<polyline class="line" points="-405 -240, -405 -210, -320 -210, -320 -245, -300 -245" />
					<polyline class="line" points="-405 -140, -405 -170, -320 -170, -320 -135, -300 -135" />
					<polyline class="line" points="-405 -40, -405 -10, -320 -10, -320 -45, -300 -45" />

					<polyline class="line" points="-405 40, -405 10, -320 10, -320 45, -300 45" />
					<polyline class="line" points="-405 340, -405 370, -320 370, -320 335, -300 335" />
					<polyline class="line" points="-405 240, -405 210, -320 210, -320 245, -300 245" />
					<polyline class="line" points="-405 140, -405 170, -320 170, -320 135, -300 135" />

					<tournament-block :item="eighths[0].contestants[0]" :x="-300" :y="-365" :size="60" />
					<tournament-fight :fight="eighths[0].fight" :x="-285" :y="-305" />
					<tournament-block :item="eighths[0].contestants[1]" :x="-300" :y="-275" :size="60" :invert="true" />

					<tournament-block :item="eighths[1].contestants[0]" :x="-300" :y="-165" :size="60" />
					<tournament-fight :fight="eighths[1].fight" :x="-285" :y="-105" />
					<tournament-block :item="eighths[1].contestants[1]" :x="-300" :y="-75" :size="60" :invert="true" />

					<tournament-block :item="eighths[2].contestants[0]" :x="-300" :y="15" :size="60" />
					<tournament-fight :fight="eighths[2].fight" :x="-285" :y="75" />
					<tournament-block :item="eighths[2].contestants[1]" :x="-300" :y="105" :size="60" :invert="true" />

					<tournament-block :item="eighths[3].contestants[0]" :x="-300" :y="215" :size="60" />
					<tournament-fight :fight="eighths[3].fight"	:x="-285" :y="275" />
					<tournament-block :item="eighths[3].contestants[1]" :x="-300" :y="305" :size="60" :invert="true" />

					<polyline class="line" points="-255 -290, -175 -290, -175 -275" />
					<polyline class="line" points="-255 -90, -175 -90, -175 -105" />
					<polyline class="line" points="-255 290, -175 290, -175 275" />
					<polyline class="line" points="-255 90, -175 90, -175 105" />

					<tournament-block :item="quarters[0].contestants[0]" :x="-210" :y="-275" :size="70" />
					<tournament-fight :fight="quarters[0].fight" :x="-190" :y="-205" />
					<tournament-block :item="quarters[0].contestants[1]" :x="-210" :y="-175" :size="70" :invert="true" />

					<tournament-block :item="quarters[1].contestants[0]" :x="-210" :y="105" :size="70" />
					<tournament-fight :fight="quarters[1].fight" :x="-190" :y="175" />
					<tournament-block :item="quarters[1].contestants[1]" :x="-210" :y="205" :size="70" :invert="true" />

					<polyline class="line" points="-160 -190, -122.2 -190, -122.5 -110, -80 -110, -80, -95" />
					<polyline class="line" points="-160 190, -122.2 190, -122.5 110, -80 110, -80, 95" />

					<tournament-block :item="semifinals[0].contestants[0]" :x="-120" :y="-95" :size="80" />
					<tournament-fight :fight="semifinals[0].fight" :x="-95" :y="-15" />
					<tournament-block :item="semifinals[0].contestants[1]" :x="-120" :y="15" :size="80" :invert="true" />

					<polyline class="line" points="-65 0, -25 0, -25 -145, -60 -145, -60 -165" />

					<tournament-block :item="sixteenths[8].contestants[0]" :x="340" :y="-350" :size="50" />
					<tournament-fight :fight="sixteenths[8].fight" :x="390" :y="-340" />
					<tournament-block :item="sixteenths[8].contestants[1]" :x="420 " :y="-350" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[9].contestants[0]" :x="340" :y="-280" :size="50" />
					<tournament-fight :fight="sixteenths[9].fight" :x="390" :y="-270" />
					<tournament-block :item="sixteenths[9].contestants[1]" :x="420" :y="-280" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[10].contestants[0]" :x="340" :y="-150" :size="50" />
					<tournament-fight :fight="sixteenths[10].fight"	:x="390" :y="-140" />
					<tournament-block :item="sixteenths[10].contestants[1]" :x="420 " :y="-150" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[11].contestants[0]" :x="340" :y="-80" :size="50" />
					<tournament-fight :fight="sixteenths[11].fight"	:x="390" :y="-70" />
					<tournament-block :item="sixteenths[11].contestants[1]" :x="420" :y="-80" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[12].contestants[0]" :x="340" :y="30" :size="50" />
					<tournament-fight :fight="sixteenths[12].fight" :x="390" :y="40" />
					<tournament-block :item="sixteenths[12].contestants[1]" :x="420" :y="30" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[13].contestants[0]" :x="340" :y="100" :size="50" />
					<tournament-fight :fight="sixteenths[13].fight" :x="390" :y="110" />
					<tournament-block :item="sixteenths[13].contestants[1]" :x="420" :y="100" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[14].contestants[0]" :x="340" :y="230" :size="50" />
					<tournament-fight :fight="sixteenths[14].fight"	:x="390" :y="240" />
					<tournament-block :item="sixteenths[14].contestants[1]" :x="420" :y="230" :size="50" :invert="true" />

					<tournament-block :item="sixteenths[15].contestants[0]" :x="340" :y="300" :size="50" />
					<tournament-fight :fight="sixteenths[15].fight" :x="390" :y="310" />
					<tournament-block :item="sixteenths[15].contestants[1]" :x="420" :y="300" :size="50" :invert="true" />

					<polyline class="line" points="405 -340, 405 -370, 320 -370, 320 -335, 300 -335" />
					<polyline class="line" points="405 -240, 405 -210, 320 -210, 320 -245, 300 -245" />
					<polyline class="line" points="405 -140, 405 -170, 320 -170, 320 -135, 300 -135" />
					<polyline class="line" points="405 -40, 405 -10, 320 -10, 320 -45, 300 -45" />

					<polyline class="line" points="405 40, 405 10, 320 10, 320 45, 300 45" />
					<polyline class="line" points="405 340, 405 370, 320 370, 320 335, 300 335" />
					<polyline class="line" points="405 240, 405 210, 320 210, 320 245, 300 245" />
					<polyline class="line" points="405 140, 405 170, 320 170, 320 135, 300 135" />

					<tournament-block :item="eighths[4].contestants[0]" :x="240" :y="-365" :size="60" />
					<tournament-fight :fight="eighths[4].fight"	:x="255" :y="-305" />
					<tournament-block :item="eighths[4].contestants[1]" :x="240" :y="-275" :size="60" :invert="true" />

					<tournament-block :item="eighths[5].contestants[0]" :x="240" :y="-165" :size="60" />
					<tournament-fight :fight="eighths[5].fight" :x="255" :y="-105" />
					<tournament-block :item="eighths[5].contestants[1]" :x="240" :y="-75" :size="60" :invert="true" />

					<tournament-block :item="eighths[6].contestants[0]" :x="240" :y="15" :size="60" />
					<tournament-fight :fight="eighths[6].fight"	:x="255" :y="75" />
					<tournament-block :item="eighths[6].contestants[1]" :x="240" :y="105" :size="60" :invert="true" />

					<tournament-block :item="eighths[7].contestants[0]" :x="240" :y="215" :size="60" />
					<tournament-fight :fight="eighths[7].fight"	:x="255" :y="275" />
					<tournament-block :item="eighths[7].contestants[1]" :x="240" :y="305" :size="60" :invert="true" />

					<polyline class="line" points="255 -290, 175 -290, 175 -275" />
					<polyline class="line" points="255 -90, 175 -90, 175 -105" />
					<polyline class="line" points="255 290, 175 290, 175 275" />
					<polyline class="line" points="255 90, 175 90, 175 105" />

					<tournament-block :item="quarters[2].contestants[0]" :x="140" :y="-275" :size="70" />
					<tournament-fight :fight="quarters[2].fight" :x="160" :y="-205"	/>
					<tournament-block :item="quarters[2].contestants[1]" :x="140" :y="-175" :size="70" :invert="true" />

					<tournament-block :item="quarters[3].contestants[0]" :x="140" :y="105" :size="70" />
					<tournament-fight :fight="quarters[3].fight" :x="160" :y="175" />
					<tournament-block :item="quarters[3].contestants[1]" :x="140" :y="205" :size="70" :invert="true" />

					<polyline class="line" points="160 -190, 122.2 -190, 122.5 -110, 80 -110, 80, -95" />
					<polyline class="line" points="160 190, 122.2 190, 122.5 110, 80 110, 80, 95" />

					<tournament-block :item="semifinals[1].contestants[0]" :x="40" :y="-95" :size="80" />
					<tournament-fight :fight="semifinals[1].fight" :x="65" :y="-15" />
					<tournament-block :item="semifinals[1].contestants[1]" :x="40" :y="15" :size="80" :invert="true" />

					<polyline class="line" points="65 0, 25 0, 25 -145, 60 -145, 60 -165" />

					<tournament-block :item="finals[0].contestants[0]" :x="-105" :y="-250" :size="90" />
					<tournament-fight :fight="finals[0].fight" :x="-15" :y="-220" />
					<tournament-block :item="finals[0].contestants[1]" :x="15" :y="-250" :size="90" :invert="true" />

					<polyline class="line" points="0 -220, 0 -295" />

					<tournament-block :item="tournament.winner.name ? tournament.winner : null" :x="-60" :y="-395" :size="120" />
				</svg>
			</div>
		</panel>

		<div v-show="tooltip" :style="{left: tooltipX + 'px', top: tooltipY + 'px'}" class="tooltip v-tooltip__content">{{ tooltipText }}</div>

		<panel :title="$t('comments')" class="last" icon="mdi-comment-multiple-outline">
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
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'tournament', i18n: {}, components: {
		'tournament-block': TournamentBlock,
		'tournament-fight': TournamentFight,
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

		@Watch('$route.params', {immediate: true})
		update() {
			this.tournament = null
			LeekWars.get('tournament/get/' + this.$route.params.id).then(data => {
				this.tournament = data.tournament
				if (!this.tournament) { return }

				this.sixteenths = this.tournament.rounds.sixteenths
				this.eighths = this.tournament.rounds.eighths
				this.quarters = this.tournament.rounds.quarters
				this.semifinals = this.tournament.rounds.semifinals
				this.finals = this.tournament.rounds.finals

				this.title = this.$t('tournament.' + this.tournament.type, [LeekWars.formatDate(this.tournament.date)]) as string
				LeekWars.setTitle(this.title)
				LeekWars.setActions(this.actions)
				this.setupTimer()
			})
			this.$root.$on('tooltip', this.tooltipOpen)
			this.$root.$on('tooltip-close', this.tooltipClose)
		}
		beforeDestroy() {
			clearTimeout(this.timer)
			this.$root.$off('tooltip', this.tooltipOpen)
			this.$root.$off('tooltip-close', this.tooltipClose)
		}
		tooltipOpen(x: number, y: number, text: string) {
			this.tooltip = true
			const width = (this.$refs.sizer as any).offsetWidth - 30
			const ratio = width / 970
			this.tooltipX = 15 + (485 + x) * ratio
			this.tooltipY = 60 + (400 + y) * ratio
			this.tooltipText = text
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
					this.timerText = this.$t('tournament.next_round_in', [this.$t('tournament.few_seconds')]) as string
					LeekWars.setSubTitle(this.timerText)
				} else {
					this.timerText = this.$t('tournament.next_round_in', [LeekWars.formatTimeSeconds(time)]) as string
					LeekWars.setSubTitle(this.timerText)
					this.timer = setTimeout(update, 1000)
				}
			}
			if (!this.tournament.finished && this.tournament.next_round > 0) {
				update()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.tournament-page {
		position: relative;
	}
	.tooltip {
		transform: translate(-50%, 0px);
	}
	.tournament.zoomed {
		overflow-x: auto;
	}
	#app.app .tournament.zoomed {
		width: auto;
	}
	.line {
		stroke: #aaa;
		stroke-width: 3;
		fill: none;
	}
</style>