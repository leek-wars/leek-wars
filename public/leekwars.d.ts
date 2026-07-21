// Auto-généré depuis les game data Leek Wars (API de combat). Ne pas éditer à la main.

declare const console: {
	log(...args: any[]): void;
	info(...args: any[]): void;
	debug(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
};


// --- API de combat orientée objet (LeekScript v5-style) ---
// Les signatures écrivent les unions EN TOUTES LETTRES (`Cell | Entity | number`) au lieu d'un alias
// nommé : le survol dit alors directement ce qu'on peut passer, et surtout on n'ajoute AUCUN nom au
// scope global. Un `type Position` global entrerait en collision avec un `class Position` écrit par
// un joueur (TS2300 -> IA marquée invalide via le pont de diagnostics). Les alias historiques sont
// conservés ci-dessous, dépréciés, pour ne casser aucune IA existante qui les annote.
/** @deprecated Écrire `Cell | Entity | number`. */
type CellLike = Cell | Entity | number;
/** @deprecated Écrire `Entity | number`. */
type EntityLike = Entity | number;
/** @deprecated Écrire `Weapon | number`. */
type WeaponLike = Weapon | number;
/** @deprecated Écrire `Chip | number`. */
type ChipLike = Chip | number;

/** Un effet actif ou lancé sur une entité (Effect.DAMAGE, Effect.HEAL...). */
declare class Effect {
	/** Tableau brut [type, value, caster, turns, critical, item, target, modifiers]. */
	readonly raw: any[];
	readonly type: Effect.Type;
	readonly value: number;
	readonly caster: Entity | null;
	readonly turns: number;
	readonly critical: boolean;
	/** Arme ou puce qui a appliqué l'effet, null si aucune. L'id brut reste dans raw[5]. */
	readonly item: Weapon | Chip | null;
	readonly target: Entity | null;
	/** Bitmask de modificateurs (Effect.Modifier.STACKABLE...). */
	readonly modifiers: Effect.Modifier;
	/**
	 * Liste des ids de TYPES d'effets existants (Effect.DAMAGE, Effect.HEAL...).
	 * Retourne la liste de tous les effets du jeu.
	 * @returns La liste de tous les effets du jeu.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAllEffects)
	 */
	static getAll(): Effect.Type[];
}

/** Un message d'équipe reçu (cf Network.getMessages). */
declare class Message {
	/** Tableau brut [auteur, type, params]. */
	readonly raw: any[];
	/**
	 * Entité alliée qui a envoyé le message. Toujours définie.
	 * Renvoie l'id de l'entité auteur du message message.
	 * @returns L'id de l'entité auteur du message message.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMessageAuthor)
	 */
	readonly author: Entity;
	/**
	 * Type du message (Message.Type.*).
	 * Renvoie le type du message message.
	 * @returns Le type du message message.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMessageType)
	 */
	readonly type: Message.Type;
	/**
	 * Renvoie le tableau des paramètres du message message.
	 * @returns Les paramètres du message message.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMessageParams)
	 */
	readonly params: any;
}

/** Une caractéristique déclarée par une arme/puce (ou un effet passif) : ce que l'item peut faire
 *  quand il touche (dégâts, poison, téléport, inversion...). Potentiel, fourchette de valeurs.
 *  À distinguer d'Effect (un effet actif sur une entité). */
declare class Feature {
	/** Tableau brut [type, minValue, maxValue, turns, targets, modifiers]. */
	readonly raw: any[];
	readonly type: Effect.Type;
	readonly minValue: number;
	readonly maxValue: number;
	readonly turns: number;
	/** Bitmask des cibles visées (Effect.Target.ALLIES, ENEMIES...). */
	readonly targets: Effect.Target;
	/** Bitmask de modificateurs (Effect.Modifier.STACKABLE...). */
	readonly modifiers: Effect.Modifier;
}

declare class Cell {
	readonly id: number;
	/**
	 * Détermine la position en X de la cellule cell.
	 * @returns La position en X de la cellule.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellX)
	 */
	readonly x: number;
	/**
	 * Détermine la position en Y de la cellule cell.
	 * @returns La position en Y de la cellule.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellY)
	 */
	readonly y: number;
	/**
	 * Détermine si une cellule est vide.
	 * @returns vrai si la cellule est vide, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isEmptyCell)
	 */
	readonly empty: boolean;
	/**
	 * Détermine si le contenu de la cellule cell est un obstacle.
	 * @returns vrai si la cellule contient un obstacle, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isObstacle)
	 */
	readonly obstacle: boolean;
	/**
	 * Renvoie l'entité qui se trouve sur la cellule cell.
	 * @returns L'id de l'entité se trouvant sur la cellule, ou -1 si la cellule ne comporte pas d'entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEntityOnCell)
	 */
	readonly entity: Entity | null;
	/**
	 * Une entité occupe-t-elle la case.
	 * Détermine si le contenu de la cellule cell est une entité.
	 * @returns vrai si la cellule contient une entité, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isEntity)
	 */
	readonly hasEntity: boolean;
	/**
	 * Contenu de la case (Cell.Type.EMPTY/PLAYER/ENTITY/OBSTACLE).
	 * Retourne le contenu d'une cellule d'id cell.
	 * @returns Le contenu de la cellule cell : CELL_EMPTY pour une cellule vide, CELL_ENTITY pour une entité, CELL_OBSTACLE pour un obstacle.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellContent)
	 */
	readonly content: Cell.Type;
	/**
	 * Retourne la distance entre deux cellules cell1 et cell2. La distance retournée est exprimée en nombre de cellules, et ne tient pas compte des divers obstacles entre les deux cellules. Pour obtenir la distance à vol d'oiseau, voir getDistance et pour obtenir la distance du chemin entre les deux cellules en évitant les obstacles, voir getPathLength.
	 * @param cell1 L'id de la cellule de départ.
	 * @param cell2 L'id de la cellule d'arrivée.
	 * @returns La distance entre les deux cellules cell1 et cell2.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellDistance)
	 */
	distance(target: Cell | Entity | number): number;
	/**
	 * Renvoie la longueur du chemin entre deux cellules cell1 et cell2, en esquivant les obstacles, en ignorant les cellules contenues dans le tableau ignoredCells. Cette fonction équivaut à count(getPath(cell1, cell2, ignoredCells)). Si un joueur se situe sur une cellule ignorée, le chemin peut passer sur lui. La cellule de départ cell1 n'est jamais comptée dans le résultat. La cellule cell2 est comptée dans le résultat si et seulement si elle est vide ou ignorée par ignoredCells. Si aucun chemin n'existe entre les deux cellules, getPathLength renvoie null.
	 * @param cell1 La cellule de départ.
	 * @param cell2 La cellule d'arrivée.
	 * @param ignoredCells (optionnel) Le tableau des cellules à ignorer.
	 * @returns La longueur du chemin entre cell1 et cell2.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPathLength)
	 */
	pathLength(target: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): number;
	/**
	 * Vérifie la ligne de vue entre la cellule start et la cellule end, en ignorant les entités ignoredEntities.
	 * @param start Cellule de départ.
	 * @param end Cellule cible.
	 * @param entityToIgnore (optionnel) Une entité ou liste d'entités à ignorer.
	 * @returns Retourne vrai si la ligne de vue est dégagée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/lineOfSight)
	 */
	lineOfSight(target: Cell | Entity | number, ignoredEntities?: Entity | number | (Entity | number)[]): boolean;
	/**
	 * Chemin (liste de cellules) jusqu'à la cible, en évitant 'ignoredCells'.
	 * Renvoie le chemin en évitant les obstacles entre deux cellules cell1 et cell2, si celui-ci existe, en ignorant les cellules contenues dans le tableau ignoredCells. Si un joueur se situe sur une cellule ignorée, le chemin peut passer sur lui. La cellule de départ cell1 ne fait jamais partie du chemin résultant. La cellule cell2 fait partie du chemin résultant si et seulement si elle est vide ou ignorée par ignoredCells. Si aucun chemin n'existe entre les deux cellules, getPath renvoie null.
	 * @param start La cellule de départ.
	 * @param end La cellule d'arrivée.
	 * @param ignoredCells (optionnel) Le tableau des cellules à ignorer.
	 * @returns Le tableau contenant les cellules constituant le chemin entre les deux cellules.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPath)
	 */
	path(target: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): Cell[];
	/**
	 * La case est-elle alignée (même ligne ou colonne) avec la cible.
	 * Détermine si deux cellules cell1 et cell2 sont sur la même ligne.
	 * @param cell1 La première cellule.
	 * @param cell2 La deuxième cellule.
	 * @returns vrai si les deux cellules sont sur la même ligne, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isOnSameLine)
	 */
	onSameLine(target: Cell | Entity | number): boolean;
	/** Cellule d'id 'id', ou null s'il est invalide. L'API accepte des ids partout : voici le chemin
	 *  inverse, indispensable dès qu'on relit un id rangé dans un registre. */
	static get(id: number): Cell | null;
}

/** Base commune aux armes et puces : tout ce qu'une arme ET une puce savent faire (coût, portée,
 *  zone, caractéristiques...). Permet d'écrire du code générique sur un équipement quelconque
 *  (`function best(item: Item) { return item.cost }`). Porte aussi les constantes partagées
 *  (Item.LaunchType, Item.Area). Weapon et Chip redéclarent ces membres pour garder CHACUN sa
 *  documentation propre (getWeaponCost vs getChipCost), pas parce qu'ils diffèrent. */
declare class Item {
	readonly id: number;
	/** Coût en PT d'une utilisation. */
	readonly cost: number;
	/** Portée minimale, en nombre de cases. */
	readonly minRange: number;
	/** Portée maximale, en nombre de cases. */
	readonly maxRange: number;
	/** Nom de l'item (Pistolet, Bandage...). */
	readonly name: string;
	/** Forme de la zone d'effet (Item.Area.SINGLE_CELL, CIRCLE_2...). */
	readonly area: Item.Area;
	/** Contrainte de visée (Item.LaunchType.LINE, STAR, CIRCLE...). */
	readonly launchType: Item.LaunchType;
	/** Nombre maximal d'utilisations par tour (0 = illimité). */
	readonly maxUses: number;
	/** L'item ne peut viser que dans l'alignement de l'entité. */
	readonly inline: boolean;
	/** L'item exige une ligne de vue dégagée jusqu'à la cible. */
	readonly needsLos: boolean;
	/** Pourcentage d'échec. */
	readonly failure: number;
	/** Caractéristiques déclarées de l'item (dégâts, poison, téléport...). cf Feature. */
	readonly features: Feature[];
	/** Zone d'effet réelle de l'item sur 'cell', utilisé depuis 'from' (défaut : position courante). */
	effectiveArea(cell: Cell | Entity | number, from?: Cell | Entity | number): Cell[];
	/** L'item (arme OU puce) d'id 'id', ou null si l'id n'en désigne aucun. */
	static get(id: number): Weapon | Chip | null;
}

declare class Weapon extends Item {
	/**
	 * Renvoie le coût en PT de l'arme weapon.
	 * @returns Le coût en PT de l'arme weapon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponCost)
	 */
	readonly cost: number;
	/**
	 * Renvoie la portée minimale de l'arme weapon.
	 * @returns La portée minimale de l'arme weapon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponMinRange)
	 */
	readonly minRange: number;
	/**
	 * Renvoie la portée maximale de l'arme weapon.
	 * @returns La portée maximale de l'arme weapon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponMaxRange)
	 */
	readonly maxRange: number;
	/**
	 * Renvoie le nom de l'arme weapon.
	 * @returns Le nom de l'arme weapon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponName)
	 */
	readonly name: string;
	/**
	 * Renvoie le type de zone d'effet de l'arme weapon.
	 * @returns Le type de zone de l'arme weapon parmi les constantes AREA_* : AREA_POINT : zone d'une seule case AREA_LASER_LINE : ligne d'un laser AREA_CIRCLE_1 : zone circulaire de 3 cases de diamètre AREA_CIRCLE_2 : zone circulaire de 5 cases de diamètre AREA_CIRCLE_3 : zone circulaire de 7 cases de diamètre
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponArea)
	 */
	readonly area: Item.Area;
	/**
	 * Renvoie le mode de lancé de l'arme weapon, parmi les constantes LAUNCH_TYPE_*.
	 * @returns Le mode de lancé de l'arme weapon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponLaunchType)
	 */
	readonly launchType: Item.LaunchType;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponMaxUses) */
	readonly maxUses: number;
	/**
	 * Détermine si l'arme weapon peut être utilisée uniquement en ligne.
	 * @returns vrai si l'arme est utilisable uniquement en ligne, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isInlineWeapon)
	 */
	readonly inline: boolean;
	/**
	 * Renvoie si l'arme weapon a besoin d'une ligne de vue pour tirer.
	 * @returns true si l'arme weapon a besoin d'une ligne de vue pour tirer, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/weaponNeedLos)
	 */
	readonly needsLos: boolean;
	/**
	 * Pourcentage d'échec de l'arme.
	 * Renvoie le pourcentage de risque d'échec de l'arme weapon.
	 * @returns Pourcentage d'échec de l'arme weapon, un nombre entier entre 0 et 100.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponFailure)
	 */
	readonly failure: number;
	/**
	 * Caractéristiques déclarées de l'arme (dégâts, poison, téléport...). cf Feature.
	 * Renvoie les effets de l'arme weapon.
	 * @returns Un tableau contenant les effets de l'arme weapon. Chaque effet est lui-même un tableau de la forme [type, min, max, turns, targets, modifiers].
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponEffects)
	 */
	readonly features: Feature[];
	/**
	 * Caractéristiques passives de l'arme (bonus quand elle est équipée).
	 * Renvoie les effets passifs de l'arme weapon.
	 * @returns Un tableau contenant les effets de l'arme weapon. Chaque effet est lui-même un tableau de la forme [type, min, max, turns, targets, modifiers]. Ces effets sont les mêmes que ceux renvoyés par getWeaponEffects.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponPassiveEffects)
	 */
	readonly passiveFeatures: Feature[];
	/**
	 * Zone d'effet réelle de l'arme sur 'cell', tirée depuis 'from' (défaut : position courante).
	 * Renvoie la liste des cellules qui seront affectées si l'arme weapon est utilisée sur la cellule cell depuis la cellule from.
	 * @param weapon (optionnel) L'arme à tester.
	 * @param cell La cellule cible.
	 * @param from (optionnel) La cellule depuis laquelle l'arme est utilisée.
	 * @returns Le tableau contenant les ids de toutes les cellules qui seront affectées.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponEffectiveArea)
	 */
	effectiveArea(cell: Cell | Entity | number, from?: Cell | Entity | number): Cell[];
	/** L'arme d'id 'id', ou null si l'id n'est pas celui d'une arme. */
	static get(id: number): Weapon | null;
	/**
	 * Toutes les armes du jeu.
	 * Retourne la liste de toutes les armes du jeu.
	 * @returns La liste de toutes les armes du jeu.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAllWeapons)
	 */
	static getAll(): Weapon[];
	/**
	 * La valeur est-elle un id d'arme valide.
	 * Détermine si une valeur est une constante représentant une arme. isWeapon(WEAPON_LASER) = true; isWeapon(CHIP_TELEPORTATION) = false.
	 * @param value Le nombre à déterminer.
	 * @returns true si la valeur est une constante d'arme.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isWeapon)
	 */
	static isWeapon(value: any): boolean;
}

