<template lang="html">
	<v-dialog :value="value" :max-width="width" :persistent="persistent" lazy @input="$emit('input', $event)">
		<template v-if="content_created">
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
		</template>
	</v-dialog>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: "popup" })
	export default class Popup extends Vue {
		@Prop() value!: boolean
		@Prop() title!: string
		@Prop() width!: number
		@Prop() full!: boolean
		@Prop() persistent!: Boolean
		content_created: boolean = false
		created() {
			this.$watch('value', (new_value, old_value) => {
				if (new_value === true) {
					this.content_created = true
				}
			})
		}
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