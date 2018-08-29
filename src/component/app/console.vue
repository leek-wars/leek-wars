<template lang="html">
	<div v-autostopscroll ref="scroll" class="leekscript-console">
		<div class="lines">
			<div v-for="(line, l) in lines" :key="l" class="line">
				<div v-if="line.type === 'code'">
					<span class="arrow">►</span><span>{{ line.code }}</span>
				</div>
				<div v-else-if="line.type === 'result'">
					<div class="line result">{{ line.result }}<span class="time">{{ line.time }}</span></div>
				</div>
				<div v-else>
					<div class="result error">error</div>
				</div>
			</div>
		</div>
		<div class="input">
			<span class="arrow">►</span><input ref="input" v-model="code" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" @keydown.enter="enter">
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class Console extends Vue {
		code: string = ''
		lines: any[] = []

		enter() {
			const code = this.code
			LeekWars.post('leekscript/execute', {code}).then((data) => {
				if (data.data.success) {
					this.lines.push({type: 'code', code})
					if (!data.data.result) {
						this.lines.push({type: 'error'})
					} else {
						const json = JSON.parse(data.data.result)
						const time = json.ops + ' op' + (json.ops > 1 ? 's' : '') + ' | ' + Math.round(json.time / 1000) / 1000 + 'ms'
						this.lines.push({type: 'result', result: json.res, time})
					}
					this.scrollDown()
				} else {
					LeekWars.toast(data.data.error)
				}
				this.code = ''
			})
		}
		scrollDown() {
			setTimeout(() => {
				(this.$refs.scroll as HTMLElement).scrollTop = (this.$refs.scroll as HTMLElement).scrollHeight
			}, 50)
		}
		focus() {
			(this.$refs.input as HTMLElement).focus()
		}
		random() {
			LeekWars.get<any>('leekscript/random').then((data) => {
				if (data.data.success) {
					this.code = data.data.code
				} else {
					LeekWars.toast(data.data.error)
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.leekscript-console {
		height: 300px;
		background: rgba(45, 45, 45, 0.9);
		color: #ccc;
		font-family: monospace;
		font-size: 16px;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 5px;
	}
	.leekscript-console.fullscreen {
		width: calc(100% - 10px);
		height: calc(100% - 10px);
	}
	.leekscript-console .lines .line {
		padding: 2px 4px;
		word-wrap: break-word;
	}
	.leekscript-onsole .line .line span {
		vertical-align: top;
	}
	.leekscript-console .lines .line.result {
		color: white;
		font-weight: bold;
		font-size: 16px;
		margin-bottom: 2px;
	}
	.leekscript-console .lines .line.result.error {
		color: red;
	}
	.leekscript-console .lines .line.result .time {
		font-size: 13px;
		margin-left: 10px;
		font-weight: normal;
		color: #888;
	}
	.leekscript-console .input {
		padding: 2px 4px;
	}
	.leekscript-console input {
		border: none;
		background: transparent;
		color: white;
		font-family: monospace;
		margin: 0;
		padding: 0;
		font-size: 16px;
		min-height: 0;
		width: calc(100% - 18px);
	}
	.leekscript-console .arrow {
		width: 18px;
		margin-right: 6px;
		color: white;
		vertical-align: top;
	}
</style>