import changelog from '@/lang/es/changelog.json'
import characteristic from '@/lang/es/characteristic.json'
import chip from '@/lang/es/chip.json'
import component from '@/lang/es/component.json'
import country from "@/lang/es/country.json"
import effect from '@/lang/es/effect.json'
import entity from "@/lang/es/entity.json"
import flag from '@/lang/es/flag.json'
import fight_pack from '@/lang/es/fight-pack.json'
import forum_category from '@/lang/es/forum-category.json'
import hat from "@/lang/es/hat.json"
import leekscript from "@/lang/es/leekscript.json"
import mail from "@/lang/es/mail.json"
import main from "@/lang/es/main.json"
import notification from "@/lang/es/notification.json"
import pomp from '@/lang/es/pomp.json'
import potion from '@/lang/es/potion.json'
import resource from '@/lang/es/resource.json'
import shortcut from '@/lang/es/shortcut.json'
import trophy from "@/lang/es/trophy.json"
import warning from '@/lang/es/warning.json'
import weapon from '@/lang/es/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("es", translations)

export { translations }