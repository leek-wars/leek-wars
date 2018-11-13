import about from "@/lang/en/about.json"
import accept_conditions from "@/lang/en/accept-conditions.json"
import bank from "@/lang/en/bank.json"
import changelog from "@/lang/en/changelog.json"
import chip from "@/lang/en/chip.json"
import conditions from "@/lang/en/conditions.json"
import country from "@/lang/en/country.json"
import didactitiel from "@/lang/en/didactitiel.json"
import documentation from "@/lang/en/documentation.json"
import editor from '@/lang/en/editor.json'
import effect from '@/lang/en/effect.json'
import entity from "@/lang/en/entity.json"
import farmer from "@/lang/en/farmer.json"
import fight from "@/lang/en/fight.json"
import forgot_password from "@/lang/en/forgot-password.json"
import forum_category from '@/lang/en/forum-category.json'
import forum_topic from '@/lang/en/forum-topic.json'
import forum from "@/lang/en/forum.json"
import garden from "@/lang/en/garden.json"
import general_help from "@/lang/en/general-help.json"
import hat from "@/lang/en/hat.json"
import help from '@/lang/en/help.json'
import history from "@/lang/en/history.json"
import leek from '@/lang/en/leek.json'
import leekscript from "@/lang/en/leekscript.json"
import legal from "@/lang/en/legal.json"
import login from "@/lang/en/login.json"
import mail from "@/lang/en/mail.json"
import main from "@/lang/en/main.json"
import market from "@/lang/en/market.json"
import messages from "@/lang/en/messages.json"
import mobile_app from "@/lang/en/mobile-app.json"
import moderation from "@/lang/en/moderation.json"
import new_leek from '@/lang/en/new-leek.json'
import notifications from '@/lang/en/notifications.json'
import potion from '@/lang/en/potion.json'
import ranking from '@/lang/en/ranking.json'
import report from '@/lang/en/report.json'
import search from '@/lang/en/search.json'
import settings from '@/lang/en/settings.json'
import signup from '@/lang/en/signup.json'
import statistics from '@/lang/en/statistics.json'
import team from "@/lang/en/team.json"
import tournament from "@/lang/en/tournament.json"
import trophies from "@/lang/en/trophies.json"
import trophy from "@/lang/en/trophy.json"
import tutorial from "@/lang/en/tutorial.json"
import weapon from '@/lang/en/weapon.json'

const translations = { garden, trophies, changelog, market, main, documentation, general_help, about, farmer, conditions, chip, weapon, potion, effect, bank, country, entity, hat, leekscript, mail, notifications, leek, forum, tournament, statistics, settings, team, help, ranking, editor, forum_topic, forum_category, accept_conditions, fight, forgot_password, history, legal, login, messages, mobile_app, moderation, report, search, signup, trophy, new_leek, tutorial, didactitiel }

import { setTranslations } from "@/locale"
import wiki from '@/wiki/fr.wiki'
setTranslations("en", translations, wiki)

export { translations }