const env = Object.freeze({
	DEV: import.meta.env.VITE_DEV === 'true' || import.meta.env.MODE === 'development',
	BETA: import.meta.env.VITE_BETA === 'true',
	LOCAL: import.meta.env.VITE_LOCAL === 'true' || import.meta.env.MODE === 'development',
	SIGN_UP: import.meta.env.VITE_SIGN_UP !== 'false', // true by default
	SOCIAL: import.meta.env.VITE_SOCIAL !== 'false', // true by default
	BANK: import.meta.env.VITE_BANK !== 'false', // true by default
	API: import.meta.env.VITE_API || '/api/',
	AVATAR: import.meta.env.VITE_AVATAR || '/image/',
	STATIC: import.meta.env.VITE_STATIC || '/',
	WEBSOCKET: import.meta.env.VITE_WEBSOCKET || 'ws://localhost:1213'
})

export { env }