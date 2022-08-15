import changelog from '@/lang/pt/changelog.json'
import characteristic from '@/lang/pt/characteristic.json'
import chip from '@/lang/pt/chip.json'
import component from '@/lang/pt/component.json'
import country from "@/lang/pt/country.json"
import effect from '@/lang/pt/effect.json'
import entity from "@/lang/pt/entity.json"
import flag from '@/lang/pt/flag.json'
import fight_pack from '@/lang/pt/fight-pack.json'
import forum_category from '@/lang/pt/forum-category.json'
import hat from "@/lang/pt/hat.json"
import leekscript from "@/lang/pt/leekscript.json"
import mail from "@/lang/pt/mail.json"
import main from "@/lang/pt/main.json"
import notification from "@/lang/pt/notification.json"
import pomp from '@/lang/pt/pomp.json'
import potion from '@/lang/pt/potion.json'
import resource from '@/lang/pt/resource.json'
import shortcut from '@/lang/pt/shortcut.json'
import trophy from "@/lang/pt/trophy.json"
import warning from '@/lang/pt/warning.json'
import weapon from '@/lang/pt/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("pt", translations, null)

export { translations }