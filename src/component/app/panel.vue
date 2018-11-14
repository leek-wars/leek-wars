<template>
	<div class="panel">
		<div class="header">
			<slot name="title">
				<h2>{{ title }}</h2>
			</slot>
			<div class="right">
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