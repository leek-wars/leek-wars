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

function walk(node: Node, file: string, found: string[]) {
	const children = (node.children ?? []) as Node[]
	if (node.type === ELEMENT && node.tag?.toLowerCase() === 'panel') {
		const slots = children.map(slotName)
		if (slots.includes('content')) {
			children.forEach((child, i) => {
				if (slots[i] === null && isRendered(child)) {
					const what = child.type === ELEMENT ? '<' + child.tag + '>' : 'du texte'
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

function droppedNodes(file: string): string[] {
	const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file })
	const ast = descriptor.template?.ast as RootNode & { children: TemplateChildNode[] } | undefined
	if (!ast) return []
	const found: string[] = []
	walk(ast as unknown as Node, file, found)
	return found
}

describe('slots de <panel>', () => {
	it('rien n\'est posé dans le slot par défaut d\'un panneau qui fournit #content', { timeout: 30_000 }, () => {
		expect(vueFiles(SRC).flatMap(droppedNodes)).toEqual([])
	})
})
