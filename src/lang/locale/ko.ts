import changelog from '@/lang/ko/changelog.json'
import characteristic from '@/lang/ko/characteristic.json'
import chip from '@/lang/ko/chip.json'
import country from "@/lang/ko/country.json"
import effect from '@/lang/ko/effect.json'
import entity from "@/lang/ko/entity.json"
import flag from '@/lang/ko/flag.json'
import fight_pack from '@/lang/ko/fight-pack.json'
import forum_category from '@/lang/ko/forum-category.json'
import hat from "@/lang/ko/hat.json"
import leekscript from "@/lang/ko/leekscript.json"
import mail from "@/lang/ko/mail.json"
import main from "@/lang/ko/main.json"
import notification from "@/lang/ko/notification.json"
import pomp from '@/lang/ko/pomp.json'
import potion from '@/lang/ko/potion.json'
import resource from '@/lang/ko/resource.json'
import shortcut from '@/lang/ko/shortcut.json'
import trophy from "@/lang/ko/trophy.json"
import warning from '@/lang/ko/warning.json'
import weapon from '@/lang/ko/weapon.json'

const translations = { main, changelog, characteristic, chip, flag, 'fight-pack': fight_pack, 'forum-category': forum_category, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, resource, shortcut, trophy, pomp, warning }

import { setTranslations } from "@/locale"
setTranslations("ko", translations, null)

export { translations }