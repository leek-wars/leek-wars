import changelog from '@/lang/id/changelog.json'
import characteristic from '@/lang/id/characteristic.json'
import chip from '@/lang/id/chip.json'
import component from '@/lang/id/component.json'
import country from "@/lang/id/country.json"
import effect from '@/lang/id/effect.json'
import entity from "@/lang/id/entity.json"
import flag from '@/lang/id/flag.json'
import fight_pack from '@/lang/id/fight-pack.json'
import forum_category from '@/lang/id/forum-category.json'
import hat from "@/lang/id/hat.json"
import leekscript from "@/lang/id/leekscript.json"
import mail from "@/lang/id/mail.json"
import main from "@/lang/id/main.json"
import notification from "@/lang/id/notification.json"
import pomp from '@/lang/id/pomp.json'
import potion from '@/lang/id/potion.json'
import resource from '@/lang/id/resource.json'
import shortcut from '@/lang/id/shortcut.json'
import trophy from "@/lang/id/trophy.json"
import warning from '@/lang/id/warning.json'
import weapon from '@/lang/id/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("id", translations, null)

export { translations }