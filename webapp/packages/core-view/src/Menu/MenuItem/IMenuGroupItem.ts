/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuItem } from './IMenuItem';

export interface IMenuGroupItem extends IMenuItem {
  items: IMenuItem[];
  disabled: boolean;
  add: (...items: IMenuItem[]) => void;
  addAfter: (index: number, ...items: IMenuItem[]) => void;
}
