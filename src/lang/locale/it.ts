import changelog from '@/lang/it/changelog.json'
import characteristic from '@/lang/it/characteristic.json'
import chip from '@/lang/it/chip.json'
import component from '@/lang/it/component.json'
import country from "@/lang/it/country.json"
import effect from '@/lang/it/effect.json'
import entity from "@/lang/it/entity.json"
import flag from '@/lang/it/flag.json'
import fight_pack from '@/lang/it/fight-pack.json'
import forum_category from '@/lang/it/forum-category.json'
import hat from "@/lang/it/hat.json"
import leekscript from "@/lang/it/leekscript.json"
import mail from "@/lang/it/mail.json"
import main from "@/lang/it/main.json"
import notification from "@/lang/it/notification.json"
import pomp from '@/lang/it/pomp.json'
import potion from '@/lang/it/potion.json'
import resource from '@/lang/it/resource.json'
import shortcut from '@/lang/it/shortcut.json'
import trophy from "@/lang/it/trophy.json"
import warning from '@/lang/it/warning.json'
import weapon from '@/lang/it/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("it", translations, null)

export { translations }