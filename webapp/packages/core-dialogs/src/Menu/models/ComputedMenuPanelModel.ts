/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { IMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';

export interface IComputedMenuPanelOptions {
  id: string;
  menuItemsGetter: () => IMenuItem[];
}

export class ComputedMenuPanelModel implements IMenuPanel {

  id: string;

  @computed get menuItems() {
    return this.options.menuItemsGetter();
  }

  constructor(private options: IComputedMenuPanelOptions) {
    this.id = this.options.id;
  }
}
