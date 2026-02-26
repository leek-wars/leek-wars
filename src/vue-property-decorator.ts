/** Compatibility shim: re-exports from vue-facing-decorator
 * All 248 .vue files import from 'vue-property-decorator' which is aliased
 * to this file via vite.config.ts resolve.alias.
 * vue-facing-decorator uses @Component instead of @Options, so we re-export
 * Component as Options for backward compatibility.
 */
import { Component, Vue, Prop, Watch, Ref, Emit, Inject, Provide, mixins } from 'vue-facing-decorator'

// Re-export Component as Options (backward compat with vue-property-decorator)
const Options = Component

export { Options, Vue, Prop, Watch, Ref, Emit, Inject, Provide, mixins }
