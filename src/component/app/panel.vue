<template>
	<div class="panel">
		<div v-if="hasTitle" class="header">
			<slot name="title">
				<h2>{{ title }}</h2>
			</slot>
			<div class="actions">
				<slot name="actions"></slot>
				<div v-if="toggle" class="button text expand" @click="expanded = !expanded">
					<i v-if="expanded" class="material-icons">expand_less</i>
					<i v-else class="material-icons">expand_more</i>
				</div>
			</div>
		</div>
		<slot v-if="expanded" name="content">
			<div v-if="expanded" class="content">
				<slot></slot>
			</div>
		</slot>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'panel' })
	export default class Panel extends Vue {
		@Prop() title!: string
		@Prop() toggle!: string
		expanded: boolean = true

		get hasTitle() {
			return this.title || 'title' in this.$slots
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
		background: #f2f2f2;
		border-radius: 4px;
		box-shadow: 0px 10px 11px -11px rgba(0,0,0,0.75);
		margin-right: 12px;
		margin-bottom: 12px;
		display: flex;
		flex-direction: column;
	}
	#app.app .panel {
		border-radius: 0;
		margin-right: 0;
	}
	.panel.last {
		margin-bottom: 0;
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
		display: inline-block;
		height: 36px;
		line-height: 36px;
		padding: 0 12px;
		position: relative;
		white-space: nowrap;
		border-top-left-radius: 3px;
	}
	.panel > .header h2 a, .panel > .header h2 a:visited {
		color: white;
		font-weight: bold;
		vertical-align: top;
	}
	.panel > .header h2 img {
		vertical-align: top;
		height: 25px;
		margin-top: 6px;
		margin-right: 8px;
	}
	.panel.first > .header h2 {
		border-top-left-radius: 0px;
	}
	.header > .actions {
		height: 36px;
		display: flex;
		justify-content: flex-end;
		flex: 1;
	}
	.header > .actions ::v-deep .button {
		height: 36px;
		line-height: 36px;
		color: white;
		padding: 0 10px;
		cursor: pointer;
		display: inline-flex;
		user-select: none;
		img {
			height: 36px;
			width: 28px;
			padding: 7px 3px;
			opacity: 0.9;
			vertical-align: top;
			margin-right: 6px;
		}
		i {
			padding: 6px 0;
			opacity: 0.9;
			font-size: 24px;
			margin-right: 6px;
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
		background: rgba(110, 201, 31, 0.8) 0%;
	}
	.panel > .content {
		padding: 15px;
	}
	.panel.collapsed .content {
		display: none;
	}
</style>