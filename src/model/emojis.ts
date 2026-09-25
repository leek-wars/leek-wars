import { LeekWars } from "./leekwars"

const Emojis = {
	custom: {
		":O": "open_mouth",
		":D": "grinning",
		"&lt;3": "heart",
		":)": "smile",
		":/": "confused",
		";)": "wink",
		":(": "frowning",
		":P": "stuck_out_tongue",
		"(lama)": "lama",
		":B": "grimacing",
		"(lucky)": "clover",
		"(grim)": "grimace",
		"(peach)": "peach",
		"(hab)": "hab",
		"(crystal)": "crystal",
		"(woodchest)": "woodchest",
		"(ironchest)": "ironchest",
		"(diamondchest)": "diamondchest",
		"(life)": "life",
		"(strength)": "strength",
		"(wisdom)": "wisdom",
		"(agility)": "agility",
		"(resistance)": "resistance",
		"(science)": "science",
		"(magic)": "magic",
		"(frequency)": "frequency",
		"(cores)": "cores",
		"(ram)": "ram",
		"(mp)": "mp",
		"(tp)": "tp",
	} as { [key: string]: string },

	categories: [
		{ icon: "😃", emojis: [":O", ":D", "&lt;3", ":)",":/", ";)",":(", ":P","(lama)",":B","(lucky)","(grim)","(peach)", "(hab)", "(crystal)", "(woodchest)", "(ironchest)", "(diamondchest)", "(life)", "(strength)", "(wisdom)", "(agility)", "(resistance)", "(science)", "(magic)", "(frequency)", "(cores)", "(ram)", "(mp)", "(tp)", "😀", "😬", "😁", "😂", "😃", "😄", "😅", "😆", "😇", "🫡", "😉", "😊", "🤗", "🙂", "😋", "😌", "🥹", "🤩", "😍", "😘", "🫠", "😗", "😙", "😚", "😜", "😝", "😛", "🤓", "😎", "🤑", "😏", "😶", "🙄", "😐", "😑", "😒", "😳", "😞", "😟", "😠", "😡", "🤬", "😔", "😕", "😣", "😖", "😫", "😩", "😤", "😮", "🤯", "😱", "😨", "😰", "🤢", "🤮", "🥵", "🥶", "😯", "😦", "😧", "😢", "😥", "😪", "🥱", "😓", "😭", "😵", "😲", "😷", "🤔", "😴", "🤐", "😶‍🌫️", "🙃", "🥴", "🤕", "🤒", "🤧", "🫨", "🥸", "🤥", "🤫", "🫣", "🫢", "💤", "💩", "😈", "👿", "👹", "👺", "🤡", "💀", "👻", "👽", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙌", "👏", "👋", "👍", "👎", "👊", "✊", "✌️", "👌", "✋", "👐", "🖖", "🤞", "🤘", "🤙", "🤌", "🫶","💪", "🙏", "☝️", "👆", "👇", "👈", "👉", "🤝", "💅", "👄", "👅", "👂", "👃", "👀", "👤", "👥", "👶", "👦", "👧", "👨", "👩", "👱", "👴", "👲", "👳", "👮", "🕵️‍♂️", "👨‍🌾", "👷", "💂", "🎅", "🤖", "🦹", "🦸", "🧙", "🧛", "👼", "🧞", "👸", "👰", "🚶", "🏃", "💃", "👯", "👫", "👬", "👭", "🫂", "🙇", "🤷", "🤦", "💁", "🙅", "🙆", "🙋", "🙎", "🙍", "💇", "💆", "🫅", "🧑‍💻", "💑", "👩‍❤️‍👩", "👨‍❤️‍👨", "💏", "👩‍❤️‍💋‍👩", "👨‍❤️‍💋‍👨", "👪", "👨‍👩‍👧", "👨‍👩‍👧‍👦", "👨‍👩‍👦‍👦", "👨‍👩‍👧‍👧", "👩‍👩‍👦", "👩‍👩‍👧", "👩‍👩‍👧‍👦", "👩‍👩‍👦‍👦", "👩‍👩‍👧‍👧", "👨‍👨‍👦", "👨‍👨‍👧", "👨‍👨‍👧‍👦", "👨‍👨‍👦‍👦", "👨‍👨‍👧‍👧", "👚", "👕", "👖", "👔", "👗", "👙", "👘", "💄", "💋", "👣", "👠", "👡", "👢", "👞", "👟", "👒", "🎩", "🎓", "👑", "🎒", "👝", "👛", "👜", "💼", "👓", "💍", "🌂"] },
		{ icon: "🐳", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🐻", "🐼", "🐨", "🐯", "🐮", "🐷", "🐽", "🐸", "🐙", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦦", "🦌", "🫎", "🦥", "🦊", "🐺", "🐗", "🐴", "🐝", "🐛", "🐌", "🐞", "🐜", "🐍", "🐢", "🐠", "🐟", "🐡", "🐬", "🐳", "🐋", "🐊", "🐆", "🐅", "🐃", "🐂", "🐄", "🐪", "🐫", "🦘", "🦙", "🐘", "🐐", "🐏", "🐑", "🐎", "🐖", "🐀", "🐁", "🐓", "🐕", "🐩", "🐈", "🐇", "🐉", "🐲", "🐦‍🔥", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "🍀", "🎍", "🎋", "🍃", "🍂", "🍁", "🌾", "🌺", "🌻", "🌹", "🌷", "🌼", "🌸", "💐", "🍄", "🌰", "🎃", "🐚", "🌎", "🌍", "🌏", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌚", "🌝", "🌛", "🌜", "🌞", "🌙", "⭐", "🌟", "💫", "✨", "☀", "⛅", "☁", "⚡", "💥", "❄", "⛄", "💨", "☔", "💧", "💦", "🌊", "🧊"] },
		{ icon: "🍎", emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🍍", "🍅", "🍆", "🌽", "🌶️", "🥔", "🥬", "🥦", "🧄", "🧅", "🥕", "🍠", "🍯", "🍞", "🍗", "🍖", "🍤", "🍳", "🍔", "🍟", "🍕", "🌮", "🥙", "🍝", "🍜", "🍲", "🍥", "🍣", "🍱", "🍛", "🍙", "🍚", "🍘", "🍢", "🍡", "🍧", "🍨", "🍦", "🍰", "🎂", "🍮", "🍬", "🍭", "🍫", "🍩", "🍪", "🍺", "🍻", "🍷", "🍸", "🍹", "🍶", "🍵", "☕", "🍼", "🍴"] },
		{ icon: "⚽", emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏉", "🎱", "⛳", "🎿", "🏂", "🎣", "🚣", "🏊", "🏄", "🛀", "🚴", "🚵", "🏇", "🏆", "🥇", "🥈", "🥉", "🏅", "🎽", "🎫", "🎭", "🎨", "🎪", "🎤", "🎧", "🎼", "🎹", "🎷", "🎺", "🎸", "🎻", "🎬", "🎮", "👾", "🎯", "🎲", "🎰", "🎳"] },
		{ icon: "🚗", "emojis": ["🚗", "🚕", "🚙", "🚌", "🚎", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🚲", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚝", "🚄", "🚅", "🚈", "🚞", "🚂", "🚆", "🚇", "🚊", "🚉", "🚁", "✈", "⛵", "🚤", "🚀", "💺", "⚓", "🚧", "⛽", "🚏", "🚦", "🚥", "🏁", "🚢", "🎡", "🎢", "🎠", "🌁", "🗼", "🏭", "⛲", "🎑", "🗻", "🌋", "🗾", "⛺", "🌅", "🌄", "🌠", "🌆", "🌃", "🌉", "🌌", "🌠", "🎇", "🎆", "🌈", "🏰", "🏯", "🗽", "🏠", "🏡", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "⛪"] },
		{ icon: "📱", emojis: ["⌚", "📱", "📲", "🎮","💻", "🪄", "💽", "💾", "💿", "📀", "📼", "📷", "📹", "🎥", "📞", "☎", "📟", "📠", "📺", "📻", "⏰", "⏳", "⌛", "📡", "🔋", "🔌", "💡", "🔦", "💸", "💵", "💴", "💶", "💷", "💰", "💳", "💎", "🔧", "🔨", "🔩", "⚙️", "🛡️", "⚔️", "🔫", "🏹", "💣", "💥", "🔪", "🚬", "🔮", "💈", "🔭", "🔬", "💊", "💉", "🔖", "🚽", "🚿", "🛁", "🔑", "🚪", "🗿", "🎈", "🎏", "🎀", "🎁", "🎊", "🎉", "🎎", "🎐", "🎌", "🏮", "✉", "📩", "📨", "📧", "💌", "📮", "📪", "📫", "📬", "📭", "📦", "📯", "📥", "📤", "📜", "📃", "📑", "📊", "📈", "📉", "📄", "📅", "📆", "📇", "📋", "📁", "📂", "📰", "📓", "📕", "📗", "📘", "📙", "📔", "📒", "📚", "📖", "🔗", "📎", "🪨", "📄", "✂️", "📐", "📏", "📌", "📍", "🚩", "🔐", "🔒", "🔓", "🔏", "✒", "📝", "✏", "🔍", "🔎"] },
		{ icon: "🔢", emojis: ["💯", "🔢", "❤", "💛", "💚", "💙", "💜", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔯", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "🈳", "🈹", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷", "✴", "🆚", "🉑", "💮", "🉐", "㊙", "㊗", "🈴", "🈵", "🈲", "🅰", "🅱", "🆎", "🆑", "🅾", "🆘", "⛔", "📛", "🚫", "❌", "⭕", "💢", "♨", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "❗", "❕", "❓", "❔", "‼", "⁉", "🔅", "🔆", "🔱", "〽", "⚠", "🚸", "🔰", "♻", "🈯", "💹", "❇", "✳", "❎", "✅", "💠", "🌀", "➿", "🌐", "Ⓜ", "🏧", "🈂", "🛂", "🛃", "🛄", "🛅", "♿", "🚭", "🚾", "🅿", "🚰", "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶", "🈁", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "🚾", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "◀️", "🔼", "🔽", "▶️", "⏩", "⏪", "🔀", "🔁", "🔂", "⏫", "⏬", "➡", "⬅", "⬆", "⬇", "↗", "↘", "↙", "↖", "↕", "↔", "🔄", "↪", "↩", "⤴", "⤵", "#⃣", "ℹ", "🔤", "🔡", "🔠", "🔣", "🎵", "🎶", "〰", "➰", "✔", "🔃", "➕", "➖", "➗", "✖", "💲", "💱", "©", "®", "™", "🔚", "🔙", "🔛", "🔝", "🔜", "☑", "🔘", "⚪", "⚫", "🔴", "🔵", "🟢", "🟣", "🟠", "🟡", "🔸", "🔹", "🔶", "🔷", "🔺", "▪", "▫", "⬛", "⬜", "🔻", "◼", "◻", "◾", "◽", "🔲", "🔳", "💭", "🗯️", "💬", "🔈", "🔉", "🔊", "🔇", "📣", "📢", "🔔", "🔕", "🃏", "🀄", "♠", "♣", "♥", "♦", "🎴", "💭", "💬", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧", "🇿", "🇾", "🇽", "🇼", "🇻", "🇺", "🇹", "🇸", "🇷", "🇶", "🇵", "🇴", "🇳", "🇲", "🇱", "🇰", "🇯", "🇮", "🇭", "🇬", "🇫", "🇪", "🇩", "🇨", "🇧", "🇦"] },
		{ icon: "🇫🇷", "emojis": ["🇦🇨", "🇦🇫", "🇦🇱", "🇩🇿", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇼", "🇦🇺", "🇦🇹", "🇦🇿", "🇧🇸", "🇧🇭", "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪", "🇧🇿", "🇧🇯", "🇧🇲", "🇧🇹", "🇧🇴", "🇧🇦", "🇧🇼", "🇧🇷", "🇧🇳", "🇧🇬", "🇧🇫", "🇧🇮", "🇨🇻", "🇰🇭", "🇨🇲", "🇨🇦", "🇰🇾", "🇨🇫", "🇹🇩", "🇨🇱", "🇨🇳", "🇨🇴", "🇰🇲", "🇨🇬", "🇨🇩", "🇨🇷", "🇭🇷", "🇨🇺", "🇨🇾", "🇨🇿", "🇩🇰", "🇩🇯", "🇩🇲", "🇩🇴", "🇪🇨", "🇪🇬", "🇸🇻", "🇬🇶", "🇪🇷", "🇪🇪", "🇪🇹", "🇫🇰", "🇫🇴", "🇫🇯", "🇫🇮", "🇫🇷", "🇵🇫", "🇬🇦", "🇬🇲", "🇬🇪", "🇩🇪", "🇬🇭", "🇬🇮", "🇬🇷", "🇬🇱", "🇬🇩", "🇬🇺", "🇬🇹", "🇬🇳", "🇬🇼", "🇬🇾", "🇭🇹", "🇭🇳", "🇭🇰", "🇭🇺", "🇮🇸", "🇮🇳", "🇮🇩", "🇮🇷", "🇮🇶", "🇮🇪", "🇮🇱", "🇮🇹", "🇨🇮", "🇯🇲", "🇯🇵", "🇯🇪", "🇯🇴", "🇰🇿", "🇰🇪", "🇰🇮", "🇽🇰", "🇰🇼", "🇰🇬", "🇱🇦", "🇱🇻", "🇱🇧", "🇱🇸", "🇱🇷", "🇱🇾", "🇱🇮", "🇱🇹", "🇱🇺", "🇲🇴", "🇲🇰", "🇲🇬", "🇲🇼", "🇲🇾", "🇲🇻", "🇲🇱", "🇲🇹", "🇲🇭", "🇲🇷", "🇲🇺", "🇲🇽", "🇫🇲", "🇲🇩", "🇲🇨", "🇲🇳", "🇲🇪", "🇲🇸", "🇲🇦", "🇲🇿", "🇲🇲", "🇳🇦", "🇳🇷", "🇳🇵", "🇳🇱", "🇳🇨", "🇳🇿", "🇳🇮", "🇳🇪", "🇳🇬", "🇳🇺", "🇰🇵", "🇳🇴", "🇴🇲", "🇵🇰", "🇵🇼", "🇵🇸", "🇵🇦", "🇵🇬", "🇵🇾", "🇵🇪", "🇵🇭", "🇵🇱", "🇵🇹", "🇵🇷", "🇶🇦", "🇷🇴", "🇷🇺", "🇷🇼", "🇸🇭", "🇰🇳", "🇱🇨", "🇻🇨", "🇼🇸", "🇸🇲", "🇸🇹", "🇸🇦", "🇸🇳", "🇷🇸", "🇸🇨", "🇸🇱", "🇸🇬", "🇸🇰", "🇸🇮", "🇸🇧", "🇸🇴", "🇿🇦", "🇰🇷", "🇪🇸", "🇱🇰", "🇸🇩", "🇸🇷", "🇸🇿", "🇸🇪", "🇨🇭", "🇸🇾", "🇹🇼", "🇹🇯", "🇹🇿", "🇹🇭", "🇹🇱", "🇹🇬", "🇹🇴", "🇹🇹", "🇹🇳", "🇹🇷", "🇹🇲", "🇹🇻", "🇺🇬", "🇺🇦", "🇦🇪", "🇬🇧", "🇺🇸", "🇻🇮", "🇺🇾", "🇺🇿", "🇻🇺", "🇻🇦", "🇻🇪", "🇻🇳", "🇼🇫", "🇪🇭", "🇾🇪", "🇿🇲", "🇿🇼", "🇷🇪", "🇦🇽", "🇹🇦", "🇮🇴", "🇧🇶", "🇨🇽", "🇨🇨", "🇬🇬", "🇮🇲", "🇾🇹", "🇳🇫", "🇵🇳", "🇧🇱", "🇵🇲", "🇬🇸", "🇹🇰", "🇧🇻", "🇭🇲", "🇸🇯", "🇺🇲", "🇮🇨", "🇪🇦", "🇨🇵", "🇩🇬", "🇦🇸", "🇦🇶", "🇻🇬", "🇨🇰", "🇨🇼", "🇪🇺", "🇬🇫", "🇹🇫", "🇬🇵", "🇲🇶", "🇲🇵", "🇸🇽", "🇸🇸", "🇹🇨", "🇲🇫", "🏳️‍🌈"] }
	]
}

function escapeRegExp(str: string) {
	return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")
}

function formatEmojis(rawData: unknown): string {
	if (!rawData || typeof(rawData) !== 'string') { return String(rawData ?? '') }
	let data: string = rawData
	// Custom smileys
	for (const i in Emojis.custom) {
		const smiley = Emojis.custom[i]
		// console.log("(^|\\s|>|\\))" + escapeRegExp(i))
		data = data.replace(new RegExp(escapeRegExp(i), "gi"), (a: string, pos: number) => {
			const previous = data.charAt(pos - 1)
			if (pos === 0 || previous === ')' || previous === '>' || previous === ' ' || previous === '\xa0') {
				return '<img class="emoji" image="' + smiley + '" alt="' + i + '" title="' + i + '" src="/image/emoji/' + smiley + '.png">'
			}
			return a
		})
	}
	if (LeekWars.nativeEmojis) {
		return data // nothing more to do
	} else {
		// Parse emojis
		const emoji_regex = /(\u00a9|[1-9]\u20E3|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g
		return data.replace(emoji_regex, "<span class='emoji emoji-font'>$&</span>")
	}
}

// Variante sûre pour les liaisons v-html : échappe le texte (protect) puis
// applique les emojis, exactement comme la directive v-emojis le faisait sur un
// noeud texte. À utiliser quand le contenu est du texte brut tracké par Vue
// (interpolation, v-text) : binder le résultat en v-html évite que la directive
// remplace un noeud que Vue suit encore (desync vnode.el -> crash parentNode, #4163).
function formatEmojisText(rawData: unknown): string {
	if (rawData === null || rawData === undefined) { return '' }
	return formatEmojis(LeekWars.protect(String(rawData)))
}

// Balises dont le contenu texte ne doit JAMAIS être transformé en emoji :
// - CODE / PRE : blocs de code (un ":)" ou "://" y est du code, pas un smiley) ;
//   en plus, le rendu markdown lit leur textContent brut ensuite (coloration).
// - LATEX : expressions maths déjà rendues.
// - A : liens ; une URL contient "://" (la règle de frontière de formatEmojis le
//   protège déjà, mais on saute les <a> par double prudence).
const EMOJI_SKIP_TAGS = new Set(['CODE', 'PRE', 'LATEX', 'A'])

// Applique les smileys/emojis sur tous les nœuds texte d'un sous-arbre DOM DÉJÀ
// rendu (ex : sortie markdown du forum), en réutilisant formatEmojis (même moteur
// que le chat) pour rester cohérent. On n'opère que sur les nœuds texte hors
// EMOJI_SKIP_TAGS. Un nœud sans emoji est laissé strictement intact (aucun <span>
// parasite créé), donc l'appel est sûr à répéter et ne modifie pas le texte
// contenant des caractères spéciaux (<, >, &) mais aucun smiley.
function applyEmojis(root: HTMLElement): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			let p = node.parentElement
			while (p && p !== root) {
				if (EMOJI_SKIP_TAGS.has(p.tagName)) { return NodeFilter.FILTER_REJECT }
				p = p.parentElement
			}
			return NodeFilter.FILTER_ACCEPT
		},
	})
	// On matérialise la liste AVANT de muter le DOM : remplacer un nœud pendant
	// que le walker le parcourt invaliderait l'itération.
	const targets: Text[] = []
	let n: Node | null
	while ((n = walker.nextNode())) { targets.push(n as Text) }

	for (const textNode of targets) {
		const escaped = LeekWars.protect(textNode.nodeValue ?? '')
		const formatted = formatEmojis(escaped)
		if (formatted === escaped) { continue } // aucun emoji : nœud intact
		const template = document.createElement('template')
		template.innerHTML = formatted
		textNode.parentNode?.replaceChild(template.content, textNode)
	}
}

export { Emojis, formatEmojis, formatEmojisText, applyEmojis }
