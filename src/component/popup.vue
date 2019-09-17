<template lang="html">
	<v-dialog :value="value" :max-width="width" :persistent="persistent" @input="$emit('input', $event)">
		<div class="title">
			<slot name="title"></slot>
			<div class="options">
				<div class="option" @click="close">
					<i class="material-icons">clear</i>
				</div>
			</div>
		</div>
		<div :class="{full: full}" class="content">
			<slot></slot>
		</div>
		<div v-if="!!$slots['actions']" class="actions">
			<slot name="actions"></slot>
		</div>
	</v-dialog>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "popup" })
	export default class Popup extends Vue {
		@Prop() value!: boolean
		@Prop() title!: string
		@Prop() width!: number
		@Prop() full!: boolean
		@Prop() persistent!: Boolean
		close() {
			this.$emit('input', false)
		}
	}
</script>

<style lang="scss" scoped>
	.content.full {
		padding: 0;
	}
</style>