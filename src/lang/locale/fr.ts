import about from "@/lang/fr/about.json"
import accept_conditions from "@/lang/fr/accept-conditions.json"
import bank from "@/lang/fr/bank.json"
import changelog from "@/lang/fr/changelog.json"
import chip from '@/lang/fr/chip.json'
import conditions from "@/lang/fr/conditions.json"
import country from "@/lang/fr/country.json"
import didactitiel from "@/lang/fr/didactitiel.json"
import documentation from "@/lang/fr/documentation.json"
import editor from '@/lang/fr/editor.json'
import effect from '@/lang/fr/effect.json'
import entity from "@/lang/fr/entity.json"
import farmer from "@/lang/fr/farmer.json"
import fight from "@/lang/fr/fight.json"
import forgot_password from "@/lang/fr/forgot-password.json"
import forum_category from '@/lang/fr/forum-category.json'
import forum_topic from '@/lang/fr/forum-topic.json'
import forum from "@/lang/fr/forum.json"
import garden from "@/lang/fr/garden.json"
import general_help from "@/lang/fr/general-help.json"
import hat from "@/lang/fr/hat.json"
import help from '@/lang/fr/help.json'
import history from "@/lang/fr/history.json"
import leek from '@/lang/fr/leek.json'
import leekscript from "@/lang/fr/leekscript.json"
import legal from "@/lang/fr/legal.json"
import login from "@/lang/fr/login.json"
import mail from "@/lang/fr/mail.json"
import main from "@/lang/fr/main.json"
import market from "@/lang/fr/market.json"
import messages from "@/lang/fr/messages.json"
import mobile_app from "@/lang/fr/mobile-app.json"
import moderation from "@/lang/fr/moderation.json"
import new_leek from '@/lang/fr/new-leek.json'
import notifications from "@/lang/fr/notifications.json"
import potion from '@/lang/fr/potion.json'
import ranking from '@/lang/fr/ranking.json'
import report from '@/lang/fr/report.json'
import search from '@/lang/fr/search.json'
import settings from '@/lang/fr/settings.json'
import signup from '@/lang/fr/signup.json'
import statistics from '@/lang/fr/statistics.json'
import team from "@/lang/fr/team.json"
import tournament from "@/lang/fr/tournament.json"
import trophies from "@/lang/fr/trophies.json"
import trophy from "@/lang/fr/trophy.json"
import tutorial from "@/lang/fr/tutorial.json"
import weapon from '@/lang/fr/weapon.json'

const translations = { garden, trophies, changelog, farmer, market, main, documentation, general_help, about, conditions, chip, weapon, potion, effect, bank, country, entity, hat, leekscript, mail, notifications, leek, forum, tournament, statistics, settings, team, help, ranking, editor, forum_topic, forum_category, accept_conditions, forgot_password, fight, history, legal, login, messages, mobile_app, moderation, report, search, signup, trophy, new_leek, tutorial, didactitiel }

import { setTranslations } from "@/locale"
setTranslations("fr", translations)

export { translations }