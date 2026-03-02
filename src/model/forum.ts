import { Farmer } from "./farmer"

class ForumCategory {
	public id!: number
	public name!: string
	public team!: number
	public topics!: ForumTopic[] | null
}

enum ForumTopicStatus {
	OPEN = 0,
	RESOLVED = 1,
	NOT_REPRODUCED = 2,
	NOT_PLANNED = 3,
	NOT_A_BUG = 4,
}

class ForumTopic {
	public id!: number
	public name!: string
	public messages!: ForumMessage[] | null
	public status!: ForumTopicStatus
	public locked!: boolean
	public pinned!: boolean
	public subscribed!: boolean
	public acknowledged!: boolean
	public issue!: number
	public private_issue!: number
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

export { ForumCategory, ForumTopic, ForumMessage, ForumTopicStatus }
