<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('documentation.title') }}</h1>
		</div>
		<div class="documentation">
			<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column3">
				<panel class="first">
					<div slot="content">
						<div class="search-box">
							<img src="/image/search_black.png">
							<input v-model="query" type="text" @input="changeQuery">
						</div>
						<div v-autostopscroll="'bottom'" class="items-list">
							<div v-for="category in categories" :key="category.id">
								<h2>{{ $t('documentation.function_category_' + category.name) }}</h2>
								<router-link v-for="(item, i) in items_by_category[category.id]" v-if="item.name === item.real_name" :key="i" :to="'/help/documentation/' + item.name" :item="item.name" class="item">
									{{ item.name }}
								</router-link>
							</div>
						</div>
					</div>
				</panel>
			</div>
			<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column9">
				<panel>
					<div v-autostopscroll="'bottom'" slot="content" ref="elements" class="items">
						<div v-for="(item, i) in items" :key="i" :item="item.name" :class="{deprecated: item.deprecated}" class="item">
							<documentation-function v-if="'return_type' in item" :fun="item" />
							<documentation-constant v-else :constant="item" />
						</div>
					</div>
				</panel>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Function } from '@/model/function'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import DocumentationConstant from './documentation-constant.vue'
	import DocumentationFunction from './documentation-function.vue'
	@Component({
		name: 'documentation',
		components: { DocumentationFunction, DocumentationConstant }
	})
	export default class Documentation extends Vue {
		categories: any[] = []
		items: any[] = []
		items_by_category: {[key: number]: any} = {}
		query: string = ''
		Function = Function
		created() {
			const get_categories = (callback: any) => {
				if (localStorage.getItem('data/function_categories')) {
					callback({categories: JSON.parse(localStorage.getItem('data/function_categories') || '[]')})
				} else {
					LeekWars.get<any>('function/get-categories').then((data) => {
						localStorage.setItem('data/function_categories', JSON.stringify(data.categories))
						callback(data)
					})
				}
			}
			get_categories((data: any) => {
				this.categories = data.categories
				for (const category in this.categories) {
					this.items_by_category[category] = []
				}
				let last: any
				let index = 1
				for (const item of LeekWars.functions) {
					(item as any).real_name = item.name
					if (last != null && last.name === item.name) {
						(item as any).real_name = last.name + '_' + (++index)
					} else {
						index = 1
					}
					this.items.push(item)
					; (item as any).lower_name = item.name.toLowerCase()
					this.items_by_category[item.category].push(item)
					last = item
				}
				for (const item of LeekWars.constants) {
					this.items.push(item)
					; (item as any).lower_name = item.name.toLowerCase()
					; (item as any).real_name = item.name
					this.items_by_category[item.category].push(item)
				}

				LeekWars.setTitle(this.$i18n.t('documentation.title'))
				this.update()

				setTimeout(() => {
					document.querySelectorAll('.items .item').forEach((item) => {
						let text: any = item.innerHTML
						let changed = false
						let pos = 0
						while ((pos = this.regexIndexOf(text, /[ \(>-]#/, pos + 1)) >= 0) {
							pos += 2
							let size = 0
							while (this.isNameChar(text.charAt(pos))) {
								pos++
								size++
							}
							if (size > 0) {
								const link = text.substring(pos - size, pos)
								text = text.slice(0, pos - size - 1) + text.slice(pos - size)
								text = this.insert(text, pos - 1, "'>" + link + "</a>")
								text = this.insert(text, pos - size - 1, "<a href='/help/documentation/")
								pos += 15
								changed = true
							}
						}
						if (changed) {
							item.innerHTML = text
							item.querySelectorAll('a').forEach((a: any) => {
								a.onclick = (e: Event) => {
									e.stopPropagation()
									e.preventDefault()
									this.query = ''
									this.changeQuery()
									setTimeout(() => {
										this.$router.push(a.getAttribute('href'))
										this.update()
									}, 50)
									return false
								}
							})
						}
					})
					document.querySelectorAll('.documentation code').forEach((item) => {
						const content = '' + item.textContent
						LeekWars.createCodeArea(content, item as HTMLElement)
					})
				}, 100)
			})
			this.$root.$on('back', () => {
				this.$router.push('/help/documentation')
			})
		}
		isNameChar(char: string) {
			return /[a-zA-Z0-9_]/.test(char)
		}
		@Watch('$route.params')
		update() {
			if (this.$route.params && 'item' in this.$route.params) {
				LeekWars.splitShowContent()
				this.selectItem(this.$route.params.item)
				LeekWars.setTitle(this.$route.params.item)
			} else {
				LeekWars.splitShowList()
				LeekWars.setTitle(this.$i18n.t('documentation.title'))
			}
		}
		selectItem(item: string) {
			setTimeout(() => {
				const element: any = document.querySelector('.items .item[item=' + item + ']')
				const elements = this.$refs.elements as HTMLElement
				if (element) {
					const offset = LeekWars.mobile ? 70 : 140
					elements.scrollTo(0, element.offsetTop - offset)
				}
			}, 100)
		}
		changeQuery() {
			const items = document.querySelectorAll(".items .item")
			if (this.query.length) {
				const query = this.query.toLowerCase()
				items.forEach((item: any) => {
					const fields = item.querySelectorAll('.searchable')
					const menuItem: any = document.querySelector('.items-list .item[item=' + item.getAttribute('item') + ']')
					for (const field of fields) {
						if (('' + field.textContent).toLowerCase().indexOf(query) !== -1) {
							item.style.display = 'block'
							menuItem.style.display = 'block'
							return
						}
					}
					item.style.display = 'none'
					menuItem.style.display = 'none'
				})
			} else {
				items.forEach((item: any) => {
					item.style.display = 'block'
					const menuItem: any = document.querySelector('.items-list .item[item=' + item.getAttribute('item') + ']')
					menuItem.style.display = 'block'
				})
			}
		}
		insert(str: string, idx: number, s: string) {
			return (str.slice(0, idx) + s + str.slice(idx))
		}
		regexIndexOf(str: string, regex: RegExp, startpos: number) {
			const indexOf = str.substring(startpos || 0).search(regex)
			return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf
		}
	}
</script>

<style lang="scss" scoped>
	.documentation {
		height: calc(100vh - 140px);
		padding-bottom: 12px;
	}
	#app.app .documentation {
		height: calc(100vh - 56px);
		padding-bottom: 0;
	}
	.column3 {
		position: sticky;
		top: 12px;
		height: 100%;
	}
	.column9 {
		height: 100%;
	}
	.panel {
		height: 100%;
	}
	.column3 .panel > div {
		padding: 0;
		height: 100%;
	}
	.items-list {
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		height: calc(100% - 46px);
	}
	.items-list h2 {
		font-size: 13px;
		font-weight: bold;
		color: #888;
		position: sticky;
		top: 0;
		padding: 6px 10px;
		margin-bottom: 4px;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.items-list .item {
		cursor: pointer;
		padding: 3px 10px;
		display: block;
	}
	.items-list .item:hover, .item.router-link-active {
		font-weight: bold;
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.items {
		padding: 10px;
		overflow-y: auto;
		overflow-x: hidden;
		height: calc(100% - 20px);
	}
	.items .item {
		margin-bottom: 20px;
		position: relative;
		padding-bottom: 20px;
		max-height: 999999px;
	}
	.items .item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	.items .item /deep/ .content {
		padding-right: 100px;
		padding-left: 10px;
	}
	.items .item /deep/ a {
		color: #5fad1b;
		text-decoration: underline;
	}
	.items .item /deep/ h2 {
		margin-bottom: 10px;
		font-size: 20px;
	}
	.items .item /deep/ ul {
		margin: 5px 0;
	}
	.items .function-name {
		color: black;
	}
	.item /deep/ h4 {
		font-weight: 300;
		margin: 0;
		color: #666;
		margin-top: 8px;
	}
	.items /deep/ .item.deprecated {
		opacity: 0.6;
	}
	.items /deep/ .item .deprecated-message {
		color: #ff7f00;
		font-weight: bold;
		margin: 10px;
	}
	pre {
		max-width: 500px;
	}
	.search-box {
		display: flex;
		align-items: center;
		padding: 8px;
	}
	.search-box img {
		margin: 4px;
	}
	input {
		width: 100%;
	}
</style>