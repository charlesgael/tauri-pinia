# tauri-pinia

This is a small utility that brings persistance to pinia for tauri apps

Installation is pretty simple

```ts
const app = createApp(YourApp)
app.use(await tauriPinia())
app.mount('#app')
```

It requires await during initialisation however because the module will do a first read from fs before initialisation.

Some configuration is available (given as argument to `tauriPinia()`):

- `singleFile`: If we do use single file for storage or one file per store
- `storeFilename`: (when `singleFile = false`) A store name to file name conversion, should you need it (e.g. `{'myStore': 'storageFileForMyStore.json'}`) it is not mandatory
- `filename`: (when `singleFile = true`) The name of the file to save in
- `logger`: A function, the same type as `console.log` for those who want more info what's happening

## Non-persistant attributes

tauri-pinia now allows for non persistant attributes. In order to do it, a new property has been added in `StoreConfig`: `ignoreProps`.

In order to use it, simply do the following:

``` ts
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useCredentialStore = defineStore('credential', () => {
  const username = ref<string>()
  const password = ref<string>()
  const userId = ref<string>()

  const withDefault = ref<string>('default_value')
  const ignored = ref<number>(0)

  return { username, password, jiraUrl, userId, withDefault, ignored }
}, {
  ignoreProps: ['ignored'],
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useCredentialStore as any, import.meta.hot))
```

In this example, the property ignored won't be written to disk nor loaded from disk.