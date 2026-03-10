<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div class="banner">
				<div class="banner-illustration">
					<leek-image :leek="{level: 300, hat: 2, skin: 12, face: 1}" :scale="0.4" />
					<leek-image :leek="{level: 200, hat: 7, skin: 43, face: 1}" :scale="0.38" />
					<leek-image :leek="{level: 250, hat: 35, skin: 17, face: 1}" :scale="0.4" :invert="true" />
					<leek-image :leek="{level: 200, hat: 7, skin: 20, face: 1}" :scale="0.38" :invert="true" />
				</div>
				<div class="banner-text">
					<h2>{{ $t('banner_title') }}</h2>
					<p>{{ $t('banner_desc') }}</p>
				</div>
			</div>
		</panel>
		<panel>
			<div class="filters">
				<v-text-field v-model="search" :label="$t('search')" prepend-inner-icon="mdi-magnify" density="compact" variant="outlined" hide-details clearable class="filter-search" />
				<v-select v-model="activityFilter" :items="activityOptions" :label="$t('activity')" density="compact" variant="outlined" hide-details class="filter-select" />
				<v-select v-model="sizeFilter" :items="sizeOptions" :label="$t('team_size')" density="compact" variant="outlined" hide-details class="filter-select" />
				<v-switch v-model="showClosed" :label="$t('show_closed')" density="compact" hide-details color="primary" class="filter-switch" />
			</div>

			<loader v-if="!teams" />
			<v-data-table v-else
				:headers="headers"
				:items="filteredTeams"
				:items-per-page="10"
				:search="search"
				density="compact"
				:row-props="rowProps"
				class="elevation-1">
				<template #item.name="{ item }">
					<div class="team-cell">
						<rich-tooltip-team :id="item.id">
							<router-link :to="'/team/' + item.id">
								<emblem :team="item" />
							</router-link>
						</rich-tooltip-team>
						<div>
							<router-link :to="'/team/' + item.id" class="team-name">{{ item.name }}</router-link>
							<div v-if="!item.opened" class="closed-badge"><v-icon size="small">mdi-lock</v-icon> {{ $t('closed') }}</div>
							<div v-else-if="item.recruitment_message" class="recruitment-message">{{ item.recruitment_message }}</div>
							<div v-if="item.recent_members" class="recent-members">
								<rich-tooltip-farmer v-for="m in item.recent_members" :id="m.id" :key="m.id">
									<router-link :to="'/farmer/' + m.id" class="member-avatar-wrapper">
										<avatar :farmer="m" class="member-avatar" />
										<span class="status-dot" :class="{ online: m.connected }" />
									</router-link>
								</rich-tooltip-farmer>
								<span v-if="item.member_count > 6" class="more-members">+{{ item.member_count - 6 }}</span>
							</div>
						</div>
					</div>
				</template>
				<template #item.talent="{ item }">
					<span class="talent-cell"><ranking-badge v-if="item.ranking && item.ranking <= 1000" :id="item.id" :ranking="item.ranking" category="team" class="team-ranking" />{{ item.talent }}</span>
				</template>
				<template #item.member_count="{ item }">
					{{ item.member_count }} / 50
				</template>
				<template #item.activity_score="{ item }">
					<v-tooltip v-if="activityLabel(item.activity_score)">
						<template #activator="{ props }">
							<span v-bind="props">{{ activityLabel(item.activity_score) }}</span>
						</template>
						{{ activityTooltip(item.activity_score) }} <template v-if="$store.state.farmer && $store.state.farmer.admin"> ({{ item.activity_score }})</template>
					</v-tooltip>
				</template>
				<template #item.match_score="{ item }">
					<span class="match-score" :style="{ color: matchColor(item.match_score), fontWeight: item.match_score >= 0.6 ? 'bold' : 'normal' }">{{ Math.round(item.match_score * 100) }}%</span>
				</template>
				<template #item.apply="{ item }">
					<template v-if="canApply && item.opened">
						<v-btn v-if="candidacyTeams.includes(item.id)" size="small" variant="outlined" @click="cancelCandidacy(item)">{{ $t('cancel') }}</v-btn>
						<v-btn v-else-if="candidacyTeams.length < 5" size="small" color="primary" prepend-icon="mdi-send" @click="sendCandidacy(item)">{{ $t('apply') }}</v-btn>
					</template>
				</template>
			</v-data-table>
		</panel>
	</div>
