-- ============================================================
-- Potions de trèfle - Migration SQL
-- ============================================================
-- Ajuste les IDs si besoin (vérifier les max actuels dans la BDD)
-- item_template IDs : 410, 411, 412
-- potion_template IDs : 50, 51, 52
-- scheme IDs : 61, 62, 63

-- ============================================================
-- 1. Potion templates
-- ============================================================
-- Effet 4 = CLOVER_PASSED, 5 = CLOVER_HOUR, 6 = CLOVER_SECOND
-- Toutes consommables, durée 0 (effet instantané)

INSERT INTO potion_template (id, consumable, duration, params) VALUES
  (50, true, 0, '4'),    -- Potion du trèfle (passé ?)
  (51, true, 0, '5'),    -- Potion de l'heure du trèfle
  (52, true, 0, '6');    -- Potion de la seconde du trèfle

-- ============================================================
-- 2. Item templates
-- ============================================================
-- type 3 = POTION
-- params = potion_template_id
-- rarity : 4 = epic, 5 = legendary
-- Ajuster les prix selon l'économie du jeu

INSERT INTO item_template (id, name, type, price, level, params, sellable, buyable, crystals, public, singleton, trophy, market, buyable_crystals, rarity) VALUES
  (410, 'potion_clover_passed', 3, 1000000, 100, '50', true, false, 0, true, false, 0, true, false, 4),
  (411, 'potion_clover_hour',   3, 10000000, 200, '51', true, false, 0, true, false, 0, true, false, 5),
  (412, 'potion_clover_second', 3, 100000000, 300, '52', true, false, 0, true, false, 0, true, false, 5);

-- ============================================================
-- 3. Schemes (recettes de craft)
-- ============================================================
-- Format items : JSON array de 9 slots (grille 3x3 + résultat)
-- Chaque slot : [item_template_id, quantité] ou null

-- Schéma 61 : Potion du trèfle (passé ?) - ~10-20M
-- Ingrédients : gold_nugget(216) x3, amazonite(186) x10, aquamarine(200) x5,
--               leek_juice(203) x50, obsidian(213) x5
INSERT INTO scheme (id, result, quantity, items) VALUES
  (61, 410, 1, '[[216,3],[186,10],null,[200,5],[203,50],null,[213,5],null,null]');

-- Schéma 62 : Potion de l'heure du trèfle - ~50M
-- Ingrédients : gold_lingot(289) x2, obsidian(213) x20, raw_ruby(217) x10,
--               aquamarine(200) x15, amazonite(186) x30, leek_juice(203) x200,
--               topaze(188) x15, cornaline(201) x10
INSERT INTO scheme (id, result, quantity, items) VALUES
  (62, 411, 1, '[[289,2],[213,20],[217,10],[200,15],[186,30],[203,200],[188,15],[201,10],null]');

-- Schéma 63 : Potion de la seconde du trèfle - ~100M
-- Ingrédients : gold_lingot(289) x5, obsidian(213) x40, raw_ruby(217) x25,
--               aquamarine(200) x30, graal_fragment(387) x3, eternal_fire(378) x10,
--               diamond_chest(230) x2, copper(214) x30
INSERT INTO scheme (id, result, quantity, items) VALUES
  (63, 412, 1, '[[289,5],[213,40],[217,25],[200,30],[387,3],[378,10],[230,2],[214,30],null]');