declare class Chip extends Item {
	/**
	 * Renvoie le coût en PT de la puce chip.
	 * @returns Le coût de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipCost)
	 */
	readonly cost: number;
	/**
	 * Renvoie le temps de récupération de la puce chip, issu du marché.
	 * @returns Le cooldown de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipCooldown)
	 */
	readonly cooldown: number;
	/**
	 * Renvoie le cooldown actuel de la puce chip de l'entité entity.
	 * @returns Le cooldown actuel de la puce chip, il s'agit du nombre de tours avant lesquels la puce deviendra utilisable, 0 si elle est actuellement utilisable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCooldown)
	 */
	readonly currentCooldown: number;
	/**
	 * Renvoie la portée minimale de la puce chip.
	 * @returns La portée minimale de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipMinRange)
	 */
	readonly minRange: number;
	/**
	 * Renvoie la portée maximale de la puce chip.
	 * @returns La portée maximale de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipMaxRange)
	 */
	readonly maxRange: number;
	/**
	 * Renvoie la portée minimale de la puce chip.
	 * @returns La portée minimale de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipMinScope)
	 */
	readonly minScope: number;
	/**
	 * Renvoie la portée maximale de la puce chip.
	 * @returns La portée maximale de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipMaxScope)
	 */
	readonly maxScope: number;
	/**
	 * Renvoie le nom de la puce chip.
	 * @returns Le nom de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipName)
	 */
	readonly name: string;
	/**
	 * Renvoie le type de zone d'effet de de la puce chip.
	 * @returns Le type de zone de la puce chip parmi les constantes AREA_* : AREA_POINT : zone d'une seule case AREA_LASER_LINE : ligne d'un laser AREA_CIRCLE_1 : zone circulaire de 3 cases de diamètre AREA_CIRCLE_2 : zone circulaire de 5 cases de diamètre AREA_CIRCLE_3 : zone circulaire de 7 cases de diamètre
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipArea)
	 */
	readonly area: Item.Area;
	/**
	 * Renvoie le mode de lancé de la puce chip, parmi les constantes LAUNCH_TYPE_*.
	 * @returns Le mode de lancé de la puce chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipLaunchType)
	 */
	readonly launchType: Item.LaunchType;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getChipMaxUses) */
	readonly maxUses: number;
	/**
	 * Détermine si la puce chip peut être utlisée uniquement en ligne.
	 * @returns vrai si la puce est utilisable uniquement en ligne, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isInlineChip)
	 */
	readonly inline: boolean;
	/**
	 * Renvoie si la puce chip a besoin d'une ligne de vue pour être utilisée.
	 * @returns true si la puce chip a besoin d'une ligne de vue pour être utilisée, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/chipNeedLos)
	 */
	readonly needsLos: boolean;
	/**
	 * Pourcentage d'échec de la puce.
	 * Renvoie le pourcentage de risque d'échec de la puce chip.
	 * @returns Pourcentage d'échec de la puce chip, un nombre entier entre 0 et 100.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipFailure)
	 */
	readonly failure: number;
	/**
	 * Caractéristiques déclarées de la puce. cf Feature.
	 * Renvoie les effets de la puce chip.
	 * @returns Les effets de la puce chip. Même valeur de retour que pour la fonction getWeaponEffects.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipEffects)
	 */
	readonly features: Feature[];
	/**
	 * Pour une puce d'INVOCATION : puces du bulbe invoqué.
	 * Renvoie la liste des puces qui seront équipées sur un bulbe invoqué par la puce bulb_chip.
	 * @returns Les puces d'un bulbe invoqué par la puce bulb_chip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBulbChips)
	 */
	readonly bulbChips: Chip[];
	/**
	 * Pour une puce d'INVOCATION : caractéristiques du bulbe invoqué.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBulbCharacteristics)
	 */
	readonly bulbCharacteristics: any;
	/**
	 * Pour une puce d'INVOCATION : statistiques du bulbe invoqué.
	 * Renvoie les caractéristiques min et max du marché pour un bulbe invoqué par la puce bulb_chip. Le résultat est une map indexée par les constantes STAT_*, chaque valeur étant un tableau [min, max].
	 * @returns Les caractéristiques min et max du bulbe invoqué par la puce bulb_chip, ou null si la puce n'est pas valide.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBulbStats)
	 */
	readonly bulbStats: any;
	/**
	 * Cooldown restant de la puce pour une AUTRE entité que soi.
	 * Renvoie le cooldown actuel de la puce chip de l'entité entity.
	 * @param chip La puce dont le cooldown actuel sera renvoyé.
	 * @param entity (optionnel) L'entité dont le cooldown sera renvoyé.
	 * @returns Le cooldown actuel de la puce chip, il s'agit du nombre de tours avant lesquels la puce deviendra utilisable, 0 si elle est actuellement utilisable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCooldown)
	 */
	currentCooldownOf(entity: Entity | number): number;
	/**
	 * Zone d'effet réelle de la puce sur 'cell', lancée depuis 'from' (défaut : position courante).
	 * Renvoie la liste des cellules qui seront affectés si la puce chip est utilisée sur la cellule cell depuis une cellule from.
	 * @param chip La puce à tester.
	 * @param cell La cellule cible.
	 * @param from (optionnel) La cellule depuis laquelle la puce est utilisée.
	 * @returns Le tableau contenant les ids de toutes les cellules qui seront affectés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipEffectiveArea)
	 */
	effectiveArea(cell: Cell | Entity | number, from?: Cell | Entity | number): Cell[];
	/** La puce d'id 'id', ou null si l'id n'est pas celui d'une puce. */
	static get(id: number): Chip | null;
	/**
	 * Toutes les puces du jeu.
	 * Retourne la liste de toutes les puces du jeu.
	 * @returns La liste de toutes les puces du jeu.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAllChips)
	 */
	static getAll(): Chip[];
	/**
	 * La valeur est-elle un id de puce valide.
	 * Détermine si une valeur est une constante représentant une puce. isChip(CHIP_RAGE) = true; isChip(WEAPON_PISTOL) = false.
	 * @param value Le nombre à déterminer.
	 * @returns true si la valeur est une constante de puce.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isChip)
	 */
	static isChip(value: any): boolean;
}

// Sous-types d'entité. Héritage exprimé par 'interface X extends Entity' (côté INSTANCE, structurel)
// plutôt que 'class X extends Entity' : ainsi le static side d'Entity (Entity.Type, Entity.Stat)
// n'est PAS propagé aux sous-classes, ce qui évite le conflit TS entre Entity.Type et
// Chest/Bulb/Mob.Type. 'x instanceof Bulb', l'assignabilité à Entity et les propriétés héritées
// fonctionnent identiquement (le runtime, lui, fait un vrai class extends).
/** Un poireau. */
declare class Leek {}
interface Leek extends Entity {}
/** Une tourelle d'équipe. */
declare class Turret {}
interface Turret extends Entity {}
/** Un bulbe invoqué. */
declare class Bulb {
	/**
	 * Sous-type de bulbe (Bulb.Type.PUNY...).
	 * Renvoie le type de bulbe de l'entité entity.
	 * @returns Le type de bulbe de l'entité :BULB_PUNY pour un bulbe Chétif.BULB_FIRE pour un bulbe de Feu.BULB_HEALER pour un bulbe Soigneur.BULB_ROCKY pour un bulbe Rocheux.BULB_ICED pour un bulbe Glacé.BULB_LIGHTNING pour un bulbe de Foudre.BULB_METALLIC pour un bulbe Métallique.BULB_WIZARD pour un bulbe Sorcier.BULB_TACTICIAN pour un bulbe Tacticien.BULB_SAVANT pour un bulbe Savant.Retourne -1 si l'entité n'est pas un bulbe, ou null si l'entité n'existe pas.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBulbType)
	 */
	readonly type: Bulb.Type;
}
interface Bulb extends Entity {}
/** Un coffre (chasse aux coffres). */
declare class Chest {
	/**
	 * Sous-type de coffre (Chest.Type.WOOD...).
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChestType)
	 */
	readonly type: Chest.Type;
}
interface Chest extends Entity {}
/** Un monstre / boss. */
declare class Mob {
	/**
	 * Sous-type de monstre (Mob.Type.GRAAL...).
	 * Renvoie le type de mob de l'entité entity. Retourne -1 si l'entité n'est pas un mob. Utilisez les constantes MOB_* pour comparer le résultat.
	 * @returns Le type de mob de l'entité entity, ou -1 si ce n'est pas un mob.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMobType)
	 */
	readonly type: Mob.Type;
}
interface Mob extends Entity {}

