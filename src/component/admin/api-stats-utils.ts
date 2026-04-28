import { LeekWars } from '@/model/leekwars'

export function formatBucket(bucketMs: number, sizeMs: number): string {
	const d = new Date(bucketMs)
	const pad = (n: number) => String(n).padStart(2, '0')
	if (sizeMs >= 24 * 3600 * 1000) {
		return pad(d.getDate()) + '/' + pad(d.getMonth() + 1)
	}
	if (sizeMs >= 3600 * 1000) {
		return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + 'h'
	}
	return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

export function formatDateMs(ms: number): string {
	return LeekWars.formatDateTime(Math.floor(ms / 1000))
}

export function formatMs(ms: number | null | undefined): string {
	if (ms === null || ms === undefined) return '—'
	const v = Math.round(ms)
	if (v >= 1000) return (v / 1000).toFixed(2) + ' s'
	return v + ' ms'
}

export function httpClass(status: number | null | undefined): string {
	if (status === null || status === undefined) return 'http-unknown'
	if (status >= 500) return 'http-5xx'
	if (status === 429) return 'http-429'
	if (status >= 400) return 'http-4xx'
	return 'http-ok'
}

export function latencyClass(ms: number | null | undefined): string {
	if (ms === null || ms === undefined) return ''
	if (ms >= 2000) return 'lat-bad'
	if (ms >= 500) return 'lat-warn'
	if (ms >= 100) return 'lat-mid'
	return 'lat-ok'
}
