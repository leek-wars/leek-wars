<template lang="html">
	<error v-if="notfound" title="Unknown farmer" />
	<error v-else-if="farmer && farmer.banned" :title="$t('banned')" :message="$t('banned_message')" />
	<error v-else-if="farmer && farmer.deleted" :title="$t('deleted')" :message="$t('deleted_message')" />
	<div v-else class="page">
		<div class="page-header page-bar">
			<div>
				<rich-tooltip-farmer v-if="farmer" :id="farmer.id" v-slot="{ props }" :bottom="true">
					<h1 v-bind="props">{{ farmer.name }}</h1>
				</rich-tooltip-farmer>
				<h1 v-else>...</h1>
				<div class="info state">
					<span v-if="farmer && farmer.connected"><img src="/image/connected.png">{{ $t('connected') }}</span>
					<span v-else><img src="/image/disconnected.png">{{ $t('disconnected') }}</span>
				</div>
			</div>
			<div v-if="farmer" class="tabs">
				<div v-if="myFarmer">
					<template v-if="farmer.tournament && farmer.tournament.current">
						<router-link :to="'/tournament/' + farmer.tournament.current">
							<div class="tab green">{{ $t('see_tournament') }}</div>
						</router-link>
					</template>
					<v-tooltip v-if="$store.state.farmer.tournaments_enabled && $store.getters.leek_count >= 2" content-class="fluid" @update:model-value="loadTournamentRange()">
						<template #activator="{ props }">
							<div class="tab" v-bind="props">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="farmer.tournament && !farmer.tournament.registered" class="register" @click="registerTournament">{{ $t('register_to_tournament') }}</span>
								<span v-else class="unregister" @click="registerTournament">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
						<i18n-t v-if="tournamentRange" tag="div" keypath="main.level_x_to_y">
							<template #min>
								<b>{{ tournamentRange.min }}</b>
							</template>
							<template #max>
								<b>{{ tournamentRange.max }}</b>
							</template>
						</i18n-t>
					</v-tooltip>
					<div class="tab" v-if="$store.getters.leek_count >= 2" @click="updateGarden">
						<span>{{ $t('garden') }}</span>
						<v-switch :model-value="farmer.in_garden" hide-details />
					</div>
					<div v-if="$store.state.farmer && $store.state.farmer.verified" class="tab action" @click="logout">
						<v-icon>mdi-power</v-icon>
						<span>{{ $t('logout') }}</span>
					</div>
				</div>
				<div v-else>
					<div v-if="env.SOCIAL && $store.state.farmer && $store.state.farmer.verified" class="tab action" @click="sendMessage">
						<v-icon>mdi-email-outline</v-icon>
						<span>{{ $t('send_private_message') }}</span>
					</div>
					<router-link v-if="$store.state.connected && $store.getters.leek_count >= 2 && Object.values(farmer.leeks).length >= 2" :to="'/garden/challenge/farmer/' + farmer.id">
						<div :link="'/garden/challenge/farmer/' + farmer.id" class="tab action">
							<v-icon>mdi-flag-outline</v-icon>
							<span>{{ $t('challenge') }}</span>
						</div>
					</router-link>
					<div class="action" icon="question_answer" link="/chat/new/{farmer.id}/{farmer.name}/{farmer.avatar_changed}"></div>
				</div>
			</div>
		</div>
		<div class="container">
			<panel class="first">
				<template #content><div class="content avatar-td">
					<div v-if="myFarmer" class="avatar-wrapper">
						<v-tooltip>
							<template #activator="{ props }">
								<div class="avatar-input" v-bind="props">
									<input ref="avatarInput" type="file" accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp" @change="changeAvatar">
									<avatar ref="avatar" :farmer="farmer" @click.native="$refs.avatarInput.click()" />
								</div>
							</template>
							{{ $t('click_to_change_avatar') }}
						</v-tooltip>
						<v-btn v-if="farmer" class="like-overlay no-click" :class="{liked: farmer.likes > 0}" size="small" :ripple="false">
							<template #prepend><v-icon size="small" :color="farmer.likes > 0 ? 'red' : ''">{{ farmer.likes > 0 ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon></template>
							{{ farmer.likes }}
						</v-btn>
					</div>
					<div v-else class="avatar-wrapper">
						<avatar :farmer="farmer" />
						<v-btn v-if="farmer" class="like-overlay" :class="{liked: farmer.liked}" size="small" @click="toggleLike">
							<template #prepend><v-icon :color="farmer.liked ? 'red' : ''">{{ farmer.liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon></template>
							{{ farmer.likes }}
						</v-btn>
					</div>
					<lw-title v-if="farmer && farmer.title.length" class="info title" :class="{me: myFarmer}" :title="farmer.title" @click.native="titleDialog = myFarmer" />
					<div v-if="farmer" class="infos">
						<div v-if="!farmer.title.length && myFarmer" class="add add-title" :class="{locked: !farmerTitleEnabled}" @click="titleDialog = !!farmerTitleEnabled">
							<v-tooltip :disabled="farmerTitleEnabled">
								<template #activator="{ props }">
									<span v-bind="props">
										<img class="image" src="/image/pomp/farmer_title.png">
										{{ $t('add_title') }}
									</span>
								</template>
								<v-icon>mdi-lock</v-icon> {{ $t('pomp.farmer_title') }}
							</v-tooltip>
						</div>
						<router-link v-if="farmer.forum_messages" :to="'/search?farmer=' + farmer.name + '&order=date'">
							<div class="info">
								<img class="flag" src="/image/forum.png"><span class="label">{{ $t('forum_messages', [farmer.forum_messages]) }}</span>
							</div>
						</router-link>
						<div class="info country">
							<flag v-if="farmer.country" :code="farmer.country" />
							<span v-if="farmer.country" class="country label">{{ $t('country.' + farmer.country) }}</span>
							<flag v-if="!farmer.country" :clickable="false" />
							<span v-if="!farmer.country" class="country no label">{{ $t('no_country') }}</span>
							<span v-if="myFarmer" class="edit" @click="openCountryDialog()"></span>
						</div>
						<div v-if="safeWebsite" class="info website">
							<img src="/image/website.png"><a :href="safeWebsite" target="_blank" rel="noopener"><span class="text label">{{ safeWebsite }}</span></a>
							<span v-if="myFarmer" class="edit" @click="websiteDialog = true"></span>
						</div>
						<div v-else-if="myFarmer" class="add add-website" @click="websiteDialog = true">{{ $t('add_website') }}</div>
						<div v-if="farmer.github" class="info github">
							<img src="/image/github.png"><a :href="'https://github.com/' + farmer.github" target="_blank" rel="noopener"><span class="text label">github.com/{{ farmer.github }}</span></a>
							<span v-if="myFarmer" class="edit" @click="githubDialog = true"></span>
						</div>
						<div v-else-if="myFarmer" class="add add-github" @click="githubDialog = true">{{ $t('add_github') }}</div>
					</div>

					<div v-if="farmer" class="log-time grey">
						<span v-if="$store.getters.moderator">{{ $t('registered_the', [LeekWars.formatDateTime(farmer.register_date)]) }}</span>
						<span v-else>{{ $t('registered_the', [LeekWars.formatDate(farmer.register_date)]) }}</span>
						<br>
						<span v-if="farmer.connected">{{ $t('connected') }}</span>
						<span v-else>{{ $t('last_connection', [LeekWars.formatDuration(farmer.last_connection)]) }}</span>
						<br>
						<span v-if="farmer.verified">{{ $t('verified') }}</span>
						<span v-else>{{ $t('not_verified') }}</span>
					</div>
					<div v-if="farmer" class="grades">
						<div v-if="farmer.admin" class="grade admin">{{ $t('admin') }}</div>
						<div v-else-if="farmer.moderator" class="grade moderator">{{ $t('moderator') }}</div>
						<div v-if="farmer.contributor" class="grade contributor">{{ $t('contributor') }}</div>
					</div>


				</div></template>
			</panel>

			<panel>
				<template #content><div class="content stats">
					<div class="talent-wrapper">
						<talent :id="farmer?.id ?? 0" :talent="farmer?.talent ?? '...'" :max_talent="farmer?.max_talent" :label="$t('talent')" category="farmer" />
						<v-tooltip v-if="farmer">
							<template #activator="{ props }">
								<div class="talent-more" v-bind="props">({{ farmer.talent_more >= 0 ? '+' : '' }} {{ $filters.number(farmer.talent_more) }})</div>
							</template>
							<template v-if="farmer.talent_more > 0">
								<span v-html="$t('main.talent_difference_farmer', [farmer.name, farmer.talent_more, talent_gains + '%'])"></span>
							</template>
							<div v-else v-html="$t('main.talent_difference_farmer_no_gains', [farmer.name])"></div>
						</v-tooltip>
						<ranking-badge v-if="farmer && farmer.ranking && farmer.ranking <= 1000 && farmer.in_garden" :id="farmer.id" :ranking="farmer.ranking" category="farmer" />
					</div>
					<v-tooltip v-if="farmer">
						<template #activator="{ props }">
							<table v-bind="props">
								<tr>
									<td class="big">{{ $filters.number(farmer.victories) }}</td>
									<td class="big">{{ $filters.number(farmer.draws) }}</td>
									<td class="big">{{ $filters.number(farmer.defeats) }}</td>
								</tr>
								<tr>
									<td class="grey">{{ $t('victories') }}</td>
									<td class="grey">{{ $t('draws') }}</td>
									<td class="grey">{{ $t('defeats') }}</td>
								</tr>
							</table>
						</template>
						{{ $t('ratio') }} : {{ farmer.ratio }}
					</v-tooltip>

					<table v-if="farmer && farmer.won_solo_tournaments + farmer.won_farmer_tournaments + farmer.won_team_tournaments + farmer.won_battle_royale > 0" class="tournaments">
						<tr>
							<td class="grey">
								<v-tooltip>
									<template #activator="{ props }">
										<v-icon v-bind="props">mdi-trophy-outline</v-icon>
									</template>
									{{ $t('tournaments') }}
								</v-tooltip>
							</td>
							<td width="25%"><span class="big">{{ farmer.won_solo_tournaments }}</span><br><span class="small grey">solo</span></td>
							<td width="25%"><span class="big">{{ farmer.won_farmer_tournaments }}</span><br><span class="small grey">{{ $t('display_farmer') }}</span></td>
							<td width="25%"><span class="big">{{ farmer.won_team_tournaments }}</span><br><span class="small grey">{{ $t('display_team') }}</span></td>
							<td width="25%"><span class="big">{{ farmer.won_battle_royale }}</span><br><span class="small grey">BR</span></td>
						</tr>
					</table>

					<Line v-if="chartData" :data="chartData" :options="chartOptions" class="talent-history" />

					<div v-if="farmer" class="godfather grey">
						<div v-if="farmer.godfather">
							<i18n-t keypath="godson_of" tag="div">
								<template #farmer>
									<router-link :to="'/farmer/' + farmer.godfather.id">
										<rich-tooltip-farmer :id="farmer.godfather.id" v-slot="{ props }">
											<span v-bind="props">{{ farmer.godfather.name }}</span>
										</rich-tooltip-farmer>
									</router-link>
								</template>
							</i18n-t>
						</div>
						<div v-if="farmer.godsons.length">
							<i18n-t keypath="godfather_of" tag="div">
								<template #farmers>
									<template v-for="(godson, i) in farmer.godsons" :key="i">
										<router-link :to="'/farmer/' + godson.id">
											<rich-tooltip-farmer :id="godson.id" v-slot="{ props }">
												<span v-bind="props">{{ godson.name }}</span>
											</rich-tooltip-farmer>
										</router-link>
										<span v-if="i < farmer.godsons.length - 1" :key="i + '_'">, </span>
									</template>
								</template>
							</i18n-t>
						</div>
					</div>

				</div></template>
			</panel>

			<panel>
				<template #content><div class="content team center">
					<loader v-if="!farmer" />
					<div v-else-if="farmer.team">
						<rich-tooltip-team :id="farmer.team.id" v-slot="{ props }" :bottom="true">
							<router-link :to="'/team/' + farmer.team.id">
								<div v-bind="props">
									<emblem :team="farmer.team" />
									<br>
									<h2>{{ farmer.team.name }}</h2>
									{{ $t('main.level_n', [farmer.team.level]) }}
								</div>
							</router-link>
						</rich-tooltip-team>
					</div>
					<div v-else>
						<div v-if="myFarmer">
							<v-btn @click="createTeamDialog = true">{{ $t('create_team') }}</v-btn>
							<div v-if="farmer.candidacies && farmer.candidacies.length" class="candidacies">
								<h4>{{ $t('candidacies') }}</h4>
								<div v-for="c in farmer.candidacies" :key="c.team_id" class="candidacy-item">
									<rich-tooltip-team :id="c.team_id">
										<emblem :team="{id: c.team_id, emblem_changed: c.emblem_changed}" />
									</rich-tooltip-team>
									<router-link :to="'/team/' + c.team_id">{{ c.team_name }}</router-link>
									<v-btn size="small" variant="outlined" @click="cancelCandidacy(c)">{{ $t('cancel_candidacy') }}</v-btn>
								</div>
							</div>
							<div v-if="$store.state.farmer && $store.state.farmer.team_invitations && $store.state.farmer.team_invitations.length > 0" class="invitations">
								<br>
								<h4>{{ $t('team_invitations') }}</h4>
								<div v-for="invitation in $store.state.farmer.team_invitations" :key="invitation.id" class="invitation">
									<rich-tooltip-team :id="invitation.team_id" v-slot="{ props }">
										<router-link :to="'/team/' + invitation.team_id" v-bind="props">
											<emblem :team="{id: invitation.team_id, emblem_changed: invitation.emblem_changed}" />
											<span>{{ invitation.team_name }}</span>
										</router-link>
									</rich-tooltip-team>
									<div class="invitation-actions">
										<v-btn color="green" size="small" @click="acceptInvitation(invitation)">{{ $t('accept') }}</v-btn>
										<v-btn size="small" @click="rejectInvitation(invitation)">{{ $t('reject') }}</v-btn>
									</div>
								</div>
							</div>
						</div>
						<div v-else>
							<span class="grey">{{ $t('no_team') }}</span>
							<br><br>
							<v-btn v-if="canInvite" :disabled="alreadyInvited" @click="inviteToTeam">
								<v-icon start>mdi-account-plus</v-icon>
								{{ alreadyInvited ? $t('invitation_sent') : $t('invite_to_team') }}
							</v-btn>
						</div>
					</div>
				</div></template>
			</panel>
		</div>
		<panel v-if="farmer && farmer.trophies > 0" toggle="farmer/trophies">
			<template #title>
				<img src="/image/icon/trophy.png">{{ $t('trophies') }} <span v-if="farmer" class="trophy-count">({{ $filters.number(farmer.points) }})</span>
			</template>
			<template #actions>
				<router-link :to="'/trophies/' + id" class="button flat">
					<img src="/image/icon/trophy.png">
					<span>{{ $t('see_all_trophies') }}</span>
				</router-link>
				<div class="button flat" @click="trophiesModeButton">
					<v-icon>{{ (trophiesMode === 'grid' ? 'mdi-format-list-bulleted-square' : 'mdi-view-module') }}</v-icon>
				</div>
			</template>
			<template #content>
				<div class="trophies" @mouseleave="hideTrophyTooltip">
					<loader v-if="!farmer || !trophies" />
					<template v-else-if="farmer.trophies > 0 && trophies_list && trophies_grid">
						<div v-show="trophiesMode == 'list'" class="list trophies-container">
							<router-link v-for="(trophy, t) in trophies_list" :key="t" :to="'/trophy/' + trophy.code" @mouseenter="showTrophyTooltip(trophy, $event)" @mouseleave="hideTrophyTooltip">
								<img class="trophy" :src="'/image/trophy/' + trophy.code + '.svg'" loading="lazy">
							</router-link>
						</div>
						<div v-show="trophiesMode == 'grid'" class="grid trophies-container">
							<template v-for="(trophy, t) in trophies_grid" :key="t">
								<router-link v-if="trophy != null" :to="'/trophy/' + trophy.code" class="card" @mouseenter="showTrophyTooltip(trophy, $event)" @mouseleave="hideTrophyTooltip">
									<img :src="'/image/trophy/' + trophy.code + '.svg'" class="trophy" loading="lazy">
								</router-link>
								<div v-else class="locked">
									<img class="trophy" src="/image/unknown.png" loading="lazy">
								</div>
							</template>
						</div>
						<div v-if="bonus_trophies && bonus_trophies.length > 0">
							<h4 class="trophies-bonus">{{ $t('bonus_trophies') }}</h4>
							<div class="trophies-container">
								<router-link v-for="trophy in bonus_trophies" :key="trophy.id" :to="'/trophy/' + trophy.code" :class="{card: trophiesMode == 'grid'}" @mouseenter="showTrophyTooltip(trophy, $event)" @mouseleave="hideTrophyTooltip">
									<img class="trophy" :src="'/image/trophy/' + trophy.code + '.svg'" loading="lazy">
								</router-link>
							</div>
						</div>
					</template>
					<div v-else-if="farmer.trophies == 0" class="grey">{{ $t('no_trophies_yet') }}</div>
				</div>
			</template>
		</panel>

		<panel :title="$t('leeks')">
			<loader v-if="!farmer" />
			<div v-else class="leeks">
				<rich-tooltip-leek v-for="leek in farmer.leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
					<router-link v-ripple :to="'/leek/' + leek.id" class="leek" v-bind="props">
						<div>
							<leek-image :leek="leek" :scale="0.9" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title.length" :title="leek.title" />
							<div class="talent-ranking">
								<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
								<ranking-badge v-if="leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
							</div>
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
					</router-link>
				</rich-tooltip-leek>
			</div>
		</panel>


		<panel :title="$t('sponsorship')" toggle="trophies/sponsorship" icon="mdi-hat-fedora">
			<template #actions>
				<div v-if="myFarmer" class="button flat" @click="openGodfatherDialog"><v-icon>mdi-link-variant</v-icon> {{ $t('godfather_link') }}</div>
			</template>
			<template #content>
				<div class="content sponsorship">
					<div class="container">
						<div v-if="farmer" class="column grey">
							<div v-if="farmer.godfather">
								<i18n-t keypath="godson_of" tag="div">
									<template #farmer>
										<router-link :to="'/farmer/' + farmer.godfather.id">
											<rich-tooltip-farmer :id="farmer.godfather.id" v-slot="{ props }">
												<span v-bind="props">{{ farmer.godfather.name }}</span>
											</rich-tooltip-farmer>
										</router-link>
									</template>
								</i18n-t>
							</div>
							<div v-if="farmer.godsons.length">
								<i18n-t keypath="godfather_of" tag="div">
									<template #farmers>
										<template v-for="(godson, i) in farmer.godsons" :key="i">
											<router-link :to="'/farmer/' + godson.id">
												<rich-tooltip-farmer :id="godson.id" v-slot="{ props }">
													<span v-bind="props">{{ godson.name }}</span>
												</rich-tooltip-farmer>
											</router-link>
											<span v-if="i < farmer.godsons.length - 1" :key="i + '_'">, </span>
										</template>
									</template>
								</i18n-t>
							</div>
						</div>
						<div class="column column-level">
							<div class="grey">{{ $t('godsons_level') }}</div>
							<div class="total-level">{{ $filters.number(farmer ? farmer.godsons_level : '...') }}</div>
							<v-tooltip>
								<template #activator="{ props }">
									<div class="bar" v-bind="props">
										<span :class="{ blue: farmer?.godsons_level >= 10_000 }" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
									</div>
								</template>
								<span v-if="farmer">{{ $filters.number(farmer.godsons_level) }} / 10 000</span>
							</v-tooltip>
						</div>
					</div>
					<h4>{{ $t('main.rewards') }}</h4>
					<div v-if="farmer" class="rewards">
						<div v-for="(reward, r) of rewards" :key="r" class="reward card" :class="{'notif-trophy': r <= farmer.godsons_level}">
							<div class="level">{{ $filters.number(r) }}<v-icon v-if="r <= farmer.godsons_level">mdi-check</v-icon></div>
							<img v-if="reward.trophy" :src="'/image/trophy/' + reward.trophy + '.svg'">
							<rich-tooltip-item v-else-if="reward.resource" :item="LeekWars.items[reward.item]" v-slot="{ props }" :bottom="true">
								<img v-bind="props" :src="'/image/resource/' + reward.resource + '.png'">
							</rich-tooltip-item>
							<img v-else-if="reward.fight_pack" :src="'/image/fight-pack/' + reward.fight_pack + '.png'">
							<rich-tooltip-item v-else-if="reward.potion" :item="LeekWars.items[reward.item]" v-slot="{ props }" :bottom="true">
								<img v-bind="props" :src="'/image/potion/skin_' + reward.potion + '.png'">
							</rich-tooltip-item>
							<rich-tooltip-item v-else-if="reward.hat" :item="LeekWars.items[reward.item]" v-slot="{ props }" :bottom="true">
								<img v-bind="props" :src="'/image/hat/' + reward.hat + '.png'">
							</rich-tooltip-item>
							<div class="name" v-if="reward.trophy">{{ $t('trophy_x', [$t('trophy.' + reward.trophy)]) }}</div>
							<div class="name" v-else-if="reward.resource">{{ $t('resource.' + reward.resource) }}</div>
							<div class="name" v-else-if="reward.fight_pack">{{ $t('fight-pack.' + reward.fight_pack) }}</div>
							<div class="name" v-else-if="reward.potion">{{ $t('potion.skin_' + reward.potion) }}</div>
							<div class="name" v-else-if="reward.hat">{{ $t('hat.' + reward.hat) }}</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<div class="container grid large">
			<panel v-if="!farmer || farmer.fight_history.length > 0" :title="$t('fights')" icon="mdi-sword-cross">
				<template #actions>
					<router-link :to="'/farmer/' + id + '/history'" class="button flat">
						<v-icon class="list-icon">mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template>
				<template #content>
					<loader v-if="!farmer" />
					<fights-history v-else :fights="farmer.fight_history" />
				</template>
			</panel>
			<panel v-if="!farmer || farmer.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<template #content>
					<loader v-if="!farmer" />
					<tournaments-history v-else :tournaments="farmer.tournaments" />
				</template>
			</panel>
		</div>

		<panel v-if="farmer && farmer.warnings && farmer.warnings.length" :title="$t('warnings')">
			<template #content><div class="content warnings">
				<h4 v-if="myFarmer" class="warning-title">{{ $t('you_have_n_warnings', farmer.warnings.length) }}</h4>
				<h4 v-else class="warning-title">{{ $t('farmer_have_n_warnings', farmer.warnings.length) }}</h4>
				<div v-for="(warning, w) in farmer.warnings" :key="w" class="warning card">
					<div class="reason">{{ $t('warning.reason_' + warning.reason) }} ({{ $t('warning.severity_s', [ warning.severity]) }})</div>
					<div class="message"><i>{{ warning.message }}</i></div>
					<i18n-t v-if="$store.getters.moderator" class="date" keypath="warning.given_by_x_the_d">
						<template #farmer><router-link :to="'/farmer/' + warning.author_id">{{ warning.author_name }}</router-link></template>
						<template #date><span>{{ $filters.date(warning.date) }}</span></template>
					</i18n-t>
					<div v-else class="date">{{ $filters.date(warning.date) }}</div>
				</div>
			</div></template>
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="farmer && $store.state.connected && !myFarmer && !farmer.admin" class="report-button tab" @click="showReport = true">
					<img src="/image/icon/flag.png">
					<span>{{ $t('report') }}</span>
				</div>
				<template v-if="myFarmer && $store.state.farmer && $store.state.farmer.verified">
					<div class="tab" @click="renameDialog = true">
						<v-icon>mdi-pencil-outline</v-icon>
						{{ $t('rename') }}
					</div>
				</template>
				<template v-if="$store.getters.admin">
					<div class="tab" @click="trophyDialog = true">
						<v-icon>mdi-trophy-outline</v-icon>
						Donner trophée
					</div>
				</template>
			</div>
		</div>

		<popup v-model="createTeamDialog" :width="500">
			<template #icon><v-icon>mdi-plus-circle-outline</v-icon></template>
			<template #title><span>{{ $t('create_team') }}</span></template>
			{{ $t('team_name') }} <input v-model="createTeamName" type="text">
			<template #actions>
				<div v-ripple @click="createTeamDialog = false" class="dismiss">{{ $t('cancel') }}</div>
				<div v-ripple @click="createTeam">{{ $t('create') }}</div>
			</template>
		</popup>

		<popup v-if="farmer" v-model="godfatherDialog" :width="600" icon="mdi-hat-fedora" :title="$t('godfather_link')">
			{{ $t('godfather_link_description') }} :
			<br>
			<br>
			<div ref="godfatherLink" class="godfather-url">leekwars.com/godfather/{{ farmer.login }}</div>
		</popup>

		<popup v-if="farmer" v-model="countryDialog" :width="1000" icon="mdi-earth" :title="$t('country_selection')">
			<div class="country-dialog">
				<div class="country" code="null" @click="selectCountry('null')">
					<flag :clickable="false" />
					<h4>{{ $t('no_country') }}</h4>
				</div>
				<div v-for="country in LeekWars.countries" :key="country" class="country" @click="selectCountry(country)">
					<flag :code="country" :clickable="false" />
					<h4>{{ $t('country.' + country) }}</h4>
				</div>
			</div>
		</popup>

		<report-dialog v-if="farmer" v-model="showReport" :target="farmer" :reasons="reasons" />

		<popup v-if="farmer" v-model="websiteDialog" :width="500" icon="mdi-web" :title="$t('add_website')">
			<div class="website-dialog">
				<input v-model="newWebsite" type="text" class="input">
			</div>
			<template #actions>
				<div v-ripple @click="websiteDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="changeWebsite">{{ $t('validate') }}</div>
			</template>
		</popup>

		<popup v-if="farmer" v-model="githubDialog" :width="500" :title="$t('add_github')">
			<template #icon>
				<img src="/image/github_white.png">
			</template>
			<div class="github-dialog">
				<input v-model="newGitHub" type="text" class="input">
			</div>
			<template #actions>
				<div v-ripple @click="githubDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="changeGithub">{{ $t('validate') }}</div>
			</template>
		</popup>

		<popup v-if="farmer" v-model="titleDialog" :width="600">
			<template #icon><v-icon>mdi-medal-outline</v-icon></template>
			<template #title><span>{{ $t('main.select_title') }}</span></template>
			<div class="title-dialog">
				<title-picker ref="picker" :title="farmer.title" />
			</div>
			<template #actions>
				<div v-ripple @click="titleDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="pickTitle($refs.picker.getTitle())">{{ $t('validate') }}</div>
			</template>
		</popup>

		<popup v-if="farmer" v-model="renameDialog" :width="600" icon="mdi-pencil-outline">
			<template #title>{{ $t('rename') }}</template>
			{{ $t('rename_description') }}
			<br>
			<br>
			{{ $t('rename_info') }}
			<br>
			<br>
			{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
			<br>
			<br>
			<div class="center">
				<v-btn class="rename-button" @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ $filters.number(rename_price_habs) }}</b><span class="hab"></span></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ $filters.number(rename_price_crystals) }}</b> <span class="crystal"></span></v-btn>
			</div>
		</popup>

		<popup v-if="farmer" v-model="trophyDialog" :width="600" icon="mdi-trophy-outline">
			<template #title>Donner un trophée</template>

			<div>
				ID de trophée : <input v-model="giveTrophyID" type="number">
				Combat : <input v-model="giveTrophyFight" type="number">
			</div>
			<br>
			<img v-for="trophy in giveTrophies" :key="trophy.id" :src="'/image/trophy/' + trophy.code + '.svg'" :title="trophy.code" class="give-trophy" @click="giveTrophyID = trophy.id">

			<template #actions>
				<div v-ripple @click="trophyDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="giveTrophy()">Donner</div>
			</template>
		</popup>

		<v-tooltip v-if="trophyTooltip.show" v-model="trophyTooltip.show" :open-on-hover="false" location="bottom">
			<template #activator="{ props }">
				<div ref="trophyTooltipAnchor" v-bind="props" class="trophy-tooltip-anchor" :style="{ left: trophyTooltip.x + 'px', top: trophyTooltip.y + 'px' }"></div>
			</template>
			<template v-if="trophyTooltip.trophy">
				<div class="header">
					<b>{{ $t('trophy.' + trophyTooltip.trophy.code) }}</b>
					<b>{{ trophyTooltip.trophy.points }}</b>
				</div>
				<div v-if="trophyTooltip.trophy.description">{{ trophyTooltip.trophy.description }}</div>
				<span class="trophy-date">{{ LeekWars.formatDuration(trophyTooltip.trophy.date) }}</span>
			</template>
		</v-tooltip>
	</div>
