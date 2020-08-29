const env = Object.freeze({
	DEV: process.env.VUE_APP_DEV === 'true',
	BETA: process.env.VUE_APP_BETA === 'true',
	LOCAL: process.env.VUE_APP_LOCAL === 'true',
	SIGN_UP: process.env.VUE_APP_SIGN_UP === 'true',
	SOCIAL: process.env.VUE_APP_SOCIAL === 'true',
	BANK: process.env.VUE_APP_BANK === 'true',
	API: process.env.VUE_APP_API,
	AVATAR: process.env.VUE_APP_AVATAR,
	STATIC: process.env.VUE_APP_STATIC,
	WEBSOCKET: process.env.VUE_APP_WEBSOCKET!
})

export { env }