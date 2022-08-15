import changelog from '@/lang/ja/changelog.json'
import characteristic from '@/lang/ja/characteristic.json'
import chip from '@/lang/ja/chip.json'
import component from '@/lang/ja/component.json'
import country from "@/lang/ja/country.json"
import effect from '@/lang/ja/effect.json'
import entity from "@/lang/ja/entity.json"
import flag from '@/lang/ja/flag.json'
import fight_pack from '@/lang/ja/fight-pack.json'
import forum_category from '@/lang/ja/forum-category.json'
import hat from "@/lang/ja/hat.json"
import leekscript from "@/lang/ja/leekscript.json"
import mail from "@/lang/ja/mail.json"
import main from "@/lang/ja/main.json"
import notification from "@/lang/ja/notification.json"
import pomp from '@/lang/ja/pomp.json'
import potion from '@/lang/ja/potion.json'
import resource from '@/lang/ja/resource.json'
import shortcut from '@/lang/ja/shortcut.json'
import trophy from "@/lang/ja/trophy.json"
import warning from '@/lang/ja/warning.json'
import weapon from '@/lang/ja/weapon.json'

const translations = { component, main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("ja", translations, null)

export { translations }