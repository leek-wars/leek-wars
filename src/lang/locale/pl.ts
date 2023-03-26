import changelog from '@/lang/pl/changelog.json'
import characteristic from '@/lang/pl/characteristic.json'
import chip from '@/lang/pl/chip.json'
import country from "@/lang/pl/country.json"
import effect from '@/lang/pl/effect.json'
import entity from "@/lang/pl/entity.json"
import flag from '@/lang/pl/flag.json'
import fight_pack from '@/lang/pl/fight-pack.json'
import forum_category from '@/lang/pl/forum-category.json'
import hat from "@/lang/pl/hat.json"
import leekscript from "@/lang/pl/leekscript.json"
import ls_error from "@/lang/pl/ls_error.json"
import mail from "@/lang/pl/mail.json"
import main from "@/lang/pl/main.json"
import notification from "@/lang/pl/notification.json"
import pomp from '@/lang/pl/pomp.json'
import potion from '@/lang/pl/potion.json'
import resource from '@/lang/pl/resource.json'
import shortcut from '@/lang/pl/shortcut.json'
import trophy from "@/lang/pl/trophy.json"
import warning from '@/lang/pl/warning.json'
import weapon from '@/lang/pl/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, ls_error, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("pl", translations, null)

export { translations }