declare class Entity {
	readonly id: number;
	/**
	 * Renvoie la vie actuelle de l'entité d'id entity. Utilisez getLife() sans paramètre pour récupérer votre vie.
	 * @returns La vie actuelle de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getLife)
	 */
	readonly life: number;
	/**
	 * Renvoie la vie totale de l'entité d'id entity. Utilisez getTotalLife() sans paramètre pour récupérer votre vie totale.
	 * @returns La vie totale de l'entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTotalLife)
	 */
	readonly maxLife: number;
	/**
	 * Renvoie le nombre de points de tour de l'entité entity. Utilisez getTP() sans paramètre pour récupérer vos PT.
	 * @returns Le nombre de PT de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTP)
	 */
	readonly tp: number;
	/**
	 * Renvoie le nombre maximal de points de tour de l'entité entity.
	 * @returns Le nombre maximal de points de tour de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTotalTP)
	 */
	readonly maxTP: number;
	/**
	 * Revoie le nombre de points de mouvements actuel de l'entité entity. Utilisez getMP() sans paramètre pour récupérer vos PM.
	 * @returns Le nombre de PM de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMP)
	 */
	readonly mp: number;
	/**
	 * Renvoie le nombre maximal de points de mouvement de l'entité entity.
	 * @returns Le nombre maximal de points de mouvement de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTotalMP)
	 */
	readonly maxMP: number;
	/**
	 * Renvoie la force de l'entité d'id entity. Utilisez getStrength() sans paramètre pour récupérer votre force.
	 * @returns La force de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getStrength)
	 */
	readonly strength: number;
	/**
	 * Retourne l'agilité de l'entité d'id entity. Pour récupérer directement l'agilité de votre entité, utilisez getAgility() sans paramètre.
	 * @returns L'agilité de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAgility)
	 */
	readonly agility: number;
	/**
	 * Renvoie la sagesse de l'entité d'id entity. Utilisez getWisdom() sans paramètre pour récupérer votre sagesse.
	 * @returns La sagesse de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWisdom)
	 */
	readonly wisdom: number;
	/**
	 * Renvoie la résistance de l'entité d'id entity. Utilisez getResistance() sans paramètre pour récupérer votre résistance.
	 * @returns La résistance de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getResistance)
	 */
	readonly resistance: number;
	/**
	 * Renvoie la science de l'entité d'id entity. Utilisez getScience() sans paramètre pour récupérer votre science.
	 * @returns La science de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getScience)
	 */
	readonly science: number;
	/**
	 * Renvoie la magie de l'entité d'id entity. Utilisez getMagic() sans paramètre pour récupérer votre magie.
	 * @returns La magie de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMagic)
	 */
	readonly magic: number;
	/**
	 * Renvoie la puissance de l'entité d'id entity.
	 * @returns La puissance de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPower)
	 */
	readonly power: number;
	/**
	 * Renvoie le niveau de l'entité d'id entity.
	 * @returns Le niveau de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getLevel)
	 */
	readonly level: number;
	/**
	 * Renvoie le nom de l'entité d'id entity.
	 * @returns Le nom de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getName)
	 */
	readonly name: string;
	/**
	 * Retourne le bouclier absolu de l'entité d'id entity. Pour récupérer directement le bouclier absolu de votre entité, utilisez getAbsoluteShield() sans paramètre.
	 * @returns Le bouclier absolu de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAbsoluteShield)
	 */
	readonly absoluteShield: number;
	/**
	 * Retourne le bouclier relatif de l'entité d'id entity. Pour récupérer directement le bouclier relatif de votre entité, utilisez getRelativeShield() sans paramètre.
	 * @returns Le bouclier relatif de l'entité entity, un nombre entier entre 0 et 100.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getRelativeShield)
	 */
	readonly relativeShield: number;
	/**
	 * Retourne le taux de renvoi de dommages de l'entité d'id entity.
	 * @returns Le taux de renvoi de dommages de l'entité d'id entity (en %).
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDamageReturn)
	 */
	readonly damageReturn: number;
	/**
	 * Renvoie la fréquence de l'entité d'id entity. Utilisez getFrequency() sans paramètre pour récupérer votre fréquence.
	 * @returns La fréquence de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFrequency)
	 */
	readonly frequency: number;
	/**
	 * Renvoie le nombre de coeurs de l'entité d'id entity.
	 * @returns Le nombre de coeurs de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCores)
	 */
	readonly cores: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getRAM) */
	readonly ram: number;
	/**
	 * Retourne la cellule où se trouve l'entité d'id entity. Utilisez getCell() sans paramètre pour récupérer votre cellule.
	 * @returns Le numéro de la cellule où se trouve l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCell)
	 */
	readonly cell: Cell;
	/**
	 * Renvoie l'arme actuellement équipée l'entité entity.
	 * @returns L'id de l'arme actuellement équipée sur l'entité entity, null si l'entité n'a pas d'arme équipée ou si l'entité n'existe pas.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeapon)
	 */
	readonly weapon: Weapon | null;
	/**
	 * Renvoie les armes de l'entité d'id entity.
	 * @returns Un tableau contenant les ids des armes de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeapons)
	 */
	readonly weapons: Weapon[];
	/**
	 * Renvoie les puces de l'entité d'id entity.
	 * @returns Un tableau contenant les ids des puces de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChips)
	 */
	readonly chips: Chip[];
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getEffects) */
	readonly effects: Effect[];
	/**
	 * Renvoie la liste des effets qu'a provoqué l'entité d'id entity.
	 * @returns La liste des effets provoqués l'entité d'id entity, de la même forme que le tableau renvoyé par getEffects.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getLaunchedEffects)
	 */
	readonly launchedEffects: Effect[];
	/**
	 * Retourne la liste des effets passifs de l'entité d'id entity. Pour récupérer directement la liste des effets passifs de votre entité, utilisez getPassiveEffects() sans paramètre.
	 * @returns La liste des effets passifs actuellement présents sur l'entité entity. La liste des effets passifs est un tableau contenant les effets. Un effet est lui-même un tableau de 7 cases de la forme : [type, value, caster_id, turns, critical, item_id, target_id]. C'est la même structure que les effets classiques renvoyés par la fonction getEffects.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPassiveEffects)
	 */
	readonly passiveEffects: Feature[];
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getStates) */
	readonly states: State.Type[];
	/**
	 * Renvoie la liste des ids des invocations actuellement en vie de l'entité d'id entity.
	 * @returns La liste des ids des invocations de l'entité d'id entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getSummons)
	 */
	readonly summons: Entity[];
	/**
	 * Renvoie l'entité a invoqué l'entité entity, s'il s'agit d'une invocation.
	 * @returns L'id de l'entité a invoqué entity s'il s'agit d'une invocation, null sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getSummoner)
	 */
	readonly summoner: Entity | null;
	/**
	 * Renvoie si l'entité entity est une invocation ou non.
	 * @returns true si entity est une invocation, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isSummon)
	 */
	readonly summoned: boolean;
	/**
	 * Détermine si une entité entity est vivant. Équivalent à getLife(entity) > 0.
	 * @returns vrai si l'entité entity est vivant, faux s'il est mort.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isAlive)
	 */
	readonly alive: boolean;
	/**
	 * Détermine si l'entité entity est mort. Équivalent à getLife(entity) == 0.
	 * @returns vrai si l'entité entity est mort, faux s'il est vivant.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isDead)
	 */
	readonly dead: boolean;
	/**
	 * L'entité ne peut pas bouger (tourelle, coffre...).
	 * Renvoie si l'entité entity est statique ou non. Une entité statique ne peut pas se déplacer ou être déplacée.
	 * @returns true si entity est statique, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isStatic)
	 */
	readonly isStatic: boolean;
	/**
	 * Renvoie le tour du combat où est apparue l'entité entity. Renvoie 1 s'il s'agit d'un poireau par exemple, et 5 s'il d'agit d'une invocation invoquée au tour 5.
	 * @returns Le tour de combat où entity est apparue.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBirthTurn)
	 */
	readonly birthTurn: number;
	/**
	 * Retourne une valeur entre 1 et n (nombre d'entités actuellement en jeu) indiquant la position de l'entité entity dans l'ordre de jeu.
	 * @returns Place dans l'ordre de jeu de l'entité entity
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEntityTurnOrder)
	 */
	readonly turnOrder: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getSide) */
	readonly side: number;
	/**
	 * Renvoie l'id réel du poireau d'id leek.
	 * @returns L'id réel du poireau entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getLeekID)
	 */
	readonly leekID: number;
	/**
	 * Renvoie l'id de l'équipe de l'entité entity.
	 * @returns L'id de l'équipe de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTeamID)
	 */
	readonly teamID: number;
	/**
	 * Renvoie le nom de l'équipe de l'entité entity.
	 * @returns Le nom de l'équipe de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTeamName)
	 */
	readonly teamName: string;
	/**
	 * Renvoie le nom de la composition de l'entité entity, dans le contexte d'un combat d'équipe. Renvoie null si l'entité n'appartient pas à une composition.
	 * @returns Le nom de la composition de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCompositionName)
	 */
	readonly compositionName: string;
	/**
	 * Renvoie l'id de l'éleveur de l'entité entity.
	 * @returns L'id de l'éleveur de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFarmerID)
	 */
	readonly farmerID: number;
	/**
	 * Renvoie le nom de l'éleveur de l'entité entity.
	 * @returns Le nom de de l'éleveur de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFarmerName)
	 */
	readonly farmerName: string;
	/**
	 * Renvoie le pays de l'éleveur de l'entité entity.
	 * @returns Le pays de l'éleveur de l'entité entity, ou "?" si non indiqué.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFarmerCountry)
	 */
	readonly farmerCountry: string;
	/**
	 * Renvoie l'id de l'IA de l'entité entity. Utilisez getAIID sans paramètre pour récupérer l'id de votre IA.
	 * @returns L'id de l'IA de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAIID)
	 */
	readonly aiID: number;
	/**
	 * Renvoie le nom de l'IA de l'entité entity. Utilisez getAIName() sans paramètre pour récupérer le nom de votre IA.
	 * @returns Le nom de l'IA de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAIName)
	 */
	readonly aiName: string;
	/**
	 * Détermine si l'entité entity est votre allié.
	 * @param entity L'id de l'entité à tester.
	 * @returns vrai si l'entité entity est votre allié ou bien vous-même, faux s'il s'agit d'un ennemi.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isAlly)
	 */
	isAlly(): boolean;
	/**
	 * Détermine si l'entité entity est votre ennemi.
	 * @param entity L'id de l'entité à tester.
	 * @returns vrai si l'entité entity est un ennemi, faux s'il s'agit d'un allié ou bien vous-même.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isEnemy)
	 */
	isEnemy(): boolean;
	/**
	 * Valeur d'une caractéristique par sa constante (Entity.Stat.STRENGTH...).
	 * Renvoie la valeur de la statistique stat de l'entité entity. Utilisez les constantes STAT_* pour spécifier la statistique (ex : STAT_STRENGTH, STAT_LIFE, etc.).
	 * @returns La valeur de la statistique stat de l'entité entity.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getStat)
	 */
	stat(stat: Entity.Stat): number;
	/**
	 * Retourne la distance entre deux cellules cell1 et cell2. La distance retournée est exprimée en nombre de cellules, et ne tient pas compte des divers obstacles entre les deux cellules. Pour obtenir la distance à vol d'oiseau, voir getDistance et pour obtenir la distance du chemin entre les deux cellules en évitant les obstacles, voir getPathLength.
	 * @param cell1 L'id de la cellule de départ.
	 * @param cell2 L'id de la cellule d'arrivée.
	 * @returns La distance entre les deux cellules cell1 et cell2.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellDistance)
	 */
	distance(target: Cell | Entity | number): number;
	/** Entité d'id 'id' (typée : Leek, Bulb, Mob...), ou null s'il est invalide. Chemin inverse des
	 *  ids acceptés partout par l'API : relire un id d'entité rangé dans un registre, par exemple. */
	static get(id: number): Entity | null;
}

