<template>
	<div class="page tutorial">

	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { locale } from '@/locale'
import { store } from '@/model/store'
import { toTutorialTrack, tutorialTrackForLanguage, tutorialTitleSuffix, tutorialLocale } from './tutorial-items'

defineOptions({ name: 'Tutorial' })

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// Piste choisie explicitement dans l'URL (/help/tutorial/python), sinon le langage d'IA
// choisi par le fermier (farmer.ai_language), sinon LeekScript par défaut.
const track = route.params.lang
	? toTutorialTrack(route.params.lang as string)
	: tutorialTrackForLanguage(store.state.farmer ? store.state.farmer.ai_language : null)

// Repli sur l'anglais si la piste n'est pas traduite dans la locale courante (évite une page inexistante).
const pageLocale = tutorialLocale(track, locale)
// Titre de base de la racine du tutoriel : mot localisé dans la locale UI (toujours chargée),
// sauf quand une piste JS/Py retombe sur l'anglais.
const base = track === 'leekscript' || pageLocale === locale
	? (t('main.tutorial') as string)
	: 'Tutorial'
const title = base + tutorialTitleSuffix(track)
router.replace('/encyclopedia/' + pageLocale + '/' + title.replace(/ /g, '_'))
</script>

<style lang="scss" scoped>

</style>
