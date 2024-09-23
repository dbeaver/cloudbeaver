/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { entries, type IReactionDisposer, keys, observable, ObservableMap, reaction, remove, runInAction, set, toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import { IndexedDB, type IndexedDBTable } from './IndexedDB/IndexedDB.js';
import { IndexedDBService } from './IndexedDB/IndexedDBService.js';

interface ILocalStorageElement<T extends Record<any, any> | Map<any, any>> {
  storeId: string;
  store: T;
  defaultValue: () => T;
  remap?: (savedStore: T) => T;
  onUpdate?: () => void;
  setStorage(storage: Storage | LocalStorageIndexedDB): void;
}

export type LocalStorageType = 'local' | 'session' | 'indexed';

interface IMessage {
  type: 'init' | 'respond';
}

@injectable()
export class LocalStorageSaveService {
  get storage(): LocalStorageType {
    return this.storageType;
  }

  readonly onStorageChange: ISyncExecutor<LocalStorageType>;

  private readonly broadcastChannel: BroadcastChannel;
  private readonly storages: Map<string, ILocalStorageElement<any>>;
  private storageType: LocalStorageType;
  private readonly indexedDBStore: LocalStorageIndexedDB;

  constructor(private readonly indexedDBService: IndexedDBService) {
    this.storageType = 'local';
    this.broadcastChannel = new BroadcastChannel('local-storage');
    this.storages = new Map();
    this.onStorageChange = new SyncExecutor();
    this.indexedDBStore = new LocalStorageIndexedDB();
    this.indexedDBService.register(this.indexedDBStore);

    // this.broadcastChannel.addEventListener('message', event => {
    //   const message: IMessage = event.data;

    //   switch (message.type) {
    //     case 'init':
    //       if (this.storageType === 'local') {
    //         this.sendMessage({ type: 'respond' });
    //       }
    //       break;
    //     case 'respond':
    //       this.updateStorage('session');
    //       break;
    //   }
    // });
    // this.sendMessage({ type: 'init' });

    // window.addEventListener('storage', action(event => {
    //   if (this.storageType === 'session') {
    //     return;
    //   }

    //   if (event.key === null) {
    //     for (const storage of this.storages.values()) {
    //       storage.readState(true);
    //       storage.saveState();
    //     }
    //   } else {
    //     const storage = this.storages.get(event.key);

    //     if (storage) {
    //       storage.readState(false);
    //     }
    //   }
    //   this.onStorageChange.execute(this.storageType);
    // }));
  }

  withAutoSave<T extends Record<any, any> | Map<any, any>>(
    storeId: string,
    store: T,
    defaultValue: () => T extends any ? T : never,
    remap?: (savedStore: T) => T,
    onUpdate?: () => void,
    storageType?: LocalStorageType,
  ): void {
    if (this.storages.has(storeId)) {
      return;
    }

    this.storages.set(storeId, new DataStorage(this.getStorage(storageType), storeId, store, defaultValue, remap, onUpdate));
  }

  updateStorage(storageType: LocalStorageType): void {
    if (this.storageType === storageType) {
      return;
    }

    this.storageType = storageType;

    if (this.storageType === 'local') {
      this.sendMessage({ type: 'respond' });
    }

    runInAction(() => {
      for (const storage of this.storages.values()) {
        storage.setStorage(this.getStorage());
      }
    });

    this.onStorageChange.execute(this.storageType);
  }

  private getStorage(storageType?: LocalStorageType): Storage | LocalStorageIndexedDB {
    const type = storageType ?? this.storageType;

    switch (type) {
      case 'local':
        return localStorage;
      case 'indexed':
        return this.indexedDBStore;
      default:
        return sessionStorage;
    }
  }

  private sendMessage(message: IMessage) {
    this.broadcastChannel.postMessage(message);
  }
}

interface ILocalStorageIndexedRecord {
  key: string;
  data: Map<any, any> | Record<any, any> | string;
}

class LocalStorageIndexedDB extends IndexedDB {
  values!: IndexedDBTable<ILocalStorageIndexedRecord>;

  constructor() {
    super('local-storage');
    this.version(1).stores({
      values: 'key',
    });
  }

  count(): Promise<number> {
    return this.values.count();
  }

  async clear(): Promise<void> {
    await this.values.clear();
  }

  async getItem(key: string): Promise<unknown | null> {
    const record = await this.values.get(key);

    return record?.data ?? null;
  }

  async removeItem(key: string): Promise<void> {
    await this.values.delete(key);
  }

  async setItem(key: string, data: any): Promise<void> {
    await this.values.put({ key, data });
  }
}

class DataStorage<T extends Record<any, any> | Map<any, any>> implements ILocalStorageElement<T> {
  private firstRun: boolean;
  private mobxSub: IReactionDisposer | undefined;

  constructor(
    private storage: Storage | LocalStorageIndexedDB,
    readonly storeId: string,
    readonly store: T,
    readonly defaultValue: () => T,
    readonly remap?: (savedStore: T) => T,
    readonly onUpdate?: () => void,
  ) {
    this.firstRun = true;
    this.mobxSub = undefined;

    this.subscribe();
  }

  setStorage(storage: Storage | LocalStorageIndexedDB): void {
    this.storage = storage;
    this.firstRun = true;
    this.saveState(toJS(this.store), this.firstRun);
  }

  private async readState(reset: boolean) {
    try {
      const state = await this.storage.getItem(this.storeId);

      let nextState: T;

      if (state && !reset) {
        nextState = this.deserializeData(this.store, state, this.remap);
      } else {
        nextState = toJS(this.defaultValue());
      }

      const parsed = observable(nextState, undefined, { deep: true });
      const oldKeys = keys(this.store);
      const newKeys = keys(parsed);

      this.unsubscribe();
      try {
        runInAction(() => {
          for (const oldKey of oldKeys) {
            if (!newKeys.includes(oldKey)) {
              remove(this.store, oldKey as any);
            }
          }

          for (const [key, value] of entries(parsed)) {
            set<T>(this.store, key, value);
          }
        });
      } finally {
        this.subscribe();
      }

      this.onUpdate?.();
    } catch (e: any) {
      console.error('Error when parsing local storage value', e);
    }
  }

  private async saveState(store: T, firstRun: boolean): Promise<void> {
    if (firstRun) {
      await this.readState(false);
      this.firstRun = false;
      return;
    }
    try {
      if (this.storage instanceof LocalStorageIndexedDB) {
        await this.storage.setItem(this.storeId, this.serializeData(store));
      } else {
        this.storage.setItem(this.storeId, this.serializeData(store));
      }
    } catch (e: any) {
      console.error('Error when saving local storage value', e);
    }
  }

  private subscribe() {
    this.unsubscribe();
    this.mobxSub = reaction(
      () => [toJS(this.store), this.firstRun] as const,
      ([store, firstRun]) => this.saveState(store, firstRun),
      {
        fireImmediately: true,
        delay: 500,
      },
    );
  }

  private unsubscribe() {
    this.mobxSub?.();
    this.mobxSub = undefined;
  }

  private deserializeData(store: any, data: any, remap?: (savedStore: any) => any): any {
    if (store instanceof ObservableMap) {
      data = this.parseMap(data);
    } else if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (remap) {
      data = remap(data);
    }

    if (store instanceof ObservableMap) {
      data = Array.from((data as Map<any, any>).entries()).reduce<{
        [key: string]: any;
      }>((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    }

    return data;
  }

  private serializeData(store: any): any {
    if (this.storage instanceof LocalStorageIndexedDB) {
      return store;
    }

    if (store instanceof Map) {
      return this.stringifyMap(store);
    }

    return JSON.stringify(store);
  }

  private stringifyMap(map: Map<any, any>): string {
    return JSON.stringify(Array.from(map.entries()));
  }

  private parseMap(data: string | Map<any, any>): Map<any, any> {
    if (typeof data === 'string') {
      return new Map(JSON.parse(data));
    }

    return data;
  }
}