declare class Me extends Entity {
	/**
	 * Se rapproche de 'target' en dépensant au plus 'mp' PM (défaut : tous).
	 * Rapproche votre entité d'une autre entité entity, en utilisant au maximum mp points de mouvement.
	 * @param entity L'entité vers lequelle votre entité doit se rapprocher.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveToward)
	 */
	moveToward(target: Cell | Entity | number, mp?: number): number;
	/**
	 * Éloigne votre entité d'un autre entité entity, en utilisant au maximum mp points de mouvement.
	 * @param entity L'entité dont votre entité doit s'éloigner.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveAwayFrom)
	 */
	moveAwayFrom(target: Cell | Entity | number, mp?: number): number;
	/**
	 * Rapproche votre entité d'un ensemble de cellules cells, en utilisant au maximum mp points de mouvement.
	 * @param cells Le tableau contenant les cellules vers lesquelles votre entité doit se rapprocher.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveTowardCells)
	 */
	moveTowardCells(cells: (Cell | Entity | number)[], mp?: number): number;
	/**
	 * Rapproche votre entité d'un ensemble d'entités entities, en utilisant au maximum mp points de mouvement.
	 * @param entities Le tableau contenant les ids des entités vers lesquelles votre entité doit se rapprocher.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveTowardEntities)
	 */
	moveTowardEntities(entities: (Entity | number)[], mp?: number): number;
	/**
	 * Rapproche votre entité d'une ligne définie par deux cellules cell1 et cell2, en utilisant au maximum mp points de mouvement.
	 * @param cell1 La cellule 1.
	 * @param cell2 La cellule 2.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveTowardLine)
	 */
	moveTowardLine(a: Cell | Entity | number, b: Cell | Entity | number, mp?: number): number;
	/**
	 * Éloigne votre entité d'un ensemble de cellules cells, en utilisant au maximum mp points de mouvement.
	 * @param cells Le tableau contenant les cellules dont votre entité doit s'éloigner.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveAwayFromCells)
	 */
	moveAwayFromCells(cells: (Cell | Entity | number)[], mp?: number): number;
	/**
	 * Éloigne votre entité d'un ensemble de entités entities, en utilisant au maximum mp points de mouvement.
	 * @param entities Le tableau contenant les ids des entités dont votre entité doit s'éloigner.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveAwayFromEntities)
	 */
	moveAwayFromEntities(entities: (Entity | number)[], mp?: number): number;
	/**
	 * Éloigne votre entité d'une ligne définie par deux cellules cell1 et cell2, en utilisant au maximum mp points de mouvement.
	 * @param cell1 La cellule 1.
	 * @param cell2 La cellule 2.
	 * @param mp (optionnel) Le nombre maximum de PM à utiliser. Par défaut, pas de limite.
	 * @returns Le nombre de points de mouvements utilisés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/moveAwayFromLine)
	 */
	moveAwayFromLine(a: Cell | Entity | number, b: Cell | Entity | number, mp?: number): number;
	/**
	 * Utilise l'arme sélectionnée sur l'entité entity.
	 * @param entity Entité ciblée.
	 * @returns Les valeurs de retour de useWeapon sont : USE_CRITICAL, en cas de coup critique USE_SUCCESS, en cas de réussite USE_FAILED, en cas de d'échec USE_INVALID_TARGET, si la cible n'existe pas USE_NOT_ENOUGH_TP, si votre entité n'a pas assez de TP USE_INVALID_POSITION, si la portée est mauvaise ou la ligne de vue n'est pas dégagée
	 * 📖 [Documentation](https://leekwars.com/help/documentation/useWeapon)
	 */
	useWeapon(target: Entity | number): Fight.Use;
	/**
	 * Utilise l'arme sélectionnée sur la cellule cell.
	 * @param cell Cellule ciblée.
	 * @returns Une valeur supérieure à 0 si l'attaque a été lancée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/useWeaponOnCell)
	 */
	useWeaponOnCell(cell: Cell | Entity | number): Fight.Use;
	/**
	 * Utilise le chip chip sur l'entité entity.
	 * @param chip Chip à utiliser.
	 * @param entity (optionnel) Entité cible.
	 * @returns Les valeurs de retour de useChip sont : USE_CRITICAL, en cas de coup critique USE_SUCCESS, en cas de réussite USE_FAILED, en cas de d'échec USE_INVALID_TARGET, si la cible n'existe pas USE_NOT_ENOUGH_TP, si votre entité n'a pas assez de TP USE_INVALID_COOLDOWN, si la puce n'est pas encore utilisable USE_INVALID_POSITION, si la portée est mauvaise ou la ligne de vue n'est pas dégagée
	 * 📖 [Documentation](https://leekwars.com/help/documentation/useChip)
	 */
	useChip(chip: Chip | number, target?: Entity | number): Fight.Use;
	/**
	 * Utilise le chip chip sur la cellule cell.
	 * @param chip Chip à utiliser.
	 * @param cell Cellule cible.
	 * @returns Une valeur supérieure à 0 si l'attaque a été lancée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/useChipOnCell)
	 */
	useChipOnCell(chip: Chip | number, cell: Cell | Entity | number): Fight.Use;
	/**
	 * Équipe l'arme weapon sur votre entité.
	 * @param weapon Id de l'arme à équiper.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/setWeapon)
	 */
	setWeapon(weapon: Weapon | number): boolean;
	/**
	 * Fait parler votre entité.
	 * @param message Message qu'annonçera votre entité dans l'arène.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/say)
	 */
	say(message: any): boolean;
	/**
	 * Fait dire « lama » à ton entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/lama)
	 */
	lama(): void;
	// Les canUse* renvoient un BOOLÉEN (moteur : Type.BOOL), pas un code Fight.Use : ce sont des
	// prédicats « est-ce possible », pas des tentatives. Seules les actions réelles (useWeapon,
	// useChip, resurrect, summon) renvoient un Fight.Use.
	/**
	 * Peut-on utiliser l'arme courante sur 'target' — ou 'weapon' sur 'target' (2 arguments).
	 * Détermine si votre entité peut tirer sur l'entité d'id entity avec l'arme weapon.
	 * @param weapon (optionnel) L'arme à tester. Par défaut votre arme actuellement équipée.
	 * @param entity L'id de l'entité sur lequel vous voulez tirer.
	 * @returns true si votre entité peut tirer, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseWeapon)
	 */
	canUseWeapon(target: Entity | number): boolean;
	/**
	 * Détermine si votre entité peut tirer sur l'entité d'id entity avec l'arme weapon.
	 * @param weapon (optionnel) L'arme à tester. Par défaut votre arme actuellement équipée.
	 * @param entity L'id de l'entité sur lequel vous voulez tirer.
	 * @returns true si votre entité peut tirer, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseWeapon)
	 */
	canUseWeapon(weapon: Weapon | number, target: Entity | number): boolean;
	/**
	 * Peut-on utiliser l'arme courante sur la case 'cell' — ou 'weapon' sur 'cell' (2 arguments).
	 * Détermine si votre entité peut tirer sur la cellule cell avec l'arme weapon.
	 * @param weapon (optionnel) L'arme à tester. Par défaut votre arme actuellement équipée.
	 * @param cell Le numéro de la cellule sur laquelle vous voulez tirer.
	 * @returns true si votre entité peut tirer, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseWeaponOnCell)
	 */
	canUseWeaponOnCell(cell: Cell | Entity | number): boolean;
	/**
	 * Détermine si votre entité peut tirer sur la cellule cell avec l'arme weapon.
	 * @param weapon (optionnel) L'arme à tester. Par défaut votre arme actuellement équipée.
	 * @param cell Le numéro de la cellule sur laquelle vous voulez tirer.
	 * @returns true si votre entité peut tirer, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseWeaponOnCell)
	 */
	canUseWeaponOnCell(weapon: Weapon | number, cell: Cell | Entity | number): boolean;
	/**
	 * Détermine si votre entité peut utiliser la puce chip sur l'entité d'id entity.
	 * @param chip Le numéro de la puce à tester.
	 * @param entity L'id de l'entité sur lequel vous voulez utiliser la puce.
	 * @returns true si votre entité peut utiliser la puce, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseChip)
	 */
	canUseChip(chip: Chip | number, target: Entity | number): boolean;
	/**
	 * Détermine si votre entité peut utiliser la puce chip sur la cellule cell.
	 * @param chip Le numéro de la puce à tester.
	 * @param cell Le numéro de la cellule sur laquelle vous voulez utiliser la puce.
	 * @returns true si votre entité peut utiliser la puce, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/canUseChipOnCell)
	 */
	canUseChipOnCell(chip: Chip | number, cell: Cell | Entity | number): boolean;
	/**
	 * Utilise la puce CHIP_RESURRECTION pour ressusciter une entité d'id entity morte, sur la cellule cell.
	 * @param entity L'id de l'entité à faire revivre.
	 * @param cell La cellule sur laquelle l'entité réapparaîtra.
	 * @returns Le résultat du lancement de la puce, parmi les constantes USE_*.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/resurrect)
	 */
	resurrect(target: Entity | number, cell: Cell | Entity | number): Fight.Use;
	/**
	 * Nombre d'utilisations de l'item (arme ou puce) ce tour.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getItemUses)
	 */
	itemUses(item: Item | number): number;
	/**
	 * Change l'équipement courant (nom du loadout).
	 * Applique un loadout pour ce combat uniquement, sans modifier l'équipement persistant du poireau. À utiliser uniquement dans beforeFight(). Si le nom n'existe pas ou si setLoadout est appelé en dehors de beforeFight(), la fonction renvoie false et un avertissement est ajouté au rapport.
	 * @param name Le nom exact du loadout à appliquer (sensible à la casse).
	 * @returns true si le loadout a été appliqué, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/setLoadout)
	 */
	setLoadout(name: string, keep?: boolean): boolean;
	/**
	 * Invoque un bulbe : 'callback' est rejouée à chaque tour du bulbe (me désigne alors le bulbe).
	 * Invoque une entité déterminée par la puce chip sur la cellule cell ayant pour IA la fonction ai. Un nom personnalisé peut être donné avec le paramètre optionnel name.
	 * @param chip La puce utilisée pour l'invocation. La puce doit être une puce de type invocation et doit être équipée sur l'entité qui utilise la fonction summon.
	 * @param cell La cellule ou l'invocation doit apparaître.
	 * @param ai L'IA de l'invocation, sous la forme d'une fonction.
	 * @param name (optionnel) Le nom personnalisé du bulbe (optionnel). Par défaut, le nom du type de bulbe est utilisé.
	 * @returns La fonction summon a le même retour que la fonction useChip.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/summon)
	 */
	summon(chip: Chip | number, cell: Cell | Entity | number, callback: () => void, name?: string): Fight.Use;
	/**
	 * Cellule d'où utiliser l'arme (courante ou 'weapon') sur 'target' (une entité OU une case).
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellToUseWeapon)
	 */
	weaponCell(target: Cell | Entity | number, weapon?: Weapon | number, ignoredCells?: (Cell | Entity | number)[]): Cell | null;
	/**
	 * Toutes les cellules d'où utiliser l'arme sur 'target'.
	 * Retourne la liste des cellules à partir desquelles votre entité pourra utiliser l'arme weapon sur l'entité entity.
	 * @param weapon (optionnel) L'arme à tester. Par défaut votre arme actuellement équipée.
	 * @param entity L'entité cible.
	 * @param ignoredCells (optionnel) Tableau de cellules à ignorer. Par défaut un tableau vide.
	 * @returns Liste des cellules d'où l'arme pourra être utilisée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellsToUseWeapon)
	 */
	weaponCells(target: Cell | Entity | number, weapon?: Weapon | number, ignoredCells?: (Cell | Entity | number)[]): Cell[];
	/**
	 * Cellule d'où utiliser 'chip' sur 'target' (une entité OU une case).
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellToUseChip)
	 */
	chipCell(chip: Chip | number, target: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): Cell | null;
	/**
	 * Toutes les cellules d'où utiliser 'chip' sur 'target'.
	 * Retourne la liste des cellules à partir desquelles votre entité pourra utiliser la puce chip sur l'entité entity.
	 * @param chip La puce que l'entité veut pouvoir utiliser.
	 * @param entity L'entité cible.
	 * @param ignoredCells (optionnel) Tableau de cellules à ignorer.
	 * @returns Liste des cellules d'où la puce pourra être utilisée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellsToUseChip)
	 */
	chipCells(chip: Chip | number, target: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): Cell[];
	/**
	 * Entités touchées si l'arme (courante ou 'weapon') est utilisée sur la case 'cell'.
	 * Renvoie les entités qui seront affectées si l'arme weapon est utilisée sur la cellule cell.
	 * @param weapon (optionnel) L'arme à tester.
	 * @param cell La cellule cible.
	 * @returns Le tableau contenant les ids de tous les entités qui seront affectées.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWeaponTargets)
	 */
	weaponTargets(cell: Cell | Entity | number, weapon?: Weapon | number): Entity[];
	/**
	 * Entités touchées si 'chip' est utilisée sur la case 'cell'.
	 * Renvoie les entités qui seront affectées si la puce chip est utilisée sur la cellule cell.
	 * @param chip La puce à tester.
	 * @param cell La cellule cible.
	 * @returns Le tableau contenant les ids de tous les entités qui seront affectées.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getChipTargets)
	 */
	chipTargets(chip: Chip | number, cell: Cell | Entity | number): Entity[];
}

// Stockage persistant de l'IA. Reste un `declare const` (et pas un namespace) : `delete` est un mot
// réservé, donc `function delete(...)` serait une erreur de syntaxe dans un namespace.
declare const Registers: {
	/**
	 * Valeur du registre 'key', ou null s'il n'existe pas. Les registres ne stockent que du texte.
	 * Renvoie la valeur stockée dans le registre de l'entité associé à la clé key ou null si le registre n'existe pas.
	 * @param key La clé du registre dont la valeur sera retournée.
	 * @returns La valeur stockée dans le registre de clé key.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getRegister)
	 */
	get(key: string): string | null;
	/**
	 * Écrit un registre (la valeur est convertie en texte). false si la limite de registres est atteinte.
	 * Stocke la valeur value dans le registre de clé key. La clé et la valeur sont des chaînes qui doivent contenir respectivement 100 et 5000 caractères au maximum. Un poireau peut posséder au maximum 100 registres, le stockage dans un nouveau registre ne fonctionnera pas si tous les registres sont déjà occupés.
	 * @param key La clé du registre où stocker la valeur.
	 * @param value La valeur à stocker.
	 * @returns true si l'opération s'est bien passée, false sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/setRegister)
	 */
	set(key: string, value: any): boolean;
	/**
	 * Supprime le registre associé à la clé key s'il existe.
	 * @param key La clé du registre à supprimer.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/deleteRegister)
	 */
	delete(key: string): void;
	/**
	 * Tous les registres de l'entité, clé -> valeur.
	 * Renvoie l'ensemble des registres de l'entité sous la forme d'un tableau associatif [clé du registre : valeur du registre]. Exemple : debug(getRegisters()); // Affiche par exemple : // ['reg1' : '314323', 'reg2' : 'test_string']
	 * @returns Le tableau associatif correspondant à tous les registres de l'entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getRegisters)
	 */
	all(): Record<string, string>;
};

