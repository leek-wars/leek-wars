<template lang="html">
	<div class="explorer-wrapper">
		<div class="title">
			<v-icon>mdi-file-outline</v-icon>
			{{ $t('my_ais') }}
			<span v-if="currentFolder !== fileSystem.rootFolder" class="path"> ► {{ fileSystem.getFolderPath(currentFolder).slice(0, -1).replace(/\//g, ' ► ') }}</span>
		</div>
		<div class="dir">
			<explorer-folder v-if="currentFolder !== fileSystem.rootFolder" v-ripple :folder="{id: -1}" @click.native="currentFolder = fileSystem.folderById[currentFolder.parent]" />
			<template v-for="(item, i) in currentFolder.items">
				<explorer-folder v-if="item.folder" :key="i" v-ripple :folder="item" @click.native="currentFolder = item" />
				<ai v-else :key="i" v-ripple :ai="item.ai" @click.native="$emit('select', item.ai)" />
			</template>
		</div>
	</div>
</template>

<script lang="ts">
	import { fileSystem } from '@/model/filesystem'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import ExplorerFolder from './explorer-folder.vue'

	@Component({ name: 'explorer', i18n: {}, components: { 'explorer-folder': ExplorerFolder } })
	export default class Explorer extends Vue {
		fileSystem = fileSystem
		currentFolder = fileSystem.rootFolder
	}
</script>

<style lang="scss" scoped>
	.explorer-wrapper {
		display: flex;
		flex-direction: column;
	}
	.title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
		color: #555;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		.v-icon {
			padding-right: 4px;
		}
		.path {
			padding-left: 7px;
		}
	}
	.dir {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
		justify-items: center;
		gap: 10px;
		overflow-y: scroll;
	}
	.ai {
		cursor: pointer;
	}
</style>
