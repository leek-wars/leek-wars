<template lang="html">
	<v-dialog :model-value="modelValue" :width="width" :persistent="persistent" content-class="popup" scroll-strategy="none" @update:model-value="$emit('update:modelValue', $event)">
		<template v-if="content_created">
			<div class="title">
				<slot name="icon">
					<v-icon v-if="icon">{{ icon }}</v-icon>
				</slot>
				<div class="main">
					<slot name="title">{{ title }}</slot>
				</div>
				<div class="options">
					<slot name="options">
						<div class="option" @click="close">
							<v-icon>mdi-close</v-icon>
						</div>
					</slot>
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
		@Prop() icon!: string
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

<style lang="scss">

.v-dialog > .v-overlay__content.popup {
	margin: 0;
	max-width: 100% !important;
}

</style>

<style lang="scss" scoped>

.popup {
	display: none;
	width: 700px;
	box-shadow: 0px 0px 50px #111;
	transition: height ease 0.3s;
	margin-bottom: 50px;
	text-align: left;
}
.popup.draggable {
	position: fixed;
	z-index: 600;
	top: 0;
	left: 0;
}
.title {
	background: #2a2a2a;
	color: #eee;
	padding: 0 10px;
	padding-top: 6px;
	padding-bottom: 4px;
	height: 40px;
	font-size: 20px;
	line-height: 28px;
	text-align: left;
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
	display: flex;
	.main {
		flex: 1;
	}
	.options {
		display: flex;
		float: right;
		cursor: pointer;
		margin-top: -6px;
		margin-bottom: -4px;
		margin-right: -10px;
		&:deep(.option) {
			background: black;
			height: 40px;
			width: 40px;
			padding: 7px;
			i {
				font-size: 26px;
				vertical-align: baseline;
			}
			&:hover {
				background: #888;
			}
			img {
				width: 26px;
				height: 26px;
			}
		}
	}
}
.draggable .title {
	cursor: move;
}
.content {
	background: rgba(240,240,240, 0.95);
	padding: 15px;
	max-height: calc(100vh - 104px);
	overflow-y: auto;
	overflow-x: hidden;
}
body.dark .content {
	background: rgba(15,15,15, 0.95);
}
.v-dialog.no-actions .content {
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
}
.actions {
	height: 40px;
	display: flex;
	&:deep(div) {
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		background: #555;
		color: #eee;
		width: 100%;
		height: 40px;
		text-align: center;
		line-height: 40px;
		font-size: 20px;
		i {
			margin-right: 4px;
		}
		&:not(:last-child) {
			border-right: 1px solid #777;
		}
		&:hover {
			background: #777;
		}
		&.red {
			background: #c00;
		}
		&.red:hover {
			background: #e00;
		}
		&.green {
			background: #5fad1b;
		}
		&.green:hover {
			background: #73d120;
		}
	}
}

.title:deep(.v-icon) {
	margin-right: 5px;
	margin-bottom: 2px;
	color: #eee;
}
.title:deep(img) {
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
.actions:deep(> *) {
	user-select: none;
}

</style>