declare namespace Fight {
	/**
	 * L'IA courante (votre entité).
	 * Renvoie l'id de votre entité.
	 * @returns L'id de votre entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEntity)
	 */
	const me: Me;
	/**
	 * Renvoie le tour actuel du combat. Le nombre de tours maximum est MAX_TURNS.
	 * @returns Le tour actuel du combat.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTurn)
	 */
	const turn: number;
	/**
	 * Id du combat.
	 * Retourne l'id du combat actuel.
	 * @returns L'id du combat actuel.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFightID)
	 */
	const id: number;
	/**
	 * Type de combat (Fight.Type.SOLO...).
	 * Retourne le type de combat actuel.
	 * @returns Selon le type de combat : Combat en solo (FIGHT_TYPE_SOLO), Combat d'éleveur (FIGHT_TYPE_FARMER), Combat d'équipe (FIGHT_TYPE_TEAM), Battle Royale (FIGHT_TYPE_BATTLE_ROYALE)
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFightType)
	 */
	const type: Fight.Type;
	/**
	 * Contexte du combat (Fight.Context.GARDEN...).
	 * Retourne le contexte du combat actuel.
	 * @returns Selon le contexte du combat : Combat de test (FIGHT_CONTEXT_TEST), Combat en arène (FIGHT_CONTEXT_GARDEN), Combat en tournoi (FIGHT_CONTEXT_TOURNAMENT), Combat en défi (FIGHT_CONTEXT_CHALLENGE), Battle Royale (FIGHT_CONTEXT_BATTLE_ROYALE)
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFightContext)
	 */
	const context: Fight.Context;
	/**
	 * Boss du combat (Fight.Boss.*), s'il y en a un.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFightBoss)
	 */
	const boss: Fight.Boss;
	/**
	 * Retourne le côté de l'équipe gagnante. À utiliser uniquement dans afterFight(). Renvoie -1 si le combat n'est pas terminé.
	 * @returns Le côté gagnant : 0 (notre côté), 1 (côté adverse), 2 (égalité), ou -1 si combat en cours.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getWinner)
	 */
	const winner: number;
	/**
	 * Somme des PV des alliés / des ennemis.
	 * Retourne la vie totale de vos alliés.
	 * @returns La vie totale de vos alliés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAlliesLife)
	 */
	const alliesLife: number;
	/**
	 * Calcule la somme des points de vie de tous les entités ennemies.
	 * @returns La somme des points de vie de l'équipe ennemie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEnemiesLife)
	 */
	const enemiesLife: number;
	/**
	 * Renvoie l'entité ennemie la plus proche de votre entité.
	 * @returns L'id de l'entité ennemie la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestEnemy)
	 */
	function getNearestEnemy(): Entity | null;
	/**
	 * Renvoie l'entité alliée la plus proche de votre entité.
	 * @returns L'id de l'entité alliée la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestAlly)
	 */
	function getNearestAlly(): Entity | null;
	/**
	 * Détermine l'ennemi le plus éloigné de votre entité, à vol d'oiseau.
	 * @returns L'id de l'entité ennemie la plus éloignée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFarthestEnemy)
	 */
	function getFarthestEnemy(): Entity | null;
	/**
	 * Détermine l'allié le plus éloigné de votre entité, à vol d'oiseau.
	 * @returns L'id de l'entité alliée la plus éloignée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getFarthestAlly)
	 */
	function getFarthestAlly(): Entity | null;
	/**
	 * Renvoie l'entité ennemie la plus proche de l'entité fourni en paramètre.
	 * @param entity L'id de l'entité dont on veut connaitre l'ennemi le plus proche.
	 * @returns L'id de l'entité ennemie la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestEnemyTo)
	 */
	function getNearestEnemyTo(target: Entity | number): Entity | null;
	/**
	 * Renvoie l'entité alliée la plus proche de l'entité fourni en paramètre.
	 * @param entity L'id de l'entité dont on veut connaitre l'allié le plus proche.
	 * @returns L'id de l'entitée alliée la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestAllyTo)
	 */
	function getNearestAllyTo(target: Entity | number): Entity | null;
	/**
	 * Renvoie les entités ennemies (vivantes ou mortes) dans le combat.
	 * @returns Un tableau contenant les ids de tous les entités ennemies.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEnemies)
	 */
	function getEnemies(): Entity[];
	/**
	 * Retourne un tableau contenant vos alliés, et votre entité.
	 * @returns Le tableau des alliés et votre entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAllies)
	 */
	function getAllies(): Entity[];
	/**
	 * Retourne un tableau de tous vos ennemis vivants dans le combat.
	 * @returns Un tableau contenant les ids de tous vos ennemis vivants.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAliveEnemies)
	 */
	function getAliveEnemies(): Entity[];
	/**
	 * Retourne un tableau de tous vos alliés vivants dans le combat.
	 * @returns Un tableau contenant les ids de tous vos alliés vivants.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAliveAllies)
	 */
	function getAliveAllies(): Entity[];
	/**
	 * Renvoie les entités ennemies mortes.
	 * @returns Le tableau des entités ennemies mortes.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDeadEnemies)
	 */
	function getDeadEnemies(): Entity[];
	/**
	 * Renvoie les entités alliées mortes.
	 * @returns Le tableau des entités alliées mortes.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDeadAllies)
	 */
	function getDeadAllies(): Entity[];
	/**
	 * Renvoie le nombre d'ennemis dans le combat.
	 * @returns Le nombre d'ennemis.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEnemiesCount)
	 */
	function getEnemiesCount(): number;
	/**
	 * Renvoie le nombre d'alliés dans le combat.
	 * @returns Le nombre d'alliés.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAlliesCount)
	 */
	function getAlliesCount(): number;
	/**
	 * Renvoie le nombre d'ennemis vivants dans le combat.
	 * @returns Le nombre d'ennemis vivants.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAliveEnemiesCount)
	 */
	function getAliveEnemiesCount(): number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getAliveAlliesCount) */
	function getAliveAlliesCount(): number;
	/**
	 * Renvoie le nombre d'ennemis morts dans le combat.
	 * @returns Le nombre d'ennemis morts.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDeadEnemiesCount)
	 */
	function getDeadEnemiesCount(): number;
	/**
	 * Retourne l'id de la tourelle de votre équipe ou -1 si elle n'existe pas.
	 * @returns L'id de la tourelle de votre équipe.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getAlliedTurret)
	 */
	function getAlliedTurret(): Entity | null;
	/**
	 * Retourne l'id de la tourelle ennemie ou -1 si elle n'existe pas.
	 * @returns L'id de la tourelle ennemie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getEnemyTurret)
	 */
	function getEnemyTurret(): Entity | null;
	/**
	 * Entité alliée/ennemie la plus proche d'une CELLULE.
	 * Renvoie l'entité ennemie la plus proche de la cellule fournie en paramètre.
	 * @param cell L'id de la cellule dont on veut connaitre l'ennemi le plus proche.
	 * @returns L'id de l'entité ennemie la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestEnemyToCell)
	 */
	function getNearestEnemyToCell(cell: Cell | Entity | number): Entity | null;
	/**
	 * Renvoie l'entité alliée la plus proche de la cellule fournie en paramètre.
	 * @param cell L'id de la cellule dont on veut connaitre l'allié le plus proche.
	 * @returns L'id de l'entité alliée la plus proche.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNearestAllyToCell)
	 */
	function getNearestAllyToCell(cell: Cell | Entity | number): Entity | null;
	/**
	 * Joueur suivant / précédent dans l'ordre de jeu (défaut : relatif à soi).
	 * Renvoie l'id de l'entité qui jouera après l'entité entity. Sans paramètre, renvoie l'entité qui jouera après le joueur actuel.
	 * @param entity (optionnel) L'id de l'entité de référence.
	 * @returns Le joueur suivant.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getNextPlayer)
	 */
	function getNextPlayer(entity?: Entity | number): Entity | null;
	/**
	 * Renvoie l'id de l'entité ayant joué avant l'entité entity. Sans paramètre, renvoie l'entité ayant joué avant le joueur actuel.
	 * @param entity (optionnel) L'id de l'entité de référence.
	 * @returns Le joueur précédent.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPreviousPlayer)
	 */
	function getPreviousPlayer(entity?: Entity | number): Entity | null;
	/**
	 * Paroles prononcées (say) par les entités : liste de [entité, message].
	 * Renvoie le tableau des say() des entités précédentes, sous la forme [entity_id, message].
	 * @returns Le tableau des say() précédents.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/listen)
	 */
	function listen(): any[][];
}

declare namespace Field {
	/**
	 * Renvoie le type de terrain sur lequel se déroule le combat (usine, désert, forêt etc.), parmi les constantes MAP_NEXUS, MAP_FACTORY, MAP_DESERT, MAP_FOREST, MAP_GLACIER et MAP_BEACH.
	 * @returns Le type de terrain.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMapType)
	 */
	const type: Field.Type;
	/**
	 * Retourne l'id de la cellule se trouvant à la position (x, y).
	 * @param x La position en x de la cellule.
	 * @param y La position en y de la cellule.
	 * @returns L'id de la cellule à la position (x, y), null si la cellule n'existe pas.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellFromXY)
	 */
	function cellFromXY(x: number, y: number): Cell | null;
	/**
	 * Renvoie la liste des cases obstacles du terrain.
	 * @returns Le tableau contenant les id des cellules obstacles.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getObstacles)
	 */
	function getObstacles(): Cell[];
	/**
	 * Calcule la distance à vol d'oiseau entre deux cellules cell1 et cell2. Pour obtenir la distance en nombre de cellules, voir getCellDistance, et pour obtenir la longueur du chemin entre les deux cellules en esquivant les divers obstacles, voir getPathLength.
	 * @param cell1 La cellule de départ.
	 * @param cell2 La cellule d'arrivée.
	 * @returns La distance à vol d'oiseau entre les deux cellules.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDistance)
	 */
	function distance(a: Cell | Entity | number, b: Cell | Entity | number): number;
	/**
	 * Retourne la distance entre deux cellules cell1 et cell2. La distance retournée est exprimée en nombre de cellules, et ne tient pas compte des divers obstacles entre les deux cellules. Pour obtenir la distance à vol d'oiseau, voir getDistance et pour obtenir la distance du chemin entre les deux cellules en évitant les obstacles, voir getPathLength.
	 * @param cell1 L'id de la cellule de départ.
	 * @param cell2 L'id de la cellule d'arrivée.
	 * @returns La distance entre les deux cellules cell1 et cell2.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getCellDistance)
	 */
	function cellDistance(a: Cell | Entity | number, b: Cell | Entity | number): number;
	/**
	 * Renvoie la longueur du chemin entre deux cellules cell1 et cell2, en esquivant les obstacles, en ignorant les cellules contenues dans le tableau ignoredCells. Cette fonction équivaut à count(getPath(cell1, cell2, ignoredCells)). Si un joueur se situe sur une cellule ignorée, le chemin peut passer sur lui. La cellule de départ cell1 n'est jamais comptée dans le résultat. La cellule cell2 est comptée dans le résultat si et seulement si elle est vide ou ignorée par ignoredCells. Si aucun chemin n'existe entre les deux cellules, getPathLength renvoie null.
	 * @param cell1 La cellule de départ.
	 * @param cell2 La cellule d'arrivée.
	 * @param ignoredCells (optionnel) Le tableau des cellules à ignorer.
	 * @returns La longueur du chemin entre cell1 et cell2.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPathLength)
	 */
	function pathLength(a: Cell | Entity | number, b: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): number;
	/**
	 * Vérifie la ligne de vue entre la cellule start et la cellule end, en ignorant les entités ignoredEntities.
	 * @param start Cellule de départ.
	 * @param end Cellule cible.
	 * @param entityToIgnore (optionnel) Une entité ou liste d'entités à ignorer.
	 * @returns Retourne vrai si la ligne de vue est dégagée.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/lineOfSight)
	 */
	function lineOfSight(a: Cell | Entity | number, b: Cell | Entity | number, ignoredEntities?: Entity | number | (Entity | number)[]): boolean;
	/**
	 * Les deux cases sont-elles alignées (même ligne ou colonne).
	 * Détermine si deux cellules cell1 et cell2 sont sur la même ligne.
	 * @param cell1 La première cellule.
	 * @param cell2 La deuxième cellule.
	 * @returns vrai si les deux cellules sont sur la même ligne, faux sinon.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/isOnSameLine)
	 */
	function onSameLine(a: Cell | Entity | number, b: Cell | Entity | number): boolean;
	/**
	 * Chemin (liste de cellules) de 'from' à 'to', en évitant 'ignoredCells'.
	 * Renvoie le chemin en évitant les obstacles entre deux cellules cell1 et cell2, si celui-ci existe, en ignorant les cellules contenues dans le tableau ignoredCells. Si un joueur se situe sur une cellule ignorée, le chemin peut passer sur lui. La cellule de départ cell1 ne fait jamais partie du chemin résultant. La cellule cell2 fait partie du chemin résultant si et seulement si elle est vide ou ignorée par ignoredCells. Si aucun chemin n'existe entre les deux cellules, getPath renvoie null.
	 * @param start La cellule de départ.
	 * @param end La cellule d'arrivée.
	 * @param ignoredCells (optionnel) Le tableau des cellules à ignorer.
	 * @returns Le tableau contenant les cellules constituant le chemin entre les deux cellules.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getPath)
	 */
	function path(from: Cell | Entity | number, to: Cell | Entity | number, ignoredCells?: (Cell | Entity | number)[]): Cell[];
}

declare const Network: {
	/**
	 * Envoie un message typé (Message.Type.*) à une entité alliée.
	 * Envoie un message à l'entité d'id entity.
	 * @param entity L'id de l'entité auquelle sera envoyé le message.
	 * @param type Le type du message à envoyer (voir les constantes MESSAGE_*).
	 * @param params Les paramètres du message, qui peuvent être n'importe quelle valeur.
	 * @returns true si l'envoi a été effecuté, false si une erreur est survenue.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/sendTo)
	 */
	sendTo(entity: Entity | number, type: Message.Type, params: any): boolean;
	/**
	 * Envoie un message typé à toutes les entités alliées.
	 * Envoie un message à toute votre équipe.
	 * @param type Le type du message à envoyer (voir les constantes MESSAGE_*).
	 * @param params Les paramètres du message, qui peuvent être n'importe quelle valeur.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/sendAll)
	 */
	sendAll(type: Message.Type, params: any): void;
	/**
	 * Messages reçus (de 'entity' seulement si fourni).
	 * Renvoie le tableau des messages de l'entité entity.
	 * @param entity (optionnel) L'entité dont les messages seront renvoyés.
	 * @returns Le tableau de vos messages. Un message est représenté lui-même sous la forme d'un tableau de la forme : [auteur, type, paramètres] Les différents types de messages sont représentés par les constantes : MESSAGE_HEAL : demande de soins MESSAGE_ATTACK : demande d'attaquer MESSAGE_BUFF_FORCE : demande de boost force ...
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getMessages)
	 */
	getMessages(entity?: Entity | number): Message[];
};

