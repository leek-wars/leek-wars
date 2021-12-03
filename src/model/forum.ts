import { Farmer } from "./farmer"

class ForumCategory {
	public id!: number
	public name!: string
	public team!: number
	public topics!: ForumTopic[] | null
}

class ForumTopic {
	public id!: number
	public name!: string
	public messages!: ForumMessage[] | null
	public resolved!: boolean
	public locked!: boolean
	public pinned!: boolean
	public subscribed!: boolean
	public issue!: number
}

class ForumMessage {
	public id!: number
	public message!: string
	public html!: string | null
	public votes_up!: number
	public votes_down!: number
	public my_vote!: number
	public editing!: boolean
	public height!: number
	public edition_date!: number
	public writer!: Farmer
}

export { ForumCategory, ForumTopic, ForumMessage }
