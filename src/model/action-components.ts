import { ActionType } from "./action"

import ActionLeekTurn from '@/component/action/action-leek-turn.vue'
import ActionLifeLost from '@/component/action/action-life-lost.vue'
import ActionMove from '@/component/action/action-move.vue'
import ActionNewTurn from '@/component/action/action-new-turn.vue'
import ActionNovaDamage from '@/component/action/action-nova-damage.vue'
import ActionPlayerDead from '@/component/action/action-player-dead.vue'
import ActionSetWeapon from '@/component/action/action-set-weapon.vue'
import ActionSummon from '@/component/action/action-summon.vue'
import ActionTPLost from '@/component/action/action-tp-lost.vue'
import ActionMPLost from '@/component/action/action-mp-lost.vue'
import ActionUseChip from '@/component/action/action-use-chip.vue'
import ActionUseWeapon from '@/component/action/action-use-weapon.vue'
import ActionEndFight from '@/component/action/action-end-fight.vue'
import ActionCare from '@/component/action/action-care.vue'
import ActionSay from '@/component/action/action-say.vue'
import ActionResurrection from '@/component/action/action-resurrection.vue'
import ActionVitality from '@/component/action/action-vitality.vue'
import ActionNovaVitality from '@/component/action/action-nova-vitality.vue'
import ActionLama from '@/component/action/action-lama.vue'
import ActionShow from '@/component/action/action-show.vue'
import ActionAddEffect from '@/component/action/action-add-effect.vue'
import ActionReduceEffects from '@/component/action/action-reduce-effects.vue'
import ActionRemovePoisons from '@/component/action/action-remove-poisons.vue'
import ActionRemoveShackles from '@/component/action/action-remove-shackles.vue'
import ActionBug from '@/component/action/action-bug.vue'
import { EffectType } from "./effect"

import EffectAbsoluteShield from '@/component/effect/effect-absolute-shield.vue'
import EffectRelativeShield from '@/component/effect/effect-relative-shield.vue'
import EffectVulnerability from '@/component/effect/effect-vulnerability.vue'
import EffectAbsoluteVulnerability from '@/component/effect/effect-absolute-vulnerability.vue'
import EffectBuffAgility from '@/component/effect/effect-buff-agility.vue'
import EffectBuffStrength from '@/component/effect/effect-buff-strength.vue'
import EffectBuffMagic from '@/component/effect/effect-buff-magic.vue'
import EffectBuffResistance from '@/component/effect/effect-buff-resistance.vue'
import EffectBuffWisdom from '@/component/effect/effect-buff-wisdom.vue'
import EffectBuffScience from '@/component/effect/effect-buff-science.vue'
import EffectBuffTP from '@/component/effect/effect-buff-tp.vue'
import EffectBuffMP from '@/component/effect/effect-buff-mp.vue'
import EffectBuffPower from '@/component/effect/effect-buff-power.vue'
import EffectDamageReturn from '@/component/effect/effect-damage-return.vue'
import EffectShackleStrength from '@/component/effect/effect-shackle-strength.vue'
import EffectShackleWisdom from '@/component/effect/effect-shackle-wisdom.vue'
import EffectShackleAgility from '@/component/effect/effect-shackle-agility.vue'
import EffectShackleMagic from '@/component/effect/effect-shackle-magic.vue'
import EffectShackleTP from '@/component/effect/effect-shackle-tp.vue'
import EffectShackleMP from '@/component/effect/effect-shackle-mp.vue'

