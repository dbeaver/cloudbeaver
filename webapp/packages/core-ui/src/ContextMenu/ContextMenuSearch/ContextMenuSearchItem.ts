/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { MenuCustomItem } from '@cloudbeaver/core-view';

const ContextMenuSearchItemComponent = importLazyComponent(() =>
  import('./ContextMenuSearchItemComponent.js').then(module => module.ContextMenuSearchItemComponent),
);

export class ContextMenuSearchItem extends MenuCustomItem<IContextMenuItemProps> {
  constructor() {
    super({
      id: 'context-menu-search',
      getComponent: () => ContextMenuSearchItemComponent,
    });
  }
}
