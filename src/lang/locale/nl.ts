import changelog from '@/lang/nl/changelog.json'
import characteristic from '@/lang/nl/characteristic.json'
import chip from '@/lang/nl/chip.json'
import country from "@/lang/nl/country.json"
import effect from '@/lang/nl/effect.json'
import entity from "@/lang/nl/entity.json"
import flag from '@/lang/nl/flag.json'
import fight_pack from '@/lang/nl/fight-pack.json'
import forum_category from '@/lang/nl/forum-category.json'
import hat from "@/lang/nl/hat.json"
import leekscript from "@/lang/nl/leekscript.json"
import ls_error from "@/lang/nl/ls_error.json"
import mail from "@/lang/nl/mail.json"
import main from "@/lang/nl/main.json"
import notification from "@/lang/nl/notification.json"
import pomp from '@/lang/nl/pomp.json'
import potion from '@/lang/nl/potion.json'
import resource from '@/lang/nl/resource.json'
import shortcut from '@/lang/nl/shortcut.json'
import trophy from "@/lang/nl/trophy.json"
import warning from '@/lang/nl/warning.json'
import weapon from '@/lang/nl/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, ls_error, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("nl", translations, null)

export { translations }