const ActionComponents = {
	[ActionType.START_FIGHT]: ActionNewTurn,
	[ActionType.USE_WEAPON]: ActionUseWeapon,
	[ActionType.USE_CHIP]: ActionUseChip,
	[ActionType.SET_WEAPON]: ActionSetWeapon,
	[ActionType.END_FIGHT]: ActionEndFight,
	[ActionType.PLAYER_DEAD]: ActionPlayerDead,
	[ActionType.NEW_TURN]: ActionNewTurn,
	[ActionType.LEEK_TURN]: ActionLeekTurn,
	[ActionType.SUMMON]: ActionSummon,
	[ActionType.MOVE_TO]: ActionMove,
	[ActionType.TP_LOST]: ActionTPLost,
	[ActionType.LIFE_LOST]: ActionLifeLost,
	[ActionType.MP_LOST]: ActionMPLost,
	[ActionType.CARE]: ActionCare,
	[ActionType.BOOST_VITA]: ActionVitality,
	[ActionType.RESURRECTION]: ActionResurrection,
	[ActionType.NOVA_DAMAGE]: ActionNovaDamage,
	[ActionType.DAMAGE_RETURN]: ActionLifeLost,
	[ActionType.LIFE_DAMAGE]: ActionLifeLost,
	[ActionType.POISON_DAMAGE]: ActionLifeLost,
	[ActionType.AFTEREFFECT]: ActionLifeLost,
	[ActionType.NOVA_VITALITY]: ActionNovaVitality,
	[ActionType.SAY]: ActionSay,
	[ActionType.LAMA]: ActionLama,
	[ActionType.SHOW]: ActionShow,
	[ActionType.ADD_WEAPON_EFFECT]: ActionAddEffect,
	[ActionType.ADD_CHIP_EFFECT]: ActionAddEffect,
	[ActionType.ADD_STACKED_EFFECT]: ActionAddEffect,
	[ActionType.REDUCE_EFFECTS]: ActionReduceEffects,
	[ActionType.REMOVE_POISONS]: ActionRemovePoisons,
	[ActionType.REMOVE_SHACKLES]: ActionRemoveShackles,
	[ActionType.BUG]: ActionBug,
}

const EffectComponents = {
	[EffectType.ABSOLUTE_SHIELD]: EffectAbsoluteShield,
	[EffectType.STEAL_ABSOLUTE_SHIELD]: EffectAbsoluteShield,
	[EffectType.RAW_ABSOLUTE_SHIELD]: EffectAbsoluteShield,
	[EffectType.RELATIVE_SHIELD]: EffectRelativeShield,
	[EffectType.VULNERABILITY]: EffectVulnerability,
	[EffectType.ABSOLUTE_VULNERABILITY]: EffectAbsoluteVulnerability,
	[EffectType.BUFF_AGILITY]: EffectBuffAgility,
	[EffectType.RAW_BUFF_AGILITY]: EffectBuffAgility,
	[EffectType.BUFF_STRENGTH]: EffectBuffStrength,
	[EffectType.RAW_BUFF_STRENGTH]: EffectBuffStrength,
	[EffectType.BUFF_RESISTANCE]: EffectBuffResistance,
	[EffectType.RAW_BUFF_RESISTANCE]: EffectBuffResistance,
	[EffectType.BUFF_WISDOM]: EffectBuffWisdom,
	[EffectType.RAW_BUFF_WISDOM]: EffectBuffWisdom,
	[EffectType.RAW_BUFF_MAGIC]: EffectBuffMagic,
	[EffectType.RAW_BUFF_SCIENCE]: EffectBuffScience,
	[EffectType.BUFF_MP]: EffectBuffMP,
	[EffectType.RAW_BUFF_MP]: EffectBuffMP,
	[EffectType.BUFF_TP]: EffectBuffTP,
	[EffectType.RAW_BUFF_TP]: EffectBuffTP,
	[EffectType.DAMAGE_RETURN]: EffectDamageReturn,
	[EffectType.RAW_BUFF_POWER]: EffectBuffPower,
	[EffectType.SHACKLE_STRENGTH]: EffectShackleStrength,
	[EffectType.SHACKLE_MAGIC]: EffectShackleMagic,
	[EffectType.SHACKLE_WISDOM]: EffectShackleWisdom,
	[EffectType.SHACKLE_AGILITY]: EffectShackleAgility,
	[EffectType.SHACKLE_TP]: EffectShackleTP,
	[EffectType.SHACKLE_MP]: EffectShackleMP,
}

export { ActionComponents, EffectComponents }
