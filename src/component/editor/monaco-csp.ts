// Singleton — safe to import from multiple entry points without double-registering.
export const cspNonce = (document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null)?.content || undefined

if (cspNonce) {
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof HTMLStyleElement && !node.nonce) {
					node.nonce = cspNonce
				}
			}
		}
	}).observe(document.head, { childList: true })
}
