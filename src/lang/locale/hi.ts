import changelog from '@/lang/hi/changelog.json'
import characteristic from '@/lang/hi/characteristic.json'
import chip from '@/lang/hi/chip.json'
import component from '@/lang/hi/component.json'
import country from "@/lang/hi/country.json"
import effect from '@/lang/hi/effect.json'
import entity from "@/lang/hi/entity.json"
import flag from '@/lang/hi/flag.json'
import fight_pack from '@/lang/hi/fight-pack.json'
import forum_category from '@/lang/hi/forum-category.json'
import hat from "@/lang/hi/hat.json"
import leekscript from "@/lang/hi/leekscript.json"
import mail from "@/lang/hi/mail.json"
import main from "@/lang/hi/main.json"
import notification from "@/lang/hi/notification.json"
import pomp from '@/lang/hi/pomp.json'
import potion from '@/lang/hi/potion.json'
import resource from '@/lang/hi/resource.json'
import shortcut from '@/lang/hi/shortcut.json'
import trophy from "@/lang/hi/trophy.json"
import warning from '@/lang/hi/warning.json'
import weapon from '@/lang/hi/weapon.json'

const translations = { main, changelog, characteristic, chip, component, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("hi", translations)

export { translations }