<template lang="html">
	<div class="item-preview">
		<div class="header">
			<h2 class="name">{{ pack.title }}</h2>
		</div>
		<br>
		<div class="image">
			<img src="/image/market/fights.png">
		</div>
		<br>
		<div class="desc">{{ pack.description }}</div>
		<div class="stats"></div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class FightPackPreview extends Vue {
		@Prop() pack!: any
	}
</script>