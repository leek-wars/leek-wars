import changelog from '@/lang/ru/changelog.json'
import characteristic from '@/lang/ru/characteristic.json'
import chip from '@/lang/ru/chip.json'
import component from '@/lang/ru/component.json'
import country from "@/lang/ru/country.json"
import effect from '@/lang/ru/effect.json'
import entity from "@/lang/ru/entity.json"
import flag from '@/lang/ru/flag.json'
import fight_pack from '@/lang/ru/fight-pack.json'
import forum_category from '@/lang/ru/forum-category.json'
import hat from "@/lang/ru/hat.json"
import leekscript from "@/lang/ru/leekscript.json"
import mail from "@/lang/ru/mail.json"
import main from "@/lang/ru/main.json"
import notification from "@/lang/ru/notification.json"
import pomp from '@/lang/ru/pomp.json'
import potion from '@/lang/ru/potion.json'
import resource from '@/lang/ru/resource.json'
import shortcut from '@/lang/ru/shortcut.json'
import trophy from "@/lang/ru/trophy.json"
import warning from '@/lang/ru/warning.json'
import weapon from '@/lang/ru/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("ru", translations)

export { translations }