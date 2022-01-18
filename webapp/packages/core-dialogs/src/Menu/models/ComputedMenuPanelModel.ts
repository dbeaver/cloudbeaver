/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import type { IMenuItem, IMenuPanel } from '../IMenuPanel';

export interface IComputedMenuPanelOptions {
  id: string;
  menuItemsGetter: () => IMenuItem[];
}

export class ComputedMenuPanelModel implements IMenuPanel {
  id: string;

  get menuItems() {
    return this.options.menuItemsGetter();
  }

  constructor(private options: IComputedMenuPanelOptions) {
    makeObservable(this, {
      menuItems: computed,
    });

    this.id = this.options.id;
  }
}
