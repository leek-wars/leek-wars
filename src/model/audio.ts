// HTMLMediaElement.play() retourne une promesse qui rejette pour des raisons ATTENDUES :
// autoplay bloqué par le navigateur (NotAllowedError), source non supportée
// (NotSupportedError — crawlers headless type Baiduspider-render, codecs absents),
// lecture interrompue par pause()/load() (AbortError). Sans catch, chaque cas part en
// unhandledrejection et pollue les rapports d'erreur (#11807436).
export function playAudio(media: HTMLMediaElement) {
	media.play()?.catch(() => { /* attendu : autoplay/codec/abort */ })
}
