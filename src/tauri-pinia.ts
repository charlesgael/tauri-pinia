import {
  BaseDirectory,
  createDir,
  readDir,
  readTextFile,
  writeFile,
} from '@tauri-apps/api/fs'
import { debounce } from 'debounce'
import type { Pinia, PiniaPluginContext, StateTree, Store, SubscriptionCallbackMutation } from 'pinia'
import { createPinia } from 'pinia'
import { addExcluded, addStore, filterValues } from './store-mgr'
import { getFilename, getStorename } from './multi-file.helper'
import { replacer, reviver } from './json'
import { DEFAULT_SINGLEFILE_NAME } from './constants'
import type { ModuleConfig } from './interfaces'

export async function tauriPinia(options?: Partial<ModuleConfig>): Promise<Pinia> {
  const _options: ModuleConfig = Object.assign(
    { singleFile: false, excludeStore: [] },
    options,
  )

  const load = async () => {
    try {
      if (_options.singleFile === false) {
        await createDir('stores', { recursive: true, dir: BaseDirectory.App })
        const files = await readDir('stores', { dir: BaseDirectory.App })
        const contents = await Promise.all(
          files
            .filter(file => file.name?.endsWith('.json'))
            .map(async (file) => {
              try {
                return {
                  [getStorename(file.name || '', _options.storeFilename)]: JSON.parse(
                    await readTextFile(file.path),
                    reviver,
                  ),
                }
              }
              catch (err) {
                console.error('Could not read file', err)
              }
              return {}
            }),
        )
        const store = contents.reduce<Record<string, any>>(
          (acc, val) => Object.assign(acc, val),
          {},
        )
        options?.logger?.('Loaded store', { ...store })
        return store
      }
      else {
        await createDir('.', { recursive: true, dir: BaseDirectory.App })
        const store = JSON.parse(
          await readTextFile(_options.filename || DEFAULT_SINGLEFILE_NAME, {
            dir: BaseDirectory.App,
          }),
          reviver,
        )
        options?.logger?.('Loaded store', { ...store })
        return store
      }
    }
    catch (err) {
      console.error('Could not read file', err)
    }
    return {}
  }

  const save = debounce(async (storeId: string, store: any, fullStore: any) => {
    try {
      if (_options.singleFile === false) {
        const savedData = filterValues(storeId, store)
        options?.logger?.(`Saving store "${storeId}"`, savedData)

        await writeFile(
          {
            contents: JSON.stringify(savedData, replacer, 2),
            path: `stores/${getFilename(storeId, _options.storeFilename)}`,
          },
          { dir: BaseDirectory.App },
        )
      }
      else {
        options?.logger?.('Saving whole pinia', fullStore)
        await writeFile(
          {
            contents: JSON.stringify(fullStore, replacer, 2),
            path: _options.filename || DEFAULT_SINGLEFILE_NAME,
          },
          { dir: BaseDirectory.App },
        )
      }
    }
    catch (err) {
      console.error('Could not save file', err)
    }
  }, 1000)

  addExcluded(..._options.excludeStore)

  const pinia = createPinia()

  await load().then((store) => {
    pinia.use((ctx: PiniaPluginContext) => {
      const storeId = ctx.store.$id
      if (!_options.excludeStore.includes(storeId)) {
      // Register store options
        addStore(storeId, ctx.options)
        // Assign in store
        applyAll(ctx.store, filterValues(storeId, store[storeId]))
        // Saves on change
        ctx.store.$subscribe((mutation: SubscriptionCallbackMutation<StateTree>, state) => {
          save(mutation.storeId, state, pinia.state.value)
        })
      }
    })
  })

  return pinia
}

function applyAll(store: Store, record: Record<string, any>) {
  return Object.entries(record).forEach(([key, value]) => {
    // eslint-disable-next-line no-prototype-builtins
    if (store.hasOwnProperty(key))
      (store as any)[key] = value
  })
}
