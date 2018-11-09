import './class-component-hooks'

import '@/model/vue'
import axios from 'axios'
import 'es6-promise/auto'
import 'katex/dist/katex.min.css'
import './global.scss'
import './sfw.scss'

axios.defaults.headers = {
	'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
}