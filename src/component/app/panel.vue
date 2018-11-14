<template>
	<div class="panel">
		<div v-if="hasTitle" class="header">
			<slot name="title">
				<h2>{{ title }}</h2>
			</slot>
			<div class="actions">
				<slot name="actions"></slot>
				<div v-if="toggle" class="button flat expand" @click="expanded = !expanded">
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
	}
	#app.app .panel > .header {
		border-radius: 0;
	}
	.panel.first > .header {
		border-top-left-radius: 0px;
	}
	.panel > .header h2 {
		color: #eee;
		font-size: 19px;
		display: inline-block;
		height: 36px;
		line-height: 36px;
		background: rgba(150, 150, 150, 0.5);
		padding: 0 12px;
		position: relative;
		white-space: nowrap;
		border-top-left-radius: 3px;
	}
	.panel > .header h2 a, .panel > .header h2 a:visited {
		color: white;
		font-weight: bold;
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
	.panel > .header h2:before {
		content: "";
		position: absolute;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 36px 0 0 20px;
		border-color: transparent transparent transparent rgba(150, 150, 150, 0.5);
	}
	.panel > .header img {
		max-height: 24px;
		max-width: 24px;
		vertical-align: top;
		opacity: 0.9;
	}
	.header > .actions {
		position: absolute;
		top: 0;
		height: 36px;
		right: 0;
		display: flex;
		justify-content: flex-end;
	}
	.header > .actions .button {
		height: 36px;
		line-height: 36px;
		padding-top: 0px;
		padding-bottom: 0px;
		color: white;
		background: rgba(0, 0, 0, 0.4);
	}
	.header > .actions > div:last-child.button,
	.header > .actions > a:last-child .button,
	.header > .actions > div:last-child .button {
		border-top-right-radius: 3px;
	}
	.header > .actions .button /deep/ img {
		height: 22px;
		width: 22px;
		padding: 7px 3px;
		opacity: 0.9;
		vertical-align: top;
	}
	.header > .actions .button i {
		padding: 4px 0;
		opacity: 0.9;
		font-size: 28px;
	}
	.header > .actions .button:hover {
		background-image: linear-gradient(to bottom, rgba(110, 201, 31, 0.7) 0%, rgba(110, 201, 31, 0.9) 50%, rgba(110, 201, 31, 0.7) 100%);
	}
	.panel > .content {
		padding: 15px;
	}
	.panel.collapsed .content {
		display: none;
	}
</style>