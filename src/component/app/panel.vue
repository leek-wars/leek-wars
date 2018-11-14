<template>
	<div class="panel">
		<div class="header">
			<h2>{{ title }}</h2>
			<div class="right">
				<slot name="actions"></slot>
				<div v-if="toggle" class="button flat expand" @click="expanded = !expanded">
					<i v-if="expanded" class="material-icons">expand_more</i>
					<i v-else class="material-icons">expand_less</i>
				</div>
			</div>
		</div>
		<div class="content" v-show="expanded">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'panel' })
	export default class Panel extends Vue {
		@Prop({required: true}) title!: string
		@Prop() toggle!: string
		expanded: boolean = true

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