</template>

<script setup lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { Team, TeamMemberLevel } from '@/model/team'
	import { mixins } from '@/model/i18n'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import TitlePicker from '@/component/title/title-picker.vue'
	import LwTitle from '@/component/title/title.vue'
	import { emitter } from '@/model/vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'
	import { computed, defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'

	const FightsHistory = defineAsyncComponent(() => import('@/component/history/fights-history.vue'))
	const TournamentsHistory = defineAsyncComponent(() => import('@/component/history/tournaments-history.vue'))
	const ReportDialog = defineAsyncComponent(() => import('@/component/moderation/report-dialog.vue'))

	defineOptions({ name: 'farmer', i18n: {}, mixins: [...mixins], components: {
		RichTooltipFarmer, RichTooltipTeam, RichTooltipLeek, TitlePicker, 'lw-title': LwTitle, 'rich-tooltip-item': RichTooltipItem, Line,
	} })

	const { t, locale: i18nLocale } = useI18n()
	const route = useRoute()
	const router = useRouter()
	const avatarRef = useTemplateRef<any>('avatar')
	const godfatherLink = useTemplateRef<any>('godfatherLink')

	const farmer = ref<Farmer | null>(null)
	const trophies = ref<any>(null)
	const trophiesMode = ref('list')
	const trophyTooltip = ref<{ show: boolean, trophy: any, x: number, y: number }>({ show: false, trophy: null, x: 0, y: 0 })
	const godfatherDialog = ref(false)
	const countryDialog = ref(false)
	const createTeamDialog = ref(false)
	const createTeamName = ref('')
	const showReport = ref(false)
	const reasons = [Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR, Warning.INCORRECT_WEBSITE]
	const websiteDialog = ref(false)
	const newWebsite = ref('')
	const githubDialog = ref(false)
	const newGitHub = ref('')
	const notfound = ref(false)
	const titleDialog = ref(false)
	const renameDialog = ref(false)
	const renameName = ref('')
	const rename_price_habs = 10000000
	const rename_price_crystals = 200
	const tournamentRangeLoading = ref(false)
	const tournamentRange = ref<any>(null)
	const trophyDialog = ref(false)
	const giveTrophyID = ref<number | null>(null)
	const giveTrophyFight = ref<number | null>(null)
	const giveTrophies = [
		LeekWars.trophies[173 - 1],
		LeekWars.trophies[177 - 1],
		LeekWars.trophies[166 - 1],
		LeekWars.trophies[194 - 1],
		LeekWars.trophies[322 - 1],
		LeekWars.trophies[320 - 1],
		LeekWars.trophies[111 - 1],
	]
	const rewards: { [key: number]: { trophy?: string, fight_pack?: string, potion?: string, resource?: string, hat?: string, item?: number } } = {
		1: { trophy: 'godfather' },
		20: { fight_pack: 'fight_pack_100' },
		50: { potion: 'bordeaux', item: 281 },
		100: { resource: 'box_100k_habs', item: 183 },
		200: { trophy: 'guru' },
		500: { hat: 'black_fedora', item: 279 },
		1000: { resource: 'box_1m_habs', item: 185 },
		2000: { trophy: 'master' },
		5000: { potion: 'mafia', item: 282 },
		10000: { hat: 'gold_fedora', item: 280 },
	}
	const invitationSent = ref(false)
	const chartData = ref<ChartData | null>(null)
	const chartOptions = ref<ChartOptions | null>(null)

	const id = computed<number | null>(() => route.params.id ? parseInt(route.params.id as string, 10) : (store.state.farmer ? store.state.farmer.id : null))
	const myFarmer = computed(() => store.state.farmer && id.value === store.state.farmer.id)

	const safeWebsite = computed(() => {
		if (!farmer.value) return null
		const url = LeekWars.safeUrl(farmer.value.website)
		if (!url) return null
		// Block links to our own API so a profile can't be used to trigger
		// authenticated GET requests when a visitor clicks the website link.
		if (/^(https:\/\/leekwars.\w+)?\/api\//.test(url)) return null
		return url
	})

	const canInvite = computed(() => {
		const me = store.state.farmer
		return farmer.value && !myFarmer.value && !farmer.value.team && me && me.team && me.team.member_level >= TeamMemberLevel.CAPTAIN
	})

	const alreadyInvited = computed(() => {
		if (invitationSent.value) return true
		const me = store.state.farmer
		if (me && me.team && me.team.sent_invitations && farmer.value) {
			return me.team.sent_invitations.includes(farmer.value.id)
		}
		return false
	})

	const talent_gains = computed(() => farmer.value ? Math.round(farmer.value.talent_more / 3) : 0)

	const trophies_list = computed(() => {
		const list: any[] = []
		for (const tr in trophies.value) {
			if (trophies.value[tr].unlocked && trophies.value[tr].category !== 6) {
				list.push(trophies.value[tr])
			}
		}
		list.sort((t1, t2) => t1.date - t2.date)
		return list
	})

	const trophies_grid = computed(() => {
		const grid: {[key: string]: any} = {}
		for (const tr in trophies.value) {
			if (trophies.value[tr].category !== 6) {
				grid[tr] = trophies.value[tr].unlocked ? trophies.value[tr] : null
			}
		}
		return grid
	})

	const bonus_trophies = computed(() => {
		const bonus: any[] = []
		for (const tr in trophies.value) {
			if (trophies.value[tr].unlocked && trophies.value[tr].category === 6) {
				bonus.push(trophies.value[tr])
			}
		}
		bonus.sort((a, b) => a.id - b.id)
		return bonus
	})

	const farmerTitleEnabled = computed(() => LeekWars.selectWhere(store.state.farmer!.pomps, 'template', 126))

	watch(id, () => update(), { immediate: true })

	function update() {
		farmer.value = null
		trophies.value = null
		notfound.value = false
		invitationSent.value = false
		tournamentRangeLoading.value = false
		if (id.value === null) return
		if (myFarmer.value) {
			setTimeout(() => {
				init(store.state.farmer!)
			}, 10)
		} else {
			LeekWars.get('farmer/get/' + id.value).then(data => {
				init(data.farmer)
			}).error(() => {
				notfound.value = true
			})
		}
	}

	function init(f: Farmer) {
		farmer.value = f
		renameName.value = f.name
		if (f.banned || f.deleted) {
			return
		}
		LeekWars.setTitle(f.name, t('n_trophies', [f.trophies]) as string)
		if (myFarmer.value) {
			LeekWars.setActions([
				{icon: 'mdi-power', click: () => logout()}
			])
		} else {
			LeekWars.setActions([
				{image: 'icon/garden.png', click: () => router.push('/garden/challenge/farmer/' + f.id)},
				{icon: 'mdi-email-outline', click: () => router.push('/chat/new/' + f.id + '/' + f.name + '/' + f.avatar_changed)}
			])
		}
		chart()
		getTrophies()
		warnings()
		newWebsite.value = f.website
		newGitHub.value = f.github
		emitter.emit('loaded')
	}

	function logout() {
		LeekWars.logoutDialog = true
	}

	function showTrophyTooltip(trophy: any, event: MouseEvent) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
		trophyTooltip.value = {
			show: true,
			trophy,
			x: rect.left + rect.width / 2,
			y: rect.bottom,
		}
	}

	function hideTrophyTooltip() {
		trophyTooltip.value.show = false
	}

	function trophiesModeButton() {
		if (trophiesMode.value === 'list') {
			trophiesMode.value = 'grid'
			localStorage.setItem('farmer/trophies-mode', 'grid')
		} else {
			trophiesMode.value = 'list'
			localStorage.setItem('farmer/trophies-mode', 'list')
		}
	}

	function chart() {
		if (!farmer.value || !farmer.value.talent_history || farmer.value.talent_history.length === 0) return
		const labels = []
		const time = LeekWars.time
		for (let i = 1; i <= 7; ++i) {
			labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		}
		chartData.value = {
			labels: labels.reverse(),
			datasets: [
				{
					tension: 0.2,
					data: farmer.value.talent_history,
					borderColor: '#5fad1b',
					pointBackgroundColor: '#5fad1b',
					borderWidth: 2,
					fill: { target: 'origin', above: '#5fad1b30' },
				}
			]
		} as any
		chartOptions.value = {
			aspectRatio: 2.5,
			plugins: { legend: { display: false } },
			elements: { point: { radius: 4, hoverRadius: 6 } },
		}
	}

	function getTrophies() {
		if (!farmer.value) return
		if (!('farmer/trophies-mode' in localStorage)) {
			localStorage.setItem('farmer/trophies-mode', 'list')
		}
		trophiesMode.value = localStorage.getItem('farmer/trophies-mode') || 'list'
		if (farmer.value.trophies_list) {
			trophies.value = farmer.value.trophies_list
		} else {
			LeekWars.get('trophy/get-farmer-trophies/' + farmer.value.id + '/' + i18nLocale.value).then(data => {
				trophies.value = data.trophies
				if (myFarmer.value) {
					store.commit('set-trophies', data.trophies)
				}
			})
		}
	}

	function registerTournament() {
		if (farmer.value) {
			if (farmer.value.tournament.registered) {
				farmer.value.tournament.registered = false
				LeekWars.post('farmer/unregister-tournament')
			} else {
				farmer.value.tournament.registered = true
				LeekWars.post('farmer/register-tournament')
			}
		}
	}

	function updateGarden() {
		if (farmer.value) {
			farmer.value.in_garden = !farmer.value.in_garden
			LeekWars.post('farmer/set-in-garden', {in_garden: farmer.value.in_garden})
		}
	}

	function openGodfatherDialog() {
		godfatherDialog.value = true
		setTimeout(() => {
			LeekWars.selectText(godfatherLink.value)
		}, 100)
	}

	function selectCountry(code: string) {
		if (farmer.value) {
			farmer.value.country = code === 'null' ? null : code
			countryDialog.value = false
			LeekWars.post('farmer/change-country', {country_code: code})
		}
	}

	function changeAvatar(e: Event) {
		if (!e || !e.target) return
		const input = e.target as HTMLInputElement
		if (!input || !input.files) {
			LeekWars.toast("No input file")
			return
		}
		const file = input.files[0]

		if (!LeekWars.uploadCheck(file)) {
			LeekWars.toast("Invalid image (wrong format or > 10 Mo)")
			return
		}

		LeekWars.fileToImage(file, (avatarRef.value as any)?.$el as Element)

		const formdata = new FormData()
		formdata.append('avatar', file)
		input.value = ''

		LeekWars.toast(t('uploading_avatar') as string)

		LeekWars.post('farmer/set-avatar', formdata).then(data => {
			if (farmer.value) {
				LeekWars.toast(t('upload_success') as string)
				farmer.value.avatar_changed = data.avatar_changed
			}
		}).error(error => {
			LeekWars.toast(t('upload_failed', [error.error]) as string)
			if (farmer.value) {
				farmer.value.avatar_changed = LeekWars.time
			}
		})
	}

	function warnings() {
		if (!farmer.value) return
		if (store.getters.moderator || myFarmer.value) {
			LeekWars.get('moderation/get-warnings/' + farmer.value.id).then(data => {
				if (farmer.value) {
					farmer.value.warnings = data.warnings
				}
			})
		}
	}

	function createTeam() {
		LeekWars.post('team/create', {team_name: createTeamName.value}).then(data => {
			LeekWars.toast(t('team_created'))
			createTeamDialog.value = false
			const team = new Team()
			team.id = data.id
			team.name = createTeamName.value
			team.level = 1
			team.talent = 1000
			team.opened = true
			store.commit('create-team', team)
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function inviteToTeam() {
		if (!farmer.value) return
		LeekWars.post('team/send-invitation', {farmer_name: farmer.value.name}).then(() => {
			invitationSent.value = true
			const me = store.state.farmer
			if (me && me.team) {
				if (!me.team.sent_invitations) me.team.sent_invitations = []
				me.team.sent_invitations.push(farmer.value!.id)
			}
			LeekWars.toast(t('invitation_sent'))
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function acceptInvitation(invitation: any) {
		LeekWars.post('team/accept-invitation', {invitation_id: invitation.id}).then(() => {
			LeekWars.toast(t('invitation_accepted'))
			router.push('/team/' + invitation.team_id)
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function rejectInvitation(invitation: any) {
		LeekWars.post('team/reject-invitation', {invitation_id: invitation.id}).then(() => {
			if (farmer.value) {
				LeekWars.toast(t('invitation_rejected'))
				farmer.value.team_invitations.splice(farmer.value.team_invitations.indexOf(invitation), 1)
			}
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function cancelCandidacy(candidacy: { team_id: number }) {
		LeekWars.post('team/cancel-candidacy-for-team', { team_id: candidacy.team_id }).then(() => {
			if (farmer.value) {
				LeekWars.toast(t('candidacy_canceled'))
				farmer.value.candidacies = farmer.value.candidacies.filter((c: any) => c.team_id !== candidacy.team_id)
			}
		}).error(error => {
			LeekWars.toast(error)
		})
	}

	function changeWebsite() {
		if (!farmer.value) return
		farmer.value.website = newWebsite.value
		LeekWars.post('farmer/set-website', {website: newWebsite.value})
		websiteDialog.value = false
	}

	function changeGithub() {
		if (!farmer.value) return
		farmer.value.github = newGitHub.value.substring(newGitHub.value.lastIndexOf('/') + 1)
		LeekWars.post('farmer/set-github', {github: farmer.value.github})
		githubDialog.value = false
	}

	function sendMessage() {
		if (!farmer.value) return
		LeekWars.get('message/find-conversation/' + farmer.value.id).then(conversation => {
			store.commit('new-conversation', conversation)
			router.push('/chat/' + conversation.id)
		}).error(() => {
			if (!farmer.value) return
			router.push('/chat/new/' + farmer.value.id + '/' + farmer.value.name + '/' + farmer.value.avatar_changed)
		})
	}

	function pickTitle(title: number[]) {
		farmer.value!.title = title
		titleDialog.value = false
		LeekWars.put('farmer/set-title', {icon: title[0] || 0, noun: title[1] || 0, gender: title[2] || 0, adjective: title[3] || 0})
		store.commit('set-title', title)
	}

	function rename(currency: string) {
		if (!farmer.value) return
		const method = currency === 'habs' ? 'farmer/rename-habs' : 'farmer/rename-crystals'
		LeekWars.post(method, {name: renameName.value}).then(() => {
			if (farmer.value) {
				farmer.value.name = renameName.value
				store.commit('rename-farmer', {name: renameName.value})
				if (currency === 'habs') {
					store.commit('update-habs', -rename_price_habs)
				} else {
					store.commit('update-crystals', -rename_price_crystals)
				}
				renameDialog.value = false
				LeekWars.toast(t('rename_done'))
			}
		})
		.error(error => LeekWars.toast(t('error_' + error.error, error.params)))
	}

	function loadTournamentRange() {
		if (!farmer.value || tournamentRange.value || tournamentRangeLoading.value) return
		tournamentRangeLoading.value = true
		const power = Math.round(Object.values(farmer.value.leeks).reduce((p, l) => p + l.level ** LeekWars.POWER_FACTOR, 0))
		LeekWars.get('tournament/range-farmer/' + power).then(d => tournamentRange.value = d)
	}

	function giveTrophy() {
		if (giveTrophyID.value) {
			LeekWars.post('trophy/give', { trophy: giveTrophyID.value, farmer_id: farmer.value!.id, fight_id: giveTrophyFight.value || 0 })
				.then(() => {
					trophyDialog.value = false
					LeekWars.toast("Trophée donné !")
				})
				.error(error => LeekWars.toast(t('error_' + error.error, error.params)))
		}
	}

	function toggleLike() {
		if (!farmer.value) return
		const liked = farmer.value.liked
		farmer.value.liked = !liked
		farmer.value.likes += liked ? -1 : 1
		const endpoint = liked ? 'farmer/unlike' : 'farmer/like'
		LeekWars.post(endpoint, {target_id: farmer.value.id}).then(data => {
			if (farmer.value) {
				farmer.value.likes = data.likes
			}
		}).error(() => {
			if (farmer.value) {
				farmer.value.liked = liked
				farmer.value.likes += liked ? 1 : -1
			}
		})
	}

	function openCountryDialog() {
		countryDialog.value = true
		LeekWars.loadCountries()
	}

	const xp_bar_width = computed(() => {
		if (!farmer.value) return 0
		return farmer.value.godsons_level >= 10_000 ? 100 : Math.min(100, farmer.value.godsons_level / 10_000 * 100)
	})
</script>


<style lang="scss" scoped>
	.state img {
		margin-right: 6px;
		width: 20px;
		margin-bottom: -3.5px;
	}
	.v-input--switch {
		margin-left: 8px;
		margin-right: -12px;
	}
	.avatar-td {
		text-align: center;
		vertical-align: top;
	}
	.avatar {
		width: 200px;
		height: 200px;
	}
	.avatar-input {
		cursor: pointer;
		text-align: center;
		border-radius: 50%;
		input {
			display: none;
		}
	}
	.country.no {
		font-style: italic;
	}
	.country-dialog {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		.country {
			display: inline-block;
			text-align: center;
			margin: 1px;
			padding: 6px;
			cursor: pointer;
			vertical-align: top;
			.flag {
				max-width: 40px;
				max-height: 40px;
			}
			&:hover {
				background: white;
			}
			h4 {
				font-size: 14px;
				font-weight: normal;
				margin-top: 6px;
			}
		}
	}
	.infos {
		text-align: left;
		padding: 0 15px;
		margin: 0 auto;
		margin-top: 6px;
	}
	.infos .add {
		font-size: 13px;
		color: #999;
		margin: 3px 0;
		img {
			width: 20px;
			height: 16px;
			object-fit: contain;
			vertical-align: bottom;
		}
		&:not(.locked) {
			cursor: pointer;
		}
	}
	.infos .info {
		padding: 1px;
		color: #888;
		font-size: 14px;
		word-break: break-all;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.infos .info a {
		color: #888;
	}
	.infos .info img, .infos .info .flag {
		width: 20px;
	}
	.infos .info .label {
		line-height: 22px;
		vertical-align: top;
		font-weight: bold;
	}
	.infos .info .edit {
		background-image: url("../../../public/image/edit_pen.png");
		background-size: cover;
		cursor: pointer;
		width: 12px;
		height: 12px;
		display: none;
	}
	.infos .info:hover .edit {
		display: inline-block;
	}
	.website-dialog input, .github-dialog input {
		width: calc(100% - 10px);
	}
	.title {
		&.me {
			cursor: pointer;
		}
		text-align: center;
		.quote {
			font-size: 25px;
			padding: 0 3px;
			vertical-align: top;
			line-height: 19px;
		}
	}
	.team {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.team img {
		width: 150px;
		height: 150px;
		border-radius: 2px;
	}
	.talent-wrapper {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20px;
	}
	.talent-more {
		font-size: 18px;
		margin-left: 5px;
		color: #888;
	}
	.talent-history {
		margin-top: 3px;
	}
	.stats {
		vertical-align: top;
		.tournaments td {
			padding: 0 10px;
		}
		.small {
			font-size: 13px;
			vertical-align: top;
		}
		table {
			margin: 10px auto;
			margin-bottom: 15px;
		}
		tr > td:nth-child(n+2) {
			border-left: 2px solid var(--border);
		}
		td {
			padding: 0 17px;
			text-align: center;
		}
		.big {
			font-size: 22px;
			font-weight: 300;
			color: var(--text-color-secondary);
		}
		.grey {
			color: #999;
		}
		.v-icon {
			color: #777;
		}
	}
	.log-time, .godfather {
		margin-top: 10px;
		padding: 0 15px;
		font-size: 13px;
		color: #999;
		text-align: left;
	}
	.grades {
		margin-left: 15px;
		text-align: left;
	}
	.grade {
		border-radius: 5px;
		color: white;
		display: inline-block;
		padding: 3px 6px;
		margin-top: 5px;
		font-weight: normal;
		font-size: 14px;
		margin-right: 5px;
	}
	.grade.admin {
		background: #ff3333;
	}
	.grade.moderator {
		background: #ffa900;
	}
	.grade.contributor {
		background: #009c1d;
	}
	.avatar-wrapper {
		position: relative;
		display: inline-block;
	}
	.like-overlay {
		position: absolute;
		bottom: 4px;
		right: 4px;
		text-transform: none;
		min-width: 0;
		.like-count {
			margin-left: 2px;
		}
		&.liked {
			color: #e53935;
		}
		&.no-click {
			cursor: default;
			pointer-events: none;
		}
	}
	#app.app .leeks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		align-items: flex-end;
	}
	.leek {
		text-align: center;
		display: inline-block;
		& > div {
			padding: 5px;
		}
		.name {
			font-size: 20px;
			font-weight: 500;
			padding: 0 5px;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
		}
		.talent-ranking {
			margin-top: 2px;
			margin-bottom: 5px;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.level {
			font-size: 17px;
			color: var(--text-color-secondary);
			font-weight: 500;
		}
		img {
			margin-bottom: 5px;
		}
	}
	.leek:hover {
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.trophies-mode-button {
		padding: 8px 10px;
		cursor: pointer;
	}
	.trophies-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
		grid-gap: 3px;
		padding: 6px;
	}
	#app.app .trophies-container {
		grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
	}
	.trophy {
		padding: 4px;
		border: 1px solid transparent;
		text-align: center;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		vertical-align: bottom;
	}
	.trophy-date {
		padding-top: 4px;
		font-size: 13px;
		font-style: italic;
		color: #ddd;
	}
	.trophies.grid .trophy {
		background: white;
		border: 1px solid #ddd;
	}
	.trophies-bonus {
		margin: 5px;
	}
	.trophies .grey {
		color: #777;
		text-align: center;
		padding: 15px;
	}
	.warnings {
		text-align: center;
		padding-bottom: 20px;
		.warning-title {
			color: red;
			margin-bottom: 15px;
		}
		.warning {
			padding: 5px;
			background: white;
			border-radius: 2px;
			width: 250px;
			display: inline-block;
			margin: 6px;
			vertical-align: top;
			.reason {
				font-size: 15px;
			}
			.date {
				font-size: 12px;
				color: #666;
			}
			.author {
				font-size: 12px;
				color: #666;
			}
		}
	}
	.godfather-link {
		cursor: pointer;
	}
	.godfather-url {
		font-size: 20px;
		font-family: monospace;
		text-align: center;
		word-break: break-all;
	}
	.candidacies {
		margin-top: 15px;
		h4 {
			margin-bottom: 8px;
			color: #777;
		}
		.candidacy-item {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 4px 0;
			.emblem {
				width: 36px;
				height: 36px;
			}
			a {
				flex: 1;
				text-align: left;
			}
		}
	}
	.invitations {
		h4 {
			margin-bottom: 8px;
			color: #777;
		}
		.invitation {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 5px 0;
			a {
				display: flex;
				align-items: center;
				gap: 8px;
			}
			.emblem {
				width: 40px;
				height: 40px;
			}
			.invitation-actions {
				display: flex;
				gap: 5px;
				margin-left: auto;
			}
		}
	}
	.rename-button {
		b {
			padding-right: 4px;
		}
	}
	.trophy-count {
		margin-left: 5px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
	}
	.give-trophy {
		width: 30px;
		margin: 0 5px;
	}
	.sponsorship {
		.grey {
			color: #999;
		}
		.container {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(min(500px, 100%), 1fr));
		}
		.column {
			flex: 1;
			display: flex;
			justify-content: center;
			flex-direction: column;
		}
		.column-level {
			text-align: center;
		}
		.total-level {
			font-size: 32px;
			font-weight: 500;
		}
		.rewards {
			display: grid;
			gap: 8px;
			margin-top: 10px;
			grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
			.reward {
				flex: 1;
				min-width: 0;
				padding: 6px;
				text-align: center;
				font-weight: 500;
				&.notif-trophy .v-icon {
					color: black;
				}
				.level {
					font-size: 18px;
					display: flex;
					justify-content: center;
					gap: 2px;
					.v-icon {
						font-size: 20px;
					}
				}
				.name {
					font-size: 13px;
				}
				img {
					width: 100%;
					height: 80px;
					padding: 7px;
					object-fit: contain;
				}
			}
		}
		.bar {
			width: 100%;
			height: 12px;
			margin-top: 5px;
			background: var(--pure-white);
			border: 1px solid var(--border);
			position: relative;
			border-radius: 5px;
			text-align: left;
		}
		.xp-bar {
			height: 10px;
			background: #30bb00;
			display: inline-block;
			vertical-align: top;
			position: absolute;
			border-radius: 5px;
			transition: all ease 0.3s;
		}
		.xp-bar.blue {
			background: #008fbb;
		}
	}
	.trophy-tooltip-anchor {
		position: fixed;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}
</style>
