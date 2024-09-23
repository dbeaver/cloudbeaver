/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IContextMenuItemProps } from '@cloudbeaver/core-ui';
import { MenuCustomItem } from '@cloudbeaver/core-view';

import { SearchResourceMenuItemComponent } from './SearchResourceMenuItemComponent.js';

export class SearchResourceMenuItem extends MenuCustomItem<IContextMenuItemProps> {
  constructor() {
    super({
      id: 'search-resource',
      getComponent: () => SearchResourceMenuItemComponent,
    });
  }
}
