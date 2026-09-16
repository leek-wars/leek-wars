<template lang="html">
    <v-list class="version-menu">
        <v-list-item v-for="v in versions" :key="v.pragma" v-ripple :lines="false" @click="version = v.pragma">
            <template #prepend>
                <v-icon v-if="version === v.pragma" class="list-icon">mdi-star</v-icon>
                <v-icon v-else class="list-icon">mdi-star-outline</v-icon>
            </template>
            <v-list-item-title>{{ v.label }}</v-list-item-title>
            <v-list-item-subtitle>
                <code>{{ v.comment }} @version:{{ v.pragma }}</code>
            </v-list-item-subtitle>
        </v-list-item>
    </v-list>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { getLanguageVersions } from '../editor/file-types'

const props = defineProps<{ language: string }>()
const version = defineModel<string>("version", { required: true })
const versions = computed(() => getLanguageVersions(props.language))
</script>

<style lang="scss" scoped>
.version-menu {
	.list-icon {
		margin-right: 12px;
	}
	.v-list-item__subtitle {
		white-space: initial;
		font-weight: 400;
		code {
			font-size: 13px;
		}
	}
}
</style>
