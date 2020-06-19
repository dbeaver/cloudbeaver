/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ReactElement } from 'react';

import { NavNode } from '@cloudbeaver/core-app';
import { ITab } from '@cloudbeaver/core-blocks';

import { objectPropertyTablePanel } from '../ObjectPropertyTable/ObjectPropertyTable';

export class ObjectFolderTabModel implements ITab {
  readonly tabId: string;

  get title(): string {
    return this.node.name || '';
  }
  get icon(): string | undefined {
    return this.node.icon;
  }

  panel: () => ReactElement | null;

  constructor(private node: NavNode,
              public onActivate: () => void) {
    this.tabId = node.id;
    this.panel = () => objectPropertyTablePanel(node.parentId, node.id);
  }

}
