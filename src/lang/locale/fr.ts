import chip from '@/lang/fr/chip.json'
import country from "@/lang/fr/country.json"
import effect from '@/lang/fr/effect.json'
import entity from "@/lang/fr/entity.json"
import hat from "@/lang/fr/hat.json"
import leekscript from "@/lang/fr/leekscript.json"
import mail from "@/lang/fr/mail.json"
import main from "@/lang/fr/main.json"
import notification from "@/lang/fr/notification.json"
import pomp from '@/lang/fr/pomp.json'
import potion from '@/lang/fr/potion.json'
import trophy from "@/lang/fr/trophy.json"
import weapon from '@/lang/fr/weapon.json'

const translations = { main, chip, weapon, potion, effect, country, entity, hat, leekscript, mail, notification, trophy, pomp }

import { setTranslations } from "@/locale"
// import wiki from '@/wiki/fr.wiki'
setTranslations("fr", translations, null)

export { translations }