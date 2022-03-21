/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  autorun,
  ObservableMap,
  set,
  toJS
} from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

let id = 0;

@injectable()
export class LocalStorageSaveService {
  withAutoSave<T>(store: T, name?: string, remap?: (savedStore: T) => T): void {
    let firstRun = true;
    const storeId = name || ++id;

    autorun(() => {
      if (firstRun) {
        const state = localStorage.getItem(`${storeId}`);

        if (state) {
          try {
            const parsed = this.parseData(store, state, remap);
            set(store, parsed);
          } catch (e: any) {
            console.log('Error when parsing local storage value', e);
          }
        }

        firstRun = false;
      }

      localStorage.setItem(
        `${storeId}`,
        this.stringifyData(store)
      );
    });
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
