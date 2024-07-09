import changelog from '@/lang/zh/changelog.json'
import characteristic from '@/lang/zh/characteristic.json'
import chip from '@/lang/zh/chip.json'
import component from '@/lang/hi/component.json'
import country from "@/lang/zh/country.json"
import effect from '@/lang/zh/effect.json'
import entity from "@/lang/zh/entity.json"
import flag from '@/lang/zh/flag.json'
import fight_pack from '@/lang/zh/fight-pack.json'
import forum_category from '@/lang/zh/forum-category.json'
import hat from "@/lang/zh/hat.json"
import leekscript from "@/lang/zh/leekscript.json"
import mail from "@/lang/zh/mail.json"
import main from "@/lang/zh/main.json"
import notification from "@/lang/zh/notification.json"
import pomp from '@/lang/zh/pomp.json'
import potion from '@/lang/zh/potion.json'
import resource from '@/lang/zh/resource.json'
import shortcut from '@/lang/zh/shortcut.json'
import trophy from "@/lang/zh/trophy.json"
import warning from '@/lang/zh/warning.json'
import weapon from '@/lang/zh/weapon.json'

const translations = { main, changelog, characteristic, chip, component, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("zh", translations, null)

export { translations }