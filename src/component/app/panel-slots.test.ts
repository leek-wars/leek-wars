import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import type { RootNode, TemplateChildNode } from '@vue/compiler-core'

// `panel.vue` rend l'un OU l'autre de ses deux slots de corps :
//
//     <slot v-if="$slots.content" name="content"></slot>
//     <div v-else class="content"><slot></slot></div>
//
// Fournir un `#content` fait donc disparaître, SANS AUCUN bruit, tout ce qui a été posé dans le
// slot par défaut. C'est ce qui a tué le dialogue de confirmation de `accounts.vue` : le bouton
// « Délier » basculait bien son booléen, mais le `<popup>` n'existait pas dans le DOM — bouton
// mort, aucune erreur en console (topic forum 12109).
//
// Ce test relit l'AST de chaque template et refuse tout nœud rendu placé dans le slot par défaut
// d'un `<panel>` qui a déjà un `#content`.
const SRC = path.resolve(__dirname, '../..')

const ELEMENT = 1
const TEXT = 2
const COMMENT = 3
const DIRECTIVE = 7

interface Node { type: number, tag?: string, content?: string, props?: Array<Record<string, unknown>>, children?: unknown[] }

/** Nom du slot qu'un `<template #x>` / `<template v-slot:x>` remplit, sinon null. */
function slotName(node: Node): string | null {
	if (node.type !== ELEMENT || node.tag !== 'template') return null
	for (const prop of node.props ?? []) {
		if (prop.type === DIRECTIVE && prop.name === 'slot') {
			const arg = prop.arg as { content?: string } | undefined
			return arg?.content ?? 'default'
		}
	}
	return null
}

/** Un nœud qui produit quelque chose à l'écran (les blancs et les commentaires ne comptent pas). */
function isRendered(node: Node): boolean {
	if (node.type === COMMENT) return false
	if (node.type === TEXT) return (node.content ?? '').trim() !== ''
	return true
}

/** Un `<template v-if="…" #content>` laisse le slot par défaut servir de repli : rien n'est perdu. */
function isConditional(node: Node): boolean {
	return (node.props ?? []).some(prop => prop.type === DIRECTIVE && (prop.name === 'if' || prop.name === 'else-if'))
}

function walk(node: Node, file: string, found: string[]) {
	const children = (node.children ?? []) as Node[]
	if (node.type === ELEMENT && node.tag?.toLowerCase() === 'panel') {
		const slots = children.map(slotName)
		const content = children.find((child, i) => slots[i] === 'content')
		if (content && !isConditional(content)) {
			children.forEach((child, i) => {
				// Le slot par défaut s'écrit aussi bien en vrac qu'en `<template #default>` :
				// dans les deux cas le panneau le jette, donc on inspecte les deux formes.
				const dropped = slots[i] === null ? [child] : slots[i] === 'default' ? child.children as Node[] : []
				for (const node of dropped) {
					if (!isRendered(node)) continue
					const what = node.type === ELEMENT ? '<' + node.tag + '>' : 'du texte'
					found.push(path.relative(SRC, file) + ' : ' + what + ' dans le slot par défaut d\'un <panel> qui a un #content')
				}
			})
		}
	}
	for (const child of children) walk(child, file, found)
}

function vueFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) return vueFiles(full)
		return entry.name.endsWith('.vue') ? [full] : []
	})
}

function droppedNodes(source: string, file: string): string[] {
	const { descriptor } = parse(source, { filename: file })
	const ast = descriptor.template?.ast as RootNode & { children: TemplateChildNode[] } | undefined
	if (!ast) return []
	const found: string[] = []
	walk(ast as unknown as Node, file, found)
	return found
}

const sfc = (template: string) => droppedNodes('<template>' + template + '</template>', 'fixture.vue')

describe('slots de <panel>', () => {
	it('rien n\'est posé dans le slot par défaut d\'un panneau qui fournit #content', { timeout: 30_000 }, () => {
		expect(vueFiles(SRC).flatMap(file => droppedNodes(fs.readFileSync(file, 'utf8'), file))).toEqual([])
	})

	// Le garde-fou lui-même : il doit voir les deux écritures du slot par défaut, et ne pas
	// crier sur les panneaux qui n'ont pas le problème.
	it('voit le slot par défaut, en vrac comme en <template #default>', () => {
		expect(sfc('<panel><template #content><div /></template><popup /></panel>')).toHaveLength(1)
		expect(sfc('<panel><template #content><div /></template><template #default><popup /></template></panel>')).toHaveLength(1)
		expect(sfc('<panel><template #content><div /></template>du texte</panel>')).toHaveLength(1)
	})

	it('laisse passer ce qui est bien rendu', () => {
		// Slot par défaut seul, et slot #content seul : les deux cas normaux.
		expect(sfc('<panel><popup /></panel>')).toEqual([])
		expect(sfc('<panel><template #content><popup /></template></panel>')).toEqual([])
		// Les blancs, les commentaires et les autres slots nommés ne sont pas du contenu perdu.
		expect(sfc('<panel><template #actions><div /></template><template #content><div /></template>\n\t<!-- rien --></panel>')).toEqual([])
		// #content conditionnel : le slot par défaut lui sert de repli, il est bien rendu.
		expect(sfc('<panel><template v-if="ok" #content><div /></template><popup /></panel>')).toEqual([])
	})
})
