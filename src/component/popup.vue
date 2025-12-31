<template lang="html">
	<v-dialog :model-value="modelValue" :max-width="width" :persistent="persistent" @update:model-value="$emit('update:modelValue', $event)">
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
			<div v-if="hasActionsSlot" class="actions">
				<slot name="actions"></slot>
			</div>
		</template>
	</v-dialog>
</template>

<script lang="ts">
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	@Options({ name: "popup" })
	export default class Popup extends Vue {
		@Prop() modelValue!: boolean
		@Prop() title!: string
		@Prop() width!: number
		@Prop() full!: boolean
		@Prop() persistent!: Boolean
		content_created: boolean = false
		created() {
			if (this.modelValue) {
				this.content_created = true // Content created direclty from creation
			}
			this.$watch('modelValue', (new_value, old_value) => {
				if (new_value === true) {
					this.content_created = true
				}
			})
		}
		get hasActionsSlot() {
			return !!this.$slots.actions
		}
		hasIcon() {
			return !!this.$slots.icon
		}
		close() {
			this.$emit('update:modelValue', false)
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
	.actions ::v-deep > * {
		user-select: none;
	}
</style>