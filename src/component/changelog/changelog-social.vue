<template lang="html">
	<panel icon="mdi-image-multiple">
		<template #title>Social images</template>
		<template #actions>
			<div class="button flat" @click="downloadAll">
				<v-icon>mdi-download</v-icon>
				<span>Download all</span>
			</div>
		</template>
		<template #content>
			<div class="social-section">
				<div class="social-entry">
					<div class="social-caption" style="margin-bottom: 10px">Cover image</div>
					<div class="social-canvases">
						<div v-for="f in FORMATS" :key="'cover_' + f.key" class="social-canvas-wrapper">
							<canvas :ref="(el: any) => setCoverCanvasRef(el, f.key)" :width="f.width" :height="f.height" class="social-canvas" />
							<div class="canvas-label">{{ f.label }}</div>
							<div class="canvas-download" @click="downloadCoverCanvas(f.key)">
								<v-icon>mdi-download</v-icon>
							</div>
						</div>
					</div>
				</div>
				<div class="social-grid">
					<div v-for="(entry, i) in socialEntries" :key="i" class="social-entry" :class="{ excluded: !included[i] }">
						<label class="social-entry-header">
							<input v-model="included[i]" type="checkbox" class="social-include-toggle">
							<div class="social-caption">{{ entry.emoji }} {{ entry.text }}</div>
						</label>
						<div v-show="included[i]">
							<div class="social-description-input">
								<input v-model="descriptions[i]" placeholder="Sub-description..." @input="renderAllCanvases()" />
							</div>
							<div class="social-canvases">
								<div v-for="f in FORMATS" :key="f.key" class="social-canvas-wrapper">
									<canvas :ref="(el: any) => setCanvasRef(el, i, f.key)" :width="f.width" :height="f.height" class="social-canvas" />
									<div class="canvas-label">{{ f.label }}</div>
									<div class="canvas-download" @click="downloadCanvas(i, f.key, entry.imageNames[0])">
										<v-icon>mdi-download</v-icon>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
	</panel>
</template>

<script setup lang="ts">

import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
	version: number
	versionName: string
}>()

interface SocialEntry {
	text: string
	imageNames: string[]
	imageUrls: string[]
	emoji: string
}

interface SocialFormat {
	key: string
	label: string
	width: number
	height: number
}

const FORMATS: SocialFormat[] = [
	{ key: 'square', label: 'Square 1:1 (X/Facebook)', width: 1080, height: 1080 },
	{ key: 'feed', label: 'Feed 3:4 (Instagram)', width: 1080, height: 1440 },
	{ key: 'story', label: 'Story 9:16', width: 1080, height: 1920 },
]

const descriptions = ref<string[]>([])
const included = ref<boolean[]>([])
const socialDescriptions = ref<Record<string, { emoji: string, description: string }>>({})

import('@/component/changelog/social-descriptions.json').then((module: { default: Record<string, { emoji: string, description: string }> }) => {
	socialDescriptions.value = module.default
})

const canvasRefs: Record<string, HTMLCanvasElement> = {}
const coverCanvasRefs: Record<string, HTMLCanvasElement> = {}

function setCoverCanvasRef(el: HTMLCanvasElement | null, format: string) {
	if (el) { coverCanvasRefs[format] = el } else { delete coverCanvasRefs[format] }
}

function setCanvasRef(el: HTMLCanvasElement | null, index: number, format: string) {
	const key = `${index}_${format}`
	if (el) { canvasRefs[key] = el } else { delete canvasRefs[key] }
}

const englishChangelog = ref<Record<number, any>>({})

import('@/component/changelog/changelog.en.yaml').then((module: { default: Record<number, any> }) => {
	englishChangelog.value = module.default
})

const SECTION_EMOJIS: Record<string, string> = { added: '✨', improved: '⚡', fixed: '🔧' }

