import changelog from '@/lang/fr/changelog.json'
import characteristic from '@/lang/fr/characteristic.json'
import chip from '@/lang/fr/chip.json'
import country from "@/lang/fr/country.json"
import effect from '@/lang/fr/effect.json'
import entity from "@/lang/fr/entity.json"
import flag from '@/lang/fr/flag.json'
import forum_category from '@/lang/fr/forum-category.json'
import hat from "@/lang/fr/hat.json"
import leekscript from "@/lang/fr/leekscript.json"
import mail from "@/lang/fr/mail.json"
import main from "@/lang/fr/main.json"
import notification from "@/lang/fr/notification.json"
import pomp from '@/lang/fr/pomp.json'
import potion from '@/lang/fr/potion.json'
import trophy from "@/lang/fr/trophy.json"
import warning from '@/lang/fr/warning.json'
import weapon from '@/lang/fr/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("fr", translations, null)

export { translations }