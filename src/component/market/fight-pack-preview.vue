<template lang="html">
	<div class="stats"></div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'
	@Options({})
	export default class FightPackPreview extends Vue {
		@Prop() pack!: any
	}
</script>