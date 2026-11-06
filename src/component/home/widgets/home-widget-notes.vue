<template>
	<div class="notes-widget">
		<template v-if="editing">
			<textarea ref="editorEl" v-model="text" class="editor" :maxlength="MAX_LENGTH" :placeholder="t('notes_placeholder')"
				@input="scheduleSave" @blur="stopEditing" @keydown.esc.prevent="stopEditing"
				@keydown.ctrl.enter.prevent="stopEditing" @keydown.meta.enter.prevent="stopEditing"></textarea>
			<div class="hint">{{ t('notes_local') }}</div>
		</template>
		<div v-else class="view" @click="startEditing">
			<markdown v-if="text.trim()" :content="text" mode="forum" />
			<template v-else>
				<div class="placeholder">{{ t('notes_placeholder') }}</div>
				<div class="hint">{{ t('notes_local') }}</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	// Le rendu du forum (markdown assaini, émojis, mentions), chargé à la demande :
	// il embarque de quoi afficher l'encyclopédie, inutile tant que la note est vide.
	const Markdown = defineAsyncComponent(() => import('@/component/encyclopedia/markdown.vue'))
	defineOptions({ name: 'HomeWidgetNotes' })

	// `noteId` : la clé de la note, posée par l'accueil à l'ajout du widget (cf.
	// `initialParams` dans home.vue). Ce n'est pas l'id du widget : il est
	// réattribué au prochain ajout, et une nouvelle note reprendrait le texte
	// d'une note supprimée.
	const props = defineProps<{ noteId: string }>()

	const t = useNamespacedT('home')

	// Le texte vit dans le navigateur (localStorage), pas dans la disposition :
	// celle-ci est relue et réécrite à chaque déplacement de widget, et le
	// serveur n'en garantit pas la taille. La note ne suit donc pas l'éleveur
	// d'un appareil à l'autre, ce que le widget dit sous la zone de saisie.
	// Le plafond reste loin des quelques Mo d'un localStorage.
	const MAX_LENGTH = 20000
	const SAVE_DELAY = 400

	// Une note par éleveur : un changement de compte ne montre pas les notes
	// de l'autre.
	const storageKey = computed(() => 'home/notes/' + (store.state.farmer?.id ?? 0) + '/' + props.noteId)

	const text = ref('')
	const editing = ref(false)
	const editorEl = ref<HTMLTextAreaElement | null>(null)
	let saveTimer: ReturnType<typeof setTimeout> | null = null

	// Navigation privée ou stockage plein : la note reste éditable, elle ne
	// survivra simplement pas au rechargement.
	function read(key: string): string {
		try { return localStorage.getItem(key) ?? '' } catch { return '' }
	}
	function write(key: string, value: string) {
		try {
			if (value.trim()) localStorage.setItem(key, value)
			else localStorage.removeItem(key)
		} catch { /* stockage indisponible */ }
	}

	function flushSave() {
		if (!saveTimer) return
		clearTimeout(saveTimer)
		saveTimer = null
		write(storageKey.value, text.value)
	}
	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer)
		saveTimer = setTimeout(flushSave, SAVE_DELAY)
	}

	watch(storageKey, (key, previous) => {
		// La saisie en cours appartient à l'ancienne clé (compte quitté).
		if (previous && saveTimer) {
			clearTimeout(saveTimer)
			saveTimer = null
			write(previous, text.value)
		}
		editing.value = false
		text.value = read(key)
	}, { immediate: true })

	// Un clic sur la note l'ouvre en écriture, sauf sur un lien (on le suit) ou
	// à la fin d'une sélection de texte (on voulait copier).
	function startEditing(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('a, button')) return
		if (window.getSelection()?.toString()) return
		editing.value = true
		nextTick(() => {
			const editor = editorEl.value
			if (!editor) return
			editor.focus()
			editor.setSelectionRange(editor.value.length, editor.value.length)
		})
	}

	function stopEditing() {
		if (saveTimer) clearTimeout(saveTimer)
		saveTimer = null
		write(storageKey.value, text.value)
		editing.value = false
	}

	// La même note ouverte dans un autre onglet : on reprend son texte, sauf
	// pendant une saisie ici, qui l'emporte à l'enregistrement.
	function onStorage(event: StorageEvent) {
		if (event.key !== storageKey.value || editing.value) return
		text.value = event.newValue ?? ''
	}

	onMounted(() => window.addEventListener('storage', onStorage))
	onBeforeUnmount(() => {
		window.removeEventListener('storage', onStorage)
		flushSave()
	})
</script>

<style lang="scss" scoped>
	.notes-widget {
		display: flex;
		flex-direction: column;
		gap: 4px;
		height: 100%;
	}
	// Le panneau ne défile pas (noScroll) : c'est la note qui défile, comme la
	// zone de messages du chat.
	.view {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		cursor: text;
	}
	.editor {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		resize: none;
		padding: 6px 8px;
		font: inherit;
		font-size: 14px;
		color: var(--text-color);
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: var(--radius-small);
		outline: none;
	}
	.editor:focus {
		border-color: var(--primary);
	}
	.placeholder {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px 0 4px;
	}
	.hint {
		flex: none;
		font-size: 11px;
		color: var(--text-color-secondary);
	}
</style>
