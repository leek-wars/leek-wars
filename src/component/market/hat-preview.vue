<template lang="html">
	<div class="item-preview">
		<div class="header">
			<h2 class="name">{{ $t('hat.' + hat.name) }}</h2>
			<div class="level">{{ $t('effect.level_n', [hat.level]) }}</div>
		</div>
		<br>
		<div class="image">
			<img :src="'/image/hat/' + hat.name + '.png'">
		</div>
		<br>
		<div v-if="$te('hat.' + hat.name + '_desc')" class="desc">
			{{ $t('hat.' + hat.name + '_desc') }}
		</div>
		<div class="stats"></div>
	</div>
</template>

<script lang="ts">
	import { HatTemplate } from '@/model/hat'
	import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({})
	export default class HatPreview extends Vue {
		@Prop() hat!: HatTemplate
	}
</script>