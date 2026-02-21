<template>
	<span :class="'team' + leek.team">{{ leek.translatedName }}</span>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class ActionLeekElement extends Vue {
		@Prop({required: true}) leek!: FightLeek
	}
</script>