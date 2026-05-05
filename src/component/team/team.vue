<template>
	<error v-if="error" :title="$t('not_found')">
		<template #message><i18n-t keypath="not_found_id" tag="span"><template #id><b>{{ id }}</b></template></i18n-t></template>
		<template #button>
			<router-link to="/teams">
				<v-btn size="large" color="primary">{{ $t('all_teams') }}</v-btn>
			</router-link>
		</template>
	</error>
	<div v-else class="page">
		<div class="page-header page-bar">

			<rich-tooltip-team v-if="team" :id="team.id" v-slot="{ props }" :bottom="true">
				<h1 v-bind="props">{{ team.name }}</h1>
			</rich-tooltip-team>
			<h1 v-else>...</h1>

			<div v-if="team" class="tabs">
				<router-link v-if="is_member" :to="'/forum/category-' + team.forum">
					<div :link="'/forum/category-' + team.forum" class="tab action" icon="question_answer">
						<img src="/image/icon/forum.png">
						<span>{{ $t('forum') }}</span>
					</div>
				</router-link>
				<v-tooltip v-if="is_member">
					<template #activator="{ props }">
						<div class="tab" @click="updateOpened" v-bind="props">
							<span>{{ $t('opened') }}</span>
							<v-switch :model-value="team.opened ?? false" hide-details @click.stop />
						</div>
					</template>
					{{ $t('recrutment_mode') }}
				</v-tooltip>
				<router-link v-if="$store.state.connected" :to="'/garden/challenge/team/' + team.id">
					<div :link="'/garden/challenge/team/' + team.id" class="tab action" icon="flag-outline">
						<v-icon>mdi-flag-outline</v-icon>
						<span>{{ $t('main.challenge') }}</span>
					</div>
				</router-link>
				<router-link to="/teams">
					<div class="tab action">
						<v-icon>mdi-account-group</v-icon>
						<span>{{ $t('all_teams') }}</span>
					</div>
				</router-link>
			</div>
		</div>

		<div class="container">
			<panel class="team-emblem first">
				<template #content><div v-if="team" class="content">
					<div class="emblem-wrapper">
						<template v-if="owner">
							<v-tooltip>
								<template #activator="{ props }">
									<div class="emblem-input" v-bind="props">
										<input ref="emblemInput" type="file" accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp" @change="changeEmblem">
										<emblem ref="emblem" :team="team" @click.native="emblemInput?.click()" />
									</div>
								</template>
								{{ $t('change_emblem') }}
							</v-tooltip>
						</template>
						<emblem v-else :team="team" />
						<v-btn v-if="is_member" class="like-overlay" :class="{liked: team.liked}" size="small" @click.stop="toggleLike">
							<template #prepend><v-icon size="small" :color="team.liked ? 'red' : ''">{{ team.liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon></template>
							{{ team.likes }}
						</v-btn>
						<v-btn v-else-if="$store.state.connected" class="like-overlay" :class="{liked: team.liked}" size="small" @click="toggleLike">
							<template #prepend><v-icon :color="team.liked ? 'red' : ''">{{ team.liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon></template>
							{{ team.likes }}
						</v-btn>
						<v-btn v-else class="like-overlay no-click" :class="{liked: team.likes > 0}" size="small" :ripple="false">
							<template #prepend><v-icon size="small" :color="team.likes > 0 ? 'red' : ''">{{ team.likes > 0 ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon></template>
							{{ team.likes }}
						</v-btn>
					</div>
					<div v-if="team.description || is_member" class="description">
						<span class="guillemet">«</span>
						<span v-if="owner" ref="descriptionElement" :class="{empty: !team.description && !editingDescription}" class="team-status text" contenteditable @click="startEditingDescription" @blur="saveDescription" @keydown.enter.prevent="saveDescription">{{ team.description }}</span>
						<span v-else class="text team-status">{{ team.description }}</span>
						<span class="guillemet">»</span>
						<span class="edit-pen"></span>
					</div>
					<div v-if="team.recruitment_message || captain" class="recruitment-message">
						<v-tooltip>
							<template #activator="{ props }">
								<v-icon v-bind="props" size="small">mdi-bullhorn-outline</v-icon>
							</template>
							{{ $t('recruitment_message') }}
						</v-tooltip>
						<span v-if="captain" ref="recruitmentElement" class="team-status text" contenteditable :data-placeholder="$t('no_recruitment_message')" @blur="saveRecruitmentMessage">{{ team.recruitment_message }}</span>
						<span v-else class="text">{{ team.recruitment_message }}</span>
					</div>
				</div></template>
			</panel>

			<panel>
				<h4 class="team-level">{{ $t('level_n', [team ? team.level : '...']) }}
					<v-tooltip v-if="team && activityLabel">
						<template #activator="{ props }">
							<span v-bind="props" class="team-activity">{{ activityLabel }}</span>
						</template>
						{{ activityTooltip }} <template v-if="$store.state.farmer && $store.state.farmer.admin">({{ team.activity.toFixed(1) }})</template>
					</v-tooltip>
				</h4>
				<v-tooltip v-if="team">
					<template #activator="{ props }">
						<div class="bar" v-bind="props">
							<span :class="{blue: max_level}" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
						</div>
					</template>
					<template v-if="max_level">
						<b>{{ $t('max_level') }}</b>
						<br>
						{{ $t('xp', [LeekWars.formatNumber(team.xp)]) }}
					</template>
					<template v-else>
						<b>{{ $t('remaining_xp', [LeekWars.formatNumber(team.remaining_xp)]) }}</b>
						<br>
						{{ $t('xp', [LeekWars.formatNumber(team.xp) + " / " + LeekWars.formatNumber(team.up_xp)]) }}
					</template>
				</v-tooltip>

				<div class="info-talent">
					<talent :id="team ? team.id : ''" :talent="team ? team.talent : '...'" :max_talent="team?.max_talent" :label="$t('talent')" category="team" />
					<ranking-badge v-if="team && team.ranking <= 1000" :id="team.id" :ranking="team.ranking" category="team" />
				</div>

				<br>
				<v-tooltip v-if="team">
					<template #activator="{ props }">
						<table class="fights" v-bind="props">
							<tr>
								<td class="big">{{ $filters.number(team.victories) }}</td>
								<td class="big">{{ $filters.number(team.draws) }}</td>
								<td class="big">{{ $filters.number(team.defeats) }}</td>
							</tr>
							<tr>
								<td class="grey">{{ $t('victories') }}</td>
								<td class="grey">{{ $t('draws') }}</td>
								<td class="grey">{{ $t('defeats') }}</td>
							</tr>
						</table>
					</template>
					{{ $t('ratio', [team.ratio]) }}
				</v-tooltip>

				<v-tooltip v-if="team && team.won_tournaments > 0">
					<template #activator="{ props }">
						<div v-bind="props" class="tournaments">
							<v-icon class="grey">mdi-trophy-outline</v-icon>
							<span class="big">{{ $filters.number(team.won_tournaments) }}</span>
						</div>
					</template>
					{{ $t('tournaments') }}
				</v-tooltip>

				<Line v-if="chartData && chartOptions" :data="chartData" :options="chartOptions" class="talent-history" />

				<div class="center" v-if="team && $store.state.farmer && !is_member && $store.state.farmer.team == null && !myInvitation">
					<br>
					<v-btn v-if="team.candidacy" @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
					<v-btn v-if="team.opened && !team.candidacy" @click="sendCandidacy">{{ $t('join_team') }}</v-btn>
					<i v-else-if="!team.opened">{{ $t('closed_team') }}</i>
				</div>
			</panel>

			<panel class="description">
				<template #content><div v-if="team" class="turret-wrapper">
					<router-link v-if="teamOwner" class="team-owner" :to="'/farmer/' + teamOwner.id">
						<rich-tooltip-farmer :id="teamOwner.id" v-slot="{ props }">
							<div class="owner-content" v-bind="props">
								<avatar :farmer="teamOwner" />
								<div class="owner-info">
									<div class="owner-name" :class="teamOwner.color">
										{{ teamOwner.name }}
										<img v-if="teamOwner.connected" class="owner-status" src="/image/connected.png">
										<img v-else class="owner-status" src="/image/disconnected.png">
									</div>
									<div class="owner-label">{{ $t('owner') }}</div>
								</div>
							</div>
						</rich-tooltip-farmer>
					</router-link>
					<div class="turret">
						<turret-image :level="team.level" :skin="1" :scale="0.32" @click.native="turretDialog = true" />

						<div class="infos">
							<h4>{{ $t('turret') }}</h4>
							<div class="level">{{ $t('level_n', [team.level]) }}</div>

							<ai v-if="team.turret_ai" v-ripple :ai="team.turret_ai" :library="false" :small="false" :class="{active: captain}" @click.native="turretAiDialog = captain" />
							<div v-else-if="is_member" class="no-ai" @click="turretAiDialog = true">{{ $t('no_ai') }}</div>
						</div>
					</div>
				</div></template>
			</panel>
		</div>

		<panel v-if="myInvitation">
			<div class="center">
				<b><i18n-t keypath="you_are_invited">
					<template #sender>
						<rich-tooltip-farmer :id="myInvitation.sender_id" v-slot="{ props }">
							<router-link :to="'/farmer/' + myInvitation.sender_id" v-bind="props" style="color: #5fad1b; font-weight: bold">{{ myInvitation.sender_name }}</router-link>
						</rich-tooltip-farmer>
					</template>
				</i18n-t></b>
				<br><br>
				<v-btn color="primary" @click="acceptInvitation">{{ $t('accept_invitation') }}</v-btn>
				<v-btn class="ml-2" @click="rejectInvitation">{{ $t('reject_invitation') }}</v-btn>
			</div>
		</panel>

		<panel v-if="team && is_member" :title="$t('chat')" toggle="team/chat" icon="mdi-chat-outline">
			<template #actions>
				<div v-if="!LeekWars.mobile && team && $store.state.chat[team.chat]" class="button flat" @click="LeekWars.addChat($store.state.chat[team.chat])">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
			</template>
			<template #content>
				<chat v-if="team" :id="team.chat" />
			</template>
		</panel>

		<panel v-if="team && is_member && team.candidacies && team.candidacies.length > 0">
			<template #title>{{ $t('candidacies') }} ({{ team.candidacies.length }})</template>
			<div class="content candidacies">
				<div v-for="candidacy in team.candidacies" :key="candidacy.id" class="farmer">
					<rich-tooltip-farmer :id="candidacy.farmer.id" v-slot="{ props }">
						<router-link :to="'/farmer/' + candidacy.farmer.id">
							<div v-bind="props">
								<avatar :farmer="candidacy.farmer" />
								<div class="name">{{ candidacy.farmer.name }}</div>
							</div>
						</router-link>
					</rich-tooltip-farmer>
					<span v-if="captain" class="accept" @click="acceptCandidacy(candidacy)">{{ $t('candidacy_accept') }}</span>
					<span v-if="captain" class="reject" @click="rejectCandidacy(candidacy)">{{ $t('candidacy_refuse') }}</span>
				</div>
			</div>
		</panel>

		<panel v-if="team" icon="mdi-account-supervisor" :title="$t('farmers', [ team.member_count])">
			<template #actions>
				<v-menu v-if="owner && membersTableView" v-model="columnsDialog" location="top end" :close-on-content-click="false" @update:model-value="$event && openColumnsDialog()">
					<template #activator="{ props: menuProps }">
						<div class="button flat" v-bind="menuProps">
							<v-icon>mdi-table-cog</v-icon>
						</div>
					</template>
					<div class="columns-menu">
						<div class="columns-menu-header">
							<div class="columns-menu-title">{{ $t('configure_columns') }}</div>
							<v-icon class="columns-reset" size="small" @click="resetColumnsConfig">mdi-refresh</v-icon>
						</div>
						<div ref="columnsConfigListEl" class="columns-config-list">
							<div v-for="col in columnsConfigList" :key="col.key"
								class="column-config-item" :data-key="col.key">
								<v-icon class="drag-handle">mdi-drag</v-icon>
								<v-checkbox-btn v-model="col.visible" :disabled="col.key === 'name'" density="compact" color="primary" :label="columnLabel(col)" class="column-checkbox" @change="saveColumnsConfig" />
							</div>
						</div>
						<div class="sort-config">
							<span class="sort-label">{{ $t('default_sort') }}</span>
							<select v-model="columnsSortKey" class="sort-select" @change="saveColumnsConfig">
								<option v-for="col in visibleConfigColumns" :key="col.key" :value="col.key">{{ columnLabel(col) }}</option>
							</select>
							<v-icon class="sort-order" @click="toggleSortOrder">{{ columnsSortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending' }}</v-icon>
						</div>
					</div>
				</v-menu>
				<div v-if="owner && !membersTableView && !editMembers" class="button flat" @click="editMembers = true">
					<v-icon>mdi-pencil</v-icon>
				</div>
				<div v-if="owner && !membersTableView && editMembers" class="button flat" @click="editMembers = false">
					<v-icon>mdi-check</v-icon>
				</div>
				<div v-if="is_member || $store.state.farmer?.admin" class="button flat" @click="toggleMembersView">
					<v-icon>{{ membersTableView ? 'mdi-view-grid' : 'mdi-view-list' }}</v-icon>
				</div>
			</template>
			<template #content>
				<loader v-if="!team" />
				<div v-else-if="(!is_member && !$store.state.farmer?.admin) || !membersTableView" class="members">
					<div v-for="member in team.members" :key="member.id" class="farmer">
						<router-link :to="'/farmer/' + member.id">
							<rich-tooltip-farmer :id="member.id" v-slot="{ props }">
								<div v-bind="props">
									<avatar :farmer="member" />
									<div class="name">
										<img v-if="member.connected" class="status" src="/image/connected.png">
										<img v-else class="status" src="/image/disconnected.png">
										<v-tooltip v-if="member.grade == 'owner'">
											<template #activator="{ props }">
												<span v-bind="props">★</span>
											</template>
											<div class="grade">{{ $t('owner') }}</div>
										</v-tooltip>
										<v-tooltip v-else-if="member.grade == 'captain'">
											<template #activator="{ props }">
												<span v-bind="props">☆</span>
											</template>
											<div class="grade">{{ $t('captain') }}</div>
										</v-tooltip>
										<span :title="member.name">{{ member.name }}</span>
									</div>
									<talent :id="member.id" :talent="member.talent" :max_talent="member.max_talent" category="farmer" />
								</div>
							</rich-tooltip-farmer>
						</router-link>
						<template v-if="is_member">
							<div class="logs" :class="{hidden: member.logs_level === 0, me: $store.state.farmer && member.id === $store.state.farmer.id}" @click="logsDialog = !!($store.state.farmer && member.id === $store.state.farmer.id)">
								<v-icon v-if="member.logs_level > 0" class="activated">mdi-playlist-check</v-icon>
								<v-icon v-else>mdi-playlist-remove</v-icon>
								<span :title="$t('log_level_' + member.logs_level) + ' : ' + $t('log_level_' + member.logs_level + '_desc')"> {{ $t('log_level_' + member.logs_level) }} </span>
								<v-icon v-if="$store.state.farmer && member.id === $store.state.farmer.id" class="edit">mdi-pencil</v-icon>
							</div>
						</template>
						<template v-if="owner && editMembers">
							<i v-if="member.grade == 'owner'" class="grade">{{ $t('owner') }}</i>
							<select v-else v-model="member.grade" class="level" @change="changeLevel(member)">
								<option value="captain">{{ $t('captain') }}</option>
								<option value="member">{{ $t('member') }}</option>
							</select>
							<br>
							<v-btn v-if="$store.state.farmer && member.id !== $store.state.farmer.id" class="ban" size="small" @click="banMemberStart(member)">
								<v-icon>mdi-hand-pointing-right</v-icon>
								{{ $t('ban') }}
							</v-btn>
						</template>
					</div>
				</div>
				<v-data-table v-else
					:headers="membersHeaders"
					:items="team.members"
					hide-default-footer
					:items-per-page="100"
					density="compact"
					:sort-by="membersSort"
					:custom-key-sort="customKeySort"
					class="members-table">
					<template #item.name="{ item }">
						<router-link v-ripple :to="'/farmer/' + item.id" class="member-link">
							<rich-tooltip-farmer :id="item.id" v-slot="{ props }">
								<span v-bind="props" class="member-info">
									<avatar :farmer="item" class="table-avatar" />
									<img v-if="item.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
									<span :class="item.color">{{ item.name }}</span>
								</span>
							</rich-tooltip-farmer>
						</router-link>
					</template>
					<template #item.grade="{ item }">
						<span>
							<span v-if="item.grade == 'owner'">★ </span>
							<span v-else-if="item.grade == 'captain'">☆ </span>
							{{ $t(item.grade) }}
						</span>
					</template>
					<template #item.country="{ item }">
						<flag v-if="item.country" :code="item.country" />
					</template>
					<template #item.talent="{ item }">
						{{ $filters.number(item.talent) }}
					</template>
					<template #item.points="{ item }">
						{{ $filters.number(item.points) }}
					</template>
					<template #item.victories="{ item }">
						{{ $filters.number(item.victories) }}
					</template>
					<template #item.draws="{ item }">
						{{ $filters.number(item.draws) }}
					</template>
					<template #item.defeats="{ item }">
						{{ $filters.number(item.defeats) }}
					</template>
					<template #[`item.join_date`]="{ item }">
						<span class="date-cell">{{ $filters.date(item.join_date) }}</span>
					</template>
					<template #[`item.fights`]="{ item }">
						{{ $filters.number(item.victories + item.draws + item.defeats) }}
					</template>
					<template #[`item.ratio`]="{ item }">
						{{ item.defeats === 0 && item.victories > 0 ? '∞' : item.defeats > 0 ? (item.victories / item.defeats).toFixed(2) : '-' }}
					</template>
					<template #[`item.leek_count`]="{ item }">
						{{ item.leek_count }}
					</template>
					<template #[`item.ranking`]="{ item }">
						<ranking-badge v-if="item.ranking" :id="item.id" :ranking="item.ranking" category="farmer" class="ranking-badge-small" />
					</template>
					<template #[`item.last_connection`]="{ item }">
						<span class="date-cell" :class="{ inactive: !item.connected && item.last_connection < Date.now() / 1000 - 30 * 24 * 3600 }">
							{{ item.connected ? $t('main.connected') : LeekWars.formatDuration(item.last_connection) }}
						</span>
					</template>
				</v-data-table>
			</template>
		</panel>

		<panel v-if="team && captain && team.invitations && team.invitations.length > 0">
			<template #title>{{ $t('invitations') }} ({{ team.invitations.length }})</template>
			<div class="content candidacies">
				<div v-for="invitation in team.invitations" :key="invitation.id" class="farmer">
					<rich-tooltip-farmer :id="invitation.farmer.id" v-slot="{ props }">
						<router-link :to="'/farmer/' + invitation.farmer.id">
							<div v-bind="props">
								<avatar :farmer="invitation.farmer" />
								<div class="name">{{ invitation.farmer.name }}</div>
							</div>
						</router-link>
					</rich-tooltip-farmer>
					<span class="reject" @click="cancelInvitation(invitation)">{{ $t('cancel') }}</span>
				</div>
			</div>
		</panel>

		<panel v-if="team" icon="mdi-podium">
			<template #title>{{ $t('rankings') }}</template>
			<div class="container grid last rankings">
				<div class="column4">
					<h4>{{ $t('main.leeks') }}</h4>
					<div class="ranking card">
						<div class="header">
							<div class="p20">{{ $t('main.place') }}</div>
							<div class="p50">{{ $t('main.leek') }}</div>
							<div class="p20">{{ $t('main.talent') }}</div>
							<div class="p20">{{ $t('main.level') }}</div>
						</div>
						<div v-for="(leek, i) in team.rankings.leeks" :key="i" :class="{me: leek.me}">
							<div class="p20">{{ i + 1 }}</div>
							<div class="p50" :class="leek.style">
								<rich-tooltip-leek :id="leek.id" v-slot="{ props }">
									<router-link :to="'/leek/' + leek.id">
										<span v-bind="props">{{ leek.name }}</span>
									</router-link>
								</rich-tooltip-leek>
							</div>
							<div class="p20">{{ $filters.number(leek.talent) }}</div>
							<div class="p20">{{ $filters.number(leek.level) }}</div>
						</div>
					</div>
				</div>
				<div class="column4">
					<h4>{{ $t('main.farmers') }}</h4>
					<div class="ranking card">
						<div class="header">
							<div class="p15">{{ $t('main.place') }}</div>
							<div class="p50">{{ $t('main.farmer') }}</div>
							<div class="p20">{{ $t('main.talent') }}</div>
							<div class="p15">{{ $t('main.country') }}</div>
						</div>
						<div v-for="(farmer, i) in team.rankings.farmers" :key="i" :class="{me: farmer.me}">
							<div class="p15">{{ i + 1 }}</div>
							<div class="p50" :class="farmer.style">
								<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }">
									<router-link :to="'/farmer/' + farmer.id">
										<span v-bind="props">{{ farmer.name }}</span>
									</router-link>
								</rich-tooltip-farmer>
							</div>
							<div class="p20">{{ $filters.number(farmer.talent) }}</div>
							<div class="p15">
								<flag v-if="farmer.country" :code="farmer.country" class="country" />
							</div>
						</div>
					</div>
				</div>
				<div class="column4">
					<h4>{{ $t('main.trophies') }}</h4>
					<div class="ranking card">
						<div class="header">
							<div class="p15">{{ $t('main.place') }}</div>
							<div class="p50">{{ $t('main.farmer') }}</div>
							<div class="p25">{{ $t('main.trophies') }}</div>
						</div>
						<div v-for="(farmer, i) in team.rankings.trophies" :key="i" :class="{me: farmer.me}">
							<div class="p15">{{ i + 1 }}</div>
							<div class="p50" :class="farmer.style">
								<rich-tooltip-farmer v-if="farmer" :id="farmer.id" v-slot="{ props }">
									<router-link :to="'/farmer/' + farmer.id">
										<span v-bind="props">{{ farmer.name }}</span>
									</router-link>
								</rich-tooltip-farmer>
							</div>
							<div class="p25">{{ $filters.number(farmer.points) }}</div>
						</div>
					</div>
				</div>
			</div>
			<div v-if="team.leek_count > 10 && !rankingsLoaded" class="load-rankings">
				<loader v-if="rankingsLoading" />
				<v-btn size="small" v-else @click="loadRankings">{{ $t('load_all') }}</v-btn>
			</div>
		</panel>

		<panel v-if="is_member" :title="$t('compositions')">
			<template v-if="captain" #actions>
				<div class="button flat" @click="createCompoDialog = true">{{ $t('create_composition') }}</div>
			</template>
			<template #content></template>
		</panel>

		<div v-if="is_member && team && team.compositions && team.compositions.length == 0" class="no-compos">{{ $t('no_compositions') }}</div>

		<div v-if="is_member && team && team.compositions" class="compos">
			<panel v-for="composition in team.compositions" :key="composition.id" :class="{'in-tournament': composition.tournament.registered}" :toggle="'team/compo/toggle/' + composition.id" class="compo">
				<template #title>
					<rich-tooltip-composition :id="composition.id" v-slot="{ props }">
						<div v-bind="props">{{ composition.name }}</div>
					</rich-tooltip-composition>
				</template>
				<template #actions>
					<div class="level-talent">
						<span class="level">{{ $t('level_n', [composition.total_level]) }}</span>
						<talent :id="team.id" :talent="composition.talent" :max_talent="composition.max_talent" category="team" />
					</div>
					<router-link v-if="composition.tournament.current" :to="'/tournament/' + composition.tournament.current" class="view-tournament button flat">{{ $t('see_tournament') }}</router-link>
					<v-tooltip v-if="$store.state.farmer && $store.state.farmer.tournaments_enabled && captain" content-class="fluid" @update:model-value="loadTournamentRange(composition)">
						<template #activator="{ props }">
							<div class="button flat" v-bind="props" @click="registerTournament(composition)">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="!composition.tournament.registered" class="register-tournament">{{ $t('register_tournament') }}</span>
								<span v-else class="unregister-tournament">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
						<i18n-t v-if="composition.tournamentRange" tag="div" keypath="main.level_x_to_y">
							<template #min><b>{{ composition.tournamentRange.min }}</b></template>
							<template #max><b>{{ composition.tournamentRange.max }}</b></template>
						</i18n-t>
					</v-tooltip>
					<div v-if="captain" class="delete-compo button red" @click="compositionToDelete = composition; deleteCompoDialog = true">
						<v-icon>mdi-close</v-icon>
					</div>
					<div v-if="captain" class="button flat" @click="compositionToRename = composition; renameCompoName = composition.name; renameCompoDialog = true">
						<v-icon>mdi-pencil</v-icon>
					</div>
				</template>
				<template #content>
					<div :class="{dashed: draggedLeek != null && canDrop(composition)}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(composition, $event)">

						<div v-if="composition.leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

						<rich-tooltip-leek v-for="leek in composition.leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
							<div :class="{dragging: leek.dragging}" class="leek" draggable="true" v-bind="props" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(composition, leek, $event)" @dragend="leeksDragend(leek, $event)">
								<leek-image :leek="leek" :scale="0.6" />
								<br>
								<div class="name">{{ leek.name }}</div>
								<talent :id="leek.id" :talent="leek.talent" category="leek" />
								<div>{{ $t('main.level_n', [leek.level]) }}</div>
								<div class="fights">
									<v-icon>mdi-sword</v-icon>
									<!-- <img src="/image/icon/grey/garden.png"> -->
									<span>{{ leek.team_fights }}</span>
								</div>
							</div>
						</rich-tooltip-leek>
					</div>
				</template>
			</panel>
		</div>

		<panel v-if="is_member && team && team.unengaged_leeks" class="compo" toggle="team/no-compo">
			<template #title>{{ $t('unsorted_leeks') }}</template>

			<template #content>
				<div :class="{dashed: draggedLeek != null}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(null, $event)">
					<div v-if="team.unengaged_leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

					<rich-tooltip-leek v-for="leek in team.unengaged_leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
						<div :class="{dragging: leek.dragging}" class="leek" draggable="true" v-bind="props" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(null, leek, $event)" @dragend="leeksDragend(leek, $event)">
							<leek-image :leek="leek" :scale="0.6" />
							<br>
							<div class="name">{{ leek.name }}</div>
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<div>{{ $t('main.level_n', [leek.level]) }}</div>
							<div class="fights">
								<v-icon>mdi-sword</v-icon>
								<!-- <img src="/image/icon/grey/garden.png"> -->
								<span>{{ leek.team_fights }}</span>
							</div>
						</div>
					</rich-tooltip-leek>
				</div>
			</template>
		</panel>
		<panel v-else :title="$t('leeks', [team?.leek_count])">
			<template #content>
				<loader v-if="!team" />
				<div v-else class="leeks">
					<rich-tooltip-leek v-for="leek in team.leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
						<router-link :to="'/leek/' + leek.id" :leek="leek.id" class="leek">
							<div v-bind="props">
								<leek-image :leek="leek" :scale="0.6" />
								<br>
								<div class="name">{{ leek.name }}</div>
								<talent :id="leek.id" :talent="leek.talent" category="leek" />
								<div>{{ $t('main.level_n', [leek.level]) }}</div>
							</div>
						</router-link>
					</rich-tooltip-leek>
				</div>
			</template>
		</panel>

		<div class="container grid large">
			<panel v-if="team && team.fights.length > 0" :title="$t('history')" icon="mdi-sword-cross">
				<template #actions>
					<router-link :to="'/team/' + id + '/history'" class="button flat">
						<v-icon class="list-icon">mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template>
				<template #content>
					<fights-history v-if="team" :fights="team.fights" />
				</template>
			</panel>

			<panel v-if="team && team.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<template #content>
					<tournaments-history v-if="team" :tournaments="team.tournaments" />
				</template>
			</panel>

		</div>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="is_member" class="tab" @click="quitTeamStart">{{ $t('quit_team') }}</div>
				<div v-if="owner" class="tab" @click="renameTeamDialog = true"><v-icon>mdi-pencil-outline</v-icon> {{ $t('rename_team') }}</div>
				<div v-if="owner" class="tab" @click="changeOwnerStart">{{ $t('change_owner') }}</div>
				<div v-if="owner" class="tab" @click="languageDialog = true"><flag v-if="team && team.language" :code="LeekWars.languages[team.language]?.country" :clickable="false" /> {{ $t('team_language') }}</div>
				<div v-if="owner" class="tab" @click="dissolveDialog = true">{{ $t('disolve_team') }}</div>
				<div v-if="!is_member && $store.state.connected">
					<div class="report-button tab" @click="showReport = true">
						<img src="/image/icon/flag.png">
						<span>{{ $t('report') }}</span>
					</div>
				</div>
			</div>
		</div>

		<report-dialog v-if="team" v-model="showReport" :team="team" :reasons="reasons" :parameter="team.id" />

		<popup v-model="createCompoDialog" :width="500" icon="mdi-plus" :title="$t('create_composition')">
			<h4>{{ $t('compo_name') }}</h4>
			<input v-model="createCompoName" type="text" @keyup.enter="createComposition">
			<template #actions>
				<div v-ripple @click="createCompoDialog = false">{{ $t('compo_cancel') }}</div>
				<div v-ripple class="green" @click="createComposition">{{ $t('compo_create') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="deleteCompoDialog" :width="600" icon="mdi-delete" :title="$t('delete_compo_confirm_title', [compositionToDelete?.name])">
			<div v-if="compositionToDelete">
				{{ $t('delete_compo_confirm', [compositionToDelete.name]) }}
			</div>
			<template #actions>
				<div v-ripple @click="deleteCompoDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="red" @click="deleteComposition(compositionToDelete)">{{ $t('delete_confirm') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="renameCompoDialog" :width="600" icon="mdi-pencil" :title="$t('rename_compo_confirm_title', [compositionToRename?.name])">
			<h4>{{ $t('compo_name') }}</h4>
			<input v-model="renameCompoName" type="text" @keyup.enter="renameComposition(compositionToRename)">
			<template #actions>
				<div v-ripple @click="renameCompoDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="green" @click="renameComposition(compositionToRename)">{{ $t('rename_confirm') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="quitTeamDialog" :width="500" icon="mdi-exit-to-app" :title="$t('quit_team_confirm_title', [team.name])">
			{{ $t('quit_team_confirm') }}
			<template #actions>
				<div v-ripple @click="quitTeamDialog = false">{{ $t('quit_cancel') }}</div>
				<div v-ripple class="red" @click="quitTeam">{{ $t('quit_confirm') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="dissolveDialog" :width="500" icon="mdi-delete" :title="$t('disolve_confirm_title', [team.name])">
			{{ $t('disolve_confirm') }}
			<template #actions>
				<div v-ripple @click="dissolveDialog = false">{{ $t('disolve_cancel') }}</div>
				<div v-ripple class="red" @click="dissolveTeam">{{ $t('disolve_disolve') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="renameTeamDialog" :width="600">
			<template #icon><v-icon>mdi-pencil-outline</v-icon></template>
			<template #title>{{ $t('rename_team') }}</template>
			{{ $t('rename_team_description') }}
			<br><br>
			{{ $t('rename_team_new_name') }} : <input v-model="renameTeamName" type="text" @keyup.enter="renameTeam('habs')">
			<br><br>
			<div class="center">
				<v-btn class="rename-button" @click="renameTeam('habs')">{{ $t('rename_team_pay_habs') }} :&nbsp;<b>{{ $filters.number(rename_team_price_habs) }}</b><img src="/image/hab.png"></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="renameTeam('crystals')">{{ $t('rename_team_pay_crystals') }} :&nbsp;<b>{{ $filters.number(rename_team_price_crystals) }}</b><span class="crystal"></span></v-btn>
			</div>
		</popup>

		<popup v-if="team" v-model="languageDialog" :width="600" icon="mdi-translate" :title="$t('team_language')">
			<div class="team-language-popup">
				<div v-for="language in LeekWars.languages" :key="language.code" v-ripple :class="{selected: language.code == team.language}" class="language" @click="setTeamLanguage(language.code)">
					<flag :code="language.country" :clickable="false" />
					<br>
					{{ language.name }}
				</div>
			</div>
		</popup>

		<popup v-if="banMemberTarget" v-model="banDialog" :width="500" icon="mdi-delete" :title="$t('ban_member_confirm_title', [banMemberTarget.name])">
			{{ $t('ban_confirm', [banMemberTarget.name]) }}
			<template #actions>
				<div v-ripple @click="banDialog = false">{{ $t('ban_cancel') }}</div>
				<div v-ripple class="red" @click="banMember"><v-icon>mdi-hand-pointing-right</v-icon>{{ $t('ban_ban') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="changeOwnerDialog" :width="650" icon="mdi-account-switch" :title="$t('change_owner_confirm_title')">
			<div class="change_owner_popup">
				{{ $t('change_owner_select') }}
				<br>
				<rich-tooltip-farmer v-for="member in team.members" :id="member.id" :key="member.id" v-slot="{ props }">
					<div :class="{selected: member === changeOwnerSelected}" class="farmer" v-bind="props" @click="changeOwnerSelected = member">
						<avatar :farmer="member" />
						<div class="name">
							<v-tooltip v-if="member.grade === 'owner'">
								<template #activator="{ props }">
									<span v-bind="props">★</span>
								</template>
								{{ $t('owner') }}
							</v-tooltip>
							<v-tooltip v-else-if="member.grade === 'captain'">
								<template #activator="{ props }">
									<span v-bind="props">☆</span>
								</template>
								{{ $t('captain') }}
							</v-tooltip>
							{{ member.name }}
						</div>
					</div>
				</rich-tooltip-farmer>
			</div>
			<template #actions>
				<div v-ripple @click="changeOwnerDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div v-ripple class="green" @click="changeOwnerSelect()">{{ $t('change_owner_change') }}</div>
			</template>
		</popup>

		<popup v-if="changeOwnerSelected" v-model="changeOwnerConfirmDialog" :width="500" icon="mdi-account-switch" :title="$t('change_owner_confirm_title')">
			<i18n-t keypath="change_owner_confirm">
				<template #farmer><b>{{ changeOwnerSelected.name }}</b></template>
			</i18n-t>
			<br><br>
			{{ $t('enter_password_to_confirm') }}
			<br><br>
			<input v-model="changeOwnerPassword" type="password">
			<template #actions>
				<div v-ripple @click="changeOwnerConfirmDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div v-ripple class="green" @click="changeOwner">{{ $t('change_owner_change') }}</div>
			</template>
		</popup>

		<popup v-if="team" v-model="turretDialog" :width="600" icon="mdi-information-outline" :title="$t('turret') + ' [' + $t('level_n', [team.level]) + ']'">
			<div class="turret-dialog">
				<turret-image :level="team.level" :skin="1" :scale="0.32" />
				<div class="infos">
					<h4>{{ $t('characteristic.characteristics') }}</h4>
					<div class="card characteristics">
						<characteristic-tooltip v-for="c in LeekWars.characteristics_table" :key="c" v-slot="{ props }" :characteristic="c" :value="turret[c]" :total="turret[c]" :leek="turret" :test="true">
							<div class="characteristic" :class="c" v-bind="props">
								<img :src="'/image/charac/' + c + '.png'">
								<span class="stat" :class="'color-' + c">{{ turret[c] }}</span>
							</div>
						</characteristic-tooltip>
					</div>
					<br>

					<h4>{{ $t('main.chips') }}</h4>
					<div class="chips">
						<rich-tooltip-item v-for="chip in [4, 23, 20, 1, 15, 92, 97, 100]" :key="chip" v-slot="{ props }" :item="LeekWars.items[chip]" :bottom="true" :instant="true">
							<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" class="chip" v-bind="props">
						</rich-tooltip-item>
					</div>
				</div>
			</div>
		</popup>

		<popup v-if="team && is_member" v-model="turretAiDialog" :width="870" icon="mdi-code-braces" :title="$t('main.turret') + ' [' + $t('level_n', [team.level]) + ']'">
			<div class="turret-ai-dialog">
				<explorer class="explorer" @select="selectAI($event)" />
			</div>
		</popup>

		<popup v-if="team && is_member" v-model="logsDialog" :width="600" icon="mdi-playlist-check" :title="$t('log_change')">
			<div>{{ $t('log_change_text') }}</div>
			<br>
			<v-radio-group v-model="logsLevel" hide-details @update:model-value="updateLogsLevel">
				<v-radio :value="0" :label="$t('log_level_0') + ' : ' + $t('log_level_0_desc')" />
				<v-radio :value="1" :label="$t('log_level_1') + ' : ' + $t('log_level_1_desc')" />
				<v-radio :value="2" :label="$t('log_level_2') + ' : ' + $t('log_level_2_desc')" />
			</v-radio-group>
		</popup>

	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { mixins, t as gt, useNamespacedT } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { Composition, Team, TeamMember } from '@/model/team'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import FightsHistory from '@/component/history/fights-history.vue'
	import TournamentsHistory from '@/component/history/tournaments-history.vue'
	import ReportDialog from '@/component/moderation/report-dialog.vue'
	import TurretImage from '@/component/turret-image.vue'
	import AIElement from '@/component/app/ai.vue'
	import { CHIPS } from '@/model/chips'
	import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'
	import Sortable from 'sortablejs'

	const Chat = defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`))
	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/explorer/explorer.${locale}.i18n`))

	defineOptions({ name: 'team', i18n: {}, mixins: [...mixins], components: {
		CharacteristicTooltip, RichTooltipItem, RichTooltipLeek, RichTooltipFarmer, RichTooltipComposition, RichTooltipTeam, FightsHistory, TournamentsHistory, ReportDialog, TurretImage, ai: AIElement, Line,
	} })

	interface ColumnDef {
		key: string
		titleKey: string
		align?: string
	}
	interface ColumnConfigItem extends ColumnDef {
		visible: boolean
	}
	const ALL_MEMBER_COLUMNS: ColumnDef[] = [
		{ key: 'name', titleKey: 'main.farmer' },
		{ key: 'grade', titleKey: 'main.grade' },
		{ key: 'country', titleKey: 'main.country', align: 'center' },
		{ key: 'talent', titleKey: 'main.talent', align: 'end' },
		{ key: 'ranking', titleKey: 'main.ranking', align: 'end' },
		{ key: 'total_level', titleKey: 'main.level', align: 'end' },
		{ key: 'points', titleKey: 'main.trophies', align: 'end' },
		{ key: 'fights', titleKey: 'main.fights', align: 'end' },
		{ key: 'victories', titleKey: 'main.victories', align: 'end' },
		{ key: 'draws', titleKey: 'main.draws', align: 'end' },
		{ key: 'defeats', titleKey: 'main.defeats', align: 'end' },
		{ key: 'ratio', titleKey: 'main.ratio', align: 'end' },
		{ key: 'leek_count', titleKey: 'main.leeks', align: 'end' },
		{ key: 'won_team_tournaments', titleKey: 'main.tournaments', align: 'end' },
		{ key: 'won_br', titleKey: 'main.battle_royale', align: 'end' },
		{ key: 'clovers', titleKey: 'main.clovers', align: 'end' },
		{ key: 'turrets_killed', titleKey: 'main.turrets', align: 'end' },
		{ key: 'last_connection', titleKey: 'main.connection' },
		{ key: 'join_date', titleKey: 'main.join_date' },
	]
	const ALL_MEMBER_COLUMNS_MAP: { [key: string]: ColumnDef } = {}
	for (const col of ALL_MEMBER_COLUMNS) ALL_MEMBER_COLUMNS_MAP[col.key] = col
	const DEFAULT_MEMBER_COLUMNS = ['name', 'grade', 'country', 'talent', 'ranking', 'total_level', 'points', 'fights', 'last_connection', 'join_date']
	const DEFAULT_MEMBER_SORT = { key: 'last_connection', order: 'desc' }

	useI18n() // initialize local scope for <i18n-t>
	const t = useNamespacedT('team')
	const route = useRoute()
	const router = useRouter()
	const emblemRef = useTemplateRef<any>('emblem')
	const emblemInput = useTemplateRef<HTMLInputElement>('emblemInput')
	const descriptionElement = useTemplateRef<HTMLElement>('descriptionElement')
	const recruitmentElement = useTemplateRef<HTMLElement>('recruitmentElement')
	const columnsConfigListEl = useTemplateRef<HTMLElement>('columnsConfigListEl')

	const team = ref<Team | null>(null)
	const error = ref(false)
	const captain = ref(false)
	const owner = ref(false)
	const showReport = ref(false)
	const reasons = [Warning.INCORRECT_EMBLEM, Warning.INCORRECT_TEAM_NAME, Warning.INCORRECT_TEAM_DESCRIPTION]
	const createCompoDialog = ref(false)
	const createCompoName = ref('')
	const renameCompoName = ref('')
	const deleteCompoDialog = ref(false)
	const renameCompoDialog = ref(false)
	const compositionToDelete = ref<Composition | null>(null)
	const compositionToRename = ref<Composition | null>(null)
	const banDialog = ref(false)
	const banMemberTarget = ref<Farmer | null>(null)
	const quitTeamDialog = ref(false)
	const dissolveDialog = ref(false)
	const renameTeamDialog = ref(false)
	const renameTeamName = ref('')
	const rename_team_price_habs = 10000000
	const rename_team_price_crystals = 200
	const languageDialog = ref(false)
	const changeOwnerDialog = ref(false)
	const changeOwnerConfirmDialog = ref(false)
	const changeOwnerSelected = ref<TeamMember | null>(null)
	const changeOwnerPassword = ref('')
	const editingDescription = ref(false)
	const draggedLeek = ref<Leek | null>(null)
	const draggedLeekComposition = ref<Composition | null>(null)
	const turretDialog = ref(false)
	const turretAiDialog = ref(false)
	const logsDialog = ref(false)
	const editMembers = ref(false)
	const membersTableView = ref(localStorage.getItem('team/members-table-view') !== 'false')
	const columnsDialog = ref(false)
	const columnsConfigList = ref<ColumnConfigItem[]>([])
	const columnsSortKey = ref(DEFAULT_MEMBER_SORT.key)
	const columnsSortOrder = ref(DEFAULT_MEMBER_SORT.order)
	let columnsSortable: Sortable | null = null
	const logsLevel = ref(0)
	const rankingsLoading = ref(false)
	const rankingsLoaded = ref(false)
	const chartData = ref<ChartData<'line'> | null>(null)
	const chartOptions = ref<ChartOptions<'line'> | null>(null)
	let savingRecruitment = false

	const id = computed(() => 'id' in route.params ? parseInt(route.params.id as string, 10) : (store.state.farmer && store.state.farmer.team !== null ? store.state.farmer.team.id : null))

	const activityLabel = computed(() => {
		if (!team.value) return ''
		const score = team.value.activity
		if (score >= 250) return '🔥🔥🔥'
		if (score >= 100) return '🔥🔥'
		if (score >= 10) return '🔥'
		return ''
	})

	const activityTooltip = computed(() => {
		if (!team.value) return ''
		const score = team.value.activity
		if (score >= 250) return t('main.very_active')
		if (score >= 100) return t('main.active')
		return t('main.low_activity')
	})

	const max_level = computed(() => team.value && team.value.level === 100)
	const xp_bar_width = computed(() => team.value ? (team.value.level === 100 ? 100 : Math.floor(100 * (team.value.xp - team.value.down_xp) / (team.value.up_xp - team.value.down_xp))) : 0)
	const is_member = computed(() => !route.params.id || (team.value && store.state.farmer && store.state.farmer.team !== null && team.value.id === store.state.farmer.team.id))
	const my_member = computed(() => is_member.value ? team.value!.membersById[store.state.farmer!.id] : null)
	const teamOwner = computed(() => team.value ? team.value.members.find(m => m.grade === 'owner') : null)

	const myInvitation = computed(() => {
		const me = store.state.farmer
		if (me && me.team_invitations && team.value) {
			return me.team_invitations.find((inv: any) => inv.team_id === team.value!.id) || null
		}
		return null
	})

	const membersColumns = computed(() => team.value?.members_columns?.columns || DEFAULT_MEMBER_COLUMNS)
	const membersSort = computed(() => {
		const sort = team.value?.members_columns?.sort || DEFAULT_MEMBER_SORT
		return [{ key: sort.key, order: sort.order as 'asc' | 'desc' }]
	})

	const customKeySort: Record<string, (a: number | null, b: number | null) => number> = {
		ranking: (a, b) => {
			if (a === null && b === null) return 0
			if (a === null) return 1
			if (b === null) return -1
			return a - b
		}
	}

	const membersHeaders = computed(() => membersColumns.value
		.map(key => {
			const col = ALL_MEMBER_COLUMNS_MAP[key]
			if (!col) return null
			return { title: t(col.titleKey), value: key, sortable: true, align: col.align as 'start' | 'end' | 'center' | undefined }
		})
		.filter((h): h is NonNullable<typeof h> => h !== null))

	const turret = computed<Record<string, any>>(() => {
		if (!team.value) return {}
		const team_ratio = 1 + (team.value.level / 100)
		const max_life = 1000 + Math.round((4000 - 500) * team_ratio)
		const characteristics_base_1000 = 100 + Math.round(950 * team_ratio)
		const characteristics_base_2000 = 200 + Math.round(1900 * team_ratio)
		const characteristics_base_500 = 50 + Math.round(475 * team_ratio)
		return {
			life: 1000 + ` ${t('to')} ` + max_life,
			strength: 200 + ` ${t('to')} ` + characteristics_base_2000,
			agility: 50 + ` ${t('to')} ` + characteristics_base_500,
			resistance: 50 + ` ${t('to')} ` + characteristics_base_500,
			science: 50 + ` ${t('to')} ` + characteristics_base_500,
			wisdom: 100 + ` ${t('to')} ` + characteristics_base_1000,
			magic: 100 + ` ${t('to')} ` + characteristics_base_1000,
			frequency: 111,
			ram: 20,
			cores: 20,
			tp: Math.floor(12 * team_ratio),
			mp: 0
		}
	})

	watch(id, () => update(), { immediate: true })

	function update() {
		if (id.value === null) return
		let request = 'team/get/' + id.value
		if (store.state.farmer) {
			if (store.state.farmer.team !== null && store.state.farmer.team.id === id.value) {
				request = 'team/get-private/' + id.value
			} else {
				request = 'team/get-connected/' + id.value
			}
		}
		error.value = false
		rankingsLoading.value = false
		rankingsLoaded.value = false
		LeekWars.get<Team>(request).then(tm => {
			team.value = tm
			if (!team.value) return

			team.value.membersById = {}
			for (const member of team.value.members) {
				team.value.membersById[member.id] = member
			}
			const teamCaptain = is_member.value && ['captain', 'owner'].indexOf(team.value.membersById[store.state.farmer!.id].grade) !== -1
			captain.value = teamCaptain as boolean
			owner.value = (is_member.value && team.value.membersById[store.state.farmer!.id].grade === 'owner') as boolean

			team.value.compositionsById = {}
			if (team.value.compositions) {
				for (const composition of team.value.compositions) {
					team.value.compositionsById[composition.id] = composition
					for (const leek of composition.leeks) {
						;(leek as any).dragging = false
					}
				}
				for (const leek of team.value.unengaged_leeks) {
					;(leek as any).dragging = false
				}
			}

			addRankingStyles()
			chart()

			LeekWars.setTitle(team.value.name)
			LeekWars.setSubTitle(t('main.n_farmers', [tm.members.length]) + " • " + t('main.n_leeks', [tm.leek_count]))
			if (is_member.value) {
				logsLevel.value = my_member.value!.logs_level
				LeekWars.setActions([
					{icon: 'mdi-chat-outline', click: () => router.push('/forum/category-' + tm.forum)},
					{icon: 'mdi-account-group', click: () => router.push('/teams')}
				])
			} else {
				LeekWars.setActions([
					{icon: 'mdi-flag-outline', click: () => router.push('/garden/challenge/team/' + tm.id)},
					{icon: 'mdi-account-group', click: () => router.push('/teams')}
				])
			}
			emitter.emit('loaded')
		}).error(() => {
			error.value = true
		})
	}

	function addRankingStyles() {
		if (!team.value) return
		const styles = ['first', 'second', 'third']
		for (let i = 0; i < 3; ++i) {
			if (team.value.rankings.leeks.length > i) (team.value.rankings.leeks[i] as any).style = styles[i]
			if (team.value.rankings.farmers.length > i) (team.value.rankings.farmers[i] as any).style = styles[i]
			if (team.value.rankings.trophies.length > i) (team.value.rankings.trophies[i] as any).style = styles[i]
		}
		if (store.state.connected && store.state.farmer) {
			for (const row of team.value.rankings.leeks) {
				if (row.id in store.state.farmer.leeks) {
					;(row as any).me = true
				}
			}
			for (const row of team.value.rankings.farmers) {
				if (row.id === store.state.farmer.id) {
					;(row as any).me = true
					break
				}
			}
			for (const row of team.value.rankings.trophies) {
				if (row.id === store.state.farmer.id) {
					;(row as any).me = true
					break
				}
			}
		}
	}

	function changeEmblem(e: Event) {
		if (!e || !e.target || !team.value) return
		const input = e.target as HTMLInputElement
		if (!input || !input.files) return
		const file = input.files[0]

		if (!LeekWars.uploadCheck(file)) {
			LeekWars.toast("Invalid image (wrong format or > 10 Mo)")
			return
		}

		LeekWars.fileToImage(file, (emblemRef.value as any)?.$el as Element)

		const formdata = new FormData()
		formdata.append('team_id', '' + team.value.id)
		formdata.append('emblem', file)

		LeekWars.toast(t('uploading_emblem') as string)

		LeekWars.post('team/set-emblem', formdata).then(() => {
			if (team.value) {
				LeekWars.toast(t('upload_success') as string)
				team.value.emblem_changed = LeekWars.time
				store.commit('update-emblem')
			}
		}).error(err => {
			LeekWars.toast(t('upload_failed', [err.error]) as string)
			team.value!.emblem_changed = LeekWars.time
		})
	}

	function createComposition() {
		LeekWars.post('team/create-composition', {composition_name: createCompoName.value}).then(data => {
			if (team.value) {
				if (!data.id) data.id = Math.floor(Math.random() * 100000)
				const compo = {
					id: data.id,
					name: createCompoName.value,
					leeks: [],
					talent: 1000,
					total_level: 0,
					tournament: {current: null, registered: false},
					captain: captain.value,
					fights: 10,
					tournamentRange: [],
					tournamentRangeLoading: false
				} as any as Composition
				team.value.compositions.push(compo)
				team.value.compositionsById[compo.id] = compo
				createCompoDialog.value = false
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function deleteComposition(composition: Composition | null) {
		if (!composition) return
		LeekWars.delete('team/delete-composition', {composition_id: composition.id}).then(() => {
			if (team.value) {
				LeekWars.toast(gt('compo_deleted', [composition.name]))
				for (const leek of composition.leeks) {
					team.value.unengaged_leeks.push(leek)
				}
				team.value.compositions.splice(team.value.compositions.indexOf(composition), 1)
				deleteCompoDialog.value = false
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function renameComposition(composition: Composition | null) {
		if (!composition) return
		LeekWars.put('team/rename-composition', {composition_id: composition.id, composition_name: renameCompoName.value}).then(() => {
			if (team.value) {
				renameCompoDialog.value = false
				composition.name = renameCompoName.value
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function quitTeamStart() {
		if (owner.value) {
			LeekWars.toast(gt('cant_quit_owner'))
		} else {
			quitTeamDialog.value = true
		}
	}

	function quitTeam() {
		LeekWars.post('team/quit').then(() => {
			quitTeamDialog.value = false
			LeekWars.toast(gt('you_left_team'))
			router.push('/farmer')
		}).error(err => {
			quitTeamDialog.value = false
			LeekWars.toast(t('error_' + err.error, err.params))
		})
	}

	function dissolveTeam() {
		LeekWars.post('team/dissolve').then(() => {
			dissolveDialog.value = false
			LeekWars.toast(gt('team_have_been_disolved'))
			store.commit('dissolve-team')
			router.push('/farmer')
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function registerTournament(composition: Composition) {
		if (composition.tournament.registered) {
			LeekWars.post('team/unregister-tournament', {composition_id: composition.id})
			composition.tournament.registered = false
		} else {
			if (composition.leeks.length < 4) {
				LeekWars.toast(gt('compo_must_contain_4_leeks'))
				return
			}
			LeekWars.post('team/register-tournament', {composition_id: composition.id})
			composition.tournament.registered = true
		}
	}

	function banMemberStart(member: Farmer) {
		banMemberTarget.value = member
		banDialog.value = true
	}

	function banMember() {
		if (banMemberTarget.value == null) return
		LeekWars.post('team/ban', {farmer_id: banMemberTarget.value.id}).then(() => {
			LeekWars.toast(gt('farmer_banned'))
			banDialog.value = false
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function updateOpened() {
		if (team.value) {
			team.value.opened = !team.value.opened
			LeekWars.post('team/set-opened', {opened: team.value.opened})
		}
	}

	function setTeamLanguage(code: string) {
		if (team.value) {
			team.value.language = code
			LeekWars.put('team/set-language', {language: code})
		}
	}

	function renameTeam(currency: string) {
		if (!team.value) return
		const method = currency === 'habs' ? 'team/rename-habs' : 'team/rename-crystals'
		LeekWars.post(method, {name: renameTeamName.value}).then(() => {
			if (team.value) {
				team.value.name = renameTeamName.value
				if (currency === 'habs') {
					store.commit('update-habs', -rename_team_price_habs)
				} else {
					store.commit('update-crystals', -rename_team_price_crystals)
				}
				renameTeamDialog.value = false
				LeekWars.toast(t('rename_team_done'))
			}
		}).error(err => {
			LeekWars.toast(t('error_' + err.error, err.params))
		})
	}

	function startEditingDescription() {
		if (!team.value) return
		editingDescription.value = true
		if (!team.value.description) {
			descriptionElement.value!.innerText = ''
		}
	}

	function saveDescription() {
		if (!team.value) return
		editingDescription.value = false
		descriptionElement.value!.blur()
		team.value.description = '' + descriptionElement.value!.textContent
		LeekWars.put('team/change-description', {team_id: team.value.id, description: team.value.description})
		if (!team.value.description) {
			descriptionElement.value!.innerText = ''
		}
	}

	function saveRecruitmentMessage() {
		if (!team.value || savingRecruitment) return
		savingRecruitment = true
		recruitmentElement.value!.blur()
		const text = ('' + recruitmentElement.value!.innerText).trim()
		team.value.recruitment_message = text
		LeekWars.put('team/change-recruitment-message', {message: text}).error((e: any) => {
			LeekWars.toast("Error: " + JSON.stringify(e))
		})
		nextTick(() => { savingRecruitment = false })
	}

	function acceptCandidacy(candidacy: any) {
		LeekWars.post('team/accept-candidacy', {candidacy_id: candidacy.id}).then(() => {
			LeekWars.toast(gt('farmer_accepted'))
			update()
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function rejectCandidacy(candidacy: any) {
		LeekWars.post('team/reject-candidacy', {candidacy_id: candidacy.id}).then(() => {
			LeekWars.toast(gt('farmer_refused'))
			update()
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function toggleMembersView() {
		membersTableView.value = !membersTableView.value
		localStorage.setItem('team/members-table-view', String(membersTableView.value))
	}

	function openColumnsDialog() {
		if (columnsConfigList.value.length === 0) {
			const config = team.value?.members_columns
			const columns = config?.columns || DEFAULT_MEMBER_COLUMNS
			const order = config?.order || ALL_MEMBER_COLUMNS.map(c => c.key)
			const sort = config?.sort || DEFAULT_MEMBER_SORT
			for (const key of order) {
				const col = ALL_MEMBER_COLUMNS_MAP[key]
				if (col) columnsConfigList.value.push({ ...col, visible: columns.includes(key) })
			}
			for (const col of ALL_MEMBER_COLUMNS) {
				if (!order.includes(col.key)) {
					columnsConfigList.value.push({ ...col, visible: false })
				}
			}
			columnsSortKey.value = sort.key
			columnsSortOrder.value = sort.order
		}
		nextTick(() => {
			const el = columnsConfigListEl.value
			if (!el) return
			if (columnsSortable) columnsSortable.destroy()
			columnsSortable = Sortable.create(el, {
				handle: '.drag-handle',
				animation: 150,
				onEnd: (evt) => {
					if (evt.oldIndex === undefined || evt.newIndex === undefined) return
					const item = columnsConfigList.value.splice(evt.oldIndex, 1)[0]
					columnsConfigList.value.splice(evt.newIndex, 0, item)
					saveColumnsConfig()
				}
			})
		})
	}

	function saveColumnsConfig() {
		const columns = columnsConfigList.value.filter(c => c.visible).map(c => c.key)
		if (!columns.includes('name')) columns.unshift('name')
		if (!columns.includes(columnsSortKey.value)) {
			columnsSortKey.value = columns[0]
		}
		const order = columnsConfigList.value.map(c => c.key)
		const config = { columns, order, sort: { key: columnsSortKey.value, order: columnsSortOrder.value } }
		team.value!.members_columns = config
		LeekWars.put('team/set-members-columns', { columns: JSON.stringify(config) })
	}

	function columnLabel(col: ColumnDef) {
		return t(col.titleKey) as string
	}

	const visibleConfigColumns = computed(() => columnsConfigList.value.filter(c => c.visible))

	function toggleSortOrder() {
		columnsSortOrder.value = columnsSortOrder.value === 'asc' ? 'desc' : 'asc'
		saveColumnsConfig()
	}

	function resetColumnsConfig() {
		columnsSortKey.value = DEFAULT_MEMBER_SORT.key
		columnsSortOrder.value = DEFAULT_MEMBER_SORT.order
		columnsConfigList.value = ALL_MEMBER_COLUMNS.map(col => ({
			...col,
			visible: DEFAULT_MEMBER_COLUMNS.includes(col.key)
		}))
		saveColumnsConfig()
	}

	function cancelInvitation(invitation: any) {
		if (!team.value) return
		LeekWars.post('team/cancel-invitation', {invitation_id: invitation.id}).then(() => {
			if (team.value) {
				LeekWars.toast(gt('invitation_cancelled'))
				team.value.invitations.splice(team.value.invitations.indexOf(invitation), 1)
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function acceptInvitation() {
		const inv = myInvitation.value
		if (!inv) return
		LeekWars.post('team/accept-invitation', {invitation_id: inv.id}).then(() => {
			LeekWars.toast(gt('invitation_accepted'))
			router.push('/team/' + inv.team_id)
			LeekWars.get('farmer/get-login-data').then((d) => {
				store.commit('connected', d)
			})
		}).error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function rejectInvitation() {
		const inv = myInvitation.value
		if (!inv) return
		LeekWars.post('team/reject-invitation', {invitation_id: inv.id}).then(() => {
			LeekWars.toast(gt('invitation_rejected'))
			const me = store.state.farmer
			if (me && me.team_invitations) {
				me.team_invitations.splice(me.team_invitations.indexOf(inv), 1)
			}
		}).error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function sendCandidacy() {
		if (!team.value) return
		LeekWars.post('team/send-candidacy', {team_id: team.value.id}).then(() => {
			if (team.value) {
				LeekWars.toast(gt('candidacy_sent'))
				team.value.candidacy = true
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function cancelCandidacy() {
		if (!team.value) return
		LeekWars.post('team/cancel-candidacy-for-team', {team_id: team.value.id}).then(() => {
			if (team.value) {
				LeekWars.toast(gt('candidacy_cancelled'))
				team.value.candidacy = false
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function changeLevel(member: TeamMember) {
		if (!team.value) return
		LeekWars.post('team/change-member-grade', {member_id: member.id, new_grade: member.grade})
	}

	function changeOwnerStart() {
		if (!team.value) return
		changeOwnerDialog.value = true
		changeOwnerSelected.value = team.value.members.find(m => m.grade === 'owner') as TeamMember
	}

	function changeOwnerSelect() {
		if (!team.value) return
		changeOwnerConfirmDialog.value = true
	}

	function changeOwner() {
		if (!team.value || !changeOwnerSelected.value) return
		LeekWars.post('team/change-owner', {new_owner: changeOwnerSelected.value.id, password: changeOwnerPassword.value}).then(() => {
			LeekWars.toast(gt('owner_has_been_changed'))
			changeOwnerConfirmDialog.value = false
			changeOwnerDialog.value = false
			update()
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function moveLeek(leek: Leek, oldCompo: Composition | null, newCompo: Composition | null) {
		if (!team.value || (newCompo && !canDrop(newCompo))) return
		if (oldCompo) {
			oldCompo.leeks.splice(oldCompo.leeks.indexOf(leek), 1)
		} else {
			team.value.unengaged_leeks.splice(team.value.unengaged_leeks.indexOf(leek), 1)
		}
		if (newCompo) {
			newCompo.leeks.push(leek)
		} else {
			team.value.unengaged_leeks.push(leek)
		}
		const newCompositionID = newCompo ? newCompo.id : -1
		LeekWars.post('team/move-leek', {leek_id: leek.id, to: newCompositionID})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function leeksDragstart(composition: Composition | null, leek: Leek, e: DragEvent) {
		if (composition && composition.tournament.registered) return false
		e.dataTransfer!.setData('text/plain', 'drag !!!')
		draggedLeek.value = leek
		draggedLeekComposition.value = composition
		;(leek as any).dragging = true
		return true
	}

	function leeksDragend(leek: Leek, e: Event) {
		;(leek as any).dragging = false
		draggedLeek.value = null
		e.preventDefault()
		return false
	}

	function leeksDrop(composition: Composition | null, e: Event) {
		if (draggedLeek.value) {
			moveLeek(draggedLeek.value, draggedLeekComposition.value, composition)
			;(draggedLeek.value as any).dragging = false
			draggedLeek.value = null
		}
		e.preventDefault()
		return false
	}

	function leeksDragover(e: Event) {
		e.preventDefault()
		e.stopPropagation()
		return false
	}

	function canDrop(composition: Composition) {
		return !composition.tournament.registered && composition.leeks.length < 6 && draggedLeekComposition.value !== composition
	}

	function selectAI(ai: any) {
		LeekWars.put('team/set-turret-ai', {ai_path: ai.path}).then(() => {
			team.value!.turret_ai = ai
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
		turretAiDialog.value = false
	}

	function updateLogsLevel() {
		my_member.value!.logs_level = logsLevel.value
		LeekWars.put('team/set-logs-level', {level: logsLevel.value})
	}

	function loadTournamentRange(composition: Composition) {
		if ((composition as any).tournamentRange || (composition as any).tournamentRangeLoading) return
		;(composition as any).tournamentRangeLoading = true
		const power = Math.round(composition.leeks.reduce((p, l) => p + l.level ** LeekWars.POWER_FACTOR, 0))
		LeekWars.get('tournament/range-compo/' + power).then(d => (composition as any).tournamentRange = d)
	}

	function chart() {
		if (!team.value || !team.value.talent_history || team.value.talent_history.length === 0) return
		const labels = []
		const time = LeekWars.time
		for (let i = 1; i <= 7; ++i) {
			labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		}
		chartData.value = {
			labels: labels.reverse(),
			datasets: [{
				tension: 0.2,
				data: team.value.talent_history,
				borderColor: '#5fad1b',
				pointBackgroundColor: '#5fad1b',
				borderWidth: 2,
				fill: { target: 'origin', above: '#5fad1b30' },
			}]
		} as any
		chartOptions.value = {
			aspectRatio: 2.5,
			plugins: { legend: { display: false } },
			elements: { point: { radius: 4, hoverRadius: 6 } },
		}
	}

	function toggleLike() {
		if (!team.value) return
		const liked = team.value.liked
		team.value.liked = !liked
		team.value.likes += liked ? -1 : 1
		const endpoint = liked ? 'team/unlike' : 'team/like'
		LeekWars.post(endpoint, {target_id: team.value.id}).then(data => {
			if (team.value) team.value.likes = data.likes
		}).error(() => {
			if (team.value) {
				team.value.liked = liked
				team.value.likes += liked ? 1 : -1
			}
		})
	}

	function loadRankings() {
		if (!team.value) return
		rankingsLoading.value = true
		LeekWars.get('team/rankings/' + team.value.id).then(rankings => {
			team.value!.rankings = rankings
			rankingsLoading.value = false
			rankingsLoaded.value = true
			addRankingStyles()
		})
	}
</script>

<style lang="scss" scoped>
	.team-level {
		font-size: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.team-activity {
		cursor: default;
		font-size: 18px;
	}
	.v-input--switch {
		margin-left: 8px;
	}
	.team-emblem {
		text-align: center;
	}
	.emblem {
		width: 200px;
		height: 200px;
	}
	.emblem-wrapper {
		position: relative;
		display: inline-block;
	}
	.like-overlay {
		position: absolute;
		bottom: 0;
		right: -8px;
		text-transform: none;
		min-width: 0;
		&.liked {
			color: #e53935;
		}
		&.no-click {
			cursor: default;
			pointer-events: none;
		}
	}
	.emblem-input {
		cursor: pointer;
		input {
			display: none;
		}
	}
	.description {
		vertical-align: bottom;
		padding-top: 8px;
		.text {
			font-size: 17px;
			color: var(--text-color-secondary);
			font-weight: 300;
		}
	}
	.recruitment-message {
		padding-top: 6px;
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-color-secondary);
		font-size: 14px;
		text-align: left;
		.v-icon {
			color: var(--text-color-secondary);
		}
		.text {
			padding: 0 4px;
		}
		[contenteditable] {
			cursor: text;
		}
		[contenteditable]:empty:before {
			content: attr(data-placeholder);
			font-style: italic;
			color: #999;
		}
	}
	.guillemet {
		font-size: 30px;
		line-height: 18px;
		vertical-align: top;
		color: var(--text-color-secondary);
		font-weight: 300;
	}
	.team-status {
		padding: 0 5px;
	}
	.team-status.empty {
		font-style: italic;
		color: #999;
	}
	.bar {
		width: 100%;
		height: 12px;
		margin-top: 5px;
		background: var(--pure-white);
		border: 1px solid var(--border);
		position: relative;
		border-radius: 5px;
	}
	.xp-bar {
		height: 10px;
		background: #30bb00;
		display: inline-block;
		vertical-align: top;
		position: absolute;
		border-radius: 5px;
	}
	.xp-bar.blue {
		background: #008fbb;
	}
	.info-talent {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 15px;
	}
	.talent-history {
		margin-top: 3px;
	}
	.fights, .tournaments {
		width: 100%;
		border-collapse: collapse;
		text-align: center;
		.big {
			font-size: 22px;
			font-weight: 300;
			color: var(--text-color-secondary);
		}
		.grey {
			color: #999;
		}
		tr > td:nth-child(n+2) {
			border-left: 2px solid var(--border);
		}
	}
	.tournaments {
		margin-top: 10px;
		margin-bottom: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		.big {
			font-size: 22px;
			font-weight: 300;
			color: var(--text-color-secondary);
		}
	}
	.candidacies .empty {
		padding: 10px;
		color: #999;
		text-align: center;
	}
	.candidacies .farmer {
		text-align: center;
		display: inline-block;
		.avatar {
			width: 100px;
			height: 100px;
		}
		.accept {
			color: green;
			cursor: pointer;
			margin: 5px;
		}
		.reject {
			color: red;
			cursor: pointer;
			margin: 5px;
		}
	}
	.members {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
		grid-gap: 10px;
		padding: 10px;
		.grade {
			margin: 4px 0;
			display: block;
		}
		.level {
			margin: 4px 0;
		}
		.logs {
			font-size: 14px;
			margin-top: 3px;
			padding-top: 2px;
			border-radius: 3px;
			&.me {
				cursor: pointer;
				&:hover {
					background: #ddd;
				}
			}
			&.hidden {
				color: var(--text-color-secondary);
			}
			.v-icon {
				font-size: 22px;
			}
			.activated {
				color: green;
			}
			.edit {
				font-size: 18px;
				vertical-align: top;
			}
		}
	}
	.chat {
		height: 300px;
	}
	.farmer, .popup.change_owner_popup .farmer {
		display: inline-block;
		text-align: center;
		vertical-align: top;
	}
	.farmer .avatar, .popup.change_owner_popup .farmer .avatar {
		width: 100px;
		height: 100px;
		margin-left: 6px;
		margin-right: 6px;
	}
	.farmer .name, .popup.change_owner_popup .farmer .name {
		font-size: 17px;
		text-align: center;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 114px;
		margin: 2px 0;
		span {
			padding-left: 2px;
		}
	}
	.members-table {
		white-space: nowrap;
		.date-cell {
			font-size: 12px;
		}
		.inactive {
			opacity: 0.4;
		}
		.ranking-badge-small {
			transform: scale(0.8);
			transform-origin: center;
			margin: 0;
		}
		:deep(td), :deep(th) {
			padding: 0 8px !important;
		}
		.member-info {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.table-avatar {
			width: 33px;
			height: 33px;
			margin-right: 4px;
		}
		.status {
			width: 13px;
			margin-right: 2px;
		}
		.flag {
			height: 16px;
		}
	}
	.columns-menu {
		background: var(--background);
		padding: 12px;
		min-width: 280px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		.columns-menu-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-bottom: 8px;
			border-bottom: 1px solid var(--border-color);
			margin-bottom: 4px;
		}
		.columns-menu-title {
			font-weight: 500;
		}
		.columns-reset {
			cursor: pointer;
			opacity: 0.6;
			&:hover {
				opacity: 1;
			}
		}
	}
	.columns-config-list {
		.column-config-item {
			display: flex;
			align-items: center;
			padding: 0 8px;
			border-radius: 4px;
			transition: background 0.15s;
			&:hover {
				background: rgba(128, 128, 128, 0.1);
			}
			.drag-handle {
				color: var(--text-color-secondary);
				margin-right: 4px;
				cursor: grab;
			}
			.column-checkbox {
				flex: 1;
				:deep(.v-selection-control) {
					min-height: 36px;
				}
				:deep(.v-label) {
					user-select: none;
					text-align: left;
					padding: 8px 0;
					width: 100%;
					height: 100%;
					font-size: 13px;
					margin-left: 6px;
				}
			}
		}
	}
	.sort-config {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 8px 4px;
		border-top: 1px solid var(--border-color);
		.sort-label {
			white-space: nowrap;
			font-weight: 500;
		}
		.sort-select {
			flex: 1;
			padding: 4px 8px;
			border-radius: 4px;
			border: 1px solid var(--border-color);
			background: var(--background);
			color: var(--text-color);
		}
		.sort-order {
			cursor: pointer;
			&:hover {
				color: #5fad1b;
			}
		}
	}
	.farmer .status {
		width: 15px;
		vertical-align: bottom;
		margin-bottom: 2px;
	}
	.change_owner_popup .farmer {
		padding: 4px;
		padding-top: 10px;
		border-radius: 4px;
		cursor: pointer;
	}
	.change_owner_popup .farmer.selected {
		background: #5fad1b;
	}
	.change_owner_popup .farmer.selected .name {
		color: white;
	}
	.no-compos {
		color: #aaa;
		font-size: 18px;
		margin: 20px;
		text-align: center;
	}
	.compo-title {
		display: inline-block;
	}
	.level-talent {
		display: inline-block;
		vertical-align: top;
		padding-top: 1px;
	}
	.level-talent .level {
		color: white;
		line-height: 32px;
		margin-left: 30px;
		margin-right: 10px;
		vertical-align: bottom;
	}
	.leeks {
		min-height: 80px;
		position: relative;
		border: 4px solid transparent;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		grid-gap: 10px;
		padding: 5px;
		align-items: baseline;
	}
	.leek {
		text-align: center;
		transition: transform 0.4s;
		transform: scale(1);
		cursor: pointer;
		width: 96px;
		.name {
			font-size: 16px;
			text-align: center;
			display: inline-block;
			text-overflow: ellipsis;
			overflow: hidden;
			width: 100%;
		}
		.fights {
			display: inline-block;
			margin-top: 3px;
			.v-icon {
				font-size: 18px;
				margin-right: 2px;
			}
			img {
				width: 18px;
				height: 18px;
				margin-right: 2px;
				vertical-align: top;
			}
			span {
				vertical-align: top;
				font-size: 17px;
			}
		}
		.talent {
			margin-bottom: 4px;
		}
	}
	.leek.dragging {
		opacity: 0.2;
	}
	.leek.moving {
		transform: scale(0.5);
	}
	.compo.in-tournament .leeks {
		background: var(--background-disabled);
	}
	.compo .empty {
		position: absolute;
		left: 0; right: 0;
		text-align: center;
		top: 50%; bottom: 50%;
		margin-top: -9px;
		font-weight: 300;
		color: #aaa;
		font-size: 18px;
	}
	.compo-tournament {
		float: right;
	}
	.compo-tournament img {
		vertical-align: middle;
		margin-right: 8px;
		margin-bottom: 3px;
		font-size: 18px;
		color: #444;
	}
	.tournament-info {
		font-size: 18px;
		color: #444;
	}
	.compo:not(.in-tournament) .leek {
		cursor: move;
	}
	.compo .leeks.dashed {
		border: 4px dashed #aaa;
	}
	.panel :deep(.turret-wrapper) {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
    	justify-content: space-between;
		.team-owner {
			text-decoration: none;
			color: var(--text-color);
			padding: 10px;
			.owner-content {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 6px 12px;
				border-radius: 8px;
				transition: background 0.15s;
				&:hover {
					background: rgba(128, 128, 128, 0.1);
				}
			}
			.avatar {
				width: 50px;
				height: 50px;
			}
			.owner-info {
				display: flex;
				flex-direction: column;
			}
			.owner-name {
				font-weight: bold;
			}
			.owner-label {
				font-size: 13px;
				color: var(--text-color-secondary);
			}
			.owner-status {
				width: 14px;
				vertical-align: middle;
				margin-right: 2px;
			}
		}
		.turret {
			display: flex;
			justify-content: center;
			padding: 15px;
			width: 100%;
			svg {
				padding-right: 20px;
				align-self: flex-end;
				cursor: pointer;
			}
			.infos {
				padding-right: 20px;
			}
			.level {
				font-weight: 300;
				color: var(--text-color-secondary);
				padding-bottom: 5px;
			}
			.ai {
				margin-left: -5px;
				&.active {
					cursor: pointer;
				}
			}
			.no-ai {
				color: #5fad1b;
				font-weight: bold;
				text-decoration: underline;
				cursor: pointer;
			}
		}
	}
	.turret-dialog {
		display: flex;
		align-items: center;
		svg {
			padding-left: 10px;
			padding-right: 30px;
			flex: 0 0 120px;
		}
		.infos {
			max-width: 440px;
		}
		.chips {
			padding-top: 5px;
		}
		.chip {
			width: 50px;
			padding-right: 4px;
			padding-bottom: 4px;
		}
		.characteristics {
			margin-top: 8px;
			.characteristic {
				width: 50%;
				padding: 5px 20px;
				display: inline-block;
				img {
					vertical-align: top;
					margin-right: 7px;
					width: 25px;
				}
				.stat {
					font-size: 18px;
					vertical-align: top;
					display: inline-block;
					margin-top: 3px;
					font-weight: bold;
				}
			}
			.characteristic:nth-child(8n+6),
			.characteristic:nth-child(8n+8) {
				background: var(--background-secondary);
			}
		}
	}
	body.dark .characteristic.frequency img {
		filter: invert(1);
	}
	#app.app .turret-dialog {
		.characteristic {
			width: 100%;
		}
	}
	.turret-ai-dialog .farmer-ais {
		min-height: 80px;
		max-height: 600px;
		.ai {
			cursor: pointer;
		}
	}
	.explorer {
		height: 460px;
	}
	h4 {
		margin-bottom: 7px;
	}
	.rankings {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}
	.ranking {
		width: 100%;
		background: var(--pure-white);
		> div {
			text-align: center;
			display: flex;
			&:not(:last-child) {
				border-bottom: 1px solid var(--border);
			}
			> div {
				&:not(:last-child) {
					border-right: 1px solid var(--border);
				}
				min-width: 0;
				text-overflow: ellipsis;
				overflow: hidden;
				padding: 4px 10px;
			}
			&.me {
				background: var(--background-secondary);
			}
		}
		.header {
			background: var(--background-header);
			text-align: center;
		}
		.first a {
			color: #ffa900;
			font-weight: bold;
		}
		.second a {
			color: #9c9c9c;
			font-weight: bold;
		}
		.third a {
			color: #ae4e00;
			font-weight: bold;
		}
		.p5 {
			flex: 1;
		}
		.p10 {
			flex: 2;
		}
		.p15 {
			flex: 3;
		}
		.p20 {
			flex: 4;
		}
		.p25 {
			flex: 5;
		}
		.p35 {
			flex: 7;
		}
		.p50 {
			flex: 10;
		}
		.flag {
			height: 16px;
			vertical-align: bottom;
		}
	}
	.load-rankings {
		text-align: center;
		margin-top: 15px;
	}
	.compos {
		margin-bottom: 12px;
	}
	.team-language-popup {
		text-align: center;
		.language {
			display: inline-block;
			padding: 7px;
			text-align: center;
			margin: 5px;
			cursor: pointer;
			border: 1px solid var(--border);
			border-radius: 2px;
			.flag {
				height: 22px;
				margin-bottom: 10px;
			}
			&.selected {
				background: var(--pure-white);
				box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			}
		}
	}
	.rename-button {
		b {
			padding-right: 4px;
		}
		img {
			width: 20px;
		}
	}
</style>