const socialEntries = computed<SocialEntry[]>(() => {
	if (!props.version || !englishChangelog.value) return []
	const versionData = englishChangelog.value[props.version]
	if (!versionData) return []

	const entries: SocialEntry[] = []
	const imgRegex = /#img_(\w+)/g

	for (const section of ['added', 'improved', 'fixed']) {
		const items = versionData[section]
		if (!items) continue
		for (const line of items) {
			const images = Array.from(line.matchAll(imgRegex), (m: any) => m[1])
			if (images.length === 0) continue
			const text = line
				.replace(/#ai\s*/g, '')
				.replace(imgRegex, '')
				.replace(/\s+$/, '')
				.replace(/\.\s*$/, '')
			const meta = socialDescriptions.value[images[0]]
			entries.push({
				text,
				imageNames: images,
				imageUrls: images.map((img: string) => `/image/changelog/${img}.png`),
				emoji: meta?.emoji || SECTION_EMOJIS[section] || '✨',
			})
		}
	}
	return entries
})

const iconImage = ref<HTMLImageElement | null>(null)
const bgLeekImage = ref<HTMLImageElement | null>(null)
const imagesLoaded = ref(0)

if (typeof window !== 'undefined') {
	const icon = new Image()
	icon.src = '/image/icon512.png'
	icon.onload = () => { iconImage.value = icon; imagesLoaded.value++ }

	const leek = new Image()
	leek.src = '/image/big_leek_2_white.png'
	leek.onload = () => { bgLeekImage.value = leek; imagesLoaded.value++ }
}

// --- State persistence (only included/excluded, descriptions always come from JSON) ---

let socialStateLoading = false

function loadSocialState() {
	if (!props.version) return
	socialStateLoading = true
	let saved: any = {}
	try { saved = JSON.parse(localStorage.getItem(`social_${props.version}`) || '{}') } catch { /* ignore */ }
	descriptions.value = socialEntries.value.map(e => socialDescriptions.value[e.imageNames[0]]?.description ?? '')
	included.value = socialEntries.value.map(e => saved.included?.[e.imageNames[0]] ?? true)
	nextTick(() => { socialStateLoading = false })
}

function saveSocialState() {
	if (!props.version || socialStateLoading) return
	const incl: Record<string, boolean> = {}
	socialEntries.value.forEach((e, i) => { incl[e.imageNames[0]] = included.value[i] ?? true })
	localStorage.setItem(`social_${props.version}`, JSON.stringify({ included: incl }))
}

watch([socialEntries, socialDescriptions], () => loadSocialState(), { immediate: true })
watch([descriptions, included], () => saveSocialState(), { deep: true })

// --- Rendering ---

watch([socialEntries, imagesLoaded], () => {
	nextTick(() => nextTick(() => renderAllCanvases()))
})

function renderAllCanvases() {
	for (const f of FORMATS) {
		renderCoverCanvas(f)
	}
	for (let i = 0; i < socialEntries.value.length; i++) {
		for (const f of FORMATS) {
			renderCanvas(i, f)
		}
	}
}

// --- Shared drawing helpers ---

const sampleCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

function getDominantColor(img: HTMLImageElement): [number, number, number] {
	const size = 64
	if (!sampleCanvas) return [90, 160, 90]
	sampleCanvas.width = size
	sampleCanvas.height = size
	const sctx = sampleCanvas.getContext('2d')!
	sctx.drawImage(img, 0, 0, size, size)
	const data = sctx.getImageData(0, 0, size, size).data

	const buckets: { r: number, g: number, b: number, count: number, sat: number }[] = []
	for (let i = 0; i < 12; i++) buckets.push({ r: 0, g: 0, b: 0, count: 0, sat: 0 })

	for (let i = 0; i < data.length; i += 16) {
		const r = data[i], g = data[i + 1], b = data[i + 2]
		const max = Math.max(r, g, b), min = Math.min(r, g, b)
		const sat = max === 0 ? 0 : (max - min) / max
		const lum = (max + min) / 510
		if (sat < 0.15 || lum < 0.1 || lum > 0.9) continue

		let h = 0
		if (max !== min) {
			const d = max - min
			if (max === r) h = ((g - b) / d + 6) % 6
			else if (max === g) h = (b - r) / d + 2
			else h = (r - g) / d + 4
		}
		const bucket = Math.floor(h / 6 * 12) % 12
		buckets[bucket].r += r
		buckets[bucket].g += g
		buckets[bucket].b += b
		buckets[bucket].count++
		buckets[bucket].sat += sat
	}

	let best = buckets[0], bestScore = 0
	for (const b of buckets) {
		if (b.count === 0) continue
		const score = b.count * (b.sat / b.count)
		if (score > bestScore) { bestScore = score; best = b }
	}

	if (best.count === 0) return [90, 160, 90]
	return [Math.round(best.r / best.count), Math.round(best.g / best.count), Math.round(best.b / best.count)]
}

function rgbScale(r: number, g: number, b: number, factor: number): string {
	return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`
}

function rgba(r: number, g: number, b: number, a: number): string {
	return `rgba(${r}, ${g}, ${b}, ${a})`
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, ar: number, ag: number, ab: number, extraGlow = false) {
	// Gradient
	const grad = ctx.createLinearGradient(0, 0, W * 0.4, H)
	grad.addColorStop(0, rgbScale(ar, ag, ab, 0.4))
	grad.addColorStop(0.5, rgbScale(ar, ag, ab, 0.2))
	grad.addColorStop(1, rgbScale(ar, ag, ab, 0.1))
	ctx.fillStyle = grad
	ctx.fillRect(0, 0, W, H)

	// Center glow
	const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.55)
	glow.addColorStop(0, rgba(ar, ag, ab, 0.25))
	glow.addColorStop(0.5, rgba(ar, ag, ab, 0.1))
	glow.addColorStop(1, 'rgba(0,0,0,0)')
	ctx.fillStyle = glow
	ctx.fillRect(0, 0, W, H)

	// Extra corner glow for entry canvases
	if (extraGlow) {
		const glow2 = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.6)
		glow2.addColorStop(0, rgba(Math.min(255, ar + 40), Math.min(255, ag + 40), Math.min(255, ab + 40), 0.15))
		glow2.addColorStop(1, 'rgba(0,0,0,0)')
		ctx.fillStyle = glow2
		ctx.fillRect(0, 0, W, H)
	}

	// Scanlines
	ctx.fillStyle = 'rgba(255,255,255,0.012)'
	for (let y = 0; y < H; y += 3) {
		ctx.fillRect(0, y, W, 1)
	}

	// Background leek watermark
	if (bgLeekImage.value) {
		const leekW = H * (bgLeekImage.value.width / bgLeekImage.value.height)
		ctx.globalAlpha = 0.07
		ctx.drawImage(bgLeekImage.value, (W - leekW) / 2, H * 0.1, leekW, H)
		ctx.globalAlpha = 1
	}
}

function drawScreenshot(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius: number, ar: number, ag: number, ab: number) {
	ctx.shadowColor = rgba(ar, ag, ab, 0.5)
	ctx.shadowBlur = 50
	ctx.shadowOffsetY = 12

	ctx.save()
	ctx.beginPath()
	ctx.roundRect(x, y, w, h, radius)
	ctx.clip()
	ctx.drawImage(img, x, y, w, h)
	ctx.restore()

	ctx.shadowColor = 'transparent'
	ctx.shadowBlur = 0
	ctx.shadowOffsetY = 0

	ctx.strokeStyle = rgba(ar, ag, ab, 0.25)
	ctx.lineWidth = 1.5
	ctx.beginPath()
	ctx.roundRect(x, y, w, h, radius)
	ctx.stroke()
}

function drawTitle(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, format: SocialFormat) {
	const fontSize = format.key === 'story' ? 48 : 40
	ctx.font = `bold ${fontSize}px "Roboto", sans-serif`
	ctx.fillStyle = '#ffffff'
	ctx.textBaseline = 'middle'
	ctx.textAlign = 'left'
	ctx.fillText(text, x, y)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(' ')
	const lines: string[] = []
	let currentLine = ''
	for (const word of words) {
		const test = currentLine ? currentLine + ' ' + word : word
		if (ctx.measureText(test).width > maxWidth) {
			if (currentLine) lines.push(currentLine)
			currentLine = word
		} else {
			currentLine = test
		}
	}
	if (currentLine) lines.push(currentLine)
	return lines
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, description: string, W: number, H: number, format: SocialFormat) {
	const padding = 60
	const maxWidth = W - padding * 2
	const captionH = format.key === 'story' ? 240 : 160

	const titleSize = format.key === 'story' ? 48 : 40
	ctx.font = `700 ${titleSize}px "Roboto", sans-serif`
	ctx.fillStyle = '#ffffff'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	const titleLines = wrapText(ctx, text, maxWidth)
	const titleLineH = titleSize * 1.3

	const descSize = format.key === 'story' ? 34 : 28
	let descLines: string[] = []
	const descLineH = descSize * 1.35
	if (description) {
		ctx.font = `400 ${descSize}px "Roboto", sans-serif`
		descLines = wrapText(ctx, description, maxWidth)
	}

	const gap = description ? (format.key === 'story' ? 16 : 12) : 0
	const totalH = titleLines.length * titleLineH + gap + descLines.length * descLineH
	const startY = H - captionH / 2 - totalH / 2 + titleLineH / 2

	ctx.font = `700 ${titleSize}px "Roboto", sans-serif`
	ctx.fillStyle = '#ffffff'
	for (let i = 0; i < titleLines.length; i++) {
		ctx.fillText(titleLines[i], W / 2, startY + i * titleLineH)
	}

	if (descLines.length) {
		ctx.font = `400 ${descSize}px "Roboto", sans-serif`
		ctx.fillStyle = 'rgba(255,255,255,0.7)'
		const descStartY = startY + titleLines.length * titleLineH + gap
		for (let i = 0; i < descLines.length; i++) {
			ctx.fillText(descLines[i], W / 2, descStartY + i * descLineH)
		}
	}
}

// --- Cover canvas ---

function renderCoverCanvas(format: SocialFormat) {
	const canvas = coverCanvasRefs[format.key]
	if (!canvas) return

	const ctx = canvas.getContext('2d')!
	const { width: W, height: H } = format
	const isStory = format.key === 'story'

	drawBackground(ctx, W, H, 95, 173, 27)

	const safeTop = isStory ? 120 : 0
	const safeBottom = isStory ? 100 : 0

	const iconSize = isStory ? 160 : 140
	const centerY = (H + safeTop - safeBottom) / 2
	if (iconImage.value) {
		ctx.drawImage(iconImage.value, (W - iconSize) / 2, centerY - iconSize - 60, iconSize, iconSize)
	}

	const titleSize = isStory ? 120 : 100
	ctx.font = `bold ${titleSize}px "Roboto", sans-serif`
	ctx.fillStyle = '#ffffff'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText(`Update ${props.versionName}`, W / 2, centerY + 30)

	const versionData = englishChangelog.value[props.version]
	if (versionData?.title && versionData.title !== 'WIP') {
		const subSize = isStory ? 56 : 48
		ctx.font = `400 ${subSize}px "Roboto", sans-serif`
		ctx.fillStyle = 'rgba(255,255,255,0.6)'

		const lines = wrapText(ctx, versionData.title, W - 100)
		const lineH = subSize * 1.6
		const subY = centerY + 30 + titleSize * 1.1
		for (let i = 0; i < lines.length; i++) {
			ctx.fillText(lines[i], W / 2, subY + i * lineH)
		}
	}
}

// --- Entry canvas ---

const imageCache = new Map<string, HTMLImageElement>()

function loadImages(urls: string[]): Promise<HTMLImageElement[]> {
	return Promise.all(urls.map(url => {
		const cached = imageCache.get(url)
		if (cached) return Promise.resolve(cached)
		return new Promise<HTMLImageElement>((resolve) => {
			const img = new Image()
			img.src = url
			img.onload = () => { imageCache.set(url, img); resolve(img) }
			img.onerror = () => resolve(img)
		})
	}))
}

function renderCanvas(index: number, format: SocialFormat) {
	const canvas = canvasRefs[`${index}_${format.key}`]
	if (!canvas) return

	const entry = socialEntries.value[index]
	const ctx = canvas.getContext('2d')!
	const { width: W, height: H } = format
	const isStory = format.key === 'story'

	loadImages(entry.imageUrls).then(imgs => {
		const [ar, ag, ab] = getDominantColor(imgs[0])

		drawBackground(ctx, W, H, ar, ag, ab, true)

		const safeTop = isStory ? 120 : 40
		const safeBottom = isStory ? 100 : 40
		const headerH = (isStory ? 200 : 140) + safeTop

		// Header tint
		const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH)
		headerGrad.addColorStop(0, rgba(Math.round(ar * 0.4), Math.round(ag * 0.4), Math.round(ab * 0.4), 0.4))
		headerGrad.addColorStop(1, 'rgba(0,0,0,0)')
		ctx.fillStyle = headerGrad
		ctx.fillRect(0, 0, W, headerH)

		// Title: icon + "Update X.XX"
		const titleText = `Update ${props.versionName}`
		const titleFontSize = isStory ? 42 : 36
		const iconSize = isStory ? 68 : 54
		const iconGap = isStory ? 14 : 10
		const titleY = safeTop + (isStory ? 70 : 55)
		ctx.font = `bold ${titleFontSize}px "Roboto", sans-serif`
		const titleMetrics = ctx.measureText(titleText)
		const totalTitleW = iconSize + iconGap + titleMetrics.width
		const titleStartX = (W - totalTitleW) / 2
		if (iconImage.value) {
			const iconYOffset = isStory ? -4 : -3
			ctx.drawImage(iconImage.value, titleStartX, titleY - iconSize / 2 + iconYOffset, iconSize, iconSize)
		}
		drawTitle(ctx, titleText, titleStartX + iconSize + iconGap, titleY, format)

		// Screenshots layout
		const padding = isStory ? 40 : 30
		const imgGap = imgs.length > 1 ? 16 : 0
		const captionH = (isStory ? 240 : 160) + safeBottom
		const availW = W - padding * 2
		const availH = H - headerH - captionH - padding
		const radius = 12

		if (imgs.length === 1) {
			const scale = Math.min(availW / imgs[0].width, availH / imgs[0].height)
			const imgW = imgs[0].width * scale
			const imgH = imgs[0].height * scale
			drawScreenshot(ctx, imgs[0], (W - imgW) / 2, headerH + (availH - imgH) / 2, imgW, imgH, radius, ar, ag, ab)
		} else {
			const totalGap = imgGap * (imgs.length - 1)

			// Compare horizontal vs vertical area coverage
			const perImgW = (availW - totalGap) / imgs.length
			let hArea = 0
			for (const img of imgs) { const s = Math.min(perImgW / img.width, availH / img.height); hArea += img.width * s * img.height * s }

			const perImgH = (availH - totalGap) / imgs.length
			let vArea = 0
			for (const img of imgs) { const s = Math.min(availW / img.width, perImgH / img.height); vArea += img.width * s * img.height * s }

			const horizontal = hArea >= vArea
			for (let j = 0; j < imgs.length; j++) {
				const slotW = horizontal ? perImgW : availW
				const slotH = horizontal ? availH : perImgH
				const scale = Math.min(slotW / imgs[j].width, slotH / imgs[j].height)
				const imgW = imgs[j].width * scale
				const imgH = imgs[j].height * scale
				const imgX = horizontal
					? padding + j * (perImgW + imgGap) + (perImgW - imgW) / 2
					: (W - imgW) / 2
				const imgY = horizontal
					? headerH + (availH - imgH) / 2
					: headerH + j * (perImgH + imgGap) + (perImgH - imgH) / 2
				drawScreenshot(ctx, imgs[j], imgX, imgY, imgW, imgH, radius, ar, ag, ab)
			}
		}

		// Caption zone
		const captionY = H - captionH
		const captGrad = ctx.createLinearGradient(0, captionY, 0, H)
		captGrad.addColorStop(0, 'rgba(0,0,0,0)')
		captGrad.addColorStop(0.5, rgba(Math.round(ar * 0.15), Math.round(ag * 0.15), Math.round(ab * 0.15), 0.7))
		ctx.fillStyle = captGrad
		ctx.fillRect(0, captionY, W, captionH)

		drawCaption(ctx, `${entry.emoji} ${entry.text}`, descriptions.value[index] || '', W, H - safeBottom, format)
	})
}

// --- Downloads ---

function downloadCoverCanvas(format: string) {
	const canvas = coverCanvasRefs[format]
	if (!canvas) return
	const link = document.createElement('a')
	link.download = `${props.version}_${format}_cover.png`
	link.href = canvas.toDataURL('image/png')
	link.click()
}

function downloadCanvas(index: number, format: string, imageName: string) {
	const canvas = canvasRefs[`${index}_${format}`]
	if (!canvas) return
	const link = document.createElement('a')
	const version = imageName.split('_')[0]
	const name = imageName.substring(version.length + 1)
	link.download = `${version}_${format}_${name}.png`
	link.href = canvas.toDataURL('image/png')
	link.click()
}

function downloadAll() {
	let delay = 0
	for (let i = 0; i < socialEntries.value.length; i++) {
		if (!included.value[i]) continue
		for (const f of FORMATS) {
			setTimeout(() => downloadCanvas(i, f.key, socialEntries.value[i].imageNames[0]), delay)
			delay += 100
		}
	}
}

</script>

<style lang="scss" scoped>
.social-section {
	padding: 15px;
}
.social-grid {
	display: flex;
	flex-direction: column;
	gap: 30px;
}
.social-entry-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 6px;
}
.social-include-toggle {
	cursor: pointer;
	width: 16px;
	height: 16px;
}
.social-entry.excluded {
	opacity: 0.4;
}
.social-caption {
	font-size: 16px;
	font-weight: 600;
}
.social-description-input input {
	width: 100%;
	max-width: 500px;
	padding: 4px 8px;
	margin-bottom: 10px;
	border: 1px solid rgba(255,255,255,0.15);
	border-radius: 4px;
	background: rgba(255,255,255,0.05);
	color: var(--text-color);
	font-size: 14px;
	&::placeholder {
		opacity: 0.4;
	}
}
.social-canvases {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}
.social-canvas-wrapper {
	position: relative;
	flex: 1;
	min-width: 0;
}
.social-canvas {
	width: 100%;
	height: auto;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.canvas-label {
	text-align: center;
	font-size: 12px;
	margin-top: 4px;
	opacity: 0.7;
}
.canvas-download {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(0,0,0,0.6);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.2s;
	.social-canvas-wrapper:hover & {
		opacity: 1;
	}
	.v-icon {
		color: white;
		font-size: 18px;
	}
}
</style>
