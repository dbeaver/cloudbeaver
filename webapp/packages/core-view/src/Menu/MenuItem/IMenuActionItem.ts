/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IActionItem } from '../../Action/IActionItem';
import type { IMenuItem } from './IMenuItem';

export interface IMenuActionItem extends IMenuItem {
  action: IActionItem;
  disabled: boolean;
}
