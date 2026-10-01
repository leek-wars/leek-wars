<template>
	<div class="team-widget">
		<loader v-if="!loaded" />
		<template v-else-if="team">
			<router-link :to="'/team/' + team.id" class="team-header">
				<img :src="emblem" class="emblem">
				<div class="identity">
					<span class="name">{{ team.name }}</span>
					<span class="level">{{ $t('main.level_n', [team.level]) }}</span>
				</div>
			</router-link>
			<div class="stats">
				<div class="stat">
					<div class="value">{{ $filters.number(team.talent) }}</div>
					<div class="label">{{ t('team_talent') }}</div>
				</div>
				<div class="stat">
					<div class="value">{{ team.rank ? '#' + $filters.number(team.rank) : '—' }}</div>
					<div class="label">{{ t('team_rank') }}</div>
				</div>
				<div class="stat">
					<div class="value">{{ $filters.number(team.member_count) }}</div>
					<div class="label">{{ t('team_members') }}</div>
				</div>
			</div>
			<div ref="membersEl" class="members" :style="{ '--row-height': ROW_HEIGHT + 'px' }">
				<router-link v-for="m in visibleMembers" :key="m.id" v-ripple :to="'/farmer/' + m.id" class="member">
					<img :src="LeekWars.getAvatar(m.id, m.avatar_changed)" class="avatar" loading="lazy">
					<!-- L'aperçu de l'éleveur au survol du nom, comme dans la liste des
					     membres de la page d'équipe. La mise en page
					     reste sur le span extérieur : la racine du rich-tooltip est un
					     v-menu, qui avale les attributs de l'appelant. -->
					<span class="member-name">
						<rich-tooltip-farmer :id="m.id" v-slot="{ props }" :bottom="true">
							<span v-bind="props" :class="m.color">{{ m.name }}</span>
						</rich-tooltip-farmer>
					</span>
					<!-- La pastille des connectés, le même signal que la liste des membres
					     de la page d'équipe : c'est ce qu'on vient vérifier d'un coup d'œil. -->
					<span v-if="m.connected" class="online"></span>
					<span class="talent">{{ $filters.number(m.talent) }}</span>
				</router-link>
			</div>
		</template>
		<div v-else class="none">
			<span>{{ t('no_team') }}</span>
			<router-link v-ripple to="/teams" class="button">{{ t('find_team') }}</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	defineOptions({ name: 'HomeWidgetTeam' })

	const t = useNamespacedT('home')

	// Hauteur naturelle d'une ligne de membre : les lignes retenues s'étirent pour
	// remplir le panneau, leur hauteur rendue ne peut donc plus dire combien il en
	// tient (cf. useFitCount).
	const ROW_HEIGHT = 34
	// Une équipe monte à cinquante membres ; au-delà de vingt lignes, le panneau le
	// plus haut de la grille est déjà plein.
	const MEMBERS = 20

	interface Member { id: number, name: string, avatar_changed: number, talent: number, connected: boolean, grade: number, color?: string }
	interface TeamData { id: number, name: string, level: number, emblem_changed: number, talent: number, rank: number | null, member_count: number }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { team: TeamData | null, members: Member[] } | null }>()

	const loaded = ref(false)
	const team = ref<TeamData | null>(null)
	const members = ref<Member[]>([])

	const membersEl = ref<HTMLElement | null>(null)
	const memberCount = useFitCount(membersEl, '.member', MEMBERS, 0, ROW_HEIGHT)
	const visibleMembers = computed(() => members.value.slice(0, memberCount.value))

	// Même résolution que le composant `emblem`, qui attend un objet `Team` complet
	// là où le widget n'en a que l'en-tête.
	const emblem = computed(() => team.value && team.value.emblem_changed > 0
		? LeekWars.AVATAR + 'emblem/' + team.value.id + '.png?' + team.value.emblem_changed
		: '/image/no_emblem.png')

	// Repli quand la requête groupée n'a rien pour nous (serveur plus ancien que le
	// widget, ou widget en erreur) : le service complet de la page d'équipe. Il en
	// renvoie beaucoup plus que nécessaire, mais il est déjà là et c'est un cas rare.
	function load() {
		const id = store.state.farmer?.team?.id
		if (!id) { loaded.value = true; return }
		LeekWars.get('team/get/' + id).then(data => {
			apply({
				team: {
					id: data.id, name: data.name, level: data.level, emblem_changed: data.emblem_changed,
					talent: data.talent, rank: data.ranking, member_count: data.member_count,
				},
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				members: (data.members ?? []).map((m: any) => ({
					id: m.id, name: m.name, avatar_changed: m.avatar_changed,
					talent: m.talent, connected: m.connected, grade: 0, color: m.color,
				})),
			})
		}).error(() => { loaded.value = true })
	}

	function apply(data: { team: TeamData | null, members: Member[] }) {
		team.value = data.team
		members.value = data.members ?? []
		loaded.value = true
	}

	watch(() => props.data, (data) => {
		if (data === undefined) return
		if (data === null) load()
		else apply(data)
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.team-widget {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
	}
	.team-header {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: var(--text-color);
	}
	.emblem {
		width: 40px;
		height: 40px;
		object-fit: contain;
		flex-shrink: 0;
	}
	.identity {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.level {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.stat {
		text-align: center;
		background: var(--background-secondary);
		border-radius: var(--radius);
		padding: 6px;
	}
	// `--background-secondary` EST la surface du panneau en v3 : les cases n'y
	// auraient aucun fond visible. Même correctif que le widget des trophées.
	body:not(.v2) .stat {
		background: var(--background-row);
	}
	.stat .value {
		font-size: 18px;
		font-weight: bold;
		color: var(--primary);
	}
	.stat .label {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	// La liste occupe la hauteur restante ; on n'affiche que les lignes entières
	// (useFitCount), overflow hidden en filet.
	.members {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.member {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1 1 auto;
		min-height: var(--row-height);
		padding: 2px 6px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.member:hover {
		background: var(--background-secondary);
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: var(--radius);
		flex-shrink: 0;
	}
	.member-name {
		flex: 1 1 auto;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.online {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}
	.talent {
		font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', monospace;
		font-size: 13px;
		color: var(--text-color-secondary);
		flex-shrink: 0;
	}
	.none {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		height: 100%;
		color: var(--text-color-secondary);
		font-style: italic;
	}
</style>
