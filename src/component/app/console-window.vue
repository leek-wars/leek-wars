<template lang="html">
	<popup v-model="modelValue" class="draggable" :target="[consoleX,  consoleY]" :full="true">
		<template #title>
			<div @mousedown="consoleMouseDown">
				{{ $t('main.console') }}
				<v-menu v-if="$refs.console" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<v-chip v-bind="props" size="small">LS {{ $refs.console.leekscript.version }} {{ $refs.console.leekscript.strict ? 'strict' : '' }} <v-icon>mdi-chevron-down</v-icon></v-chip>
					</template>
					<leekscript-versions v-model="$refs.console.leekscript" />
				</v-menu>
				<v-chip v-if="$refs.console && !$refs.console.isEmpty()" @click="$refs.console.clear()" size="small"><v-icon>mdi-cancel</v-icon></v-chip>
			</div>
		</template>
		<template #options>
			<div class="option" @click="$refs.console.toggleTheme()"><v-icon>mdi-weather-night</v-icon></div>
			<!-- <div class="option" @click="consoleRandom"><img src="/image/icon/dice.png"></div> -->
			<div class="option" @click="consolePopup"><v-icon>mdi-open-in-new</v-icon></div>
			<div class="option" @click="$emit('close')"><v-icon>mdi-close</v-icon></div>
		</template>
		<console ref="console" class="window" />
	</popup>
</template>

<script lang="ts">

import { LeekWars } from '@/model/leekwars'
import { Options, Prop, Vue } from 'vue-property-decorator'
import Console from './console.vue'
import LeekscriptVersions from './leekscript-versions.vue'

@Options({ components: { 'console': Console, LeekscriptVersions } })
export default class ConsoleWindow extends Vue {

	@Prop({ required: true}) modelValue!: boolean

	consoleX: number = 0
	consoleY: number = 0
	consoleDown: boolean = false
	consoleStartx: number = 0
	consoleStarty: number = 0
	consoleDragx: number = 0
	consoleDragy: number = 0
	theme: string = 'leekwars'

	mounted() {
		this.consoleX = window.innerWidth / 2 - 300
		this.consoleY = window.innerHeight / 2 - 200
		console.log("open", this.consoleX, this.consoleY, this.$refs.console)
		setTimeout(() => {
			(this.$refs.console as Console).focus()
		}, 100)
	}

	consoleMouseDown(e: MouseEvent) {

		console.log("Console mouse down")
		if (e.button === 2) { return false }
		this.consoleDragx = e.pageX
		this.consoleDragy = e.pageY
		this.consoleStartx = this.consoleX
		this.consoleStarty = this.consoleY
		this.consoleDown = true
		e.preventDefault()
		return false
	}

	consoleMouseMove(e: MouseEvent) {
		console.log("consoleMouseMove", this.consoleDown)
		if (!this.consoleDown) { return null }
		this.consoleX = this.consoleStartx + (e.pageX - this.consoleDragx)
		if (this.consoleX < -15) { this.consoleX = -15 }
		this.consoleY = this.consoleStarty + (e.pageY - this.consoleDragy)
		if (this.consoleY < -15) { this.consoleY = -15 }

		console.log("Console pos", this.consoleX, this.consoleY)
	}

	consoleMouseUp(e: MouseEvent) {
		this.consoleDown = false
	}

	consolePopup() {
		LeekWars.popupWindow("/full-console", "title", 600, 320)
		this.$emit('close')
	}
}

</script>

<style lang="scss" scoped>

.v-dialog.console {
	position: fixed;
	top: calc(50% - 200px);
	left: calc(50% - 300px);
	width: 700px;
	z-index: 10;
	transition: none;
	overflow: visible;
	margin: 0;
	animation: hithere 0.2s ease 1;
}
@keyframes hithere {
	0% { transform: scale(0.5); opacity: 0; }
	100% { transform: scale(1); opacity: 1; }
}

.title {
	gap: 8px;
	.v-chip {
		margin-top: -2px;
	}
}
</style>