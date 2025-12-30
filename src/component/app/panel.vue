<template>
	<div class="panel">
		<div v-if="hasTitle" class="header">
			<h2>
				<v-icon v-if="icon">{{ icon }}</v-icon>
				<slot name="title">{{ title }}</slot>
			</h2>
			<div class="actions">
				<slot name="actions"></slot>
				<div v-if="toggle" class="button text expand" @click="expanded = !expanded">
					<v-icon v-if="expanded">mdi-chevron-up</v-icon>
					<v-icon v-else>mdi-chevron-down</v-icon>
				</div>
			</div>
		</div>
		<template v-if="expanded">
			<slot v-if="$slots.content" name="content"></slot>
			<div v-else class="content">
				<slot></slot>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'panel' })
	export default class Panel extends Vue {
		@Prop() icon!: string
		@Prop() title!: string
		@Prop() toggle!: string
		expanded: boolean = true

		get hasTitle() {
			return this.title || !!this.$slots.title
		}
		created() {
			if (this.toggle) {
				if (localStorage.getItem(this.toggle) === null) { localStorage.setItem(this.toggle, 'true') }
				this.expanded = localStorage.getItem(this.toggle) === 'true'
			}
		}
		@Watch('expanded')
		update() {
			if (this.toggle) {
				localStorage.setItem(this.toggle, '' + this.expanded)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		background: var(--background);
		border-radius: 4px;
		box-shadow: 0px 10px 11px -11px rgba(0,0,0,0.75);
		display: flex;
		flex-direction: column;
		width: 100%;
		margin-bottom: 12px;
		&.last, &:last-child {
			margin-bottom: 0;
		}
	}
	#app.app .panel {
		border-radius: 0;
	}
	.panel.first {
		border-top-left-radius: 0px;
	}
	.panel.auto {
		padding: 20px;
	}
	.panel > .header {
		height: 36px;
		background: #2a2a2a;
		position: relative;
		text-align: left;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
		display: flex;
		i {
			margin-right: 7px;
		}
	}
	#app.app .panel > .header {
		border-radius: 0;
	}
	.panel.first > .header {
		border-top-left-radius: 0px;
	}
	.panel > .header h2 {
		color: #eee;
		font-size: 18px;
		display: inline-flex;
		align-items: center;
		height: 36px;
		line-height: 36px;
		padding: 0 12px;
		position: relative;
		white-space: nowrap;
		border-top-left-radius: 3px;
		text-overflow: ellipsis;
		overflow: hidden;
		flex: 1;
	}
	.panel > .header h2 a, .panel > .header h2 a:visited {
		color: white;
		font-weight: bold;
		vertical-align: top;
	}
	.panel > .header h2 img {
		height: 25px;
		margin-right: 8px;
	}
	.panel.first > .header h2 {
		border-top-left-radius: 0px;
	}
	.header > .actions {
		height: 36px;
		display: flex;
		justify-content: flex-end;
	}
	.header > .actions ::v-deep .button {
		height: 36px;
		color: white;
		padding: 0 10px;
		cursor: pointer;
		display: inline-flex;
		user-select: none;
		align-items: center;
		gap: 6px;
		img {
			height: 36px;
			width: 28px;
			padding: 7px 3px;
			opacity: 0.9;
			vertical-align: top;
		}
		i {
			padding: 6px 0;
			opacity: 0.9;
			font-size: 24px;
		}
		.v-icon {
			color: white;
		}
	}
	.header > .actions ::v-deep > div:last-child.button,
	.header > .actions ::v-deep > a:last-child .button,
	.header > .actions ::v-deep > div:last-child .button {
		border-top-right-radius: 3px;
	}
	.header > .actions ::v-deep .button :last-child {
		margin-right: 0;
	}
	.header > .actions ::v-deep .button:hover {
		background: #888;
	}
	.header > .actions ::v-deep .button.green:hover {
		background: rgba(110, 201, 31, 0.8) 0%;
	}
	.header > .actions ::v-deep .button.red:hover {
		background: rgba(201, 31, 31, 0.8) 0%;
	}
	.panel:deep( > .content) {
		padding: 15px;
	}
	.panel.collapsed .content {
		display: none;
	}
</style>