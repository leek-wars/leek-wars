/** Compatibility shim for vue-property-decorator v10
 * In v10, @Component is renamed to @Options
 * This shim re-exports Options as Component for backwards compatibility
 */
// Import vue-class-component exports directly
import { mixins, Options, Vue } from 'vue-class-component'

export { mixins, Options, Vue }

// Import each decorator directly from its file to avoid circular imports
export { Emit } from '../node_modules/vue-property-decorator/lib/decorators/Emit.js'
export { Inject } from '../node_modules/vue-property-decorator/lib/decorators/Inject.js'
export { Model } from '../node_modules/vue-property-decorator/lib/decorators/Model.js'
export { Prop } from '../node_modules/vue-property-decorator/lib/decorators/Prop.js'
export { Provide } from '../node_modules/vue-property-decorator/lib/decorators/Provide.js'
export { Ref } from '../node_modules/vue-property-decorator/lib/decorators/Ref.js'
export { Watch } from '../node_modules/vue-property-decorator/lib/decorators/Watch.js'
