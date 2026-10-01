<template>
	<div class="tabs">
		<slot name="before"></slot>
		<div v-if="active === 'reports'" class="tab action active">
			<v-icon>mdi-flag</v-icon>
			<span>Signalements</span>
		</div>
		<router-link v-else to="/moderation">
			<div class="tab action">
				<v-icon>mdi-flag</v-icon>
				<span>Signalements</span>
			</div>
		</router-link>
		<div v-if="active === 'thugs'" class="tab action active">
			<v-icon>mdi-emoticon-devil-outline</v-icon>
			<span>Voyous</span>
		</div>
		<router-link v-else to="/moderation/thugs">
			<div class="tab action">
				<v-icon>mdi-emoticon-devil-outline</v-icon>
				<span>Voyous</span>
			</div>
		</router-link>
		<div v-if="active === 'muted'" class="tab action active">
			<v-icon>mdi-volume-off</v-icon>
			<span>Mutés</span>
		</div>
		<router-link v-else to="/moderation/muted">
			<div class="tab action">
				<v-icon>mdi-volume-off</v-icon>
				<span>Mutés</span>
			</div>
		</router-link>
		<template v-if="images_page">
			<div v-if="active === 'images'" class="tab action active">
				<v-icon>mdi-image-search-outline</v-icon>
				<span>Images</span>
			</div>
			<router-link v-else to="/moderation/images">
				<div class="tab action">
					<v-icon>mdi-image-search-outline</v-icon>
					<span>Images</span>
				</div>
			</router-link>
		</template>
		<div v-if="active === 'history'" class="tab action active">
			<v-icon>mdi-history</v-icon>
			<span>Historique</span>
		</div>
		<router-link v-else to="/moderation/history">
			<div class="tab action">
				<v-icon>mdi-history</v-icon>
				<span>Historique</span>
			</div>
		</router-link>
	</div>
</template>

<script setup lang="ts">
	import router from '@/router'

	defineOptions({ name: 'ModerationTabs' })

	// L'onglet Images n'apparaît que si sa route existe : sans ce garde, la barre
	// pourrait proposer un onglet qui ne mène nulle part. Lu
	// dans la table des routes plutôt que par `resolve`, qui journalise un
	// avertissement quand le chemin ne correspond à rien.
	const images_page = router.getRoutes().some(route => route.path === '/moderation/images')

	// Onglets de navigation partagés par les pages de modération, sur le modèle de
	// page-tabs (banque / marché / inventaire) : la page courante est un onglet
	// actif non cliquable, les autres sont des liens. Les libellés restent en
	// français en dur comme le reste de la section, réservée aux modérateurs.
	// Le slot #before sert aux filtres propres à une page (les images à vérifier
	// et bannies), posés AVANT la navigation pour ne pas la couper.
	defineProps<{ active: 'reports' | 'thugs' | 'muted' | 'images' | 'history' }>()
</script>
