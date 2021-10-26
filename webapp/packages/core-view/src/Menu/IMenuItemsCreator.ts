/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuContext } from './IMenuContext';
import type { IMenuItem } from './MenuItem/IMenuItem';

export interface IMenuItemsCreator {
  isApplicable?: (context: IMenuContext) => boolean;
  getItems: (context: IMenuContext, items: IMenuItem[]) => IMenuItem[];
}
