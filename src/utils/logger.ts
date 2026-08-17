/**
 * Minimal leveled logger, replacing raw console.log calls (#771).
 * In production only warnings and errors are emitted; in development
 * everything is, so logger.debug/info are free to use while coding.
 */
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	NONE = 4,
}

/* eslint-disable no-console */
class Logger {
	level: LogLevel = import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG

	debug(message?: unknown, ...args: unknown[]) {
		if (this.level <= LogLevel.DEBUG) {
			console.debug(message, ...args)
		}
	}

	info(message?: unknown, ...args: unknown[]) {
		if (this.level <= LogLevel.INFO) {
			console.info(message, ...args)
		}
	}

	warn(message?: unknown, ...args: unknown[]) {
		if (this.level <= LogLevel.WARN) {
			console.warn(message, ...args)
		}
	}

	error(message?: unknown, ...args: unknown[]) {
		if (this.level <= LogLevel.ERROR) {
			console.error(message, ...args)
		}
	}
}
/* eslint-enable no-console */

export const logger = new Logger()
