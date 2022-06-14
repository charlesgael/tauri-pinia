import {
  BaseDirectory,
  createDir,
  readDir,
  readTextFile,
  writeFile,
} from '@tauri-apps/api/fs';
import { debounce } from 'debounce';
import { createPinia } from 'pinia';

import { replacer, reviver } from './json';

const DEFAULT_SINGLEFILE_NAME = 'pinia.json';

type ConfigMonoFile = {
  readonly singleFile: true;
  readonly filename?: string;
};

type ConfigMultiFiles = {
  readonly singleFile: false;
  readonly storeFilename?: Record<string, string>;
};

type ConfigTauriPinia = ConfigMonoFile | ConfigMultiFiles;

export async function tauriPinia(options?: ConfigTauriPinia) {
  const _options: ConfigTauriPinia = Object.assign(
    { singleFile: false },
    options
  );

  const load = async (init: any) => {
    try {
      if (_options.singleFile === false) {
        await createDir('stores', { recursive: true, dir: BaseDirectory.App });
        const files = await readDir('stores', { dir: BaseDirectory.App });
        const contents = await Promise.all(
          files
            .filter((file) => file.name?.endsWith('.json'))
            .map(async (file) => {
              try {
                const storeName = file.name!.slice(0, -5);
                return {
                  [_options.storeFilename?.[storeName] || storeName]:
                    JSON.parse(await readTextFile(file.path), reviver),
                };
              } catch (err) {
                console.error('Could not read file', err);
              }
              return {};
            })
        );
        const store = contents.reduce<Record<string, any>>(
          (acc, val) => Object.assign(acc, val),
          {}
        );
        console.log('Loaded store', { ...store }, { ...init });
        return store;
      } else {
        await createDir('.', { recursive: true, dir: BaseDirectory.App });
        const store = JSON.parse(
          await readTextFile(_options.filename || DEFAULT_SINGLEFILE_NAME, {
            dir: BaseDirectory.App,
          }),
          reviver
        );
        console.log('Loaded store', { ...store }, { ...init });
        return store;
      }
    } catch (err) {
      console.error('Could not read file', err);
    }
    return {};
  };

  const save = debounce(async (storeId: string, store: any, fullStore: any) => {
    try {
      if (_options.singleFile === false) {
        console.log(`Saving store "${storeId}"`, store);
        const filename =
          Object.entries(_options.storeFilename || {}).find(
            ([, value]) => value === storeId
          )?.[0] || storeId;
        await writeFile(
          {
            contents: JSON.stringify(store, replacer, 2),
            path: `stores/${filename}.json`,
          },
          { dir: BaseDirectory.App }
        );
      } else {
        console.log('Saving whole pinia', fullStore);
        await writeFile(
          {
            contents: JSON.stringify(fullStore, replacer, 2),
            path: _options.filename || DEFAULT_SINGLEFILE_NAME,
          },
          { dir: BaseDirectory.App }
        );
      }
    } catch (err) {
      console.error('Could not save file', err);
    }
  }, 1000);

  const pinia = createPinia();

  // First load
  await load(pinia).then((store) => {
    pinia.state.value = store;

    // connect read/write to saves
    pinia.use((ctx) => {
      // Saves on change
      ctx.store.$subscribe((mutation, state) => {
        console.log(mutation, state);
        save(mutation.storeId, state, pinia.state.value);
      });
    });
  });

  return pinia;
}
