<template>
	<div>
		<code ref="code" v-show="expanded"></code>
		<span v-if="expandable && !single" class="button" v-ripple @click="expanded = !expanded">
			<v-icon>{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
			<span class="label" v-if="expanded">{{ $t('main.close') }}</span>
			<span class="label" v-else>{{ $t('main.open') }} ({{ $tc('main.n_lines', lines) }})</span>
		</span>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'lw-code' })
	export default class Code extends Vue {

		@Prop({required: true}) code!: string
		@Prop() single!: boolean
		@Prop() expandable!: boolean
		expanded: boolean = true

		get lines() {
			return this.code.split('\n').length
		}

		@Watch('code', {immediate: true})
		@Watch('single', {immediate: true})
		update() {
			this.$nextTick(() => {
				// if (this.expandable && this.lines >= 5) {
				// 	this.expanded = false
				// }
				if (this.single) {
					LeekWars.createCodeAreaSimple(this.code, this.$refs.code as HTMLElement)
				} else {
					LeekWars.createCodeArea(this.code, this.$refs.code as HTMLElement)
				}
			})
		}
	}
</script>


<style lang="scss" scoped>
	div {
		display: inline-block;
		max-width: 100%;
	}
	.button {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		cursor: pointer;
		color: #777;
		user-select: none;
		padding-right: 10px;
	}
	.label {
		color: #777;
	}
</style>