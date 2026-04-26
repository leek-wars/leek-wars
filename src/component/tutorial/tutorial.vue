<template>
	<div class="page tutorial">

	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { locale } from '@/locale'

defineOptions({ name: 'tutorial' })

const { t } = useI18n()
const router = useRouter()

router.replace('/encyclopedia/' + locale + '/' + (t('main.tutorial') as string).replace(/ /g, '_'))
</script>

<style lang="scss" scoped>

</style>
