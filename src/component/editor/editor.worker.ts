// Worker éditeur de Monaco (c'est lui qui calcule le surlignage Unicode). Un worker ne passe
// pas par main.ts : il charge lui-même les polyfills, AVANT le code de Monaco.
import '@/polyfills-es'
import 'monaco-editor/esm/vs/editor/editor.worker.js'
