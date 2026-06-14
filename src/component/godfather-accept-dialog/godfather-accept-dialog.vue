<template lang="html">
	<popup :model-value="modelValue" :width="500" icon="mdi-hat-fedora" :title="info ? t('title', [info.name]) : '...'" @update:model-value="$emit('update:modelValue', $event)">
		<div v-if="info" class="godfather-accept">
			<div class="who">
				<avatar :farmer="(info as any)" class="gf-avatar" />
				<div class="who-text">
					<router-link :to="'/farmer/' + info.id" class="name">{{ info.name }}</router-link>
					<div class="stats grey">{{ t('stats', [info.total_level, info.leek_count]) }}</div>
				</div>
			</div>
			<i18n-t keypath="rewards" tag="div" class="rewards">
				<template #habs><span class="hab"></span></template>
				<template #crystals><span class="crystal"></span></template>
			</i18n-t>
		</div>
		<template #actions>
			<div v-ripple class="action compact" @click="refuse">{{ t('refuse') }}</div>
			<div v-ripple class="action green" :class="{ disabled: accepting }" @click="accept">{{ t('accept') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { store } from '@/model/store'
import Popup from '@/component/popup.vue'
import Avatar from '@/component/avatar.vue'

interface GodfatherInfo { id: number, name: string, avatar_changed: number, total_level: number, leek_count: number }

defineOptions({ name: 'GodfatherAcceptDialog', i18n: {}, mixins: [...mixins] })
const props = defineProps<{ modelValue: boolean, login: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
const t = useNamespacedT('godfather-accept-dialog')

const info = ref<GodfatherInfo | null>(null)
const accepting = ref(false)

watch(() => props.login, (login) => {
	info.value = null
	if (!login) return
	LeekWars.get('farmer/get-godfather-info/' + encodeURIComponent(login)).then((data: GodfatherInfo | null) => {
		// On ne se propose pas soi-même comme parrain.
		if (!data || data.id === store.state.farmer?.id) {
			emit('update:modelValue', false)
			return
		}
		info.value = data
	})
}, { immediate: true })

function accept() {
	if (accepting.value || !info.value) return
	accepting.value = true
	LeekWars.post('farmer/set-godfather', { godfather: props.login }).then(() => {
		if (store.state.farmer && info.value) {
			store.state.farmer.godfather = { id: info.value.id, name: info.value.name }
		}
		LeekWars.toast(t('accepted', [info.value!.name]))
		emit('update:modelValue', false)
	}).catch(() => {
		accepting.value = false
	})
}
function refuse() {
	emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.godfather-accept {
	display: flex;
	flex-direction: column;
	gap: 14px;
}
.who {
	display: flex;
	align-items: center;
	gap: 12px;
}
.gf-avatar {
	width: 52px;
	height: 52px;
}
.who-text .name {
	font-weight: 500;
	font-size: 17px;
}
.rewards {
	font-size: 16px;
	.hab, .crystal {
		vertical-align: middle;
		margin: 0 2px;
	}
}
.action.green {
	background: var(--success, #5cb85c);
	color: white;
}
</style>
