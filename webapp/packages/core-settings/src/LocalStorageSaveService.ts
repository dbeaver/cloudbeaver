/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  autorun,
  set,
  toJS,
} from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

let id = 0;

@injectable()
export class LocalStorageSaveService {
  withAutoSave(store: object, name?: string, remap?: (savedStore: object) => object): void {
    let firstRun = true;
    const storeId = name || ++id;

    autorun(() => {
      if (firstRun) {
        const state = localStorage.getItem(`${storeId}`);

        if (state) {
          try {
            if (remap) {
              set(store, remap(JSON.parse(state)));
            } else {
              set(store, JSON.parse(state));
            }
          } catch (e) {
            console.log('Error when parsing local storage value', e);
          }
        }

        firstRun = false;
      }

      localStorage.setItem(`${storeId}`, JSON.stringify(toJS(store)));
    });
  }
}
