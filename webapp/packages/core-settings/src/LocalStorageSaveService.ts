/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, autorun, entries, IReactionDisposer, keys, observable, ObservableMap, remove, runInAction, set, toJS } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

interface ILocalStorageElement<T extends Record<any, any> | Map<any, any>> {
  storeId: string;
  store: T;
  defaultValue: () => T;
  remap?: (savedStore: T) => T;
  onUpdate?: () => void;
  readState: (reset: boolean) => void;
  saveState: () => void;
  setStorage(storage: Storage): void;

  subscribe(): void;
  unsubscribe(): void;
}

export type LocalStorageType = 'local' | 'session';

interface IMessage {
  type: 'init' | 'respond';
}

@injectable()
export class LocalStorageSaveService {
  get storage(): LocalStorageType {
    return this.storageType;
  }

  readonly onStateChange: ISyncExecutor<LocalStorageType>;

  private readonly broadcastChannel: BroadcastChannel;
  private readonly storages: Map<string, ILocalStorageElement<any>>;
  private storageType: LocalStorageType;

  constructor() {
    this.storageType = 'local';
    this.broadcastChannel = new BroadcastChannel('local-storage');
    this.storages = new Map();
    this.onStateChange = new SyncExecutor();

    this.broadcastChannel.addEventListener('message', event => {
      const message: IMessage = event.data;

      switch (message.type) {
        case 'init':
          if (this.storageType === 'local') {
            this.sendMessage({ type: 'respond' });
          }
          break;
        case 'respond':
          this.storageType = 'session';
          this.updateStorage();
          this.onStateChange.execute(this.storageType);
          break;
      }
    });
    this.sendMessage({ type: 'init' });

    window.addEventListener('storage', action(event => {
      if (this.storageType === 'session') {
        return;
      }

      if (event.key === null) {
        for (const storage of this.storages.values()) {
          storage.readState(true);
          storage.saveState();
        }
      } else {
        const storage = this.storages.get(event.key);

        if (storage) {
          storage.readState(false);
        }
      }
    }));
  }

  withAutoSave<T extends Record<any, any> | Map<any, any>>(
    storeId: string,
    store: T,
    defaultValue: () => T extends any ? T : never,
    remap?: (savedStore: T) => T,
    onUpdate?: () => void
  ): void {
    if (this.storages.has(storeId)) {
      return;
    }

    this.storages.set(storeId, new DataStorage(
      this.getStorage(),
      storeId,
      store,
      defaultValue,
      remap,
      onUpdate
    ));
  }

  private updateStorage(): void {
    for (const storage of this.storages.values()) {
      storage.setStorage(this.getStorage());
    }
  }

  private getStorage(): Storage {
    if (this.storageType === 'local') {
      return localStorage;
    }
    return sessionStorage;
  }

  private sendMessage(message: IMessage) {
    this.broadcastChannel.postMessage(message);
  }
}

class DataStorage<T extends Record<any, any> | Map<any, any>> implements ILocalStorageElement<T> {
  private firstRun: boolean;
  private mobxSub: IReactionDisposer | undefined;

  constructor(
    private storage: Storage,
    readonly storeId: string,
    readonly store: T,
    readonly defaultValue: () => T,
    readonly remap?: (savedStore: T) => T,
    readonly onUpdate?: () => void
  ) {
    this.firstRun = true;
    this.mobxSub = undefined;
    this.subscribe();
  }

  setStorage(storage: Storage): void {
    this.storage = storage;
    this.firstRun = true;
    this.saveState();
  }

  readState(reset: boolean) {
    try {
      this.unsubscribe();
      const state = this.storage.getItem(this.storeId);

      let nextState: T;

      if (state && !reset) {
        nextState = this.parseData(this.store, state, this.remap);
      } else {
        nextState = toJS(this.defaultValue());
      }

      const parsed = observable(nextState);
      const oldKeys = keys(this.store);
      const newKeys = keys(parsed);

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

      this.onUpdate?.();
    } catch (e: any) {
      console.log('Error when parsing local storage value', e);
    } finally {
      this.subscribe();
    }
  }

  saveState(): void {
    if (this.firstRun) {
      this.readState(false);
      this.firstRun = false;
    }

    this.storage.setItem(
      this.storeId,
      this.stringifyData(this.store)
    );
  }

  subscribe() {
    this.unsubscribe();
    this.mobxSub = autorun(() => this.saveState());
  }

  unsubscribe() {
    this.mobxSub?.();
    this.mobxSub = undefined;
  }

  private parseData(store: any, data: any, remap?: (savedStore: any) => any): any {
    if (store instanceof ObservableMap) {
      data = this.parseMap(data);
    } else {
      data = JSON.parse(data);
    }

    if (remap) {
      data = remap(data);
    }

    if (store instanceof ObservableMap) {
      data = Array.from((data as Map<any, any>).entries())
        .reduce<{
        [key: string]: any;
      }>((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    }

    return data;
  }

  private stringifyData(store: any): string {
    if (store instanceof ObservableMap) {
      return this.stringifyMap(toJS(store));
    }

    return JSON.stringify(toJS(store));
  }

  private stringifyMap(map: Map<any, any>): string {
    return JSON.stringify(Array.from(map.entries()));
  }

  private parseMap(data: string): Map<any, any> {
    return new Map(JSON.parse(data));
  }
}
