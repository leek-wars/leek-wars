import { defineComponent, h } from 'vue'
import type { IconSet } from 'vuetify'
import { mdi as mdiSvgSet } from 'vuetify/iconsets/mdi-svg'
import { mdiIcons } from './mdi-icons'

const VSvgIcon = mdiSvgSet.component

const VMdiSvgIcon = defineComponent({
	name: 'VMdiSvgIcon',
	inheritAttrs: false,
	props: {
		icon: { type: [String, Function, Object, Array] },
		tag: { type: [String, Object, Function], required: true },
	},
	setup(props, { attrs }) {
		return () => {
			const raw = props.icon
			let resolved = raw
			if (typeof raw === 'string') {
				const path = mdiIcons[raw]
				if (path) resolved = path
				else if (import.meta.env.DEV && !raw.startsWith('M')) console.warn('[mdi] unknown icon:', raw)
			}
			return h(VSvgIcon as any, { ...attrs, tag: props.tag, icon: resolved })
		}
	},
})

export const mdiIconSet: IconSet = {
	component: VMdiSvgIcon as IconSet['component'],
}
