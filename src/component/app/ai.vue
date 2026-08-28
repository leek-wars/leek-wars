<template lang="html">
	<div draggable="true" class="ai" :class="{[ai.color || '']: true, small, locked}">
		<!-- Motif de code du v3 (masqué en v2, où la feuille est un PNG). Trois
		     lignes indentées : ce qui dit « fichier de code » sans glyphe. -->
		<div class="motif" aria-hidden="true"><i></i><i></i><i></i></div>
		<img v-if="langLogo" class="lang-logo" :src="langLogo">
		<div class="name" :style="{ fontSize: nameSize + 'px' }">
			{{ ai.bot ? $t('leekscript.' + ai.name) : ai.name }}
			<v-icon v-if="!ai.valid">mdi-close-circle</v-icon>
		</div>
		<div v-if="show_lines" class="lines">{{ $t('main.n_lines', ai.total_lines) }}</div>
		<div v-if="ai.version && isLeekScriptAI" class="version">LS {{ ai.version }}</div>
	</div>
</template>

<script setup lang="ts">
import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import { store } from '@/model/store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLanguageLogo, isLeekScript } from '@/component/editor/file-types'

defineOptions({ name: "Ai" })

const props = defineProps<{
	ai: AI
	library: boolean
	small: boolean
	locked?: boolean
}>()

const { t } = useI18n()

// Les bots (ai.bot) et les IA sans path retombent sur le nom (sans extension = LeekScript).
const aiPath = computed(() => props.ai.path || props.ai.name || '')
const langLogo = computed(() => getLanguageLogo(aiPath.value))
const isLeekScriptAI = computed(() => isLeekScript(aiPath.value))

const my_ai = computed(() => props.ai.path && props.ai.path in fileSystem.ais)

const displayName = computed(() => props.ai.bot ? t('leekscript.' + props.ai.name) as string : props.ai.name)

const nameSize = computed(() => {
	const base = props.small ? 12 : 16
	const length = displayName.value.length
	if (length <= 16) return base
	return Math.max(base * 0.75, base * 16 / length)
})

const show_lines = computed(() => {
	if (props.small) { return false }
	if (props.library) { return true }
	if (my_ai.value) {
		return store.state.farmer!.show_ai_lines
	}
	return props.ai.total_lines !== undefined
})
</script>

