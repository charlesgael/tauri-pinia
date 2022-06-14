# tauri-pinia

This is a small utility that brings persistance to pinia for tauri apps

Installation is pretty simple

```ts
const app = createApp(YourApp);
app.use(await tauriPinia());
app.mount('#app');
```

It requires await during initialisation however because the module will do a first read from fs before initialisation.

Some configuration is available (given as argument to `tauriPinia()`):

- `singleFile`: If we do use single file for storage or one file per store
- `storeFilename`: (when `singleFile = false`) A store name to file name conversion, should you need it (e.g. `{'myStore': 'storageFileForMyStore.json'}`) it is not mandatory
- `filename`: (when `singleFile = true`) The name of the file to save in
