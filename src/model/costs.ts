// Paliers de conversion capital → bonus de caractéristique (mirror des constantes serveur).
// Module feuille volontairement SANS import : capital.ts (et les composants) en dépendent
// sans tirer le graphe de modèles lourd de leek.ts. leek.ts le ré-exporte pour compat.
export interface CostEntry { step: number; capital: number; sup: number }

export const COSTS: { [key: string]: CostEntry[] } = {
	life : [
		{step : 0, capital : 1, sup : 4},
		{step : 1000, capital : 1, sup : 3},
		{step : 2000, capital : 1, sup : 2},
	],
	strength : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	wisdom : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	agility : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	resistance : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	science : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	magic : [
		{step : 0, capital : 1, sup : 2},
		{step : 200, capital : 1, sup : 1},
		{step : 400, capital : 2, sup : 1},
		{step : 600, capital : 3, sup : 1},
	],
	frequency : [
		{step : 0, capital : 1, sup : 1}
	],
	cores : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 30, sup : 1},
		{step : 2, capital : 40, sup : 1},
		{step : 3, capital : 50, sup : 1},
		{step : 4, capital : 60, sup : 1},
		{step : 5, capital : 70, sup : 1},
		{step : 6, capital : 80, sup : 1},
		{step : 7, capital : 90, sup : 1},
		{step : 8, capital : 100, sup : 1},
	],
	ram : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 30, sup : 1},
		{step : 2, capital : 40, sup : 1},
		{step : 3, capital : 50, sup : 1},
		{step : 4, capital : 60, sup : 1},
		{step : 5, capital : 70, sup : 1},
		{step : 6, capital : 80, sup : 1},
		{step : 7, capital : 90, sup : 1},
		{step : 8, capital : 100, sup : 1},
	],
	tp : [
		{step : 0, capital : 30, sup : 1}, {step : 1, capital : 35, sup : 1},
		{step : 2, capital : 40, sup : 1}, {step : 3, capital : 45, sup : 1},
		{step : 4, capital : 50, sup : 1}, {step : 5, capital : 55, sup : 1},
		{step : 6, capital : 60, sup : 1}, {step : 7, capital : 65, sup : 1},
		{step : 8, capital : 70, sup : 1}, {step : 9, capital : 75, sup : 1},
		{step : 10, capital : 80, sup : 1}, {step : 11, capital : 85, sup : 1},
		{step : 12, capital : 90, sup : 1}, {step : 13, capital : 95, sup : 1},
		{step : 14, capital : 100, sup : 1}
	],
	mp : [
		{step : 0, capital : 20, sup : 1},
		{step : 1, capital : 40, sup : 1},
		{step : 2, capital : 60, sup : 1},
		{step : 3, capital : 80, sup : 1},
		{step : 4, capital : 100, sup : 1},
		{step : 5, capital : 120, sup : 1},
		{step : 6, capital : 140, sup : 1},
		{step : 7, capital : 160, sup : 1},
		{step : 8, capital : 180, sup : 1}
	]
}
