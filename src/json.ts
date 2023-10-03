export function replacer(_: any, value: unknown) {
  if (value instanceof Map)
    return { $$type: 'Map', value: Array.from(value.entries()) }
  if (value instanceof Set)
    return { $$type: 'Set', value: Array.from(value.values()) }
  return value
}

export function reviver(_: any, value: unknown) {
  if (typeof value === 'object' && value !== null) {
    const v: Record<string, any> = value
    if (v.$$type === 'Map')
      return new Map(v.value)
    if (v.$$type === 'Set')
      return new Set(v.value)
  }
  return value
}
