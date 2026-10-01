/** Noms qu'un fichier ou un dossier ne peut pas porter : `.git` est réservé quelle que soit la casse. */
export function isReservedName(name: string): boolean {
	return name === '.' || name === '..' || name === '.trash' || name.toLowerCase() === '.git'
}
