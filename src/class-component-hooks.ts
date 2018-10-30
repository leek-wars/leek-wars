import { Component } from 'vue-property-decorator'

// Register the router hooks with their names
Component.registerHooks([
	'beforeRouteEnter',
	'beforeRouteLeave',
	'beforeRouteUpdate' // for vue-router 2.2+
])