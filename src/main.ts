import '@/model/vue'
import axios from 'axios'
import 'es6-promise/auto'
import 'katex/dist/katex.min.css'
import 'vue-github-buttons/dist/vue-github-buttons.css'

axios.defaults.headers = {
	'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
}

// function checkUpdate() {
// TODO
// if ('version' in localStorage && 'sub_version' in localStorage) {
// 	var version = parseInt(localStorage.getItem('version'))
// 	var subVersion = parseInt(localStorage.getItem('sub_version'))
// 	if (version != LW.version || subVersion != LW.subVersion) {
// 		LW.clear()
// 		if (version != LW.version) {
// 			LW.updated = true
// 		}
// 	}
// } else {
// 	LW.clear()
// }
// localStorage.setItem('version') = LW.version
// localStorage.setItem('sub_version') = LW.subVersion

// Popup changelog
// if (localStorage['changelog_version'] != localStorage['version']) {
// 	LW.changelogPopup()
// 	localStorage['changelog_version'] = localStorage['version']
// }
// }

// function changelogPopup() {
// _.lang.load('changelog', false, function() {
// 	_.get('changelog/get-last/' + _.lang.current, function(data) {
// 		if (data.success) {
// 			for (var d in data.changelog) {
// 				var changes_data = _.lang.get('changelog', data.changelog.data)
// 				data.changelog.changes = []
// 				var changes_array = changes_data.split("\n")
// 				for (var c in changes_array) {
// 					var change = changes_array[c].replace('# ', '')
// 					if (change.length > 0) {
// 						data.changelog.changes.push(change)
// 					}
// 				}
// 			}
// 			new _.popup.new('main.changelog_popup', data.changelog, 800, true).show()
// 		}
// 	})
// })
// }
