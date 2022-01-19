/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IContextMenuItem } from '../ContextMenu/IContextMenuItem';
import type { IMenuContext } from '../ContextMenu/IMenuContext';
import type { IMenuPanel } from '../IMenuPanel';

export interface IComputedContextMenuPanelOptions<T> {
  id: string;
  menuItemsGetter: (context: IMenuContext<T>) => Array<IContextMenuItem<T>>;
}

export class ComputedContextMenuModel<T> implements IMenuPanel {
  id: string;

  get menuItems() {
    return [];
  }

  constructor(readonly options: IComputedContextMenuPanelOptions<T>) {
    this.id = this.options.id;
  }
}
