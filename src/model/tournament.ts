import { Comment } from '@/model/comment'

interface TournamentEntry {
	me?: boolean
	data?: number[]
	win?: boolean
	image?: string
	id?: number
	farmer_id?: number
	farmer_avatar_changed?: number
	link?: string
	name?: string
	[key: string]: unknown
}

class Tournament {
	id!: number
	type!: number
	date!: number
	finished!: boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	rounds!: any
	comments!: Comment[]
	next_round!: number
	group!: number | null
	size!: number
	winner?: TournamentEntry
	min_power?: number
	max_power?: number
	current?: number
	registered?: boolean
}

export type { TournamentEntry }

export { Tournament }