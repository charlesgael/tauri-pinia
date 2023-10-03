import { DEFAULT_EXTENSION } from './constants'

export function getFilename(storeId: string, storeFilename: Record<string, string> = {}): string {
  return storeFilename[storeId] ?? `${storeId}.${DEFAULT_EXTENSION}`
}

export function getStorename(filename: string, storeFilename?: Record<string, string>): string {
  return Object.entries(storeFilename || {})
    .find(([,value]) => value === filename)
    ?.[0] || filename.slice(0, -DEFAULT_EXTENSION.length - 1)
}
