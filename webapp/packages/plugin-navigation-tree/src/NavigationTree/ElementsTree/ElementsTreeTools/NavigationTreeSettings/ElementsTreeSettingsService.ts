/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { IElementsTree } from '../../useElementsTree';
import { ElementsTreeBaseSettingsForm } from './ElementsTreeBaseSettingsForm';

export interface IElementsTreeSettingsProps {
  tree: IElementsTree;
  style?: ComponentStyle;
}

@injectable()
export class ElementsTreeSettingsService {
  readonly placeholder = new PlaceholderContainer<IElementsTreeSettingsProps>();

  constructor() {
    this.placeholder.add(ElementsTreeBaseSettingsForm, 0);
  }
}
