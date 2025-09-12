/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDataContextProvider } from '@cloudbeaver/core-data-context';

export interface IMenuItemEvents {
  onSelect?: (context: IDataContextProvider) => void;
}

export interface IMenuItem {
  readonly id: string;
  readonly events?: IMenuItemEvents;

  hidden?: boolean;
}
