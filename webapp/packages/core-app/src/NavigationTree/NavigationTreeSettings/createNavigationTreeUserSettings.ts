/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import type { INavigationTreeUserSettings } from './INavigationTreeUserSettings';

export function createNavigationTreeUserSettings(): INavigationTreeUserSettings {
  return observable<INavigationTreeUserSettings>({
    filter: false,
    filterAll: false,
    saveExpanded: true,
    folders: false,
  });
}

export function validateNavigationTreeUserSettings(data: any): boolean {
  return (
    typeof data === 'object'
    && typeof data.filterAll === 'boolean'
    && typeof data.filter === 'boolean'
    && typeof data.saveExpanded === 'boolean'
    && typeof data.folders === 'boolean'
  );
}