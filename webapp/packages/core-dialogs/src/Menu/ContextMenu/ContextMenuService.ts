/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { IMenuPanel } from '../IMenuPanel';
import { ContextMenu } from './ContextMenu';
import type { IContextMenuItem } from './IContextMenuItem';
import type { IMenuContext } from './IMenuContext';

@injectable()
export class ContextMenuService {
  private static rootPanelId = 'contextRoot';

  private contextMenu = new ContextMenu();

  constructor() {
    this.contextMenu.addRootPanel(ContextMenuService.rootPanelId);
  }

  getRootMenuToken() {
    return ContextMenuService.rootPanelId;
  }

  addPanel(panelId: string) {
    this.contextMenu.addRootPanel(panelId);
  }

  addMenuItem<T>(panelId: string, menuItem: IContextMenuItem<T>) {
    this.contextMenu.addMenuItem(panelId, menuItem);
  }

  createContextMenu<T>(context: IMenuContext<T>, panelId?: string): IMenuPanel {
    return this.contextMenu.constructMenuWithContext(panelId || ContextMenuService.rootPanelId, context);
  }
}
