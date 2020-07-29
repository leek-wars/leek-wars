<template>
	<span v-if="type.name == 'function'" class="type">(<template v-for="(arg, a) of type.args">
		<span v-if="a > 0" :key="a">, </span><lw-type :key="a + '_'" :type="arg" />
	</template>)
		→ <lw-type :type="type.return" />
	</span>
	<span v-else-if="(type instanceof Array)" class="type">
		<template v-for="(t, i) in type">
			<lw-type :key="i" :type="t" />
			<span v-if="i < type.length - 1" :key="i + '_'"> | </span>
		</template>
	</span>
	<span v-else-if="(type instanceof Object)" class="type">{{ type.name }}<span v-if="type.element">&lt;<span v-if="type.key"><lw-type :type="type.key" />, </span><lw-type :type="type.element" />&gt;</span></span>
	<span v-else class="type">{{ type }}</span>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: 'lw-type' })
	export default class Type extends Vue {
		@Prop({required: true}) type!: any
	}
</script>

<style lang="scss" scoped>
	.type {
		color: #0000D0;
		font-weight: bold;
	}
</style>