<template lang="html">
	<div class="explorer-wrapper">
		<div class="title">
			<v-icon>mdi-file-outline</v-icon>
			{{ $t('my_ais') }}
			<span v-if="currentFolder !== fileSystem.rootFolder" class="path"> ► {{ fileSystem.getFolderPath(currentFolder).slice(0, -1).replace(/\//g, ' ► ') }}</span>
		</div>
		<div class="dir">
			<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
			<explorer-folder v-if="currentFolder !== fileSystem.rootFolder" v-ripple :folder="({id: -1} as any)" @click="currentFolder = fileSystem.folderById[currentFolder.parent]" />
			<template v-for="(item, i) in currentFolder.items" :key="i">
				<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
				<explorer-folder v-if="item.folder" v-ripple :folder="(item as any)" @click="currentFolder = (item as any)" />
				<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
				<ai v-else v-ripple :ai="(item as any).ai" :small="false" :library="false" @click="$emit('select', (item as any).ai)" />
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fileSystem } from '@/model/filesystem'
import { mixins } from '@/model/i18n'
import ExplorerFolder from './explorer-folder.vue'
import AIElement from '@/component/app/ai.vue'

defineOptions({ name: 'Explorer', i18n: {}, mixins: [...mixins], components: { 'explorer-folder': ExplorerFolder, ai: AIElement } })

defineEmits<{
	select: [ai: unknown]
}>()

const currentFolder = ref<import("../editor/editor-item").Folder>(fileSystem.rootFolder)
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
		color: var(--text-color-secondary);
		margin-bottom: 15px;
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
		// La zone de defilement prend toute la hauteur laissee par le titre,
		// sinon elle s'arrete a la hauteur du contenu et l'explorateur ne
		// profite pas de la place qu'on lui donne.
		flex: 1;
		min-height: 0;
		align-content: start;
		// `auto` et non `scroll` : la zone fait maintenant toute la hauteur du
		// panneau, une gouttiere vide en permanence s'y verrait.
		overflow-y: auto;
		overflow-x: hidden;
	}
	.ai {
		cursor: pointer;
	}
</style>