</template>

<script lang="ts">
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { Component, Vue, Watch } from 'vue-facing-decorator'
import { mixins } from '@/model/i18n'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

@Component({ name: 'teams', i18n: {}, components: { RichTooltipTeam, RichTooltipFarmer }, mixins: [...mixins] })
export default class Teams extends Vue {

	teams: any[] | null = null
	hasMatch: boolean = false
	search: string = ''
	activityFilter: string = 'all'
	sizeFilter: string = 'all'
	showClosed: boolean = localStorage.getItem('teams/show-closed') === 'true'
	candidacyTeams: number[] = []

	get activityOptions() {
		return [
			{ title: this.$t('all'), value: 'all' },
			{ title: this.$t('main.very_active'), value: 'very_active' },
			{ title: this.$t('main.active'), value: 'active' },
		]
	}

	get sizeOptions() {
		return [
			{ title: this.$t('all'), value: 'all' },
			{ title: '1-5', value: 'small' },
			{ title: '6-15', value: 'medium' },
			{ title: '16+', value: 'large' },
		]
	}

	get headers() {
		const h: any[] = [
			{ title: this.$t('team_name'), key: 'name', sortable: true },
			{ title: this.$t('level'), key: 'level', sortable: true, align: 'end' },
			{ title: this.$t('talent'), key: 'talent', sortable: true, align: 'end' },
			{ title: this.$t('avg_leek_level'), key: 'avg_leek_level', sortable: true, align: 'end' },
			{ title: this.$t('members'), key: 'member_count', sortable: true, align: 'end' },
			{ title: this.$t('activity'), key: 'activity_score', sortable: true, align: 'end' },
		]
		if (this.hasMatch) {
			h.push({ title: this.$t('match'), key: 'match_score', sortable: true, align: 'end' })
		}
		if (this.canApply) {
			h.push({ title: '', key: 'apply', sortable: false, align: 'center', width: '120px' })
		}
		return h
	}

	get filteredTeams() {
		if (!this.teams) return []
		let result = this.teams
		if (this.activityFilter === 'very_active') {
			result = result.filter(t => t.activity_score >= 200)
		} else if (this.activityFilter === 'active') {
			result = result.filter(t => t.activity_score >= 100)
		}
		if (this.sizeFilter === 'small') {
			result = result.filter(t => t.member_count >= 1 && t.member_count <= 5)
		} else if (this.sizeFilter === 'medium') {
			result = result.filter(t => t.member_count >= 6 && t.member_count <= 15)
		} else if (this.sizeFilter === 'large') {
			result = result.filter(t => t.member_count >= 16)
		}
		return result
	}

	activityLabel(score: number) {
		if (score >= 200) return '🔥🔥🔥'
		if (score >= 100) return '🔥🔥'
		if (score >= 10) return '🔥'
		return ''
	}

	activityTooltip(score: number) {
		if (score >= 200) return this.$t('main.very_active')
		if (score >= 100) return this.$t('main.active')
		return this.$t('main.low_activity')
	}

	get canApply(): boolean {
		return store.state.farmer && store.state.farmer.team === null
	}

	sendCandidacy(team: { id: number }) {
		LeekWars.post('team/send-candidacy', { team_id: team.id }).then(() => {
			this.candidacyTeams.push(team.id)
			LeekWars.toast(this.$t('candidacy_sent'))
		}).error((error: { error: string, params: string[] }) => LeekWars.toast(this.$t('error_' + error.error, error.params)))
	}

