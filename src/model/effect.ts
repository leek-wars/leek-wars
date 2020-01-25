enum EffectType {
	DAMAGE = 1,
	HEAL = 2,
	BUFF_STRENGTH = 3,
	BUFF_AGILITY = 4,
	RELATIVE_SHIELD = 5,
	ABSOLUTE_SHIELD = 6,
	BUFF_MP = 7,
	BUFF_TP = 8,
	POISON = 13,
	SUMMON = 14,
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
}

enum EffectTypeMarket {
	ATTACK = 1,
	HEAL = 2,
	BOOST = 3,
	SHIELD = 4,
	TACTIC = 5,
	DAMAGE_RETURN = 6,
	POISON = 7,
	BULB = 8,
	SHACKLE = 9
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
export { Effect, EffectType, EffectTypeMarket }
