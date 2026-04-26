<template lang="html">

</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { locale } from '@/locale'

defineOptions({ name: 'general_help' })

const { t } = useI18n()
const router = useRouter()

router.replace('/encyclopedia/' + locale + '/' + (t('main.game_rules') as string).replace(/ /g, '_'))
</script>

<style lang="scss" scoped>

</style>