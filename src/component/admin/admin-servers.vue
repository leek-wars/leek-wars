<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Serveurs</h1>
		</div>
		<div id="servers" class="panel">
			<div class="content">
				<loader v-if="LeekWars.objectSize(servers) == 0" />
				<div v-else>
					<div v-for="(server, s) in servers" :key="s" class="server card">
						<div class="load">
							<div :style="{'margin-top': (server.load * 136) + 'px'}"></div>
						</div>
						<img src="/image/admin/server.png">
						<br>
						<div class="name">
							{{ server.name }}<img src="/image/connected.png">
						</div>
						<div class="total-wrapper">Total : {{ server.generated | number }}</div>
						<div class="threads">

							<div v-for="(thread, t) in server.threads" :key="t" class="thread">
								<div class="th-name">
									<img v-if="thread.connected" src="/image/connected.png">
									<img v-else src="/image/disconnected.png">
									&nbsp;&nbsp;
									<b>{{ thread.name }}</b>
								</div>
								<span class="green">✔ <span class="generated">{{ thread.generated | number }}</span></span>&nbsp;
								<span class="red">✘ <span class="error">{{ thread.errors | number }}</span></span>
								<br>
								► <span class="task">{{ thread.task }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	const LISTEN_DATA = 15
	const STATS_NEW_THREAD = 16
	const STAT_UPDATE_THREAD = 17
	const STAT_UPDATE_TASK = 18

	@Component({})
	export default class AdminServers extends Vue {
		servers: {[key: string]: any} = {}
		threads: {[key: string]: any} = {}

		created() {
			LeekWars.socket.send([LISTEN_DATA])
			LeekWars.setTitle("Admin serveurs")
			this.$root.$on('wsmessage', this.update)
		}
		update(message: any) {
			const type = message.type
			const data = message.data
			if (type === STATS_NEW_THREAD || type === STAT_UPDATE_THREAD) {
				for (const th of data) {
					this.updateThread(th.server, th.name, th.connected, th.task, th.task_start, th.generated, th.errors)
				}
			}
			if (type === STAT_UPDATE_TASK) {
				const t = data[0]
				this.updateThreadTask(t.name, t.task, t.task_start, t.generated, t.errors)
			}
		}
		updateThread(serverName: any, threadName: any, connected: any, task: any, task_start: any, generated: number, errors: number) {
			if (!(serverName in this.servers)) {
				Vue.set(this.servers, serverName, {name: serverName, generated: 0, threads: {}})
			}
			const server = this.servers[serverName]
			if (!(threadName in server.threads)) {
				const thread = {name: threadName, connected, server, generated, errors, task}
				Vue.set(server.threads, threadName, thread)
				Vue.set(this.threads, threadName, thread)
			}
			this.updateServer(server)
		}
		updateThreadTask(threadName: string, task: string, task_start: any, generated: number, errors: number) {
			if (threadName in this.threads) {
				const thread = this.threads[threadName]
				thread.task = task
				thread.generated = generated
				thread.errors = errors
				this.updateServer(thread.server)
			}
		}
		updateServer(server: any) {
			let total = 0
			let load = 0
			for (const t in server.threads) {
				if (server.threads.hasOwnProperty(t)) {
					total += server.threads[t].generated
					load += server.threads[t].task ? 1 : 0
				}
			}
			server.generated = total
			server.load = 1 - (load / LeekWars.objectSize(server.threads))
		}
	}
</script>

<style lang="scss" scoped>
	.server {
		position: relative;
		background: white;
		margin: 4px;
		padding: 10px;
		display: inline-block;
		text-align: center;
		vertical-align: top;
		width: 300px;
	}
	#servers .server .load {
		position: absolute;
		top: 5px;
		left: 5px;
		width: 11px;
		height: 136px;
		background: #eee;
		overflow: hidden;
		border: 2px solid #eee;
	}
	#servers .server .load div {
		height: 100%;
		width: 11px;
		background: #5FAD1B;
		transition: margin-top 0.4s ease;
	}
	#servers .name {
		font-size: 22px;
		font-weight: 300;
		margin: 5px;
	}
	#servers .name img {
		vertical-align: middle;
		margin-left: 8px;
		width: 16px;
	}
	#servers .server .total-wrapper {
		color: #777;
	}
	#servers .threads {
		text-align: left;
		color: #555;
		border-top: 3px solid #f2f2f2;
		padding-top: 8px;
		margin-top: 8px;
	}
	.server .thread {
		color: #aaa;
		font-size: 14px;
		padding-bottom: 10px;
		padding-left: 5px;
		padding-right: 5px;
		display: inline-block;
		width: 46.5%;
	}
	.server .thread .th-name {
		color: #666;
		font-size: 14px;
		margin-bottom: 4px;
	}
	.server .thread img {
		width: 16px;
		vertical-align: bottom;
	}
	.server .red {
		color: red;
	}
	.server .green {
		color: green;
	}
</style>