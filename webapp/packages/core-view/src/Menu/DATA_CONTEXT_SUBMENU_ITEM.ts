/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '../DataContext/createDataContext';
import type { IMenuSubMenuItem } from './MenuItem/IMenuSubMenuItem';

export const DATA_CONTEXT_SUBMENU_ITEM = createDataContext<IMenuSubMenuItem>('submenu-item');
