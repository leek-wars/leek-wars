import { Comment } from '@/model/comment'

class Tournament {
	id!: number
	type!: number
	date!: number
	finished!: boolean
	rounds!: unknown
	comments!: Comment[]
	next_round!: number
	group!: number | null
	size!: number
	winner?: number
	min_power?: number
	max_power?: number
}

export { Tournament }