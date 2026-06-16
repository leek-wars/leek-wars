<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ t('title') }}</h1>
		</div>
		<panel class="first">
			<div class="contact">
				<p class="intro">{{ t('intro') }}</p>

				<div class="channels">
					<router-link class="channel" to="/forum">
						<v-icon>mdi-forum-outline</v-icon>
						<span class="label">{{ $t('main.forum') }}</span>
					</router-link>

					<a class="channel" href="https://github.com/leek-wars/leek-wars/issues" target="_blank" rel="noopener">
						<v-icon>mdi-github</v-icon>
						<span class="label">GitHub<v-icon class="ext">mdi-open-in-new</v-icon></span>
					</a>

					<a class="channel mail" href="mailto:contact@leekwars.com">
						<v-icon>mdi-email-outline</v-icon>
						<span class="label">contact@leekwars.com</span>
					</a>
				</div>

				<div class="social">
					<a target="_blank" rel="noopener" href="https://twitter.com/LeekWars"><v-icon>mdi-twitter</v-icon></a>
					<a target="_blank" rel="noopener" href="https://www.facebook.com/LeekWars"><v-icon>mdi-facebook</v-icon></a>
					<a target="_blank" rel="noopener" href="https://www.instagram.com/leekwars/"><v-icon>mdi-instagram</v-icon></a>
					<a target="_blank" rel="noopener" href="https://www.linkedin.com/company/leek-wars"><v-icon>mdi-linkedin</v-icon></a>
				</div>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'Contact', i18n: {}, mixins: [...mixins] })

useI18n()
const t = useNamespacedT('contact')
onBeforeMount(() => LeekWars.setTitle(t('title')))
</script>

<style lang="scss" scoped>
.contact {
	max-width: 720px;
	margin: 0 auto;
	padding: 30px 20px 10px;
	text-align: center;
}
.intro {
	font-size: 18px;
	color: var(--text-color);
	margin-bottom: 30px;
}
.channels {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	justify-content: center;
}
.channel {
	flex: 1 1 180px;
	max-width: 240px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 26px 18px;
	background: var(--background-secondary);
	border: 1px solid var(--border);
	border-radius: 8px;
	color: var(--text-color);
	text-decoration: none;
	font-weight: 500;
	transition: border-color 0.15s, transform 0.15s;
	.v-icon {
		font-size: 40px;
		color: var(--primary);
	}
	.label {
		font-size: 16px;
		word-break: break-word;
	}
	.ext {
		font-size: 16px;
		margin-left: 4px;
		vertical-align: middle;
		color: var(--text-color-secondary);
	}
	&:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
	}
}
.social {
	margin-top: 36px;
	display: flex;
	justify-content: center;
	gap: 18px;
	a {
		color: var(--text-color-secondary);
		transition: color 0.15s;
		.v-icon {
			font-size: 28px;
		}
		&:hover {
			color: var(--primary);
		}
	}
}
</style>
