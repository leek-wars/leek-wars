<template lang="html">
	<error v-if="notfound" title="Unknown farmer" />
	<error v-else-if="farmer && farmer.banned" :title="$t('banned')" :message="$t('banned_message')" />
	<error v-else-if="farmer && farmer.deleted" :title="$t('deleted')" :message="$t('deleted_message')" />
	<div v-else class="page">
		<div class="page-header page-bar">
			<div>
				<rich-tooltip-farmer v-if="farmer" :id="farmer.id" v-slot="{ on }" :bottom="true">
					<h1 v-on="on">{{ farmer.name }}</h1>
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
					<tooltip v-if="$store.state.farmer.tournaments_enabled && $store.getters.leek_count >= 2" content-class="fluid" @input="loadTournamentRange()">
						<template v-slot:activator="{ on }">
							<div class="tab" v-on="on">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="farmer.tournament && !farmer.tournament.registered" class="register" @click="registerTournament">{{ $t('register_to_tournament') }}</span>
								<span v-else class="unregister" @click="registerTournament">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
						<i18n v-if="tournamentRange" tag="div" path="main.level_x_to_y">
							<b slot="min">{{ tournamentRange.min }}</b>
							<b slot="max">{{ tournamentRange.max }}</b>
						</i18n>
					</tooltip>
					<div class="tab" v-if="$store.getters.leek_count >= 2" @click="updateGarden">
						<span>{{ $t('garden') }}</span>
						<v-switch :input-value="farmer.in_garden" hide-details />
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
				<div slot="content" class="content avatar-td">
					<div v-if="myFarmer">
						<tooltip>
							<template v-slot:activator="{ on }">
								<div class="avatar-input" v-on="on">
									<input ref="avatarInput" type="file" accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp" @change="changeAvatar">
									<avatar ref="avatar" :farmer="farmer" @click.native="$refs.avatarInput.click()" />
								</div>
							</template>
							{{ $t('click_to_change_avatar') }}
						</tooltip>
					</div>
					<div v-else>
						<avatar :farmer="farmer" />
					</div>
					<lw-title v-if="farmer && farmer.title.length" class="info title" :class="{me: myFarmer}" :title="farmer.title" @click.native="titleDialog = myFarmer" />
					<div v-if="farmer" class="infos">
						<div v-if="!farmer.title.length && myFarmer" class="add add-title" :class="{locked: !farmerTitleEnabled}" @click="titleDialog = farmerTitleEnabled">
							<tooltip :disabled="farmerTitleEnabled">
								<template v-slot:activator="{ on }">
									<span v-on="on">
										<img class="image" src="/image/pomp/farmer_title.png">
										{{ $t('add_title') }}
									</span>
								</template>
								<v-icon>mdi-lock</v-icon> {{ $t('pomp.farmer_title') }}
							</tooltip>
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
						<div v-if="farmer.website && !/^(https:\/\/leekwars.\w+)?\/api\//.test(farmer.website.trim())" class="info website">
							<img src="/image/website.png"><a :href="farmer.website" target="_blank" rel="noopener"><span class="text label">{{ farmer.website }}</span></a>
							<span v-if="myFarmer" class="edit" @click="websiteDialog = true"></span>
						</div>
						<div v-else-if="myFarmer" class="add add-website" @click="websiteDialog = true">{{ $t('add_website') }}</div>
						<div v-if="farmer.github" class="info github">
							<img src="/image/github.png"><a :href="'https://github.com/' + farmer.github" target="_blank" rel="noopener"><span class="text label">github.com/{{ farmer.github }}</span></a>
							<span v-if="myFarmer" class="edit" @click="githubDialog = true"></span>
						</div>
						<div v-else-if="myFarmer" class="add add-github" @click="githubDialog = true">{{ $t('add_github') }}</div>
					</div>
				</div>
			</panel>

			<panel>
				<div slot="content" class="content stats">
					<div class="talent-wrapper">
						<tooltip>
							<template v-slot:activator="{ on }">
								<talent :id="farmer ? farmer.id : 0" :talent="farmer ? farmer.talent : '...'" category="farmer" :on="on" />
							</template>
							<div>{{ $t('talent') }}</div>
						</tooltip>
						<tooltip v-if="farmer">
							<template v-slot:activator="{ on }">
								<div class="talent-more" v-on="on">({{ farmer.talent_more >= 0 ? '+' : '' }} {{ farmer.talent_more | number }})</div>
							</template>
							<template v-if="farmer.talent_more > 0">
								<span v-html="$t('main.talent_difference_farmer', [farmer.name, farmer.talent_more, talent_gains + '%'])"></span>
							</template>
							<div v-else v-html="$t('main.talent_difference_farmer_no_gains', [farmer.name])"></div>
						</tooltip>
						<ranking-badge v-if="farmer && farmer.ranking && farmer.ranking <= 1000 && farmer.in_garden" :id="farmer.id" :ranking="farmer.ranking" category="farmer" />
					</div>
					<tooltip v-if="farmer">
						<template v-slot:activator="{ on }">
							<table v-on="on">
								<tr>
									<td class="big">{{ farmer.victories | number }}</td>
									<td class="big">{{ farmer.draws | number }}</td>
									<td class="big">{{ farmer.defeats | number }}</td>
								</tr>
								<tr>
									<td class="grey">{{ $t('victories') }}</td>
									<td class="grey">{{ $t('draws') }}</td>
									<td class="grey">{{ $t('defeats') }}</td>
								</tr>
							</table>
						</template>
						{{ $t('ratio') }} : {{ farmer.ratio }}
					</tooltip>

					<table v-if="farmer && farmer.won_solo_tournaments + farmer.won_farmer_tournaments + farmer.won_team_tournaments + farmer.won_battle_royale > 0" class="tournaments">
						<tr>
							<td class="grey">
								<tooltip>
									<template v-slot:activator="{ on }">
										<v-icon v-on="on">mdi-trophy-outline</v-icon>
									</template>
									{{ $t('tournaments') }}
								</tooltip>
							</td>
							<td width="25%"><span class="big">{{ farmer.won_solo_tournaments }}</span><br><span class="small grey">solo</span></td>
							<td width="25%"><span class="big">{{ farmer.won_farmer_tournaments }}</span><br><span class="small grey">{{ $t('display_farmer') }}</span></td>
							<td width="25%"><span class="big">{{ farmer.won_team_tournaments }}</span><br><span class="small grey">{{ $t('display_team') }}</span></td>
							<td width="25%"><span class="big">{{ farmer.won_battle_royale }}</span><br><span class="small grey">BR</span></td>
						</tr>
					</table>

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
					<div v-if="farmer" class="godfather grey">
						<div v-if="farmer.godfather">
							<i18n path="godson_of" tag="div">
								<router-link slot="farmer" :to="'/farmer/' + farmer.godfather.id">
									<rich-tooltip-farmer :id="farmer.godfather.id">
										{{ farmer.godfather.name }}
									</rich-tooltip-farmer>
								</router-link>
							</i18n>
						</div>
						<div v-if="farmer.godsons.length">
							<i18n path="godfather_of" tag="div">
								<span slot="farmers">
									<template v-for="(godson, i) in farmer.godsons">
										<router-link :key="i" :to="'/farmer/' + godson.id">
											<rich-tooltip-farmer :id="godson.id" v-slot="{ on }">
												<span v-on="on">{{ godson.name }}</span>
											</rich-tooltip-farmer>
										</router-link>
										<span v-if="i < farmer.godsons.length - 1" :key="i + '_'">, </span>
									</template>
								</span>
							</i18n>
						</div>
					</div>
				</div>
			</panel>

			<panel>
				<div slot="content" class="content team center">
					<loader v-if="!farmer" />
					<div v-else-if="farmer.team">
						<rich-tooltip-team :id="farmer.team.id" v-slot="{ on }" :bottom="true">
							<router-link :to="'/team/' + farmer.team.id">
								<div v-on="on">
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
							<div v-if="farmer.candidacy">
								<br><br><br>
								<i18n path="candidacy_for_team" class="candidacy">
									<a slot="team" :href="'/team/' + farmer.candidacy.team_id">{{ farmer.candidacy.team_name }}</a>
								</i18n>
								<br><br>
								<v-btn @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
							</div>
						</div>
						<div v-else>
							<span class="grey">{{ $t('no_team') }}</span>
						</div>
					</div>
				</div>
			</panel>
		</div>
		<panel toggle="farmer/trophies">
			<template slot="title">
				<img src="/image/icon/trophy.png">{{ $t('trophies') }} <span v-if="farmer" class="trophy-count">({{ farmer.points | number }})</span>
			</template>
			<template slot="actions">
				<router-link :to="'/trophies/' + id" class="button flat">
					<img src="/image/icon/trophy.png">
					<span>{{ $t('see_all_trophies') }}</span>
				</router-link>
				<div class="button flat" @click="trophiesModeButton">
					<v-icon>{{ (trophiesMode === 'grid' ? 'mdi-format-list-bulleted-square' : 'mdi-view-module') }}</v-icon>
				</div>
			</template>
			<div slot="content" class="trophies">
				<loader v-if="!farmer || !trophies" />
				<template v-else-if="farmer.trophies > 0 && trophies_list && trophies_grid">
					<div v-show="trophiesMode == 'list'" class="list trophies-container">
						<tooltip v-for="(trophy, t) in trophies_list" v-if="trophy != null" :key="t">
							<template v-slot:activator="{ on }">
								<router-link :to="'/trophy/' + trophy.code">
									<img class="trophy" v-on="on" :src="'/image/trophy/' + trophy.code + '.svg'">
								</router-link>
							</template>
							<div class="header">
								<b>{{ $t('trophy.' + trophy.code) }}</b>
								<b>{{ trophy.points }}</b>
							</div>
							<div>{{ trophy.description }}</div>
							<span class="trophy-date">{{ LeekWars.formatDuration(trophy.date) }}</span>
						</tooltip>
					</div>
					<div v-show="trophiesMode == 'grid'" class="grid trophies-container">
						<tooltip v-for="(trophy, t) in trophies_grid" :key="t" :disabled="!trophy">
							<template v-slot:activator="{ on }">
								<router-link v-if="trophy != null" :to="'/trophy/' + trophy.code" class="card">
									<img :src="'/image/trophy/' + trophy.code + '.svg'" v-on="on" class="trophy">
								</router-link>
								<div v-else class="locked" v-on="on">
									<img class="trophy" src="/image/unknown.png">
								</div>
							</template>
							<span v-if="trophy">
								<div class="header">
									<b>{{ $t('trophy.' + trophy.code) }}</b>
									<b>{{ trophy.points }}</b>
								</div>
								<div v-if="trophy.description">
									{{ trophy.description }}
								</div>
								<i18n tag="span" class="trophy-date" path="main.unlocked_the">
									<span slot="date">{{ trophy.date | date }}</span>
								</i18n>
							</span>
						</tooltip>
					</div>
					<div v-if="bonus_trophies && bonus_trophies.length > 0">
						<h4 class="trophies-bonus">{{ $t('bonus_trophies') }}</h4>
						<div class="trophies-container">
							<tooltip v-for="trophy in bonus_trophies" :key="trophy.id">
								<template v-slot:activator="{ on }">
									<router-link :to="'/trophy/' + trophy.code" :class="{card: trophiesMode == 'grid'}">
										<img class="trophy" :src="'/image/trophy/' + trophy.code + '.svg'" v-on="on">
									</router-link>
								</template>
								<div class="header">
									<b>{{ $t('trophy.' + trophy.code) }}</b>
									<b v-if="trophy.points">{{ trophy.points }}</b>
								</div>
								<div>{{ trophy.description }}</div>
								<span class="date">{{ LeekWars.formatDuration(trophy.date) }}</span>
							</tooltip>
						</div>
					</div>
				</template>
				<div v-else-if="farmer.trophies == 0" class="grey">{{ $t('no_trophies_yet') }}</div>
			</div>
		</panel>

		<panel :title="$t('leeks')">
			<loader v-if="!farmer" />
			<div v-else class="leeks">
				<rich-tooltip-leek v-for="leek in farmer.leeks" :id="leek.id" :key="leek.id" v-slot="{ on }">
					<router-link v-ripple :to="'/leek/' + leek.id" class="leek">
						<div v-on="on">
							<leek-image :leek="leek" :scale="0.9" />
							<div class="name">{{ leek.name }}</div>
							<lw-title v-if="leek.title.length" :title="leek.title" />
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<br>
							<span class="level">{{ $t('main.level_n', [leek.level]) }}</span>
						</div>
					</router-link>
				</rich-tooltip-leek>
			</div>
		</panel>

		<panel :title="$t('sponsorship')" toggle="trophies/sponsorship" icon="mdi-hat-fedora">
			<template slot="actions">
				<div v-if="myFarmer" class="button flat" @click="openGodfatherDialog"><v-icon>mdi-link-variant</v-icon> {{ $t('godfather_link') }}</div>
			</template>
			<div slot="content" class="content sponsorship">
				<div class="container">
					<div v-if="farmer" class="column grey">
						<div v-if="farmer.godfather">
							<i18n path="godson_of" tag="div">
								<router-link slot="farmer" :to="'/farmer/' + farmer.godfather.id">
									<rich-tooltip-farmer :id="farmer.godfather.id">
										{{ farmer.godfather.name }}
									</rich-tooltip-farmer>
								</router-link>
							</i18n>
						</div>
						<div v-if="farmer.godsons.length">
							<i18n path="godfather_of" tag="div">
								<span slot="farmers">
									<template v-for="(godson, i) in farmer.godsons">
										<router-link :key="i" :to="'/farmer/' + godson.id">
											<rich-tooltip-farmer :id="godson.id" v-slot="{ on }">
												<span v-on="on">{{ godson.name }}</span>
											</rich-tooltip-farmer>
										</router-link>
										<span v-if="i < farmer.godsons.length - 1" :key="i + '_'">, </span>
									</template>
								</span>
							</i18n>
						</div>
					</div>
					<div class="column column-level">
						<div class="grey">{{ $t('godsons_level') }}</div>
						<div class="total-level">{{ farmer ? farmer.godsons_level : '...' | number }}</div>
						<tooltip>
							<template v-slot:activator="{ on }">
								<div class="bar" v-on="on">
									<span :class="{ blue: farmer?.godsons_level >= 10_000 }" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
								</div>
							</template>
							<span v-if="farmer">{{ farmer.godsons_level | number }} / 10 000</span>
						</tooltip>
					</div>
				</div>
				<h4>{{ $t('main.rewards') }}</h4>
				<div v-if="farmer" class="rewards">
					<div v-for="(reward, r) of rewards" :key="r" class="reward card" :class="{'notif-trophy': r <= farmer.godsons_level}">
						<div class="level">{{ r | number }}<v-icon v-if="r <= farmer.godsons_level">mdi-check</v-icon></div>
						<img v-if="reward.trophy" :src="'/image/trophy/' + reward.trophy + '.svg'">
						<rich-tooltip-item v-else-if="reward.resource" :item="LeekWars.items[reward.item]" v-slot="{ on }" :bottom="true">
							<img v-on="on" :src="'/image/resource/' + reward.resource + '.png'">
						</rich-tooltip-item>
						<img v-else-if="reward.fight_pack" :src="'/image/fight-pack/' + reward.fight_pack + '.png'">
						<rich-tooltip-item v-else-if="reward.potion" :item="LeekWars.items[reward.item]" v-slot="{ on }" :bottom="true">
							<img v-on="on" :src="'/image/potion/skin_' + reward.potion + '.png'">
						</rich-tooltip-item>
						<rich-tooltip-item v-else-if="reward.hat" :item="LeekWars.items[reward.item]" v-slot="{ on }" :bottom="true">
							<img v-on="on" :src="'/image/hat/' + reward.hat + '.png'">
						</rich-tooltip-item>
						<div class="name" v-if="reward.trophy">{{ $t('trophy_x', [$t('trophy.' + reward.trophy)]) }}</div>
						<div class="name" v-else-if="reward.resource">{{ $t('resource.' + reward.resource) }}</div>
						<div class="name" v-else-if="reward.fight_pack">{{ $t('fight-pack.' + reward.fight_pack) }}</div>
						<div class="name" v-else-if="reward.potion">{{ $t('potion.skin_' + reward.potion) }}</div>
						<div class="name" v-else-if="reward.hat">{{ $t('hat.' + reward.hat) }}</div>
					</div>
				</div>
			</div>
		</panel>

		<div class="container grid large">
			<panel v-if="!farmer || farmer.fight_history.length > 0" :title="$t('fights')" icon="mdi-sword-cross">
				<template slot="actions">
					<router-link :to="'/farmer/' + id + '/history'" class="button flat">
						<v-icon class="list-icon">mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template>
				<loader v-if="!farmer" />
				<fights-history v-else slot="content" :fights="farmer.fight_history" />
			</panel>
			<panel v-if="!farmer || farmer.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<loader v-if="!farmer" />
				<tournaments-history v-else slot="content" :tournaments="farmer.tournaments" />
			</panel>
		</div>

		<panel v-if="farmer && farmer.warnings && farmer.warnings.length" :title="$t('warnings')">
			<div slot="content" class="content warnings">
				<h4 v-if="myFarmer" class="warning-title">{{ $tc('you_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<h4 v-else class="warning-title">{{ $tc('farmer_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<div v-for="(warning, w) in farmer.warnings" :key="w" class="warning card">
					<div class="reason">{{ $t('warning.reason_' + warning.reason) }} ({{ $t('warning.severity_s', [ warning.severity]) }})</div>
					<div class="message"><i>{{ warning.message }}</i></div>
					<i18n v-if="$store.getters.moderator" class="date" path="warning.given_by_x_the_d">
						<router-link slot="farmer" :to="'/farmer/' + warning.author_id">{{ warning.author_name }}</router-link>
						<span slot="date">{{ warning.date | date }}</span>
					</i18n>
					<div v-else class="date">{{ warning.date | date }}</div>
				</div>
			</div>
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="farmer && $store.state.connected && !myFarmer && !farmer.admin" class="report-button tab" @click="reportDialog = true">
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
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_team') }}</span>
			{{ $t('team_name') }} <input v-model="createTeamName" type="text">
			<div slot="actions">
				<div v-ripple class="dismiss">{{ $t('cancel') }}</div>
				<div v-ripple @click="createTeam">{{ $t('create') }}</div>
			</div>
		</popup>

		<popup v-if="farmer" v-model="godfatherDialog" :width="600">
			<v-icon slot="icon">mdi-hat-fedora</v-icon>
			<span slot="title">{{ $t('godfather_link') }}</span>
			{{ $t('godfather_link_description') }} :
			<br>
			<br>
			<div ref="godfatherLink" class="godfather-url">leekwars.com/godfather/{{ farmer.name }}</div>
		</popup>

		<popup v-if="farmer" v-model="countryDialog" :width="1000">
			<v-icon slot="icon">mdi-earth</v-icon>
			<span slot="title">{{ $t('country_selection') }}</span>
			<div class="country-dialog">
				<div class="country" code="null" @click="selectCountry(null)">
					<flag :clickable="false" />
					<h4>{{ $t('no_country') }}</h4>
				</div>
				<div v-for="country in LeekWars.countries" :key="country" class="country" @click="selectCountry(country)">
					<flag :code="country" :clickable="false" />
					<h4>{{ $t('country.' + country) }}</h4>
				</div>
			</div>
		</popup>

		<report-dialog v-if="farmer" v-model="reportDialog" :target="farmer" :reasons="reasons" />

		<popup v-if="farmer" v-model="websiteDialog" :width="500">
			<v-icon slot="icon">mdi-web</v-icon>
			<span slot="title">{{ $t('add_website') }}</span>
			<div class="website-dialog">
				<input v-model="newWebsite" type="text" class="input">
			</div>
			<div slot="actions">
				<div v-ripple @click="websiteDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="changeWebsite">{{ $t('validate') }}</div>
			</div>
		</popup>

		<popup v-if="farmer" v-model="githubDialog" :width="500">
			<img slot="icon" src="/image/github_white.png">
			<span slot="title">{{ $t('add_github') }}</span>
			<div class="github-dialog">
				<input v-model="newGitHub" type="text" class="input">
			</div>
			<div slot="actions">
				<div v-ripple @click="githubDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="changeGithub">{{ $t('validate') }}</div>
			</div>
		</popup>

		<popup v-if="farmer" v-model="titleDialog" :width="600">
			<v-icon slot="icon">mdi-medal-outline</v-icon>
			<span slot="title">{{ $t('main.select_title') }}</span>
			<div class="title-dialog">
				<title-picker ref="picker" :title="farmer.title" />
			</div>
			<div slot="actions">
				<div v-ripple @click="titleDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="pickTitle($refs.picker.getTitle())">{{ $t('validate') }}</div>
			</div>
		</popup>

		<popup v-if="farmer" v-model="renameDialog" :width="600">
			<v-icon slot="icon">mdi-pencil-outline</v-icon>
			<template slot="title">{{ $t('rename') }}</template>
			{{ $t('rename_description') }}
			<br>
			<br>
			{{ $t('rename_info') }}
			<br>
			<br>
			{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
			<br>
			<br>
			<center>
				<v-btn class="rename-button" @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ rename_price_habs | number }}</b><span class="hab"></span></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ rename_price_crystals }}</b> <span class="crystal"></span></v-btn>
			</center>
		</popup>

		<popup v-if="farmer" v-model="trophyDialog" :width="600">
			<v-icon slot="icon">mdi-trophy-outline</v-icon>
			<template slot="title">Donner un trophée</template>

			<div>
				ID de trophée : <input v-model="giveTrophyID" type="number">
				Combat : <input v-model="giveTrophyFight" type="number">
			</div>
			<br>
			<img v-for="trophy in giveTrophies" :key="trophy.id" :src="'/image/trophy/' + trophy.code + '.svg'" :title="trophy.code" class="give-trophy" @click="giveTrophyID = trophy.id">

			<div slot="actions">
				<div v-ripple @click="trophyDialog = false">{{ $t('cancel') }}</div>
				<div v-ripple class="green" @click="giveTrophy()">Donner</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { Team } from '@/model/team'
	import { mixins } from '@/model/i18n'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import FightsHistory from '@/component/history/fights-history.vue'
	import TournamentsHistory from '@/component/history/tournaments-history.vue'
	import TitlePicker from '@/component/title/title-picker.vue'
	import ReportDialog from '@/component/moderation/report-dialog.vue'
	import { TROPHIES } from '@/model/trophies'
	import LWTitle from '@/component/title/title.vue'

	@Component({ name: "farmer", i18n: {}, mixins: [...mixins], components: {
		RichTooltipFarmer, RichTooltipTeam, RichTooltipLeek, FightsHistory, TournamentsHistory, TitlePicker, ReportDialog, 'lw-title': LWTitle, 'rich-tooltip-item': RichTooltipItem
	} })
	export default class FarmerPage extends Vue {
		farmer: Farmer | null = null
		trophies: any = null
		trophiesMode: string = 'list'
		godfatherDialog: boolean = false
		countryDialog: boolean = false
		createTeamDialog: boolean = false
		createTeamName: string = ''
		reportDialog: boolean = false
		reasons = [Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR, Warning.INCORRECT_WEBSITE]
		websiteDialog: boolean = false
		newWebsite: string = ''
		githubDialog: boolean = false
		newGitHub: string = ''
		notfound: boolean = false
		titleDialog: boolean = false
		renameDialog: boolean = false
		renameName: string = ''
		rename_price_habs: number = 2000000
		rename_price_crystals: number = 200
		tournamentRangeLoading: boolean = false
		tournamentRange: any = null
		trophyDialog: boolean = false
		giveTrophyID: number | null = null
		giveTrophyFight: number | null = null
		giveTrophies = [
			TROPHIES[173 - 1],
			TROPHIES[177 - 1],
			TROPHIES[166 - 1],
			TROPHIES[194 - 1],
			TROPHIES[322 - 1],
			TROPHIES[320 - 1],
		]
		rewards = {
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
		xp_bar: number = 0

		get id(): any {
			return this.$route.params.id ? parseInt(this.$route.params.id, 10) : (this.$store.state.farmer ? this.$store.state.farmer.id : null)
		}
		get myFarmer() {
			return this.$store.state.farmer && this.id === this.$store.state.farmer.id
		}
		get talent_gains() {
			return this.farmer ? Math.round(this.farmer.talent_more / 3) : 0
		}
		get trophies_list() {
			const list: any[] = []
			for (const t in this.trophies) {
				if (this.trophies[t].unlocked && this.trophies[t].category !== 6) {
					list.push(this.trophies[t])
				}
			}
			list.sort((t1, t2) => t1.date - t2.date)
			return list
		}
		get trophies_grid() {
			const grid: {[key: string]: any} = {}
			for (const t in this.trophies) {
				if (this.trophies[t].category !== 6) {
					grid[t] = this.trophies[t].unlocked ? this.trophies[t] : null
				}
			}
			return grid
		}
		get bonus_trophies() {
			const bonus: any[] = []
			for (const t in this.trophies) {
				if (this.trophies[t].unlocked && this.trophies[t].category === 6) {
					bonus.push(this.trophies[t])
				}
			}
			return bonus
		}
		get farmerTitleEnabled() {
			return LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 126)
		}

		@Watch('id', {immediate: true})
		update() {
			this.farmer = null
			this.trophies = null
			this.notfound = false
			this.tournamentRangeLoading = false
			if (this.id === null) { return }
			if (this.myFarmer) {
				setTimeout(() => {
					this.init(store.state.farmer!)
				}, 10)
			} else {
				LeekWars.get('farmer/get/' + this.id).then(data => {
					this.init(data.farmer)
				}).error(error => {
					this.notfound = true
				})
			}
		}

		init(farmer: Farmer) {
			this.farmer = farmer
			this.renameName = this.farmer.name
			if (this.farmer.banned || this.farmer.deleted) {
				return
			}
			LeekWars.setTitle(farmer.name, this.$t('n_trophies', [farmer.trophies]) as string)
			if (this.myFarmer) {
				LeekWars.setActions([
					{icon: 'mdi-power', click: () => this.logout()}
				])
			} else {
				LeekWars.setActions([
					{image: 'icon/garden.png', click: () => this.$router.push('/garden/challenge/farmer/' + farmer.id)},
					{icon: 'mdi-email-outline', click: () => this.$router.push('/chat/new/' + farmer.id + '/' + farmer.name + '/'+ farmer.avatar_changed)}
				])
			}
			this.getTrophies()
			this.warnings()
			this.newWebsite = this.farmer.website
			this.newGitHub = this.farmer.github
			this.$root.$emit('loaded')
		}

		logout() {
			this.$store.commit('disconnect')
			this.$router.push('/')
		}

		trophiesModeButton() {
			if (this.trophiesMode === 'list') {
				this.trophiesMode = 'grid'
				localStorage.setItem('farmer/trophies-mode', 'grid')
			} else {
				this.trophiesMode = 'list'
				localStorage.setItem('farmer/trophies-mode', 'list')
			}
		}

		getTrophies() {
			if (!this.farmer) {	return }
			if (!('farmer/trophies-mode' in localStorage)) {
				localStorage.setItem('farmer/trophies-mode', 'list')
			}
			this.trophiesMode = localStorage.getItem('farmer/trophies-mode') || 'list'
			if (this.farmer.trophies_list) {
				this.trophies = this.farmer.trophies_list
			} else {
				LeekWars.get('trophy/get-farmer-trophies/' + this.farmer.id + '/' + this.$i18n.locale).then(data => {
					this.trophies = data.trophies
					if (this.myFarmer) {
						store.commit('set-trophies', data.trophies)
					}
				})
			}
		}

		registerTournament() {
			if (this.farmer) {
				if (this.farmer.tournament.registered) {
					this.farmer.tournament.registered = false
					LeekWars.post('farmer/unregister-tournament')
				} else {
					this.farmer.tournament.registered = true
					LeekWars.post('farmer/register-tournament')
				}
			}
		}

		updateGarden() {
			if (this.farmer) {
				this.farmer.in_garden = !this.farmer.in_garden
				LeekWars.post('farmer/set-in-garden', {leek_id: this.farmer.id, in_garden: this.farmer.in_garden})
			}
		}

		openGodfatherDialog() {
			this.godfatherDialog = true
			setTimeout(() => {
				LeekWars.selectText(this.$refs.godfatherLink)
			}, 100)
		}

		selectCountry(code: string) {
			if (this.farmer) {
				this.farmer.country = code
				this.countryDialog = false
				LeekWars.post('farmer/change-country', {country_code: code})
			}
		}

		changeAvatar(e: Event) {
			if (!e || !e.target) { return }
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

			LeekWars.fileToImage(file, (this.$refs.avatar as Vue).$el as Element)

			const formdata = new FormData()
			formdata.append('avatar', file)
			input.value = ''

			LeekWars.toast(this.$t('uploading_avatar') as string)

			LeekWars.post('farmer/set-avatar', formdata).then(data => {
				if (this.farmer) {
					LeekWars.toast(this.$t('upload_success') as string)
					this.farmer.avatar_changed = data.avatar_changed
				}
			}).error(error => {
				LeekWars.toast(this.$t('upload_failed', [error.error]) as string)
				if (this.farmer) {
					this.farmer.avatar_changed = LeekWars.time
				}
			})
		}

		warnings() {
			if (!this.farmer || !this.$store.getters.moderator) { return }
			LeekWars.get('moderation/get-warnings/' + this.farmer.id).then(data => {
				if (this.farmer) {
					Vue.set(this.farmer, 'warnings', data.warnings)
				}
			})
		}

		createTeam() {
			LeekWars.post('team/create', {team_name: this.createTeamName}).then(data => {
				LeekWars.toast(this.$i18n.t('team_created'))
				this.createTeamDialog = false
				const team = new Team()
				team.id = data.id
				team.name = this.createTeamName
				team.level = 1
				team.talent = 1000
				team.opened = true
				store.commit('create-team', team)
			}).error(error => {
				LeekWars.toast(this.$i18n.t(error.error))
			})
		}

		cancelCandidacy() {
			LeekWars.post('team/cancel-candidacy').then(data => {
				if (this.farmer) {
					LeekWars.toast(this.$i18n.t('candidacy_canceled'))
					this.farmer.candidacy = null
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		changeWebsite() {
			if (!this.farmer) { return }
			this.farmer.website = this.newWebsite
			LeekWars.post('farmer/set-website', {website: this.newWebsite})
			this.websiteDialog = false
		}

		changeGithub() {
			if (!this.farmer) { return }
			this.farmer.github = this.newGitHub
			LeekWars.post('farmer/set-github', {github: this.newGitHub})
			this.githubDialog = false
		}

		sendMessage() {
			if (!this.farmer) { return }
			LeekWars.get('message/find-conversation/' + this.farmer.id).then(conversation => {
				store.commit('new-conversation', conversation)
				this.$router.push('/chat/' + conversation.id)
			}).error(() => {
				if (!this.farmer) { return }
				this.$router.push('/chat/new/' + this.farmer.id + '/' + this.farmer.name + '/' + this.farmer.avatar_changed)
			})
		}

		pickTitle(title: number[]) {
			this.farmer!.title = title
			this.titleDialog = false
			LeekWars.put('farmer/set-title', {icon: title[0] || 0, noun: title[1] || 0, gender: title[2] || 0, adjective: title[3] || 0})
			this.$store.commit('set-title', title)
		}

		rename(currency: string) {
			if (!this.farmer) { return }
			const method = currency === 'habs' ? 'farmer/rename-habs' : 'farmer/rename-crystals'
			LeekWars.post(method, {name: this.renameName}).then(data => {
				if (this.farmer) {
					this.farmer.name = this.renameName
					store.commit('rename-farmer', {name: this.renameName})
					if (currency === 'habs') {
						store.commit('update-habs', -this.rename_price_habs)
					} else {
						store.commit('update-crystals', -this.rename_price_crystals)
					}
					this.renameDialog = false
					LeekWars.toast(this.$t('rename_done'))
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		loadTournamentRange() {
			if (!this.farmer || this.tournamentRange || this.tournamentRangeLoading) { return }
			this.tournamentRangeLoading = true
			const power = Math.round(Object.values(this.farmer.leeks).reduce((p, l) => p + l.level ** LeekWars.POWER_FACTOR, 0))
			LeekWars.get('tournament/range-farmer/' + power).then(d => this.tournamentRange = d)
		}

		giveTrophy() {
			if (this.giveTrophyID) {
				LeekWars.post('trophy/give', { trophy: this.giveTrophyID, farmer_id: this.farmer!.id, fight_id: this.giveTrophyFight || 0 })
				.then(() => {
					this.trophyDialog = false
					LeekWars.toast("Trophée donné !")
				})
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
			}
		}

		openCountryDialog() {
			this.countryDialog = true
			LeekWars.loadCountries()
		}

		get xp_bar_width() {
			if (!this.farmer) {
				return this.xp_bar
			}
			return this.xp_bar = this.farmer.godsons_level >= 10_000 ? 100 : Math.min(100, this.farmer.godsons_level / 10_000 * 100)
		}
	}
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
				color: #222;
			}
		}
	}
	.infos {
		text-align: left;
		width: 250px;
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
			border-left: 2px solid #ddd;
		}
		td {
			padding: 0 17px;
			text-align: center;
		}
		.big {
			font-size: 22px;
			font-weight: 300;
			color: #555;
		}
		.grey {
			color: #999;
		}
		.v-icon {
			color: #777;
		}
		.log-time, .godfather {
			margin-top: 10px;
			padding: 0 20px;
			font-size: 13px;
		}
		.log-time {
			margin-top: 20px;
		}
		.grades {
			margin-left: 20px;
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
		.talent {
			margin-top: 2px;
			margin-bottom: 5px;
		}
		.level {
			font-size: 17px;
			color: #555;
			font-weight: 500;
		}
		img {
			margin-bottom: 5px;
		}
	}
	.leek:hover {
		background: white;
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
	.candidacy {
		color: #999;
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
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			.reward {
				flex: 1;
				min-width: 0;
				padding: 6px;
				text-align: center;
				font-weight: 500;
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
			background: white;
			border: 1px solid #ddd;
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
</style>
