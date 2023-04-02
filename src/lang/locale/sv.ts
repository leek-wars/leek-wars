import changelog from '@/lang/sv/changelog.json'
import characteristic from '@/lang/sv/characteristic.json'
import chip from '@/lang/sv/chip.json'
import country from "@/lang/sv/country.json"
import effect from '@/lang/sv/effect.json'
import entity from "@/lang/sv/entity.json"
import flag from '@/lang/sv/flag.json'
import fight_pack from '@/lang/sv/fight-pack.json'
import forum_category from '@/lang/sv/forum-category.json'
import hat from "@/lang/sv/hat.json"
import leekscript from "@/lang/sv/leekscript.json"
import mail from "@/lang/sv/mail.json"
import main from "@/lang/sv/main.json"
import notification from "@/lang/sv/notification.json"
import pomp from '@/lang/sv/pomp.json'
import potion from '@/lang/sv/potion.json'
import resource from '@/lang/sv/resource.json'
import shortcut from '@/lang/sv/shortcut.json'
import trophy from "@/lang/sv/trophy.json"
import warning from '@/lang/sv/warning.json'
import weapon from '@/lang/sv/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("sv", translations, null)

export { translations }