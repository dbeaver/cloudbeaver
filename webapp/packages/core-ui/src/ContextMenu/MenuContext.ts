/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuData } from '@cloudbeaver/core-view';
import { createContext } from 'react';

export interface IMenuContext {
  menu: IMenuData | null;
  rtl?: boolean;
}

export const MenuContext = createContext<IMenuContext | null>(null);