	cancelCandidacy(team: { id: number }) {
		LeekWars.post('team/cancel-candidacy-for-team', { team_id: team.id }).then(() => {
			this.candidacyTeams = this.candidacyTeams.filter(id => id !== team.id)
			LeekWars.toast(this.$t('candidacy_cancelled'))
		}).error((error: { error: string, params: string[] }) => LeekWars.toast(this.$t('error_' + error.error, error.params)))
	}

	matchColor(score: number) {
		// Linear interpolation from red (0%) to green (100%) via HSL hue
		const hue = score * 120 // 0 = red, 120 = green
		return `hsl(${hue}, 70%, 40%)`
	}

	rowProps({ item }: { item: any }) {
		return item.opened === false ? { class: 'closed-row' } : {}
	}

	@Watch('showClosed')
	onShowClosedChanged() {
		localStorage.setItem('teams/show-closed', '' + this.showClosed)
		this.loadTeams()
	}

	loadTeams() {
		this.teams = null
		LeekWars.get('team/get-recruiting?include_closed=' + this.showClosed).then((data: any) => {
			this.teams = data.teams
			this.hasMatch = this.teams !== null && this.teams.length > 0 && this.teams[0].match_score !== undefined
			this.candidacyTeams = data.candidacy_teams || []
		})
	}

	created() {
		LeekWars.setTitle(this.$t('title'))
		this.loadTeams()
	}
}
</script>

<style lang="scss" scoped>
.banner {
	display: flex;
	align-items: center;
	gap: 20px;
	padding: 15px;
}
.banner-illustration {
	flex-shrink: 0;
	display: flex;
	align-items: flex-end;
}
.banner-text {
	h2 {
		font-size: 22px;
		font-weight: 500;
		margin-bottom: 6px;
		color: #5fad1b;
	}
	p {
		color: var(--text-color-secondary);
		font-size: 15px;
		line-height: 1.5;
		margin: 0;
	}
}
#app.app .banner {
	flex-direction: column;
	text-align: center;
}
.filters {
	display: flex;
	gap: 12px;
	margin-bottom: 15px;
	flex-wrap: wrap;
}
.filter-search {
	min-width: 250px;
	max-width: 300px;
	:deep(input) {
		background: transparent !important;
		border: none !important;
	}
}
.filter-select {
	max-width: 200px;
}
#app.app {
	.filter-search, .filter-select {
		max-width: 100%;
	}
}
.team-cell {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	.emblem {
		width: 50px;
		height: 50px;
	}
}
.team-name {
	font-weight: 500;
	font-size: 15px;
	display: block;
}
.recent-members {
	display: flex;
	align-items: center;
	gap: 2px;
	margin-top: 4px;
}
.member-avatar-wrapper {
	position: relative;
	display: inline-block;
}
.member-avatar {
	width: 26px;
	height: 26px;
	vertical-align: bottom;
}
.status-dot {
	position: absolute;
	bottom: -3px;
	right: -3px;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--border);
	border: 1.5px solid var(--pure-white);
	&.online {
		background: #95d85a;
	}
}
.more-members {
	font-size: 12px;
	color: var(--text-color-secondary);
	margin-left: 5px;
}
.talent-cell {
	display: inline-flex;
	align-items: center;
	white-space: nowrap;
}
.team-ranking {
	transform: scale(0.75);
	margin: 0;
}
.recruitment-message {
	color: var(--text-color-secondary);
	font-size: 13px;
	max-width: 300px;
	white-space: pre-line;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
:deep(.v-data-table td), :deep(.v-data-table th) {
	padding: 6px !important;
}
.match-score {
	padding: 0 15px;
}
.filter-switch {
	flex: none;
}
.closed-badge {
	color: #999;
	font-size: 12px;
	display: flex;
	align-items: center;
	gap: 3px;
}
:deep(.closed-row) {
	opacity: 0.7;
}
</style>