declare const Debug: {
	/**
	 * Écrit dans le journal de combat, éventuellement en couleur (cf Color). console.log existe aussi.
	 * Enregistre un message object dans le log personnel, disponible dans le rapport à la fin du combat.
	 * @param object Le message à enregistrer.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/debug)
	 */
	log(value: any, color?: Color.Value): void;
	/**
	 * Marque une ou plusieurs cellules de la couleur indiquée en paramètre sur le terrain pour le nombre de tour indiqué en paramètre. Ce marquage n'est visible que par l'éleveur de l'entité.
	 * @param cells La cellule ou tableau de plusieurs cellules à marquer
	 * @param color (optionnel) Couleur du marquage
	 * @param duration (optionnel) Durée du marquage
	 * @returns Retourne true si tout s'est bien déroulé
	 * 📖 [Documentation](https://leekwars.com/help/documentation/mark)
	 */
	mark(cells: Cell | Entity | number | (Cell | Entity | number)[], color?: Color.Value, duration?: number): boolean;
	/**
	 * Écrit un texte sur une ou plusieurs cellules de la couleur indiquée en paramètre sur le terrain pour le nombre de tour indiqué en paramètre. Ces textes ne sont visibles que par l'éleveur de l'entité.
	 * @param cells La cellule ou tableau de plusieurs cellules où écrire
	 * @param text (optionnel) Le texte à écrire (maximum 10 caractères)
	 * @param color (optionnel) Couleur du texte
	 * @param duration (optionnel) Durée du texte
	 * @returns Retourne true si tout s'est bien déroulé
	 * 📖 [Documentation](https://leekwars.com/help/documentation/markText)
	 */
	markText(cells: Cell | Entity | number | (Cell | Entity | number)[], text: any, color?: Color.Value, duration?: number): boolean;
	/**
	 * Efface tous les marquages effectués par mark() et markText() sur le terrain.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/clearMarks)
	 */
	clearMarks(): void;
	/**
	 * Montre aux joueurs une cellule cell de la couleur color sur le terrain pour 1 tour. L'utilisation de cette fonction coûte 1PT.
	 * @param cell La cellule à montrer
	 * @param color (optionnel) Couleur du marquage
	 * @returns Retourne true si tout s'est bien déroulé
	 * 📖 [Documentation](https://leekwars.com/help/documentation/show)
	 */
	show(cell: Cell | Entity | number, color?: Color.Value): boolean;
	/**
	 * Met en pause le combat, uniquement pour l'éleveur de l'entité qui utilise la fonction.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/pause)
	 */
	pause(): void;
};

declare namespace System {
	/**
	 * Opérations consommées ce tour (à comparer à maxOperations pour borner une recherche).
	 * Renvoie le nombre d'opérations consommées par votre entité depuis le début de son tour. Ce nombre doit rester inférieur à OPERATIONS_LIMIT pour ne pas que l'entité plante.
	 * @returns Nombre d'opérations consommées par votre entité depuis le début de son tour.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getOperations)
	 */
	const operations: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getMaxOperations) */
	const maxOperations: number;
	/**
	 * Renvoie le nombre d'instructions que votre entité a effectué durant le tour actuel.
	 * @returns Le nombre d'instructions que votre entité a effectué durant le tour actuel.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getInstructionsCount)
	 */
	const instructionsCount: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getUsedRAM) */
	const usedRAM: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/getMaxRAM) */
	const maxRAM: number;
	/**
	 * Renvoie la date du combat, au format dd/MM/yyyy.
	 * @returns La date du combat.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getDate)
	 */
	const date: string;
	/**
	 * Renvoie le temps du combat, au format HH:mm:ss.
	 * @returns Le temps du combat.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTime)
	 */
	const time: string;
	/**
	 * Renvoie l'horodatage du combat, égual au nombre de secondes depuis le 1er janvier 1970.
	 * @returns L'horodatage du combat.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getTimestamp)
	 */
	const timestamp: number;
}

declare namespace Color {
	/**
	 * Compose une couleur depuis ses composantes 0-255.
	 * Retourne l'entier correspondant à la couleur (red, green, blue) fournie en paramètres.
	 * @param red Valeur du rouge entre 0 et 255.
	 * @param green Valeur du vert entre 0 et 255.
	 * @param blue Valeur du bleu entre 0 et 255.
	 * @returns int correspondant à la couleur fournie en paramètre.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getColor)
	 */
	function rgb(r: number, g: number, b: number): Color.Value;
	/**
	 * Renvoie le taux de rouge dans la couleur color, entre 0 et 255. Par exemple, getRed(COLOR_RED) = 255 et getRed(COLOR_BLUE) = 0.
	 * @param color La couleur dont le taux de rouge sera renvoyé.
	 * @returns Le taux de rouge dans la couleur color
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getRed)
	 */
	function red(color: Color.Value): number;
	/**
	 * Renvoie le taux de vert dans la couleur color, entre 0 et 255. Par exemple, getGreen(COLOR_GREEN) = 255 et getGreen(COLOR_RED) = 0.
	 * @param color La couleur dont le taux de vert sera renvoyé.
	 * @returns Le taux de vert dans la couleur color
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getGreen)
	 */
	function green(color: Color.Value): number;
	/**
	 * Renvoie le taux de bleu dans la couleur color, entre 0 et 255. Par exemple, getBlue(COLOR_BLUE) = 255 et getBlue(COLOR_GREEN) = 0.
	 * @param color La couleur dont le taux de bleu sera renvoyé.
	 * @returns Le taux de bleu dans la couleur color
	 * 📖 [Documentation](https://leekwars.com/help/documentation/getBlue)
	 */
	function blue(color: Color.Value): number;
}


declare namespace Effect {
	/** Constante de la famille Effect.Type (ABSOLUTE_SHIELD, ABSOLUTE_VULNERABILITY, ADD_STATE...). */
	type Type = number;
	/** Constante de la famille Effect.Modifier (IRREDUCTIBLE, MULTIPLIED_BY_TARGETS, NOT_REPLACEABLE...). */
	type Modifier = number;
	/** Constante de la famille Effect.Target (ALLIES, ALWAYS_CASTER, CASTER...). */
	type Target = number;
	/**
	 * Procure du bouclier absolu à une entité, permettant de réduire la quantité de points de vie retirée par les dégâts (EFFECT_DAMAGE) d'un montant fixe. Amplifié par la résistance.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ABSOLUTE_SHIELD)
	 */
	const ABSOLUTE_SHIELD: Effect.Type;
	/**
	 * Retire du bouclier absolu à une entité. N'est pas amplifié par une caractéristique. Permet d'augmenter les points de vie retiré par les dégâts (EFFECT_DAMAGE) d'un montant absolu.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ABSOLUTE_VULNERABILITY)
	 */
	const ABSOLUTE_VULNERABILITY: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ADD_STATE) */
	const ADD_STATE: Effect.Type;
	/**
	 * Retire des points de vie à une entité. Amplifié par la science. Réduit le maximum de points de vie de 5% du montant de points de vie retiré.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_AFTEREFFECT)
	 */
	const AFTEREFFECT: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ALLY_KILLED_TO_AGILITY) */
	const ALLY_KILLED_TO_AGILITY: Effect.Type;
	/**
	 * Retire tous les poison (EFFECT_POISON) présent sur une cible.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ANTIDOTE)
	 */
	const ANTIDOTE: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_ATTRACT) */
	const ATTRACT: Effect.Type;
	/**
	 * Augmente les points de vie et le maximum de points de vie d'une entité. Amplifié par la sagesse.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BOOST_MAX_LIFE)
	 */
	const BOOST_MAX_LIFE: Effect.Type;
	/**
	 * Procure de l'agilité à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_AGILITY)
	 */
	const BUFF_AGILITY: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_FORCE) */
	const BUFF_FORCE: Effect.Type;
	/**
	 * Procure des points de mouvement à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_MP)
	 */
	const BUFF_MP: Effect.Type;
	/**
	 * Procure de la résistance à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_RESISTANCE)
	 */
	const BUFF_RESISTANCE: Effect.Type;
	/**
	 * Procure de la force à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_STRENGTH)
	 */
	const BUFF_STRENGTH: Effect.Type;
	/**
	 * Procure des points d'action à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_TP)
	 */
	const BUFF_TP: Effect.Type;
	/**
	 * Procure de la sagesse à une entité. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_BUFF_WISDOM)
	 */
	const BUFF_WISDOM: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_CRITICAL_TO_HEAL) */
	const CRITICAL_TO_HEAL: Effect.Type;
	/**
	 * Retire des points de vie à une entité. Amplifié par la force. Interagit avec les boucliers (EFFECT_ABSOLUTE_SHIELD, EFFECT_RELATIVE_SHIELD, EFFECT_VULNERABILITY, EFFECT_ABSOLUTE_VULNERABILITY), le vol de vie (à l'exception du lanceur), et le retour de dégâts (EFFECT_DAMAGE_RETURN). Réduit le maximum de points de vie de 5% du montant de points de vie retiré.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DAMAGE)
	 */
	const DAMAGE: Effect.Type;
	/**
	 * Procure du renvoi de dégâts à une entité, permettant de retirer des points de vie aux entités infligeant des dégâts au bénéficiaire. Amplifié par l'agilité. Réduit le maximum de points de vie de 5% du montant de points de vie retiré.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DAMAGE_RETURN)
	 */
	const DAMAGE_RETURN: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DAMAGE_TO_ABSOLUTE_SHIELD) */
	const DAMAGE_TO_ABSOLUTE_SHIELD: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DAMAGE_TO_RESISTANCE) */
	const DAMAGE_TO_RESISTANCE: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DAMAGE_TO_STRENGTH) */
	const DAMAGE_TO_STRENGTH: Effect.Type;
	/**
	 * Réduit la valeur de tous les effets présents sur une entité d'un pourcentage.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_DEBUFF)
	 */
	const DEBUFF: Effect.Type;
	/**
	 * Rend des points de vie à une entité, limité par le maximum de points de vie. Amplifié par la sagesse.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_HEAL)
	 */
	const HEAL: Effect.Type;
	/**
	 * Échange la position du lanceur avec celle d'une entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_INVERT)
	 */
	const INVERT: Effect.Type;
	/**
	 * Retire tous les points de vie d'une entité.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_KILL)
	 */
	const KILL: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_KILL_TO_TP) */
	const KILL_TO_TP: Effect.Type;
	/**
	 * Retire des points de vie à une entité, dépendant d'un pourcentage de la vie du lanceur. Interagit avec les boucliers (EFFECT_ABSOLUTE_SHIELD, EFFECT_RELATIVE_SHIELD, EFFECT_VULNERABILITY, EFFECT_ABSOLUTE_VULNERABILITY) et le retour de dégâts (EFFECT_DAMAGE_RETURN). Réduit le maximum de points de vie de 5% du montant de points de vie retiré.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_LIFE_DAMAGE)
	 */
	const LIFE_DAMAGE: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MOVED_TO_MP) */
	const MOVED_TO_MP: Effect.Type;
	/**
	 * Retire des points de vie max. Amplifié par la science.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_NOVA_DAMAGE)
	 */
	const NOVA_DAMAGE: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_NOVA_DAMAGE_TO_MAGIC) */
	const NOVA_DAMAGE_TO_MAGIC: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_NOVA_VITALITY) */
	const NOVA_VITALITY: Effect.Type;
	/**
	 * Retire des points de vie à une entité. Amplifié par la magie. Réduit le maximum de points de vie de 10% du montant de points de vie retiré.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_POISON)
	 */
	const POISON: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_POISON_TO_SCIENCE) */
	const POISON_TO_SCIENCE: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_PROPAGATION) */
	const PROPAGATION: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_PUSH) */
	const PUSH: Effect.Type;
	/**
	 * Procure du bouclier absolu à une entité, permettant de réduire la quantité de points de vie retirée par les dégâts (EFFECT_DAMAGE) d'un montant fixe. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_ABSOLUTE_SHIELD)
	 */
	const RAW_ABSOLUTE_SHIELD: Effect.Type;
	/**
	 * Procure de l'agilité à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_AGILITY)
	 */
	const RAW_BUFF_AGILITY: Effect.Type;
	/**
	 * Procure de la magie à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_MAGIC)
	 */
	const RAW_BUFF_MAGIC: Effect.Type;
	/**
	 * Procure des points de mouvement à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_MP)
	 */
	const RAW_BUFF_MP: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_POWER) */
	const RAW_BUFF_POWER: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_RESISTANCE) */
	const RAW_BUFF_RESISTANCE: Effect.Type;
	/**
	 * Procure de la science à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_SCIENCE)
	 */
	const RAW_BUFF_SCIENCE: Effect.Type;
	/**
	 * Procure de la force à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_STRENGTH)
	 */
	const RAW_BUFF_STRENGTH: Effect.Type;
	/**
	 * Procure des points d'action à une entité. Non amplifiable.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_TP)
	 */
	const RAW_BUFF_TP: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_BUFF_WISDOM) */
	const RAW_BUFF_WISDOM: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_HEAL) */
	const RAW_HEAL: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RAW_RELATIVE_SHIELD) */
	const RAW_RELATIVE_SHIELD: Effect.Type;
	/**
	 * Procure un bouclier relatif, permettant de réduire la quantité de points de vie retiré par les dégâts (EFFECT_DAMAGE) d'un montant relatif. Amplifié par la résistance.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RELATIVE_SHIELD)
	 */
	const RELATIVE_SHIELD: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_REMOVE_SHACKLES) */
	const REMOVE_SHACKLES: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_REPEL) */
	const REPEL: Effect.Type;
	/**
	 * Ressuscite une entité, avec un nombre de PV maximum égal à la moitié du nombre de PV maximum de l'entité avant résurrection, et un nombre de PV courant égal au quart du nombre de PV maximum avant résurrection.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_RESURRECT)
	 */
	const RESURRECT: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_AGILITY) */
	const SHACKLE_AGILITY: Effect.Type;
	/**
	 * Retire de la magie à une entité. Amplifié par la magie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_MAGIC)
	 */
	const SHACKLE_MAGIC: Effect.Type;
	/**
	 * Retire des points de mouvement à une entité. Amplifié par la magie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_MP)
	 */
	const SHACKLE_MP: Effect.Type;
	/**
	 * Retire de la force à une entité. Amplifié par la magie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_STRENGTH)
	 */
	const SHACKLE_STRENGTH: Effect.Type;
	/**
	 * Retire des points d'action à une entité. Amplifié par la magie.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_TP)
	 */
	const SHACKLE_TP: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SHACKLE_WISDOM) */
	const SHACKLE_WISDOM: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SLIDE_TO) */
	const SLIDE_TO: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_STEAL_ABSOLUTE_SHIELD) */
	const STEAL_ABSOLUTE_SHIELD: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_STEAL_LIFE) */
	const STEAL_LIFE: Effect.Type;
	/**
	 * Invoque un bulbe. Aucun effet si la limite d'invocation de l'équipe est atteinte.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_SUMMON)
	 */
	const SUMMON: Effect.Type;
	/**
	 * Change la position du lanceur.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TELEPORT)
	 */
	const TELEPORT: Effect.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TOTAL_DEBUFF) */
	const TOTAL_DEBUFF: Effect.Type;
	/**
	 * Retire du bouclier relatif à une entité. N'est pas amplifié par une caractéristique. Permet d'augmenter les points de vie retiré par les dégâts (EFFECT_DAMAGE) d'un montant relatif.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_VULNERABILITY)
	 */
	const VULNERABILITY: Effect.Type;
	namespace Modifier {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MODIFIER_IRREDUCTIBLE) */
		const IRREDUCTIBLE: Effect.Modifier;
		/**
		 * L'effet est multiplié par le nombre d'entités affectées dans la zone.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MODIFIER_MULTIPLIED_BY_TARGETS)
		 */
		const MULTIPLIED_BY_TARGETS: Effect.Modifier;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MODIFIER_NOT_REPLACEABLE) */
		const NOT_REPLACEABLE: Effect.Modifier;
		/**
		 * L'effet affecte toujours le lanceur.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MODIFIER_ON_CASTER)
		 */
		const ON_CASTER: Effect.Modifier;
		/**
		 * L'effet est cumulable.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_MODIFIER_STACKABLE)
		 */
		const STACKABLE: Effect.Modifier;
	}
	namespace Target {
		/**
		 * Affecte les alliés.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_ALLIES)
		 */
		const ALLIES: Effect.Target;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_ALWAYS_CASTER) */
		const ALWAYS_CASTER: Effect.Target;
		/**
		 * Affecte le lanceur.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_CASTER)
		 */
		const CASTER: Effect.Target;
		/**
		 * Affecte les ennemis.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_ENEMIES)
		 */
		const ENEMIES: Effect.Target;
		/**
		 * Affecte les entités non-invoquées (Poireaux et tourelles).
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_NON_SUMMONS)
		 */
		const NON_SUMMONS: Effect.Target;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_NOT_CASTER) */
		const NOT_CASTER: Effect.Target;
		/**
		 * Affecte les entités invoquées (Bulbes).
		 * 📖 [Documentation](https://leekwars.com/help/documentation/EFFECT_TARGET_SUMMONS)
		 */
		const SUMMONS: Effect.Target;
	}
}

