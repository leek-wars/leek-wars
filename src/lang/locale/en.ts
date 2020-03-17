import chip from "@/lang/en/chip.json"
import country from "@/lang/en/country.json"
import effect from '@/lang/en/effect.json'
import entity from "@/lang/en/entity.json"
import hat from "@/lang/en/hat.json"
import leekscript from "@/lang/en/leekscript.json"
import mail from "@/lang/en/mail.json"
import main from "@/lang/en/main.json"
import notification from "@/lang/en/notification.json"
import pomp from '@/lang/en/pomp.json'
import potion from '@/lang/en/potion.json'
import trophy from "@/lang/en/trophy.json"
import weapon from '@/lang/en/weapon.json'

const translations = { main, chip, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, trophy, pomp }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("en", translations, null)

export { translations }