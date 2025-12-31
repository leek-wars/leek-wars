<template lang="html">
	<div v-if="message.censored" class="censored">{{ $t('main.censored_by', [message.censored_by.name]) }}</div>
	<div v-else v-chat-code-latex class="text" :class="{'leek-wars': message.farmer.id === 0, 'large-emojis': message.only_emojis}" v-html="message.content"></div>
</template>

<script lang="ts">
	import { store } from '@/model/store'
	import { vueMain, vuetify } from '@/model/vue'
	import { i18n } from '@/model/i18n'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import Pseudo from '../app/pseudo.vue'
	import 'katex/dist/katex.min.css'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import { ChatMessage } from '@/model/chat'
	import { createApp, App } from 'vue'

	@Options({ name: 'ChatMessageText', components: { RichTooltipFarmer } })
	export default class ChatMessageText extends Vue {

		@Prop({ required: true }) message!: ChatMessage

		pseudos: App[] = []

		mounted() {
			this.$el.querySelectorAll('.pseudo').forEach((c) => {
				const name = (c as HTMLElement).innerText
				const farmer = store.state.farmer_by_name[name]
				if (farmer) {
					const app = createApp(Pseudo, { farmer })
					app.use(vuetify)
					app.use(i18n)
					app.use(store)
					app.mount(c)
					this.pseudos.push(app)
				}
			})
		}

		beforeDestroy() {
			for (const pseudo of this.pseudos) {
				pseudo.unmount()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.text ::v-deep a {
		color: #5fad1b;
		&.lw {
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 0 4px;
			&:hover {
				border: 1px solid #5fad1b;
			}
		}
	}
	.text ::v-deep .v-icon {
		color: #5fad1b;
		font-size: 18px;
		margin-right: 4px;
		vertical-align: baseline;
	}
	.censored {
		font-size: 15px;
		color: #777;
		font-style: italic;
	}
</style>