declare namespace State {
	/** Constante de la famille State.Type (INVINCIBLE, PACIFIST, STATIC...). */
	type Type = number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/STATE_INVINCIBLE) */
	const INVINCIBLE: State.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/STATE_PACIFIST) */
	const PACIFIST: State.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/STATE_STATIC) */
	const STATIC: State.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/STATE_UNHEALABLE) */
	const UNHEALABLE: State.Type;
}

declare namespace Field {
	/** Constante de la famille Field.Type (NEXUS, FACTORY, DESERT...). */
	type Type = number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_NEXUS) */
	const NEXUS: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_FACTORY) */
	const FACTORY: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_DESERT) */
	const DESERT: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_FOREST) */
	const FOREST: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_GLACIER) */
	const GLACIER: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_BEACH) */
	const BEACH: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_TEMPLE) */
	const TEMPLE: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_CASTLE) */
	const CASTLE: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_CEMETERY) */
	const CEMETERY: Field.Type;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/MAP_TEIEN) */
	const TEIEN: Field.Type;
}

declare namespace Color {
	/** Constante de la famille Color.Value (BLUE, GREEN, RED...). */
	type Value = number;
	/**
	 * Couleur bleue.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/COLOR_BLUE)
	 */
	const BLUE: Color.Value;
	/**
	 * Couleur verte.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/COLOR_GREEN)
	 */
	const GREEN: Color.Value;
	/**
	 * Couleur rouge.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/COLOR_RED)
	 */
	const RED: Color.Value;
}

declare namespace Item {
	/** Constante de la famille Item.LaunchType (CIRCLE, DIAGONAL, DIAGONAL_INVERTED...). */
	type LaunchType = number;
	/** Constante de la famille Item.Area (ALLIES, CIRCLE_1, CIRCLE_2...). */
	type Area = number;
	namespace Area {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_ALLIES) */
		const ALLIES: Item.Area;
		/**
		 * Zone circulaire de 3 cases de diamètre (croix).
		 * 📖 [Documentation](https://leekwars.com/help/documentation/AREA_CIRCLE_1)
		 */
		const CIRCLE_1: Item.Area;
		/**
		 * Zone circulaire de 5 cases de diamètre.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/AREA_CIRCLE_2)
		 */
		const CIRCLE_2: Item.Area;
		/**
		 * Zone circulaire de 7 cases de diamètre.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/AREA_CIRCLE_3)
		 */
		const CIRCLE_3: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_ENEMIES) */
		const ENEMIES: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_FIRST_INLINE) */
		const FIRST_INLINE: Item.Area;
		/**
		 * Zone d'une laser, ligne depuis la portée minimum du laser jusqu’à sa portée maximum ou bien un obstacle.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/AREA_LASER_LINE)
		 */
		const LASER_LINE: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_PLUS_1) */
		const PLUS_1: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_PLUS_2) */
		const PLUS_2: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_PLUS_3) */
		const PLUS_3: Item.Area;
		/**
		 * Zone constituée d'une seule case.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/AREA_POINT)
		 */
		const POINT: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_SQUARE_1) */
		const SQUARE_1: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_SQUARE_2) */
		const SQUARE_2: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_X_1) */
		const X_1: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_X_2) */
		const X_2: Item.Area;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/AREA_X_3) */
		const X_3: Item.Area;
	}
	namespace LaunchType {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_CIRCLE) */
		const CIRCLE: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_DIAGONAL) */
		const DIAGONAL: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_DIAGONAL_INVERTED) */
		const DIAGONAL_INVERTED: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_LINE) */
		const LINE: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_LINE_INVERTED) */
		const LINE_INVERTED: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_STAR) */
		const STAR: Item.LaunchType;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/LAUNCH_TYPE_STAR_INVERTED) */
		const STAR_INVERTED: Item.LaunchType;
	}
}

declare namespace Fight {
	/** Constante de la famille Fight.Type (BATTLE_ROYALE, BOSS, CHEST_HUNT...). */
	type Type = number;
	/** Constante de la famille Fight.Context (BATTLE_ROYALE, CHALLENGE, GARDEN...). */
	type Context = number;
	/** Constante de la famille Fight.Boss (EVIL_PUMPKIN, FENNEL_KING, NASU_SAMOURAI...). */
	type Boss = number;
	/** Constante de la famille Fight.Erosion (CRITICAL_BONUS, DAMAGE, POISON...). */
	type Erosion = number;
	/** Constante de la famille Fight.Use (CRITICAL, FAILED, INVALID_COOLDOWN...). */
	type Use = number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CRITICAL_FACTOR) */
	const CRITICAL_FACTOR: number;
	/**
	 * Nombre de tours maximum dans un combat.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/MAX_TURNS)
	 */
	const MAX_TURNS: number;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/SUMMON_LIMIT) */
	const SUMMON_LIMIT: number;
	namespace Use {
		/**
		 * Valeur renvoyée par les fonctions useWeapon, useWeaponOnCell, useChip et useChipOnCell en cas de coup critique.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_CRITICAL)
		 */
		const CRITICAL: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useWeapon, useWeaponOnCell, useChip et useChipOnCell en cas de d'échec.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_FAILED)
		 */
		const FAILED: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useChip et useChipOnCell si la puce n'est pas encore utilisable.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_INVALID_COOLDOWN)
		 */
		const INVALID_COOLDOWN: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useWeapon, useWeaponOnCell, useChip et useChipOnCell si la portée est mauvaise ou la ligne de vue n'est pas dégagée.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_INVALID_POSITION)
		 */
		const INVALID_POSITION: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useWeapon et useChip si la cible n'existe pas.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_INVALID_TARGET)
		 */
		const INVALID_TARGET: Fight.Use;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/USE_MAX_USES) */
		const MAX_USES: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useWeapon, useWeaponOnCell, useChip et useChipOnCell si le lanceur n'a pas assez de points d'action pour utiliser l'objet.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_NOT_ENOUGH_TP)
		 */
		const NOT_ENOUGH_TP: Fight.Use;
		/**
		 * Valeur renvoyée par la fonction resurrect lorsque l'entité spécifiée n'existe pas ou n'est pas encore morte.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_RESURRECT_INVALID_ENTITY)
		 */
		const RESURRECT_INVALID_ENTITY: Fight.Use;
		/**
		 * Valeur renvoyée par les fonctions useWeapon, useWeaponOnCell, useChip et useChipOnCell en cas de réussite.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_SUCCESS)
		 */
		const SUCCESS: Fight.Use;
		/**
		 * Erreur renvoyée par summon lorsque vous avez déjà 8 invocations vivantes.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/USE_TOO_MANY_SUMMONS)
		 */
		const TOO_MANY_SUMMONS: Fight.Use;
	}
	namespace Erosion {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EROSION_CRITICAL_BONUS) */
		const CRITICAL_BONUS: Fight.Erosion;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EROSION_DAMAGE) */
		const DAMAGE: Fight.Erosion;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/EROSION_POISON) */
		const POISON: Fight.Erosion;
	}
	namespace Boss {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/BOSS_EVIL_PUMPKIN) */
		const EVIL_PUMPKIN: Fight.Boss;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/BOSS_FENNEL_KING) */
		const FENNEL_KING: Fight.Boss;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/BOSS_NASU_SAMOURAI) */
		const NASU_SAMOURAI: Fight.Boss;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/BOSS_NASU_SAMURAI) */
		const NASU_SAMURAI: Fight.Boss;
	}
	namespace Context {
		/**
		 * Contexte de combat en Battle Royale.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_CONTEXT_BATTLE_ROYALE)
		 */
		const BATTLE_ROYALE: Fight.Context;
		/**
		 * Contexte de combat de type défi.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_CONTEXT_CHALLENGE)
		 */
		const CHALLENGE: Fight.Context;
		/**
		 * Contexte de combat dans le potager.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_CONTEXT_GARDEN)
		 */
		const GARDEN: Fight.Context;
		/**
		 * Contexte de combat de test.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_CONTEXT_TEST)
		 */
		const TEST: Fight.Context;
		/**
		 * Contexte de combat de tournois.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_CONTEXT_TOURNAMENT)
		 */
		const TOURNAMENT: Fight.Context;
	}
	namespace Type {
		/**
		 * Combat en Battle Royale.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_BATTLE_ROYALE)
		 */
		const BATTLE_ROYALE: Fight.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_BOSS) */
		const BOSS: Fight.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_CHEST_HUNT) */
		const CHEST_HUNT: Fight.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_COLOSSUS) */
		const COLOSSUS: Fight.Type;
		/**
		 * Combat d'éleveur.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_FARMER)
		 */
		const FARMER: Fight.Type;
		/**
		 * Combat en solo.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_SOLO)
		 */
		const SOLO: Fight.Type;
		/**
		 * Combat en équipe.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_TEAM)
		 */
		const TEAM: Fight.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/FIGHT_TYPE_WAR) */
		const WAR: Fight.Type;
	}
}

