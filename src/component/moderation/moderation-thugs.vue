<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<div class="tabs">
				<div class="tab action content" icon="mdi-emoticon-devil-outline">
					<v-icon>mdi-emoticon-devil-outline</v-icon> Voyous
				</div>
			</div>
		</div>

		<panel title="Top Voyous">
			<div slot="content" class="thugs">
				<loader v-if="!thugs" />
				<div v-else>
					<div v-for="thug in thugs" :key="thug.id" class="thug">
						<avatar :farmer="thug" />
						<router-link :to="'/farmer/' + thug.id" class="text">{{ thug.name }} ({{ thug.warnings }})</router-link>
						<v-btn @click="ban(thug)">Bannir</v-btn>
					</div>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Fault, Warning } from '@/model/moderation'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	class ModerationRequest {
		faults!: Fault[]
		thugs!: Farmer[]
	}

	@Component({ name: "moderation-thugs", i18n: {}, components: { Breadcrumb } })
	export default class ModerationThugs extends Vue {
		thugs: any = null

		get breadcrumb_items() {
			return [
				{name: "Modération", link: '/moderation'},
				{name: "Voyous", link: '/moderation/thugs'},
			]
		}

		created() {
			LeekWars.get<ModerationRequest>('moderation/get-reportings').then(data => {
				this.thugs = data.thugs
				LeekWars.setTitle(this.$t('title'))
			})
		}

		ban(farmer: Farmer) {
			LeekWars.post('moderation/ban', {target: farmer.id}).then(data => {
				LeekWars.toast("Éleveur banni")
			}).error(error => {
				LeekWars.toast(error)
			})
		}
	}
</script>

<style lang="scss" scoped>
	.column5 {
		position: sticky;
		top: 15px;
	}
	#app.app .panel.first .header {
		display: none;
	}
	.empty {
		text-align: center;
		padding: 20px;
		i {
			font-size: 100px;
			color: #ccc;
		}
	}
	.faults {
		padding: 10px;
	}
	.fault {
		display: block;
		padding: 8px;
		padding-bottom: 4px;
		border: 1px solid #ddd;
		border-radius: 2px;
		margin-bottom: 10px;
	}
	.fault.router-link-active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	#app.app .faults .fault {
		margin: 0;
		margin-bottom: 10px;
	}
	.faults .fault.selected {
		border: 2px solid #ddd;
		opacity: 1;
	}
	.faults .fault img {
		width: 80px;
		float: left;
		margin-right: 10px;
		margin-bottom: 4px;
	}
	.faults .fault .target-name {
		font-weight: 300;
		font-size: 20px;
		margin-bottom: 5px;
	}
	.faults .fault .reporting-count {
		margin-bottom: 9px;
	}
	.faults .fault .reporting {
		margin-bottom: 5px;
		.message {
			padding: 3px 0;
		}
	}
	.faults .fault .reporter {
		color: #666;
		font-size: 14px;
	}
	.title {
		display: block;
		text-align: left;
		text-transform: uppercase;
		margin-top: -2px;
		font-size: 14px;
		color: #555;
		margin-bottom: 8px;
	}
	.warning {
		margin-bottom: 10px;
		padding: 10px;
	}
	.select {
		margin: 10px 0;
		::v-deep input {
			border: none;
		}
		::v-deep legend {
			margin-left: 17px;
		}
		::v-deep label.v-label {
			z-index: 2;
			left: -6px;
		}
	}
	.select-item {
		max-width: 500px;
	}
	.desc {
		font-weight: normal;
		color: #555;
		white-space: normal;
	}
	.details {
		margin-top: 5px;
		a {
			color: #5fad1b;
			font-weight: bold;
		}
	}
	.says {
		max-height: 150px;
		overflow-y: auto;
		border: 1px solid #ddd;
		padding: 4px;
		margin: 4px 0;
	}
	.farmer {
		padding: 10px;
		text-align: center;
		margin-bottom: 10px;
		.avatar {
			flex: 0 0 140px;
			width: 140px;
			height: 140px;
		}
		.infos {
			flex: 1;
			text-align: left;
			padding: 0 12px;
			.info {
				padding: 2px 0;
			}
			img {
				width: 16px;
				vertical-align: bottom;
			}
			i {
				font-size: 16px;
			}
			.name {
				margin-bottom: 5px;
				font-size: 22px;
			}
		}
	}
	.warn-action {
		margin-top: 6px;
		text-align: justify;
		.text {
			color: #555;
		}
	}
	.warning-message {
		width: 100%;
		max-width: 100%;
		min-height: 50px;
		padding: 3px 6px;
	}
	.thugs {
		padding: 10px;
	}
	.thugs .thug {
		margin: 3px;
		display: flex;
		align-items: center;
	}
	.thugs .thug a, .thugs {
		vertical-align: top;
	}
	.thug .button {
		vertical-align: top;
		margin: 0;
		margin-top: -3px;
		float: right;
	}
	.thugs .thug img {
		margin-right: 5px;
		width: 25px;
		height: 25px;
	}
	.thug .text {
		flex: 1;
	}
	.buttons {
		display: flex;
		margin-top: 10px;
	}
	.buttons button {
		flex: 1;
		white-space: nowrap;
		margin: 0;
		&:first-child {
			margin-right: 5px;
		}
		i {
			margin-right: 5px;
		}
	}
</style>