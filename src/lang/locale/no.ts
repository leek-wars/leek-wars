import changelog from '@/lang/no/changelog.json'
import characteristic from '@/lang/no/characteristic.json'
import chip from '@/lang/no/chip.json'
import component from '@/lang/no/component.json'
import country from "@/lang/no/country.json"
import effect from '@/lang/no/effect.json'
import entity from "@/lang/no/entity.json"
import flag from '@/lang/no/flag.json'
import fight_pack from '@/lang/no/fight-pack.json'
import forum_category from '@/lang/no/forum-category.json'
import hat from "@/lang/no/hat.json"
import leekscript from "@/lang/no/leekscript.json"
import mail from "@/lang/no/mail.json"
import main from "@/lang/no/main.json"
import notification from "@/lang/no/notification.json"
import pomp from '@/lang/no/pomp.json'
import potion from '@/lang/no/potion.json'
import resource from '@/lang/no/resource.json'
import shortcut from '@/lang/no/shortcut.json'
import trophy from "@/lang/no/trophy.json"
import warning from '@/lang/no/warning.json'
import weapon from '@/lang/no/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("no", translations)

export { translations }