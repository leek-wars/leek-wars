<template lang="html">
	<popup :model-value="modelValue" class="draggable" :content-props="{ style: 'left: ' + consoleX + 'px; top: ' + consoleY + 'px' }" content-class="console-window" :full="true" :width="700" :persistent="true" :scrim="false" :no-click-animation="true" @update:modelValue="$emit('update:modelValue', $event)">
		<template #title>
			<div @mousedown="consoleMouseDown">
				{{ $t('main.console') }}
				<v-menu v-if="$refs.console" offset-y :close-on-content-click="false">
					<template #activator="{ props }">
						<v-chip v-bind="props" size="small">LS {{ $refs.console.leekscript.version }} {{ $refs.console.leekscript.strict ? 'strict' : '' }} <v-icon>mdi-chevron-down</v-icon></v-chip>
					</template>
					<leekscript-versions v-model:version="$refs.console.leekscript.version" v-model:strict="$refs.console.leekscript.strict" />
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
import { emitter } from '@/model/vue'

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
		setTimeout(() => {
			(this.$refs.console as Console).focus()
		}, 100)

		emitter.on('mousemove', this.consoleMouseMove)
		emitter.on('mouseup', this.consoleMouseUp)
	}

	beforeUnmount() {
		emitter.off('mousemove', this.consoleMouseMove)
		emitter.off('mouseup', this.consoleMouseUp)
	}

	consoleMouseDown(e: MouseEvent) {

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
		if (!this.consoleDown) { return null }
		this.consoleX = this.consoleStartx + (e.pageX - this.consoleDragx)
		if (this.consoleX < -15) { this.consoleX = -15 }
		this.consoleY = this.consoleStarty + (e.pageY - this.consoleDragy)
		if (this.consoleY < -15) { this.consoleY = -15 }
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

<style lang="scss">

.console-window.v-overlay__content {
	z-index: 10000;
	overflow: visible;
	margin: 0;
	box-shadow: 0 11px 15px -7px #0003, 0 24px 38px 3px #00000024, 0 9px 46px 8px #0000001f;
}

</style>

<style lang="scss" scoped>

.v-chip {
	margin-left: 8px;
}

</style>