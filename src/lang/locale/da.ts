import changelog from '@/lang/da/changelog.json'
import characteristic from '@/lang/da/characteristic.json'
import chip from '@/lang/da/chip.json'
import country from "@/lang/da/country.json"
import effect from '@/lang/da/effect.json'
import entity from "@/lang/da/entity.json"
import flag from '@/lang/da/flag.json'
import fight_pack from '@/lang/da/fight-pack.json'
import forum_category from '@/lang/da/forum-category.json'
import hat from "@/lang/da/hat.json"
import leekscript from "@/lang/da/leekscript.json"
import ls_error from "@/lang/da/ls_error.json"
import mail from "@/lang/da/mail.json"
import main from "@/lang/da/main.json"
import notification from "@/lang/da/notification.json"
import pomp from '@/lang/da/pomp.json'
import potion from '@/lang/da/potion.json'
import resource from '@/lang/da/resource.json'
import shortcut from '@/lang/da/shortcut.json'
import trophy from "@/lang/da/trophy.json"
import warning from '@/lang/da/warning.json'
import weapon from '@/lang/da/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, ls_error, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("fr", translations, null)

export { translations }