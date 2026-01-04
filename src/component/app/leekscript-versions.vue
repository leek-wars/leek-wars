<template lang="html">
    <v-list class="version-menu">
        <v-list-item v-ripple @click="model.version = 4" :lines="false">
            <template #prepend>
                <v-icon v-if="model.version === 4" class="list-icon">mdi-star</v-icon>
                <v-icon v-else class="list-icon">mdi-star-outline</v-icon>
            </template>
            <v-list-item-title>LeekScript 4</v-list-item-title>
            <v-list-item-subtitle>
                <ul v-if="$i18n.locale === 'fr'">
                    <li>Séparation entre Array et Map et nouvelles fonctions.</li>
                    <li>Entiers sur 64 bits au lieu de 32, nouvelles fonctions sur les nombres.</li>
                    <li>Fonctions flèches, paramètres par défaut.</li>
                </ul>
                <router-link class="link" to="/encyclopedia/LeekScript_4"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 4']) }}</router-link>
            </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-ripple @click="model.version = 3" :lines="false">
            <template #prepend>
                <v-icon v-if="model.version === 3" class="list-icon">mdi-star</v-icon>
                <v-icon v-else class="list-icon">mdi-star-outline</v-icon>
            </template>
            <v-list-item-title>LeekScript 3</v-list-item-title>
            <v-list-item-subtitle>
                <ul v-if="$i18n.locale === 'fr'">
                    <li>Littéraux d'objets <code>{a: 12}</code></li>
                    <li>Classes de base : Number, Integer, Boolean, Object, Array, Function etc.</li>
                    <li>Nouveaux mots-clés réservés.</li>
                </ul>
                <router-link class="link" to="/encyclopedia/LeekScript_3"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 3']) }}</router-link>
            </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-ripple @click="model.version = 2" :lines="false">
            <template #prepend>
                <v-icon v-if="model.version === 2" class="list-icon">mdi-star</v-icon>
                <v-icon v-else class="list-icon">mdi-star-outline</v-icon>
            </template>
            <v-list-item-title>LeekScript 2</v-list-item-title>
            <v-list-item-subtitle>
                <ul v-if="$i18n.locale === 'fr'">
                    <li>Ajout des classes et objets.</li>
                    <li>Passage par référence par défaut pour les valeurs non-primitives dans les fonctions, les boucles foreach et les tableaux.</li>
                    <li>Corrections mineures (arrayFilter, opérateur ^=, et autres).</li>
                </ul>
                <router-link class="link" to="/encyclopedia/LeekScript_2"><v-icon>mdi-book-open-page-variant</v-icon> {{ $t('leekscript.all_info_ls', ['LeekScript 2']) }}</router-link>
            </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-ripple @click="model.version = 1" :lines="false">
            <template #prepend>
                <v-icon v-if="model.version === 1" class="list-icon">mdi-star</v-icon>
                <v-icon v-else class="list-icon">mdi-star-outline</v-icon>
            </template>
            <v-list-item-title>LeekScript 1</v-list-item-title>
            <v-list-item-subtitle>
                <ul>
                    <li>{{ $t('leekscript.intial_version') }}</li>
                </ul>
            </v-list-item-subtitle>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item v-ripple @click="model.strict = !model.strict" :lines="false">
            <template #prepend>
                <v-checkbox v-model="model.strict" :hide-details="true" @click.stop />
            </template>
            <v-list-item-title>{{ $t('leekscript.strict_mode') }}</v-list-item-title>
            <v-list-item-subtitle>
                <ul v-if="$i18n.locale === 'fr'">
                    <li>Les variables initialisées avec une valeur gardent un type fixe.</li>
                    <li>Les accès en dehors d'un tableau causent une erreur au lieu de renvoyer null.</li>
                    <li>Davantage d'avertissements sur les types sont renvoyés.</li>
                </ul>
            </v-list-item-subtitle>
        </v-list-item>
    </v-list>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';


const model = defineModel<{ version: number, strict: boolean }>({ required: true })

onMounted(() => {
    console.log(model)
})

</script>

<style lang="scss" scoped>

.version-menu {
	.list-icon {
		margin-right: 12px;
	}
	.v-list-item__subtitle {
		white-space: initial;
		font-weight: 400;
		> ul {
			padding-left: 20px;
		}
		ul {
			margin: 4px 0;
		}
	}
	.green {
		background: #5fad1b;
		color: white;
		padding: 0 6px;
		border-radius: 20px;
		margin-left: 4px;
	}
	.link {
		padding: 5px;
		color: #5fad1b;
		font-weight: 500;
		display: block;
		i {
			font-size: 14px;
			vertical-align: top;
		}
		&:hover {
			text-decoration: underline;
		}
	}
}

</style>