<style lang="scss" scoped>
	.ai {
		vertical-align: bottom;
		background-image: url("/image/ai/ai.png");
		background-size: 100% 100%;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px;
    	padding-top: 20px;
		width: 103px;
		height: 120px;
		position: relative;
		word-wrap: break-word;
		text-align: center;
		margin: 0 auto;
		&.blue {
			background-image: url("/image/ai/ai_blue.png");
			color: var(--white);
		}
		&.green {
			background-image: url("/image/ai/ai_green.png");
			color: var(--white);
		}
		&.black {
			background-image: url("/image/ai/ai_black.png");
			color: var(--white);
		}
		&.red {
			background-image: url("/image/ai/ai_red.png");
			color: var(--white);
		}
		.name {
			font-size: 16px;
			font-weight: bold;
			width: 100%;
		}
		.lang-logo {
			position: absolute;
			bottom: 8px;
			right: 8px;
			width: 18px;
			height: 18px;
		}
		&.small {
			vertical-align: top;
			width: 65px;
			height: 87px;
			margin-top: 10px;
			margin-left: -30px;
			padding: 6px;
			.name {
				font-size: 12px;
			}
			.lang-logo {
				bottom: 5px;
				right: 5px;
				width: 14px;
				height: 14px;
			}
		}
		.v-icon {
			font-size: 15px;
			color: red;
		}
		.lines {
			font-size: 13px;
			margin-top: 5px;
			font-weight: normal;
			color: var(--text-color-secondary);
		}
		.version {
			font-size: 10px;
			border-radius: 5px;
			padding: 1px 3px;
			font-weight: 500;
			position: absolute;
			border: 1px solid var(--border);
			color: var(--text-color-secondary);
			bottom: 10px;
			left: 10px;
		}
		&.locked {
			filter: brightness(85%);
		}
		// Le motif de code n'existe que dans la feuille dessinée du v3.
		.motif {
			display: none;
		}
	}
	body.v2.dark .ai:not(.blue):not(.red):not(.green) {
		background-image: url("/image/ai/ai_black.png");
		&.black {
			background-image: url("/image/ai/ai.png");
			color: var(--black);
		}
	}

	/* ====== v3 : la feuille est dessinée, plus un PNG ======
	 *
	 * Les cinq PNG (ai.png et ses quatre couleurs) portaient leur teinte en dur,
	 * leurs coins arrondis et une ombre floue : trois choses que le v3 refuse.
	 * La feuille est donc redessinée en CSS, et suit le thème.
	 *
	 * Silhouette : deux couches de `clip-path`. La couche du dessous est peinte
	 * du trait et découpée au pentagone (coin coupé) ; `::before`, en retrait de
	 * 2 px, porte la surface et le même pentagone.
	 *
	 * Le pli de `::before` n'est pas celui du pentagone : sa boîte est déjà en
	 * retrait de 2 px de chaque côté, ce qui éloigne sa diagonale de 4 px sur
	 * l'axe x−y, alors qu'un trait de 2 px perpendiculaire n'en demande que
	 * 2 × √2 ≈ 2,83. Le pli intérieur doit donc AVANCER de 4 − 2,83 = 1,17 px
	 * pour que la diagonale ait la même épaisseur que les autres côtés (avant
	 * cette correction elle faisait 4,83 px, deux fois trop). Même calcul pour
	 * `::after`, le rabat (l'envers de la page), dont l'hypoténuse se pose
	 * exactement sur le bord intérieur du trait.
	 */
	body:not(.v2) .ai {
		// --ai-accent : la teinte propre de la feuille (couleur de l'IA).
		// --ai-line : le trait, qui en dérive mais passe au vert au survol —
		// séparés pour que le survol ne repeigne QUE le contour.
		--ai-accent: var(--border-strong);
		--ai-line: var(--ai-accent);
		--ai-surface: var(--background-row);
		--ai-fold: 22px;
		--ai-inner-fold: calc(var(--ai-fold) - 1.17px);
		background-image: none;
		background-color: var(--ai-line);
		clip-path: polygon(0 0, calc(100% - var(--ai-fold)) 0, 100% var(--ai-fold), 100% 100%, 0 100%);
		padding: 30px 8px 18px;
		color: var(--text-color);
		&::before {
			content: '';
			position: absolute;
			inset: 2px;
			background: var(--ai-surface);
			clip-path: polygon(0 0, calc(100% - var(--ai-inner-fold)) 0, 100% var(--ai-inner-fold), 100% 100%, 0 100%);
		}
		&::after {
			content: '';
			position: absolute;
			top: 2px;
			right: 2px;
			width: var(--ai-inner-fold);
			height: var(--ai-inner-fold);
			background: color-mix(in srgb, var(--ai-accent) 25%, var(--ai-surface));
			clip-path: polygon(0 0, 100% 100%, 0 100%);
		}
		.motif {
			display: flex;
			flex-direction: column;
			gap: 3px;
			position: absolute;
			top: 10px;
			left: 10px;
			right: 26px;
			z-index: 1;
			i {
				display: block;
				height: 3px;
				background: var(--text-color);
				opacity: .22;
				&:nth-child(1) { width: 60%; }
				&:nth-child(2) { width: 100%; margin-left: 18%; }
				&:nth-child(3) { width: 45%; margin-left: 18%; }
			}
		}
		.name, .lines, .version, .lang-logo {
			z-index: 1;
		}
		.version {
			border-radius: 0;
			border-color: var(--ai-accent);
		}
		.v-icon {
			color: var(--error);
		}
		// Les quatre couleurs : le trait prend la teinte, la surface en garde un
		// voile. L'encre reste celle du thème, jamais du blanc forcé.
		&.green, &.blue, &.red, &.black {
			color: var(--text-color);
			background-image: none;
			--ai-surface: color-mix(in srgb, var(--ai-accent) 14%, var(--background-secondary));
		}
		&.green { --ai-accent: var(--success); }
		&.blue { --ai-accent: var(--info); }
		&.red { --ai-accent: var(--error); }
		&.black { --ai-accent: var(--text-color-secondary); }
		// Le ripple étant coupé en v3, le survol est le seul retour visuel. Il ne
		// touche que le contour : la pastille de version, le rabat et la surface
		// gardent la teinte de la feuille (demande de Pierre).
		&:hover {
			--ai-line: var(--primary-strong);
		}
		// L'assombrissement du v2 ne dit rien sur un fond sombre : la feuille
		// verrouillée s'efface à la place.
		&.locked {
			filter: none;
			opacity: .7;
		}
		&.small {
			--ai-fold: 16px;
			padding: 22px 4px 14px;
			.motif {
				top: 7px;
				left: 7px;
				right: 20px;
				gap: 2px;
				i { height: 2px; }
			}
		}
	}
</style>