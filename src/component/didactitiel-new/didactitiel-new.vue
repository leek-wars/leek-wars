<template>
	<div class="wrapper">
		<div class="didactitial">

			<div :key="LeekWars.didactitial_step" class="bubble card" :class="{visible: LeekWars.didactitial_visible}">

				<div v-if="LeekWars.didactitial_step === 1" class="content">
					<div v-if="farmerName.includes('@')" class="text" v-html="$t('main.dida_1_leek', [farmerFirstLeek])"></div>
					<div v-else class="text" v-html="$t('main.dida_1', [farmerName, farmerFirstLeek])"></div>
					<i18n-t class="text" keypath="main.dida_2" tag="div">
						<template #life><img height=18 src="/image/charac/life.png"></template>
						<template #strength><img height=18 src="/image/charac/strength.png"></template>
					</i18n-t>
				</div>
				<div v-else-if="LeekWars.didactitial_step === 2" class="content">
					<div class="text" v-html="$t('main.dida_3', [farmerName, farmerFirstLeek])"></div>
					<div class="text" v-html="$t('main.dida_4')"></div>
				</div>
				<div v-else-if="LeekWars.didactitial_step === 3" class="content">
					<div class="text" v-html="$t('main.dida_5')"></div>
					<div class="text" v-html="$t('main.dida_6')"></div>
				</div>
				<div v-else-if="LeekWars.didactitial_step === 4" class="content">
					<div class="text" v-html="$t('main.dida_7')"></div>
					<div v-chat-code-latex class="text" v-html="$t('main.dida_8')"></div>
					<div class="text" v-html="$t('main.dida_9')"></div>
				</div>
				<div v-else-if="LeekWars.didactitial_step === 5" class="content">
					<i18n-t class="text" keypath="main.dida_10" tag="div">
						<template #help><router-link to="/encyclopedia">{{ $t('main.help') }}</router-link></template>
						<template #tutorial><router-link :to="'/encyclopedia/' + $i18n.locale + '/' + $t('main.tutorial').replace(/ /g, '_')">{{ $t('main.tutorial') }}</router-link></template>
					</i18n-t>
					<i18n-t class="text" keypath="main.dida_11" tag="div">
						<template #chat><router-link to="/messages">{{ $t('main.chat') }}</router-link></template>
						<template #forum><router-link to="/forum">{{ $t('main.forum') }}</router-link></template>
					</i18n-t>
					<div class="text" v-html="$t('main.dida_12', [farmerName.includes('@') ? farmerFirstLeek : farmerName])"></div>
				</div>

				<div class="bottom">
					<v-btn v-if="LeekWars.didactitial_step > 1" @click="back"><v-icon>mdi-arrow-left</v-icon></v-btn>
					<div class="progress">{{ LeekWars.didactitial_step }} / 5</div>
					<v-btn v-if="LeekWars.didactitial_step === 5" color="primary" @click="complete">{{ $t('main.play') }}&nbsp;<v-icon>mdi-sword-cross</v-icon></v-btn>
				</div>

				<v-icon class="close" @click="closed">mdi-close</v-icon>

				<svg class="arrow" width="70" height="41" viewBox="0 0 18.617 10.965"><path d="M45.666 57.347h9.04l9.577 10.965z" style="fill: var(--pure-white); stroke-width:.306566" transform="translate(-45.666 -57.347)"/></svg>
			</div>

			<leek-image class="leek" :leek="{ level: 10, face: 1 }" :scale="2" :invert="true" />

		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

defineOptions({ name: 'Didactitiel', i18n: {}, mixins: [...mixins] })

const farmerName = computed(() => store.state.farmer ? store.state.farmer.name : '')
const farmerFirstLeek = computed(() => store.state.farmer ? LeekWars.first(store.state.farmer.leeks)?.name ?? '' : '')

function back() {
	LeekWars.didactitial_step--
}

function complete() {
	LeekWars.post('farmer/didactitiel-complete', {})
	if (store.state.farmer) {
		store.state.farmer.didactitiel_seen = true
		store.state.farmer.didactitiel_step = 6
		store.state.farmer.didactitiel_completed_at = LeekWars.time
	}
	LeekWars.didactitial = false
	LeekWars.didactitial_step = 0
}

// La croix vaut « didacticiel terminé » : sans bouton Passer, fermer doit
// faire avancer l'état sinon le didacticiel revient à la prochaine connexion.
const closed = complete
</script>

<style lang="scss" scoped>
.wrapper {
	position: fixed;
	bottom: 0;
	max-width: 100%;
	right: 0;
	z-index: 10;
}
.didactitial {
	// max-width: 1200px;
	margin: 0 auto;
	display: flex;
	gap: 20px;
	padding: 10px;
	align-items: flex-end;
	justify-content: flex-end;
	font-size: 17px;
}
#app.app .didactitial {
	font-size: 15px;
	gap: 5px;
	padding: 5px;
}
.bubble {
	background: var(--pure-white);
	padding: 20px 30px;
	border-radius: 7px;
	position: relative;
	margin-bottom: 100px;
	width: 530px;
	box-shadow: rgba(0, 0, 0, 0.4) 0px 10px 30px;
	transform: scale(0.5);
	transition: transform 300ms ease;
	transform-origin: bottom right;
	.arrow {
		position: absolute;
		bottom: -32px;
		right: 0px;
	}
	.content {
		line-height: 1.5;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	&.visible {
		transform: scale(1);
	}
	.text a {
		color: #5fad1b;
		font-weight: 500;
	}
	img {
		vertical-align: middle;
	}
}
#app.app .bubble {
	margin-bottom: 50px;
	padding: 15px;
	.content {
		line-height: 1.2;
	}
}
.leek {
	margin-top: 20px;
	flex-shrink: 0;
	margin-right: -20px;
}
#app.app .leek {
	flex-basis: 30%;
}
.progress {
	color: #777;
	font-weight: 500;
	font-size: 16px;
}
.close {
	position: absolute;
	right: -55px;
	top: 8px;
	font-size: 30px;
	width: 40px;
	height: 40px;
	background: var(--pure-white);
	border-radius: 50%;
	padding: 5px;
	box-shadow: rgba(0, 0, 0, 0.4) 0px 5px 15px;
}
#app.app .close {
	right: -45px;
	font-size: 24px;
}
.bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 20px;
	gap: 10px;
	white-space: nowrap;
}
</style>