/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import type { IElementsTree } from '../../useElementsTree.js';
import { ElementsTreeBaseSettingsForm } from './ElementsTreeBaseSettingsForm.js';

export interface IElementsTreeSettingsProps {
  tree: IElementsTree;
}

@injectable()
export class ElementsTreeSettingsService {
  readonly placeholder = new PlaceholderContainer<IElementsTreeSettingsProps>();

  constructor() {
    this.placeholder.add(ElementsTreeBaseSettingsForm, 0);
  }
}
