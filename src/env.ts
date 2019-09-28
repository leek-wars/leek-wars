const env = Object.freeze({
	DEV: process.env.NODE_ENV === 'development',
	BETA: process.env.VUE_APP_BETA === 'true',
	LOCAL: process.env.VUE_APP_LOCAL === 'true',
	SOCIAL: process.env.VUE_APP_SOCIAL === 'true',
	API: process.env.VUE_APP_API,
	AVATAR: process.env.VUE_APP_AVATAR,
	STATIC: process.env.VUE_APP_STATIC,
	WEBSOCKET: process.env.VUE_APP_WEBSOCKET!
})

export { env }