declare namespace Entity {
	/** Constante de la famille Entity.Stat (ABSOLUTE_SHIELD, AGILITY, CORES...). */
	type Stat = number;
	/** Constante de la famille Entity.Type (BULB, CHEST, LEEK...). */
	type Type = number;
	namespace Type {
		/**
		 * Désigne une entité de type Bulbe.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/ENTITY_BULB)
		 */
		const BULB: Entity.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/ENTITY_CHEST) */
		const CHEST: Entity.Type;
		/**
		 * Désigne une entité de type Poireau.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/ENTITY_LEEK)
		 */
		const LEEK: Entity.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/ENTITY_MOB) */
		const MOB: Entity.Type;
		/**
		 * Désigne une entité de type Tourelle.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/ENTITY_TURRET)
		 */
		const TURRET: Entity.Type;
	}
	namespace Stat {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_ABSOLUTE_SHIELD) */
		const ABSOLUTE_SHIELD: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_AGILITY) */
		const AGILITY: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_CORES) */
		const CORES: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_DAMAGE_RETURN) */
		const DAMAGE_RETURN: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_FREQUENCY) */
		const FREQUENCY: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_LIFE) */
		const LIFE: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_MAGIC) */
		const MAGIC: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_MP) */
		const MP: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_POWER) */
		const POWER: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_RAM) */
		const RAM: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_RELATIVE_SHIELD) */
		const RELATIVE_SHIELD: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_RESISTANCE) */
		const RESISTANCE: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_SCIENCE) */
		const SCIENCE: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_STRENGTH) */
		const STRENGTH: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_TP) */
		const TP: Entity.Stat;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/STAT_WISDOM) */
		const WISDOM: Entity.Stat;
	}
}

declare namespace Cell {
	/** Constante de la famille Cell.Type (EMPTY, ENTITY, OBSTACLE...). */
	type Type = number;
	namespace Type {
		/**
		 * Valeur de retour de getCellContent(cell) pour une case vide.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/CELL_EMPTY)
		 */
		const EMPTY: Cell.Type;
		/**
		 * Valeur de retour de getCellContent(cell) pour une case contenant une entité.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/CELL_ENTITY)
		 */
		const ENTITY: Cell.Type;
		/**
		 * Valeur de retour de getCellContent(cell) pour une case contenant un obstacle.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/CELL_OBSTACLE)
		 */
		const OBSTACLE: Cell.Type;
		/**
		 * Valeur de retour de getCellContent(cell) pour une case contenant une entité.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/CELL_PLAYER)
		 */
		const PLAYER: Cell.Type;
	}
}

declare namespace Chest {
	/** Constante de la famille Chest.Type (DIAMOND, IRON, WOOD...). */
	type Type = number;
	namespace Type {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/CHEST_DIAMOND) */
		const DIAMOND: Chest.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/CHEST_IRON) */
		const IRON: Chest.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/CHEST_WOOD) */
		const WOOD: Chest.Type;
	}
}

declare namespace Bulb {
	/** Constante de la famille Bulb.Type (FIRE, HEALER, ICED...). */
	type Type = number;
	namespace Type {
		/**
		 * Désigne le type de bulbe de Feu.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_FIRE)
		 */
		const FIRE: Bulb.Type;
		/**
		 * Désigne le type de bulbe Soigneur.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_HEALER)
		 */
		const HEALER: Bulb.Type;
		/**
		 * Désigne le type de bulbe Glacé.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_ICED)
		 */
		const ICED: Bulb.Type;
		/**
		 * Désigne le type de bulbe de Foudre.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_LIGHTNING)
		 */
		const LIGHTNING: Bulb.Type;
		/**
		 * Désigne le type de bulbe Métallique.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_METALLIC)
		 */
		const METALLIC: Bulb.Type;
		/**
		 * Désigne le type de bulbe Chétif.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_PUNY)
		 */
		const PUNY: Bulb.Type;
		/**
		 * Désigne le type de bulbe Rocheux.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_ROCKY)
		 */
		const ROCKY: Bulb.Type;
		/**
		 * Désigne le type de bulbe Savant.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_SAVANT)
		 */
		const SAVANT: Bulb.Type;
		/**
		 * Désigne le type de bulbe Tacticien.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_TACTICIAN)
		 */
		const TACTICIAN: Bulb.Type;
		/**
		 * Désigne le type de bulbe Sorcier.
		 * 📖 [Documentation](https://leekwars.com/help/documentation/BULB_WIZARD)
		 */
		const WIZARD: Bulb.Type;
	}
}

declare namespace Mob {
	/** Constante de la famille Mob.Type (BLUE_CRYSTAL, EVIL_PUMPKIN, FENNEL_KING...). */
	type Type = number;
	namespace Type {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_BLUE_CRYSTAL) */
		const BLUE_CRYSTAL: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_EVIL_PUMPKIN) */
		const EVIL_PUMPKIN: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_FENNEL_KING) */
		const FENNEL_KING: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_FENNEL_KNIGHT) */
		const FENNEL_KNIGHT: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_FENNEL_SCRIBE) */
		const FENNEL_SCRIBE: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_FENNEL_SQUIRE) */
		const FENNEL_SQUIRE: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_GRAAL) */
		const GRAAL: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_GREEN_CRYSTAL) */
		const GREEN_CRYSTAL: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_HUBBARD) */
		const HUBBARD: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_NASU_RONIN) */
		const NASU_RONIN: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_NASU_SAMURAI) */
		const NASU_SAMURAI: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_NASU_SEITO) */
		const NASU_SEITO: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_NASU_WARRIOR) */
		const NASU_WARRIOR: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_OFFSPRING) */
		const OFFSPRING: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_RED_CRYSTAL) */
		const RED_CRYSTAL: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_TURBAN) */
		const TURBAN: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_WARTY) */
		const WARTY: Mob.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MOB_YELLOW_CRYSTAL) */
		const YELLOW_CRYSTAL: Mob.Type;
	}
}

declare namespace Message {
	/** Constante de la famille Message.Type (ATTACK, BUFF_AGILITY, BUFF_MP...). */
	type Type = number;
	namespace Type {
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_ATTACK) */
		const ATTACK: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_BUFF_AGILITY) */
		const BUFF_AGILITY: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_BUFF_MP) */
		const BUFF_MP: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_BUFF_STRENGTH) */
		const BUFF_STRENGTH: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_BUFF_TP) */
		const BUFF_TP: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_CUSTOM) */
		const CUSTOM: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_DEBUFF) */
		const DEBUFF: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_HEAL) */
		const HEAL: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_MOVE_AWAY) */
		const MOVE_AWAY: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_MOVE_AWAY_CELL) */
		const MOVE_AWAY_CELL: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_MOVE_TOWARD) */
		const MOVE_TOWARD: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_MOVE_TOWARD_CELL) */
		const MOVE_TOWARD_CELL: Message.Type;
		/** 📖 [Documentation](https://leekwars.com/help/documentation/MESSAGE_SHIELD) */
		const SHIELD: Message.Type;
	}
}

declare namespace Weapon {
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_AXE) */
	const axe: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_BAZOOKA) */
	const bazooka: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_B_LASER) */
	const bLaser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_BROADSWORD) */
	const broadsword: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_DARK_KATANA) */
	const darkKatana: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_DESTROYER) */
	const destroyer: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_DOUBLE_GUN) */
	const doubleGun: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_ELECTRISOR) */
	const electrisor: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_ENHANCED_LIGHTNINGER) */
	const enhancedLightninger: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_EXPLORER_RIFLE) */
	const explorerRifle: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_FLAME_THROWER) */
	const flameThrower: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_GAZOR) */
	const gazor: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_GRENADE_LAUNCHER) */
	const grenadeLauncher: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_HEAVY_SWORD) */
	const heavySword: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_ILLICIT_GRENADE_LAUNCHER) */
	const illicitGrenadeLauncher: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_J_LASER) */
	const jLaser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_KATANA) */
	const katana: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_LASER) */
	const laser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_LIGHTNINGER) */
	const lightninger: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_MACHINE_GUN) */
	const machineGun: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_MAGNUM) */
	const magnum: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_M_LASER) */
	const mLaser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_MYSTERIOUS_ELECTRISOR) */
	const mysteriousElectrisor: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_NEUTRINO) */
	const neutrino: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_PISTOL) */
	const pistol: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_QUANTUM_RIFLE) */
	const quantumRifle: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_REVOKED_M_LASER) */
	const revokedMLaser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_RHINO) */
	const rhino: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_RIFLE) */
	const rifle: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_SHOTGUN) */
	const shotgun: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_SWORD) */
	const sword: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_TASER) */
	const taser: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_UNBRIDLED_GAZOR) */
	const unbridledGazor: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_UNSTABLE_DESTROYER) */
	const unstableDestroyer: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_ODACHI) */
	const odachi: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_EXCALIBUR) */
	const excalibur: Weapon;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/WEAPON_SCYTHE) */
	const scythe: Weapon;
}

declare namespace Chip {
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ACCELERATION) */
	const acceleration: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ADRENALINE) */
	const adrenaline: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ALTERATION) */
	const alteration: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ANTIDOTE) */
	const antidote: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_APOCALYPSE) */
	const apocalypse: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ARMOR) */
	const armor: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ARMORING) */
	const armoring: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ARSENIC) */
	const arsenic: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_AWAKENING) */
	const awakening: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_AWEKENING) */
	const awekening: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BALL_AND_CHAIN) */
	const ballAndChain: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BANDAGE) */
	const bandage: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BARK) */
	const bark: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BOXING_GLOVE) */
	const boxingGlove: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BRAINWASHING) */
	const brainwashing: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BRAMBLE) */
	const bramble: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_BURNING) */
	const burning: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_CARAPACE) */
	const carapace: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_COLLAR) */
	const collar: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_COVETOUSNESS) */
	const covetousness: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_COVID) */
	const covid: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_CRUSHING) */
	const crushing: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_CURE) */
	const cure: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DESINTEGRATION) */
	const desintegration: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DEVIL_STRIKE) */
	const devilStrike: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DIVINE_PROTECTION) */
	const divineProtection: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DOME) */
	const dome: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DOPING) */
	const doping: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_DRIP) */
	const drip: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ELEVATION) */
	const elevation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_EXASPERATION) */
	const exasperation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FEROCITY) */
	const ferocity: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FERTILIZER) */
	const fertilizer: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FIRE_BALL) */
	const fireBall: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FIRE_BULB) */
	const fireBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FLAME) */
	const flame: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FLASH) */
	const flash: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FORTRESS) */
	const fortress: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_FRACTURE) */
	const fracture: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_GRAPPLE) */
	const grapple: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_HEALER_BULB) */
	const healerBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_HELMET) */
	const helmet: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ICE) */
	const ice: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ICEBERG) */
	const iceberg: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ICED_BULB) */
	const icedBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_INVERSION) */
	const inversion: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_JUMP) */
	const jump: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_KEMURIDAMA) */
	const kemuridama: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_KILL) */
	const kill: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_KNOWLEDGE) */
	const knowledge: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_LEATHER_BOOTS) */
	const leatherBoots: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_LIBERATION) */
	const liberation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_LIGHTNING) */
	const lightning: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_LIGHTNING_BULB) */
	const lightningBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_LOAM) */
	const loam: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_MANUMISSION) */
	const manumission: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_METALLIC_BULB) */
	const metallicBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_METEORITE) */
	const meteorite: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_MIRROR) */
	const mirror: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_MOTIVATION) */
	const motivation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_MUTATION) */
	const mutation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PEBBLE) */
	const pebble: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PLAGUE) */
	const plague: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PLASMA) */
	const plasma: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PRECIPITATION) */
	const precipitation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PRISM) */
	const prism: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PROTEIN) */
	const protein: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PUNISHMENT) */
	const punishment: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_PUNY_BULB) */
	const punyBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_RAGE) */
	const rage: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_RAMPART) */
	const rampart: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_REFLEXES) */
	const reflexes: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_REGENERATION) */
	const regeneration: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_REMISSION) */
	const remission: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_REPOTTING) */
	const repotting: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_RESURRECTION) */
	const resurrection: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ROCK) */
	const rock: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ROCKFALL) */
	const rockfall: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_ROCKY_BULB) */
	const rockyBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SAVANT_BULB) */
	const savantBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SERUM) */
	const serum: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SEVEN_LEAGUE_BOOTS) */
	const sevenLeagueBoots: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SHIELD) */
	const shield: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SHOCK) */
	const shock: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SHURIKEN) */
	const shuriken: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SLOW_DOWN) */
	const slowDown: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SOLIDIFICATION) */
	const solidification: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SOPORIFIC) */
	const soporific: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_SPARK) */
	const spark: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_STALACTITE) */
	const stalactite: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_STEROID) */
	const steroid: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_STRETCHING) */
	const stretching: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TACTICIAN_BULB) */
	const tacticianBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TELEPORTATION) */
	const teleportation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_THERAPY) */
	const therapy: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_THORN) */
	const thorn: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_THUNDER) */
	const thunder: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TOXIN) */
	const toxin: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TRANQUILIZER) */
	const tranquilizer: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TRANSMUTATION) */
	const transmutation: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_TREBUCHET) */
	const trebuchet: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_VACCINE) */
	const vaccine: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_VAMPIRIZATION) */
	const vampirization: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_VENOM) */
	const venom: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WALL) */
	const wall: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WARM_UP) */
	const warmUp: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WHIP) */
	const whip: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WINGED_BOOTS) */
	const wingedBoots: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WIZARD_BULB) */
	const wizardBulb: Chip;
	/** 📖 [Documentation](https://leekwars.com/help/documentation/CHIP_WIZARDRY) */
	const wizardry: Chip;
}

declare namespace System {
	/**
	 * Nombre d'instructions maximales qu'une entité peut utiliser pendant son tour.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/INSTRUCTIONS_LIMIT)
	 */
	const INSTRUCTIONS_LIMIT: number;
	/**
	 * Nombre d'opérations maximales qu'une entité peut utiliser pendant son tour.
	 * 📖 [Documentation](https://leekwars.com/help/documentation/OPERATIONS_LIMIT)
	 */
	const OPERATIONS_LIMIT: number;
}
