import { Farmer } from '@/model/farmer'

class Conversation {
	id!: number
	farmers!: Farmer[]
	last_message!: string
	last_farmer_id!: number
	unread!: boolean
	constructor() {
		this.id = 0
		this.farmers = []
		this.last_message = ''
	}
}

export { Conversation }