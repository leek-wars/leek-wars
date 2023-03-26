import changelog from '@/lang/fi/changelog.json'
import characteristic from '@/lang/fi/characteristic.json'
import chip from '@/lang/fi/chip.json'
import country from "@/lang/fi/country.json"
import effect from '@/lang/fi/effect.json'
import entity from "@/lang/fi/entity.json"
import flag from '@/lang/fi/flag.json'
import fight_pack from '@/lang/fi/fight-pack.json'
import forum_category from '@/lang/fi/forum-category.json'
import hat from "@/lang/fi/hat.json"
import leekscript from "@/lang/fi/leekscript.json"
import ls_error from "@/lang/fi/ls_error.json"
import mail from "@/lang/fi/mail.json"
import main from "@/lang/fi/main.json"
import notification from "@/lang/fi/notification.json"
import pomp from '@/lang/fi/pomp.json'
import potion from '@/lang/fi/potion.json'
import resource from '@/lang/fi/resource.json'
import shortcut from '@/lang/fi/shortcut.json'
import trophy from "@/lang/fi/trophy.json"
import warning from '@/lang/fi/warning.json'
import weapon from '@/lang/fi/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, ls_error, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("fr", translations, null)

export { translations }