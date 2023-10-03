import type { StateTree } from 'pinia'

interface CommonConfig {
  logger?: typeof console.log
  excludeStore: string[]
}

export interface ConfigMonoFile extends CommonConfig {
  readonly singleFile: true
  readonly filename?: string
}

export interface ConfigMultiFiles extends CommonConfig {
  readonly singleFile: false
  readonly storeFilename?: Record<string, string>
}

export type ModuleConfig = ConfigMonoFile | ConfigMultiFiles

/**
 * Config implementation
 */
// eslint-disable-next-line ts/ban-types
export interface StoreConfig<S extends StateTree = any> {
  ignoreProps?: (keyof S)[]
}

/**
 * We enlarge pinia config to accept those new arguments
 */
declare module 'pinia' {
  export interface DefineSetupStoreOptions<Id extends string, S extends StateTree, G, A> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>>, StoreConfig<S> {}
  export interface DefineStoreOptionsInPlugin<Id extends string, S extends StateTree, G, A> extends Omit<DefineStoreOptions<Id, S, G, A>, 'id' | 'actions'>, StoreConfig<S> {}
}
