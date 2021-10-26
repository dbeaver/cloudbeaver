/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IContextProvider } from '../Context/IContextProvider';
import type { IViewContext } from '../View/IViewContext';
import type { IMenu } from './IMenu';

export interface IMenuContext {
  menu: IMenu;
  menuContext: IContextProvider;
  viewContext: IViewContext | null;
}
