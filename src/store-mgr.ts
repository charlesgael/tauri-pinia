import type { StateTree } from 'pinia'
import type { StoreConfig } from './interfaces'

const stores: Record<string, StoreConfig> = {}
const excluded: string[] = []

export const addExcluded = (...stores: string[]) => stores.forEach(it => excluded.push(it))

export const addStore = (storeId: string, config: StoreConfig) => stores[storeId] = { ...config }

export function filterValues(storeId: string, record: Record<string, any> | undefined) {
  const ignoredProps = (stores[storeId]?.ignoreProps || [])
  return Object.fromEntries(Object.entries(record || {})
    .filter(([it]) => !ignoredProps.includes(it)),
  )
}

export function filterFullStore(record: Record<string, StateTree>) {
  Object.fromEntries(Object.entries(record)
    .filter(([storeId]) => !excluded.includes(storeId))
    .map(([storeId, store]) => [storeId, filterValues(storeId, store)]),
  )
}
