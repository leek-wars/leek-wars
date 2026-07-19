
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import './component/editor/codemirror/bracefold'
import './component/editor/codemirror/commentfold'
import './component/editor/codemirror/comment'
import './component/editor/codemirror/continuecomment'
import './component/editor/codemirror/foldcode'
import './component/editor/codemirror/foldgutter'
import './component/editor/codemirror/leekscript'
// Modes additionnels pour la coloration des blocs de code polyglot (```js, ```python, ...)
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/python/python'
import './component/editor/codemirror/match-highlighter'
import './component/editor/codemirror/matchbrackets'
import './component/editor/codemirror/runmode.js'

export { CodeMirror }