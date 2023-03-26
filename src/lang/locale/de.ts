import changelog from '@/lang/de/changelog.json'
import characteristic from '@/lang/de/characteristic.json'
import chip from '@/lang/de/chip.json'
import country from "@/lang/de/country.json"
import effect from '@/lang/de/effect.json'
import entity from "@/lang/de/entity.json"
import flag from '@/lang/de/flag.json'
import fight_pack from '@/lang/de/fight-pack.json'
import forum_category from '@/lang/de/forum-category.json'
import hat from "@/lang/de/hat.json"
import leekscript from "@/lang/de/leekscript.json"
import ls_error from "@/lang/de/ls_error.json"
import mail from "@/lang/de/mail.json"
import main from "@/lang/de/main.json"
import notification from "@/lang/de/notification.json"
import pomp from '@/lang/de/pomp.json'
import potion from '@/lang/de/potion.json'
import resource from '@/lang/de/resource.json'
import shortcut from '@/lang/de/shortcut.json'
import trophy from "@/lang/de/trophy.json"
import warning from '@/lang/de/warning.json'
import weapon from '@/lang/de/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, ls_error, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("fr", translations, null)

export { translations }