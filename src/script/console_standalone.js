var LW = {
	version: __VERSION,
	subVersion: __SUB_VERSION,
	prod: location.host.indexOf("leekwars.com") === 0,
	beta: location.host.indexOf("beta.leekwars.com") === 0,
	dev: location.host.indexOf("localhost") === 0 && !__LOCAL,
	local: location.host.indexOf("localhost") === 0 && __LOCAL,
	staticURL: __STATIC_URL,
	api: __API_URL
}

LW.token = function() {
	if (LW.dev) return localStorage['token']
	return '$'
}

var html = "<div class='leekscript-console fullscreen' autostopscroll>\
	<div class='lines'></div>\
	<div class='input'>\
		<span class='arrow'>►</span><input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false'>\
	</div>\
</div>"

$(document).ready(function() {

	_.init({
		api: LW.api,
		version: LW.subVersion,
		view_cache: LW.prod,
		lang_cache: LW.prod,
		local: LW.local || LW.dev
	})

	$('html').css('overflow-x', 'hidden')
	$('body').css('overflow', 'hidden')
	$("body").append(html)
	_.title("LeekScript V2 Console")

	var console = new ConsoleController($('.leekscript-console'))
	console.focus()
})
