enum EffectType {
	DAMAGE = 1,
	HEAL = 2,
	BUFF_STRENGTH = 3,
	BUFF_AGILITY = 4,
	RELATIVE_SHIELD = 5,
	ABSOLUTE_SHIELD = 6,
	BUFF_MP = 7,
	BUFF_TP = 8,
	DEBUFF = 9,
	TELEPORT = 10,
	INVERT = 11,
	BOOST_MAX_LIFE = 12,
	POISON = 13,
	SUMMON = 14,
	RESURRECT = 15,
	KILL = 16,
	SHACKLE_MP = 17,
	SHACKLE_TP = 18,
	SHACKLE_STRENGTH = 19,
	DAMAGE_RETURN = 20,
	BUFF_RESISTANCE = 21,
	BUFF_WISDOM = 22,
	ANTIDOTE = 23,
	SHACKLE_MAGIC = 24,
	AFTEREFFECT = 25,
	VULNERABILITY = 26,
	ABSOLUTE_VULNERABILITY = 27,
	LIFE_DAMAGE = 28,
	STEAL_ABSOLUTE_SHIELD = 29,
	NOVA_DAMAGE = 30,
	RAW_BUFF_MP = 31,
	RAW_BUFF_TP = 32,
	POISON_TO_SCIENCE = 33,
	DAMAGE_TO_ABSOLUTE_SHIELD = 34,
	DAMAGE_TO_STRENGTH = 35,
	NOVA_DAMAGE_TO_MAGIC = 36,
	RAW_ABSOLUTE_SHIELD = 37,
	RAW_BUFF_STRENGTH = 38,
	RAW_BUFF_MAGIC = 39,
	RAW_BUFF_SCIENCE = 40,
	RAW_BUFF_AGILITY = 41,
	RAW_BUFF_RESISTANCE = 42,
	PROPAGATION = 43,
	RAW_BUFF_WISDOM = 44,
	NOVA_VITALITY = 45,
	ATTRACT = 46,
	SHACKLE_AGILITY = 47,
	SHACKLE_WISDOM = 48,
	REMOVE_SHACKLE = 49,
	MOVED_TO_MP = 50,
	PUSH = 51,
	RAW_BUFF_POWER = 52,
	REPEL = 53,
	RAW_RELATIVE_SHIELD = 54,
	ALLY_KILLED_TO_AGILITY = 55,
	KILL_TO_TP = 56,
	RAW_HEAL = 57,
	CRITICAL_TO_HEAL = 58,
	ADD_STATE = 59
}

enum EffectModifier {
	STACKABLE = 1,
	MULTIPLIED_BY_TARGETS = 2,
	ON_CASTER = 4,
	NOT_REPLACEABLE = 8,
	IRREDUCTIBLE = 16,
}

enum EffectTypeMarket {
	ATTACK = 1,
	HEAL = 2,
	DAMAGE_RETURN = 3,
	SHIELD = 4,
	BOOST = 5,
	POISON = 6,
	SHACKLE = 7,
	BULB = 8,
	TACTIC = 9,
}

enum State {
	STATUE = 1,
	UNHEALABLE = 2,
	INVICIBLE = 3,
	PACIFIST = 4,
}

class Effect {
	public id!: EffectType
	public value1!: number
	public value2!: number
	public turns!: number
	public targets!: number
	public modifiers!: number
	public type!: number
}

class EntityEffect {
	public id!: number
	public type!: number
	public value!: number
	public caster!: number
	public target!: number
	public turns!: number
	public item!: number
	public texture!: HTMLImageElement
	public modifiers!: number
}

export { Effect, EffectModifier, EffectType, EffectTypeMarket, EntityEffect, State }
