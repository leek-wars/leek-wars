<template lang="html">
	<v-dialog :value="value" :max-width="width" :persistent="persistent" @input="$emit('input', $event)">
		<template v-if="content_created">
			<div class="title">
				<slot name="icon"></slot>
				<div class="main">
					<slot name="title"></slot>
				</div>
				<div class="options">
					<div class="option" @click="close">
						<v-icon>mdi-close</v-icon>
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
			if (this.value) {
				this.content_created = true // Content created direclty from creation
			}
			this.$watch('value', (new_value, old_value) => {
				if (new_value === true) {
					this.content_created = true
				}
			})
		}
		hasIcon() {
			return !!this.$slots.icon
		}
		close() {
			this.$emit('input', false)
		}
	}
</script>

<style lang="scss" scoped>
	.title ::v-deep .v-icon {
		margin-right: 5px;
		margin-bottom: 2px;
		color: #eee;
	}
	.title ::v-deep img {
		width: 24px;
		height: 24px;
		margin-right: 5px;
		align-self: center;
		margin-bottom: 2px;
		opacity: 0.9;
	}
	.content.full {
		padding: 0;
	}
</style>