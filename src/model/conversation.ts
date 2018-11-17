import { Farmer } from '@/model/farmer'

class Conversation {
	id!: number
	farmers!: Farmer[]
	last_message!: string
	last_farmer_id!: number
	last_farmer_name!: string
	unread!: boolean
}

export { Conversation }