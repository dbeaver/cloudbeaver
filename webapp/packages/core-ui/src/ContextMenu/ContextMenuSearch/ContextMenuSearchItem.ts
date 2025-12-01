/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import { MenuCustomItem } from '@cloudbeaver/core-view';
// eslint-disable-next-line @cloudbeaver/no-sync-component-import
import { ContextMenuSearchItemComponent } from './ContextMenuSearchItemComponent.js';

export class ContextMenuSearchItem extends MenuCustomItem<IContextMenuItemProps> {
  constructor() {
    super({
      id: 'context-menu-search',
      getComponent: () => ContextMenuSearchItemComponent,
    });
  }
}
